const express = require("express");
const Grievance = require("../models/grievance");
const { checkLogin } = require("../middlewares/auth");
const axios = require("axios");
const { getChatbotGuidelines, analyzeGrievanceForResolution, detectGrievancePriority, extractGrievanceFromChat, analyzeGrievanceEvidence } = require("../services/gemini");
const { generateResolutionPDF } = require("../services/pdfGenerator");
const { detectDuplicateComplaints } = require("../services/duplicateDetection");
const { onComplaintRegistered, onStatusUpdated } = require("../services/notificationEngine");
const { calculateBacklogAwareEta } = require("../services/etaService");
const fs = require("fs");
const { GridFSBucket } = require("mongodb");
const mongoose = require("mongoose");
const router = express.Router();
router.post("/", checkLogin, async (req, res) => {
    const username = req.user.user.name;
    const email = req.user.user.email;
    const { department, description, location, category, subcategory } = req.body;
    try {
        if (req.body.fileName) {
            try {
                const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
                const file = await mongoose.connection.db.collection("uploads.files").findOne({ filename: req.body.fileName });
                if (file) {
                    const ext = req.body.fileName.split('.').pop().toLowerCase();
                    const contentTypes = { 'pdf': 'application/pdf', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp' };
                    const mimeType = contentTypes[ext];

                    if (mimeType) {
                        const downloadStream = bucket.openDownloadStream(file._id);
                        const chunks = [];
                        for await (const chunk of downloadStream) {
                            chunks.push(chunk);
                        }
                        const fileBuffer = Buffer.concat(chunks);
                        
                        const spamResult = await analyzeGrievanceEvidence(description, category, fileBuffer, mimeType);
                        
                        if (spamResult.isSpam) {
                            return res.status(400).json({ error: "Your uploaded image was flagged as invalid: " + spamResult.reasoning });
                        }
                    }
                }
            } catch (spamCheckError) {
                console.error("Spam check failed", spamCheckError);
            }
        }

        const priorityData = await detectGrievancePriority({
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description: description,
            location: location
        });
        const etaData = await calculateBacklogAwareEta({
            department,
            priority: priorityData.priority,
            complaintText: description,
            issueType: category,
            subcategory,
            category
        });
        const grievance = new Grievance({
            complainantName: username,
            complainantEmail: email,
            department,
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description,
            fileName: req.body.fileName,
            location: location || null,
            priority: priorityData.priority,
            priorityReason: priorityData.priorityReason,
            serviceDepartmentKey: etaData.department,
            serviceDepartmentLabel: etaData.departmentLabel,
            etaDepartmentKey: etaData.department,
            etaDepartmentLabel: etaData.departmentLabel,
            etaBaseDays: etaData.baseTimeDays,
            etaCapacityPerDay: etaData.capacityPerDay,
            etaBacklogCount: etaData.backlogCount,
            etaBacklogDays: etaData.backlogDays,
            etaHistoricalDays: etaData.historicalAverageDays,
            etaPriorityFactor: etaData.priorityFactor,
            etaAiFactor: etaData.aiFactor,
            etaFinalDays: etaData.finalEtaDays,
            etaStatus: etaData.status,
            etaMessage: etaData.message,
            etaCalculatedAt: etaData.calculatedAt
        });
        console.log('Grievance with priority:', grievance);
        const newGrievance = await grievance.save();

        try {
            await onComplaintRegistered(newGrievance);
        } catch (notifyError) {
            console.error("Notification error (register):", notifyError.message);
        }

        res.status(201).json({
            ...newGrievance.toObject(),
            eta: etaData
        });
    } catch (err) {
        console.error('Error creating grievance:', err);
        res.status(400).json({ error: err.message });
    }
});
router.get("/", checkLogin, async (req, res) => {
    try {
        const useremail = req.user.user.email;
        // Get only user's own grievances
        const grievances = await Grievance.find({ complainantEmail: useremail });
        res.json(grievances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/grievanceCode/:grievanceCode", async (req, res) => {
    try {
        const grievance = await Grievance.findOne({ grievanceCode: req.params.grievanceCode });
        if (!grievance) return res.status(404).json({ message: "Grievancevv not found" });

        const missingEta = grievance.etaFinalDays === undefined || grievance.etaFinalDays === null;
        if (missingEta) {
            try {
                const etaData = await calculateBacklogAwareEta({
                    department: grievance.department,
                    priority: grievance.priority,
                    complaintText: grievance.description,
                    issueType: grievance.issueType || grievance.category,
                    subcategory: grievance.subcategory,
                    category: grievance.category
                });

                grievance.serviceDepartmentKey = etaData.department;
                grievance.serviceDepartmentLabel = etaData.departmentLabel;
                grievance.etaDepartmentKey = etaData.department;
                grievance.etaDepartmentLabel = etaData.departmentLabel;
                grievance.etaBaseDays = etaData.baseTimeDays;
                grievance.etaCapacityPerDay = etaData.capacityPerDay;
                grievance.etaBacklogCount = etaData.backlogCount;
                grievance.etaBacklogDays = etaData.backlogDays;
                grievance.etaHistoricalDays = etaData.historicalAverageDays;
                grievance.etaPriorityFactor = etaData.priorityFactor;
                grievance.etaAiFactor = etaData.aiFactor;
                grievance.etaFinalDays = etaData.finalEtaDays;
                grievance.etaStatus = etaData.status;
                grievance.etaMessage = etaData.message;
                grievance.etaCalculatedAt = etaData.calculatedAt;
                await grievance.save();
            } catch (etaError) {
                console.error("ETA fallback calculation failed:", etaError.message);
            }
        }

        res.json(grievance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put("/grievanceCode/:grievanceCode", async (req, res) => {
    try {
        const { currentStatus, aiResolved } = req.body;
        if (!currentStatus) {
            return res.status(400).json({ message: "currentStatus is required" });
        }

        const previousGrievance = await Grievance.findOne({ grievanceCode: req.params.grievanceCode });
        if (!previousGrievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }

        const updateFields = { currentStatus };
        if (aiResolved !== undefined) {
            updateFields.aiResolved = aiResolved;
        }
        const grievance = await Grievance.findOneAndUpdate(
            { grievanceCode: req.params.grievanceCode },
            { $set: updateFields },
            { new: true }
        );

        try {
            await onStatusUpdated({
                previousStatus: previousGrievance.currentStatus,
                previousDepartment: previousGrievance.department,
                grievance
            });
        } catch (notifyError) {
            console.error("Notification error (status update):", notifyError.message);
        }

        res.json(grievance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/allGrievances", async (req, res) => {
    try {
        const grievances = await Grievance.find({});
        res.json(grievances);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})
router.post("/ai-assistant", async (req, res) => {
    try {
        const { question, language = "en" } = req.body;
        console.log("AI Assistant request received:", question, "Language:", language);
        console.log("Gemini API Key present:", !!process.env.GEMINI_API_KEY);
        const answer = await getChatbotGuidelines(question, language);
        let grievanceData = await extractGrievanceFromChat(question, language);
        if (!grievanceData) {
            grievanceData = getAutofillDataForAllIssues(question);
        }
        console.log("Gemini response received successfully");
        console.log("Autofill data:", grievanceData);
        res.json({ 
            answer,
            autofillData: grievanceData 
        });
    } catch (err) {
        console.error("AI Error details:", err);
        console.error("Error message:", err.message);
        const answer = getIntelligentResponse(req.body.question, req.body.language);
        const autofillData = getAutofillDataForAllIssues(req.body.question);
        res.json({ answer, autofillData });
    }
});
function getIntelligentResponse(question, language) {
    const lowerQ = question.toLowerCase();
    let response = "";
    if (lowerQ.includes('bank') || lowerQ.includes('loan') || lowerQ.includes('account') || lowerQ.includes('atm') || lowerQ.includes('transaction')) {
        response = language === 'hi' ? 
            `बैंकिंग शिकायत के लिए:\n\n1. विभाग: वित्तीय सेवाएं (बैंकिंग डिवीजन)\n2. श्रेणी: सार्वजनिक सेवाएं\n3. उप-श्रेणी: बैंकिंग मुद्दे\n\nशिकायत में शामिल करें:\n- खाता संख्या\n- बैंक शाखा का नाम\n- समस्या का विवरण\n- दिनांक और समय\n\n7-15 दिनों में समाधान की उम्मीद करें।` :
            `For banking complaints:\n\nDepartment: Financial Services (Banking Division)\nCategory: Public Services\nSubcategory: Banking Issues\n\nInclude in complaint:\n- Account number\n- Bank branch name\n- Problem description\n- Date and time\n\nExpected resolution: 7-15 days`;
    }
    else if (lowerQ.includes('job') || lowerQ.includes('salary') || lowerQ.includes('employment') || lowerQ.includes('work') || lowerQ.includes('pension')) {
        response = language === 'hi' ? 
            `रोजगार संबंधी शिकायत के लिए:\n\n1. विभाग: श्रम और रोजगार\n2. श्रेणी: रोजगार\n3. उप-श्रेणी: वेतन विलंब/नौकरी आवेदन\n\nशिकायत में शामिल करें:\n- कर्मचारी आईडी\n- कंपनी का नाम\n- पदनाम\n- समस्या की अवधि\n\n10-20 दिनों में समाधान की उम्मीद करें।` :
            `For employment complaints:\n\nDepartment: Labour and Employment\nCategory: Employment\nSubcategory: Salary Delay/Job Application\n\nInclude in complaint:\n- Employee ID\n- Company name\n- Designation\n- Duration of problem\n\nExpected resolution: 10-20 days`;
    }
    else if (lowerQ.includes('tax') || lowerQ.includes('income tax') || lowerQ.includes('pan') || lowerQ.includes('refund') || lowerQ.includes('tds')) {
        response = language === 'hi' ? 
            `कर संबंधी शिकायत के लिए:\n\n1. विभाग: केंद्रीय प्रत्यक्ष कर बोर्ड (आयकर)\n2. श्रेणी: राजस्व और कराधान\n3. उप-श्रेणी: कर रिफंड/मूल्यांकन\n\nशिकायत में शामिल करें:\n- PAN नंबर\n- मूल्यांकन वर्ष\n- ITR संख्या\n- रिफंड राशि\n\n15-30 दिनों में समाधान की उम्मीद करें।` :
            `For tax complaints:\n\nDepartment: Central Board of Direct Taxes (Income Tax)\nCategory: Revenue & Taxation\nSubcategory: Tax Refund/Assessment\n\nInclude in complaint:\n- PAN number\n- Assessment year\n- ITR number\n- Refund amount\n\nExpected resolution: 15-30 days`;
    }
    else if (lowerQ.includes('post') || lowerQ.includes('mail') || lowerQ.includes('delivery') || lowerQ.includes('parcel') || lowerQ.includes('speed post')) {
        response = language === 'hi' ? 
            `डाक सेवा शिकायत के लिए:\n\n1. विभाग: डाक\n2. श्रेणी: सार्वजनिक सेवाएं\n3. उप-श्रेणी: डाक सेवाएं\n\nशिकायत में शामिल करें:\n- ट्रैकिंग नंबर\n- भेजने वाले का विवरण\n- पूरा पता\n- अपेक्षित डिलीवरी तारीख\n\n5-10 दिनों में समाधान की उम्मीद करें।` :
            `For postal complaints:\n\nDepartment: Posts\nCategory: Public Services\nSubcategory: Postal Services\n\nInclude in complaint:\n- Tracking number\n- Sender details\n- Complete address\n- Expected delivery date\n\nExpected resolution: 5-10 days`;
    }
    else if (lowerQ.includes('mobile') || lowerQ.includes('internet') || lowerQ.includes('network') || lowerQ.includes('broadband') || lowerQ.includes('telecom')) {
        response = language === 'hi' ? 
            `दूरसंचार शिकायत के लिए:\n\n1. विभाग: दूरसंचार\n2. श्रेणी: उपयोगिताएं\n3. उप-श्रेणी: इंटरनेट/मोबाइल सेवाएं\n\nशिकायत में शामिल करें:\n- मोबाइल ऑपरेटर का नाम\n- फोन नंबर\n- स्थान\n- समस्या का समय\n\n3-7 दिनों में समाधान की उम्मीद करें।` :
            `For telecom complaints:\n\nDepartment: Telecommunications\nCategory: Utilities\nSubcategory: Internet/Mobile Services\n\nInclude in complaint:\n- Mobile operator name\n- Phone number\n- Location\n- Time of issue\n\nExpected resolution: 3-7 days`;
    }
    else if (lowerQ.includes('electricity') || lowerQ.includes('power') || lowerQ.includes('bijli') || lowerQ.includes('बिजली') || lowerQ.includes('supply')) {
        response = language === 'hi' ? 
            `बिजली संबंधी शिकायत के लिए:\n\n1. विभाग: आवास और शहरी मामले\n2. श्रेणी: उपयोगिताएं\n3. उप-श्रेणी: बिजली\n\nशिकायत में शामिल करें:\n- उपभोक्ता संख्या\n- समस्या का प्रकार (कटौती/वोल्टेज/बिलिंग)\n- स्थान की जानकारी\n- समस्या की अवधि\n\n2-7 दिनों में समाधान की उम्मीद करें।` :
            `For electricity complaints:\n\nDepartment: Housing and Urban Affairs\nCategory: Utilities\nSubcategory: Electricity\n\nInclude in complaint:\n- Consumer number\n- Type of issue (outage/voltage/billing)\n- Location details\n- Duration of problem\n\nExpected resolution: 2-7 days`;
    }
    else if (lowerQ.includes('water') || lowerQ.includes('pani') || lowerQ.includes('पानी')) {
        response = language === 'hi' ? 
            `पानी संबंधी शिकायत के लिए:\n\n1. विभाग: आवास और शहरी मामले\n2. श्रेणी: अवसंरचना\n3. उप-श्रेणी: जल आपूर्ति\n\nशिकायत में शामिल करें:\n- कनेक्शन नंबर\n- समस्या की अवधि\n- सामान्य आपूर्ति समय\n- पड़ोसियों की स्थिति\n\n3-7 दिनों में समाधान की उम्मीद करें।` :
            `For water supply complaints:\n\nDepartment: Housing and Urban Affairs\nCategory: Infrastructure\nSubcategory: Water Supply\n\nInclude in complaint:\n- Connection number\n- Duration of problem\n- Normal supply timings\n- Neighbors' situation\n\nExpected resolution: 3-7 days`;
    }
    else if (lowerQ.includes('road') || lowerQ.includes('pothole') || lowerQ.includes('सड़क')) {
        response = language === 'hi' ? 
            `सड़क संबंधी शिकायत के लिए:\n\n1. विभाग: आवास और शहरी मामले\n2. श्रेणी: अवसंरचना\n3. उप-श्रेणी: सड़कें\n\nशिकायत में शामिल करें:\n- सड़क का नाम\n- निकटतम लैंडमार्क\n- समस्या का आकार\n- फोटो अपलोड करें\n\n5-15 दिनों में समाधान की उम्मीद करें।` :
            `For road complaints:\n\nDepartment: Housing and Urban Affairs\nCategory: Infrastructure\nSubcategory: Roads\n\nInclude in complaint:\n- Road name\n- Nearest landmark\n- Size of problem\n- Upload photos\n\nExpected resolution: 5-15 days`;
    }
    else if (lowerQ.includes('health') || lowerQ.includes('hospital') || lowerQ.includes('doctor') || lowerQ.includes('medical')) {
        response = language === 'hi' ? 
            `स्वास्थ्य संबंधी शिकायत के लिए:\n\n1. विभाग: स्वास्थ्य और परिवार कल्याण\n2. श्रेणी: स्वास्थ्य और स्वच्छता\n3. उप-श्रेणी: अस्पताल सेवाएं\n\nशिकायत में शामिल करें:\n- अस्पताल का नाम\n- विभाग\n- घटना की तारीख और समय\n- रोगी का विवरण\n\n7-14 दिनों में समाधान की उम्मीद करें।` :
            `For health complaints:\n\nDepartment: Health & Family Welfare\nCategory: Health & Sanitation\nSubcategory: Hospital Services\n\nInclude in complaint:\n- Hospital name\n- Department\n- Date and time of incident\n- Patient details\n\nExpected resolution: 7-14 days`;
    }
    else {
        response = language === 'hi' ? 
            `सामान्य शिकायत के लिए:\n\n1. उपयुक्त विभाग चुनें\n2. समस्या की श्रेणी चुनें\n3. विस्तृत विवरण दें\n4. सहायक दस्तावेज अपलोड करें\n5. स्थान साझा करें\n\nअधिक सहायता के लिए हेल्पलाइन: 1800-111-555` :
            `For general complaints:\n\n1. Select appropriate department\n2. Choose issue category\n3. Provide detailed description\n4. Upload supporting documents\n5. Share location\n\nFor help: 1800-111-555`;
    }
    return response;
}
function getAutofillDataForAllIssues(question) {
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('bank') || lowerQ.includes('loan') || lowerQ.includes('account') || lowerQ.includes('atm') || lowerQ.includes('transaction')) {
        return {
            department: "Financial Services (Banking Division)",
            category: "public_services",
            subcategory: "ration_card",
            description: question,
            suggestedRemarks: "Mention your account number, bank branch name, transaction details, and any reference numbers"
        };
    }
    if (lowerQ.includes('job') || lowerQ.includes('salary') || lowerQ.includes('employment') || lowerQ.includes('work') || lowerQ.includes('pension')) {
        return {
            department: "Labour and Employment",
            category: "employment",
            subcategory: "salary_delay",
            description: question,
            suggestedRemarks: "Mention your employee ID, company name, designation, and duration of the problem"
        };
    }
    if (lowerQ.includes('tax') || lowerQ.includes('income tax') || lowerQ.includes('pan') || lowerQ.includes('refund') || lowerQ.includes('tds')) {
        return {
            department: "Central Board of Direct Taxes (Income Tax)",
            category: "revenue_taxation",
            subcategory: "tax_refund",
            description: question,
            suggestedRemarks: "Mention your PAN number, assessment year, ITR acknowledgment number, and refund amount"
        };
    }
    if (lowerQ.includes('post') || lowerQ.includes('mail') || lowerQ.includes('delivery') || lowerQ.includes('parcel') || lowerQ.includes('speed post')) {
        return {
            department: "Posts",
            category: "public_services",
            subcategory: "passport",
            description: question,
            suggestedRemarks: "Mention tracking number, sender details, expected delivery date, and your complete address"
        };
    }
    if (lowerQ.includes('mobile') || lowerQ.includes('internet') || lowerQ.includes('network') || lowerQ.includes('broadband') || lowerQ.includes('telecom')) {
        return {
            department: "Telecommunications",
            category: "utilities",
            subcategory: "internet",
            description: question,
            suggestedRemarks: "Mention your mobile operator, phone number, specific location, and time when issue occurs"
        };
    }
    if (lowerQ.includes('electricity') || lowerQ.includes('power') || lowerQ.includes('supply') || lowerQ.includes('bijli')) {
        return {
            department: "Housing and Urban Affairs",
            category: "utilities",
            subcategory: "electricity",
            description: question,
            suggestedRemarks: "Mention the exact nature of the electricity issue, consumer number, and duration of problem"
        };
    }
    if (lowerQ.includes('water') || lowerQ.includes('pani')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "water_supply",
            description: question,
            suggestedRemarks: "Mention your water connection number, usual supply timings, and if neighbors are also affected"
        };
    }
    if (lowerQ.includes('road') || lowerQ.includes('pothole') || lowerQ.includes('street')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "roads",
            description: question,
            suggestedRemarks: "Mention exact road name, nearest landmark, size of the problem, and if any accidents occurred"
        };
    }
    if (lowerQ.includes('light') || lowerQ.includes('lighting') || lowerQ.includes('lamp')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "street_lights",
            description: question,
            suggestedRemarks: "Mention exact location, pole number if visible, and how long it's been not working"
        };
    }
    if (lowerQ.includes('health') || lowerQ.includes('hospital') || lowerQ.includes('doctor') || lowerQ.includes('medical')) {
        return {
            department: "Health & Family Welfare",
            category: "health_sanitation",
            subcategory: "hospital_services",
            description: question,
            suggestedRemarks: "Mention hospital name, department, staff names if known, and date/time of incident"
        };
    }
    return null;
}
router.post("/grievanceCode/:grievanceCode/ai-resolve", async (req, res) => {
    try {
        const { grievanceCode } = req.params;
        const grievance = await Grievance.findOne({ grievanceCode });
        if (!grievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        const previousStatus = grievance.currentStatus;
        const previousDepartment = grievance.department;
        const aiResolutionData = await analyzeGrievanceForResolution({
            grievanceCode: grievanceCode,
            department: grievance.department,
            category: grievance.category,
            subcategory: grievance.subcategory,
            description: grievance.description,
            complainantName: grievance.complainantName,
            dateOfReceipt: grievance.dateOfReceipt,
            location: grievance.location
        });
        const aiResolution = aiResolutionData.resolutionText;
        const isAIResolved = aiResolutionData.isAIResolved;
        const { fileName, filePath } = await generateResolutionPDF(grievance, aiResolution);
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
        const uploadStream = bucket.openUploadStream(fileName);
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(uploadStream);
        uploadStream.on("finish", async () => {
            fs.unlinkSync(filePath);
            grievance.currentStatus = isAIResolved ? "Resolved" : "Under Review";
            grievance.aiResolved = isAIResolved;
            grievance.aiResolutionText = aiResolution;
            grievance.aiResolutionPDF = fileName;
            grievance.aiResolvedAt = isAIResolved ? new Date() : null;
            await grievance.save();

            try {
                await onStatusUpdated({
                    previousStatus,
                    previousDepartment,
                    grievance
                });
            } catch (notifyError) {
                console.error("Notification error (ai-resolve):", notifyError.message);
            }

            res.json({
                success: true,
                resolution: aiResolution,
                isAIResolved: isAIResolved,
                pdfFileName: fileName,
                grievance
            });
        });
        uploadStream.on("error", (error) => {
            console.error("Upload error:", error);
            res.status(500).json({ error: "Failed to upload PDF" });
        });
    } catch (err) {
        console.error("AI Resolution Error:", err);
        res.status(500).json({ error: err.message });
    }
});
router.post("/grievanceCode/:grievanceCode/question", async (req, res) => {
    try {
        const { question, askedBy } = req.body;
        const grievance = await Grievance.findOneAndUpdate(
            { grievanceCode: req.params.grievanceCode },
            { 
                $push: { 
                    adminQuestions: {
                        question,
                        askedBy,
                        askedAt: new Date()
                    }
                }
            },
            { new: true }
        );
        if (!grievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        res.json(grievance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put("/grievanceCode/:grievanceCode/question/:questionIndex/reply", async (req, res) => {
    try {
        const { reply, replyDocument } = req.body;
        const { grievanceCode, questionIndex } = req.params;
        const grievance = await Grievance.findOne({ grievanceCode });
        if (!grievance) {
            return res.status(404).json({ message: "Grievance not found" });
        }
        if (!grievance.adminQuestions[questionIndex]) {
            return res.status(404).json({ message: "Question not found" });
        }
        grievance.adminQuestions[questionIndex].reply = reply;
        grievance.adminQuestions[questionIndex].repliedAt = new Date();
        if (replyDocument) {
            grievance.adminQuestions[questionIndex].replyDocument = replyDocument;
        }
        await grievance.save();
        res.json(grievance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
