const express = require("express");
const Grievance = require("../models/grievance");
const { detectGrievancePriority } = require("../services/gemini");
const { onComplaintRegistered } = require("../services/notificationEngine");
const { calculateBacklogAwareEta } = require("../services/etaService");
const router = express.Router();

// Webhook endpoint for Twitter (for demo, we'll use a simple POST endpoint)
router.post("/webhook", async (req, res) => {
    try {
        const { tweet_text, user_handle, tweet_id, media_urls, location } = req.body;
        
        console.log("Received tweet:", { tweet_text, user_handle, tweet_id });

        // Check if tweet contains NagrikConnect keywords
        const keywords = ['nagrikconnect', '#nagrikconnect', '@nagrikconnect', 'nagrik connect'];
        const lowerText = tweet_text.toLowerCase();
        const hasKeyword = keywords.some(keyword => lowerText.includes(keyword));

        if (!hasKeyword) {
            return res.status(200).json({ 
                message: "Tweet does not contain NagrikConnect keywords",
                processed: false 
            });
        }

        // Extract department and category from tweet using AI
        const { department, category, subcategory } = await extractDepartmentFromTweet(tweet_text);

        // Detect priority
        const priorityData = await detectGrievancePriority({
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description: tweet_text,
            location: location
        });
        const etaData = await calculateBacklogAwareEta({
            department: department || "General",
            priority: priorityData.priority,
            complaintText: tweet_text,
            issueType: department,
            subcategory,
            category
        });

        // Create grievance from tweet
        const grievance = new Grievance({
            complainantName: user_handle,
            complainantEmail: `${user_handle}@twitter.com`, // Placeholder email
            department: department || "General",
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description: tweet_text,
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
            etaCalculatedAt: etaData.calculatedAt,
            source: 'twitter',
            sourceMetadata: {
                twitterTweetId: tweet_id,
                twitterHandle: user_handle,
                twitterMediaUrls: media_urls || []
            }
        });

        const newGrievance = await grievance.save();

        try {
            await onComplaintRegistered(newGrievance);
        } catch (notifyError) {
            console.error("Notification error (twitter webhook):", notifyError.message);
        }

        console.log("Created grievance from tweet:", newGrievance.grievanceCode);

        res.status(201).json({
            success: true,
            grievanceCode: newGrievance.grievanceCode,
            message: `Complaint registered! Your tracking number is ${newGrievance.grievanceCode}`,
            grievance: newGrievance,
            eta: etaData
        });

    } catch (err) {
        console.error("Error processing tweet:", err);
        res.status(500).json({ error: err.message });
    }
});

// Manual tweet submission endpoint (for demo/testing)
router.post("/submit-tweet", async (req, res) => {
    try {
        const { tweet_text, user_handle } = req.body;

        if (!tweet_text || !user_handle) {
            return res.status(400).json({ error: "tweet_text and user_handle are required" });
        }

        // Check if tweet contains NagrikConnect keywords
        const keywords = ['nagrikconnect', '#nagrikconnect', '@nagrikconnect', 'nagrik connect'];
        const lowerText = tweet_text.toLowerCase();
        const hasKeyword = keywords.some(keyword => lowerText.includes(keyword));

        if (!hasKeyword) {
            return res.status(400).json({ 
                error: "Tweet must contain 'NagrikConnect' or '#NagrikConnect' to file a complaint" 
            });
        }

        // Extract department and category from tweet
        const { department, category, subcategory } = await extractDepartmentFromTweet(tweet_text);

        // Detect priority
        const priorityData = await detectGrievancePriority({
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description: tweet_text,
            location: null
        });
        const etaData = await calculateBacklogAwareEta({
            department: department || "General",
            priority: priorityData.priority,
            complaintText: tweet_text,
            issueType: department,
            subcategory,
            category
        });

        // Create grievance from tweet
        const grievance = new Grievance({
            complainantName: user_handle,
            complainantEmail: `${user_handle}@twitter.com`,
            department: department || "General",
            category: category || 'General',
            subcategory: subcategory || 'Other',
            description: tweet_text,
            location: null,
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
            etaCalculatedAt: etaData.calculatedAt,
            source: 'twitter',
            sourceMetadata: {
                twitterTweetId: `DEMO_${Date.now()}`,
                twitterHandle: user_handle,
                twitterMediaUrls: []
            }
        });

        const newGrievance = await grievance.save();

        try {
            await onComplaintRegistered(newGrievance);
        } catch (notifyError) {
            console.error("Notification error (twitter submit):", notifyError.message);
        }

        res.status(201).json({
            success: true,
            grievanceCode: newGrievance.grievanceCode,
            message: `Complaint registered from Twitter! Tracking number: ${newGrievance.grievanceCode}`,
            grievance: newGrievance,
            eta: etaData
        });

    } catch (err) {
        console.error("Error processing tweet:", err);
        res.status(500).json({ error: err.message });
    }
});

// Helper function to extract department from tweet
async function extractDepartmentFromTweet(tweet_text) {
    const lowerText = tweet_text.toLowerCase();
    
    // Simple keyword matching for demo
    if (lowerText.includes('electricity') || lowerText.includes('power') || lowerText.includes('bijli')) {
        return {
            department: "Housing and Urban Affairs",
            category: "utilities",
            subcategory: "electricity"
        };
    }
    if (lowerText.includes('water') || lowerText.includes('pani')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "water_supply"
        };
    }
    if (lowerText.includes('road') || lowerText.includes('pothole') || lowerText.includes('street')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "roads"
        };
    }
    if (lowerText.includes('garbage') || lowerText.includes('waste') || lowerText.includes('trash')) {
        return {
            department: "Housing and Urban Affairs",
            category: "health_sanitation",
            subcategory: "waste_management"
        };
    }
    if (lowerText.includes('street light') || lowerText.includes('streetlight') || lowerText.includes('lamp')) {
        return {
            department: "Housing and Urban Affairs",
            category: "infrastructure",
            subcategory: "street_lights"
        };
    }
    if (lowerText.includes('police') || lowerText.includes('crime') || lowerText.includes('theft')) {
        return {
            department: "Law & Order",
            category: "law_order",
            subcategory: "police_complaint"
        };
    }
    if (lowerText.includes('hospital') || lowerText.includes('health') || lowerText.includes('medical')) {
        return {
            department: "Health & Family Welfare",
            category: "health_sanitation",
            subcategory: "hospital_services"
        };
    }
    
    // Default
    return {
        department: "General",
        category: "General",
        subcategory: "Other"
    };
}

module.exports = router;
