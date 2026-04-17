const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function getGeminiResponse(prompt, language = "en") {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash"
    });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    const response = result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    console.error("Error message:", error.message);
    throw error;
  }
}
async function getChatbotGuidelines(question, language = "en") {
  const languageInstructions = {
    en: "Respond in English",
    hi: "Respond in Hindi (Devanagari script)",
    mr: "Respond in Marathi (Devanagari script)",
    ta: "Respond in Tamil",
    te: "Respond in Telugu",
    bn: "Respond in Bengali",
    gu: "Respond in Gujarati",
    kn: "Respond in Kannada",
    ml: "Respond in Malayalam",
    pa: "Respond in Punjabi"
  };
  const prompt = `You are a helpful assistant for NagrikConnect - a government grievance portal. ${languageInstructions[language] || "Respond in English"}.
IMPORTANT: Guide users to file their grievance on THIS WEBSITE (NagrikConnect) with STEP-BY-STEP instructions.
COMPLETE DEPARTMENT AND CATEGORY MAPPING:
1. FINANCIAL SERVICES (Banking Division)
   Issues: Banking problems, loan issues, account problems, ATM issues, transaction failures
   Categories: Public Services → Banking-related subcategories
2. LABOUR AND EMPLOYMENT
   Issues: Job problems, salary delays, unemployment benefits, workplace issues, pension problems
   Categories: Employment → Job Application, Salary Delay, Pension, Unemployment Benefits
3. CENTRAL BOARD OF DIRECT TAXES (Income Tax)
   Issues: Tax problems, PAN issues, refund delays, assessment problems, ITR issues
   Categories: Revenue & Taxation → Property Tax, Land Records, Tax Refund, Assessment
4. POSTS
   Issues: Postal services, mail delivery, speed post, parcel problems, post office issues
   Categories: Public Services → Postal-related subcategories
5. TELECOMMUNICATIONS
   Issues: Mobile network, internet problems, broadband issues, telecom services
   Categories: Utilities → Internet, Mobile Services
6. PERSONNEL AND TRAINING
   Issues: Government employee problems, training issues, recruitment problems
   Categories: Employment → Government job-related subcategories
7. HOUSING AND URBAN AFFAIRS
   - UTILITIES: Electricity, Power supply, Gas connection
     Categories: Utilities → Electricity, Water Supply, Gas Connection
   - INFRASTRUCTURE: Roads, Street lights, Drainage, Water supply, Public transport
     Categories: Infrastructure → Roads, Street Lights, Drainage, Water Supply, Public Transport
   - HOUSING: Housing issues, property matters, construction problems
     Categories: Social Welfare → Housing-related subcategories
8. HEALTH & FAMILY WELFARE
   Issues: Hospital problems, medical services, sanitation, health facilities
   Categories: Health & Sanitation → Hospital Services, Waste Management, Water Quality, Public Toilets
User Question: ${question}
ANALYSIS PROCESS:
1. Identify the PRIMARY issue from keywords
2. Match to the correct department
3. Determine the appropriate category and subcategory
4. Provide specific guidance for that issue type
YOUR RESPONSE MUST INCLUDE:
1. IDENTIFY THE ISSUE: Briefly acknowledge the user's problem
2. DEPARTMENT & CATEGORY: Tell them exactly which department, category, and subcategory to select
3. STEP-BY-STEP FILING INSTRUCTIONS:
   Step 1: Click on "File Grievance" or "Lodge Grievance" button on the homepage
   Step 2: Select Department: [Specific Department Name]
   Step 3: Select Category: [Specific Category]
   Step 4: Select Subcategory: [Specific Subcategory]
   Step 5: Write your complaint description (provide sample)
   Step 6: Add remarks with specific details
   Step 7: Upload supporting documents/photos
   Step 8: Enable location sharing
   Step 9: Click "Submit Grievance"
   Step 10: Save your Grievance Code for tracking
4. SAMPLE DESCRIPTION: Give them exact text they can use
5. REQUIRED DOCUMENTS: List specific documents/photos needed
6. EXPECTED TIMELINE: Realistic resolution timeframe
7. END WITH: "Click here to file your complaint now: [AUTOFILL_LINK]"
EXAMPLES FOR DIFFERENT DEPARTMENTS:
BANKING ISSUE:
"I understand you're facing banking issues. Let me guide you through filing a complaint on NagrikConnect.
DEPARTMENT: Financial Services (Banking Division)
CATEGORY: Public Services
SUBCATEGORY: Banking Issues
[Continue with steps...]"
TAX ISSUE:
"I understand you have a tax-related problem. Let me guide you through filing a complaint on NagrikConnect.
DEPARTMENT: Central Board of Direct Taxes (Income Tax)
CATEGORY: Revenue & Taxation  
SUBCATEGORY: Tax Refund
[Continue with steps...]"
EMPLOYMENT ISSUE:
"I understand you're facing employment-related issues. Let me guide you through filing a complaint on NagrikConnect.
DEPARTMENT: Labour and Employment
CATEGORY: Employment
SUBCATEGORY: Salary Delay
[Continue with steps...]"
TELECOM ISSUE:
"I understand you're having telecommunications problems. Let me guide you through filing a complaint on NagrikConnect.
DEPARTMENT: Telecommunications
CATEGORY: Utilities
SUBCATEGORY: Internet
[Continue with steps...]"
HEALTH ISSUE:
"I understand you're facing health service issues. Let me guide you through filing a complaint on NagrikConnect.
DEPARTMENT: Health & Family Welfare
CATEGORY: Health & Sanitation
SUBCATEGORY: Hospital Services
[Continue with steps...]"
NOW ANALYZE THE USER'S ACTUAL QUESTION AND PROVIDE A DETAILED, DEPARTMENT-SPECIFIC RESPONSE WITH EXACT NAVIGATION INSTRUCTIONS.`;
  return await getGeminiResponse(prompt);
}
async function analyzeGrievanceForResolution(grievanceData) {
  const prompt = `You are an expert AI Government Officer. Provide DETAILED, ACTIONABLE solutions to citizen grievances.
CRITICAL FORMATTING RULES:
1. Use simple text formatting - NO emojis, NO special symbols, NO box characters
2. Use standard bullet points with asterisks (*) or numbers (1., 2., 3.)
3. Keep sections clearly separated with blank lines
4. Write in plain English without markdown formatting
GRIEVANCE INFORMATION:
Department: ${grievanceData.department}
Category: ${grievanceData.category || 'General'}
Subcategory: ${grievanceData.subcategory || 'Other'}
Description: ${grievanceData.description}
Complainant: ${grievanceData.complainantName}
Date: ${new Date(grievanceData.dateOfReceipt).toLocaleDateString()}
${grievanceData.location ? `Location: Lat ${grievanceData.location.latitude}, Long ${grievanceData.location.longitude}` : ''}
YOUR RESPONSE MUST FOLLOW THIS EXACT FORMAT:
AI RESOLVED: YES
(Write "YES" if this is a simple issue that doesn't need official review, otherwise "NO")
PROBLEM ANALYSIS:
(2-3 sentences explaining the issue clearly)
STEP-BY-STEP SOLUTION:
Step 1: (Title)
* Point 1
* Point 2
* Point 3
Step 2: (Title)
* Point 1
* Point 2
Step 3: (Title)
* Point 1
* Point 2
(Continue with more steps as needed)
REQUIRED DOCUMENTS:
1. Document name - purpose
2. Document name - purpose
3. Document name - purpose
CONTACT INFORMATION:
Office Name: (Full official name)
Address: (Complete address with pin code)
Phone: (Helpline numbers)
Email: (Official email)
Website: (Official website URL)
Office Hours: (Days and timings)
EXPECTED TIMELINE:
* Action 1: Timeframe
* Action 2: Timeframe
* Final Resolution: Timeframe
ESCALATION PROCESS:
If not resolved within the timeline:
1. First escalation - contact details
2. Second escalation - contact details
3. Final escalation - contact details
IMPORTANT NOTES:
* Note 1
* Note 2
* Note 3
EXAMPLE (for electricity issue):
AI RESOLVED: YES
PROBLEM ANALYSIS:
The complainant is experiencing frequent power cuts and billing issues in Chembur West, Mumbai at Ganesh Apartment near Chembur Station. This is a utility service issue that can be resolved by registering a complaint with the Maharashtra State Electricity Distribution Company (MSEDCL).
STEP-BY-STEP SOLUTION:
Step 1: Register Complaint with MSEDCL
* Call 1912 (24/7 toll-free helpline)
* SMS: Send "POWER (Consumer Number)" to 56767
* Online: Login at www.mahadiscom.in with your consumer number
* Mobile App: Download "MSEDCL" app from Play Store or App Store
Step 2: Note Your Complaint Number
* You will receive a complaint reference number via SMS
* Save this number for tracking and follow-up
* Keep a record of date and time of complaint
Step 3: For Billing Disputes
* Visit MSEDCL Chembur Division Office
* Bring latest bill, Aadhaar card, and meter photos
* Request bill verification and correction if needed
* Get written acknowledgment of your visit
Step 4: Track Your Complaint
* Call 1912 and provide complaint number
* Check status online at www.mahadiscom.in
* Technician will visit within 24-48 hours
* Follow up every 2-3 days if not resolved
REQUIRED DOCUMENTS:
1. Latest electricity bill - for consumer number verification
2. Consumer number - found on your electricity bill
3. Aadhaar card - for identity proof
4. Photos of meter - for billing disputes
5. Previous bills - to show billing pattern (if applicable)
CONTACT INFORMATION:
Office Name: MSEDCL Chembur Division Office
Address: Sion-Trombay Road, Chembur, Mumbai - 400071
Phone: 1912 (24/7 Helpline), 022-26832222 (Office)
Email: chembur@mahadiscom.in
Nodal Officer Email: nodalofficer.mumbai@mahadiscom.in
Website: www.mahadiscom.in
Office Hours: Monday to Saturday, 10:00 AM to 5:00 PM
EXPECTED TIMELINE:
* Complaint registration: Immediate
* Technician visit: Within 24-48 hours
* Power cut resolution: 2-3 days
* Billing correction: 7-10 working days
ESCALATION PROCESS:
If not resolved within 3 days:
1. Call Nodal Officer at 022-26832222 or email nodalofficer.mumbai@mahadiscom.in
2. After 7 days, escalate to Consumer Grievance Redressal Forum (CGRF)
3. CGRF Helpline: 1800-233-3435
4. Final escalation: Electricity Ombudsman (if CGRF fails)
IMPORTANT NOTES:
* Keep all complaint reference numbers safe for tracking
* Take photos of meter readings as evidence for billing disputes
* You can claim compensation for prolonged power outages as per MERC regulations
* Follow up regularly every 2-3 days until issue is resolved
* Consumer rights are protected under Electricity Act 2003
NOW PROVIDE A SIMILAR DETAILED RESPONSE FOR THE ACTUAL GRIEVANCE ABOVE. Use real government office names, actual helpline numbers, and specific procedures based on the department and location. Keep formatting simple and clean.`;
  const response = await getGeminiResponse(prompt);
  const isAIResolved = response.toUpperCase().includes('AI RESOLVED: YES');
  return {
    resolutionText: response,
    isAIResolved: isAIResolved,
    resolvedAt: isAIResolved ? new Date() : null
  };
}
async function detectGrievancePriority(grievanceData) {
  const prompt = `You are an AI system that analyzes citizen grievances and assigns priority levels based on urgency and severity.
GRIEVANCE INFORMATION:
Category: ${grievanceData.category}
Subcategory: ${grievanceData.subcategory}
Description: ${grievanceData.description}
Location: ${grievanceData.location ? 'Provided' : 'Not provided'}
PRIORITY LEVELS:
1. CRITICAL - Immediate threat to life, safety, or public health
   Keywords: fire, explosion, live wire, gas leak, collapse, death, injury, hospital, emergency, accident, flood, epidemic, riot, violence, armed, weapon, bomb, terrorist, child abuse, rape, murder, poisoning, electrocution
2. HIGH - Serious issues requiring urgent attention within 24-48 hours
   Keywords: water contamination, sewage overflow, road blockage, bridge damage, power outage (widespread), fallen tree, dangerous structure, missing person, theft, assault, harassment, corruption (with evidence), food poisoning, animal attack
3. MEDIUM - Important issues requiring attention within 3-7 days
   Keywords: pothole, street light, garbage collection, water supply irregular, noise pollution, illegal construction, encroachment, traffic signal malfunction, stray animals, minor leakage, billing error, document delay
4. LOW - Routine issues that can be addressed within 7-15 days
   Keywords: general inquiry, information request, suggestion, feedback, minor complaint, beautification, park maintenance, name change, address update, certificate request
ANALYSIS INSTRUCTIONS:
1. Scan the description for critical keywords
2. Consider the category and subcategory
3. Evaluate potential impact on public safety
4. Assess urgency based on context
5. Assign ONE priority level: Critical, High, Medium, or Low
6. Provide a brief reason (one sentence)
RESPONSE FORMAT (EXACTLY):
PRIORITY: [Critical/High/Medium/Low]
REASON: [One sentence explaining why this priority was assigned]
EXAMPLE 1:
Description: "Live electric wire fallen on road near school"
PRIORITY: Critical
REASON: Exposed live electrical wire near a school poses immediate danger to children and public safety.
EXAMPLE 2:
Description: "Street light not working in my area"
PRIORITY: Medium
REASON: Non-functional street light affects safety but is not an immediate emergency.
EXAMPLE 3:
Description: "Pothole on main road causing traffic issues"
PRIORITY: High
REASON: Large pothole on main road can cause accidents and requires urgent repair.
NOW ANALYZE THE ACTUAL GRIEVANCE ABOVE AND PROVIDE PRIORITY AND REASON.`;
  try {
    const response = await getGeminiResponse(prompt);
    const priorityMatch = response.match(/PRIORITY:\s*(Critical|High|Medium|Low)/i);
    const reasonMatch = response.match(/REASON:\s*(.+?)(?:\n|$)/i);
    const priority = priorityMatch ? priorityMatch[1] : 'Medium';
    const reason = reasonMatch ? reasonMatch[1].trim() : 'Standard priority assigned based on grievance category.';
    return {
      priority: priority,
      priorityReason: reason
    };
  } catch (error) {
    console.error("Priority detection error:", error);
    return fallbackPriorityDetection(grievanceData.description, grievanceData.category);
  }
}
function fallbackPriorityDetection(description, category) {
  const desc = description.toLowerCase();
  const criticalKeywords = ['fire', 'explosion', 'live wire', 'gas leak', 'collapse', 'death', 'injury', 'emergency', 'accident', 'flood', 'epidemic', 'violence', 'armed', 'bomb', 'child abuse', 'rape', 'murder', 'electrocution'];
  const highKeywords = ['contamination', 'sewage overflow', 'road blockage', 'bridge damage', 'power outage', 'fallen tree', 'dangerous', 'missing person', 'theft', 'assault', 'harassment', 'food poisoning'];
  for (const keyword of criticalKeywords) {
    if (desc.includes(keyword)) {
      return {
        priority: 'Critical',
        priorityReason: `Contains critical keyword: "${keyword}" indicating immediate safety threat.`
      };
    }
  }
  for (const keyword of highKeywords) {
    if (desc.includes(keyword)) {
      return {
        priority: 'High',
        priorityReason: `Contains urgent keyword: "${keyword}" requiring immediate attention.`
      };
    }
  }
  if (category === 'law_order' || category === 'health_sanitation') {
    return {
      priority: 'High',
      priorityReason: 'Category indicates potential public safety or health concern.'
    };
  }
  return {
    priority: 'Medium',
    priorityReason: 'Standard priority based on grievance category and description.'
  };
}
async function extractGrievanceFromChat(userMessage, language = "en") {
  const languageInstructions = {
    en: "Provide all text in English",
    hi: "Provide description and suggestedRemarks in Hindi (Devanagari script)",
    mr: "Provide description and suggestedRemarks in Marathi (Devanagari script)",
    ta: "Provide description and suggestedRemarks in Tamil",
    te: "Provide description and suggestedRemarks in Telugu",
    bn: "Provide description and suggestedRemarks in Bengali",
    gu: "Provide description and suggestedRemarks in Gujarati",
    kn: "Provide description and suggestedRemarks in Kannada",
    ml: "Provide description and suggestedRemarks in Malayalam",
    pa: "Provide description and suggestedRemarks in Punjabi"
  };
  const prompt = `You are an AI that extracts grievance information from user messages and maps them to the correct government departments.
IMPORTANT: ${languageInstructions[language] || "Provide all text in English"}. The "description" and "suggestedRemarks" fields MUST be in ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}.
User Message: "${userMessage}"
COMPREHENSIVE DEPARTMENT AND CATEGORY MAPPINGS:
1. FINANCIAL SERVICES (Banking Division)
   Keywords: bank, banking, loan, account, ATM, credit, debit, transaction, money, finance, payment, deposit, withdrawal, interest
   Category: "public_services"
   Subcategories: "ration_card", "voter_id", "driving_license", "passport"
2. LABOUR AND EMPLOYMENT
   Keywords: job, employment, salary, wage, work, labor, unemployment, pension, retirement, workplace, employer, employee
   Category: "employment" 
   Subcategories: "job_application", "salary_delay", "pension", "unemployment_benefits"
3. CENTRAL BOARD OF DIRECT TAXES (Income Tax)
   Keywords: tax, income tax, PAN, TDS, refund, assessment, ITR, taxation, revenue
   Category: "revenue_taxation"
   Subcategories: "property_tax", "land_records", "tax_refund", "assessment"
4. POSTS
   Keywords: post, postal, mail, letter, parcel, speed post, delivery, postman, post office
   Category: "public_services"
   Subcategories: "ration_card", "voter_id", "driving_license", "passport"
5. TELECOMMUNICATIONS
   Keywords: mobile, phone, internet, broadband, network, telecom, connection, data, call, SMS
   Category: "utilities"
   Subcategories: "electricity", "water_supply", "gas_connection", "internet"
6. PERSONNEL AND TRAINING
   Keywords: government employee, training, personnel, staff, recruitment, promotion, transfer
   Category: "employment"
   Subcategories: "job_application", "salary_delay", "pension", "unemployment_benefits"
7. HOUSING AND URBAN AFFAIRS
   - UTILITIES: electricity, power, supply, voltage, outage, billing, consumer, meter, bijli
     Category: "utilities", Subcategory: "electricity"
   - WATER: water, supply, tap, pipeline, connection, shortage, quality, pani
     Category: "infrastructure", Subcategory: "water_supply"  
   - ROADS: road, pothole, street, highway, repair, construction, traffic
     Category: "infrastructure", Subcategory: "roads"
   - STREET LIGHTS: light, lighting, lamp, pole, illumination
     Category: "infrastructure", Subcategory: "street_lights"
   - DRAINAGE: drain, sewage, overflow, blockage, cleaning
     Category: "infrastructure", Subcategory: "drainage"
   - TRANSPORT: bus, transport, public transport, metro, auto
     Category: "infrastructure", Subcategory: "public_transport"
   - HOUSING: house, apartment, building, construction, property
     Category: "social_welfare", Subcategory: "disability_benefits"
8. HEALTH & FAMILY WELFARE
   Keywords: health, hospital, doctor, medicine, treatment, medical, clinic, ambulance, disease, illness
   Category: "health_sanitation"
   Subcategories: "hospital_services", "waste_management", "water_quality", "public_toilets"
ANALYSIS RULES:
1. Look for PRIMARY keywords that indicate the main issue
2. Match to the most appropriate department
3. Select the correct category and subcategory
4. If multiple matches, choose the most specific one
5. Default to "Housing and Urban Affairs" for infrastructure issues
RESPONSE FORMAT (JSON):
{
  "department": "Exact Department Name",
  "category": "category_value",
  "subcategory": "subcategory_value", 
  "description": "Enhanced description of the issue",
  "suggestedRemarks": "Specific information that would help resolve this issue"
}
EXAMPLES:
User: "My bank account is blocked and I cannot withdraw money"
{
  "department": "Financial Services (Banking Division)",
  "category": "public_services",
  "subcategory": "ration_card",
  "description": "Bank account blocked preventing money withdrawal",
  "suggestedRemarks": "Mention your account number, bank branch, when the issue started, and any error messages received"
}
User: "I haven't received my salary for 2 months"
{
  "department": "Labour and Employment", 
  "category": "employment",
  "subcategory": "salary_delay",
  "description": "Salary payment delayed for 2 months",
  "suggestedRemarks": "Mention your employee ID, company name, designation, and any communication with HR department"
}
User: "My income tax refund is pending for 6 months"
{
  "department": "Central Board of Direct Taxes (Income Tax)",
  "category": "revenue_taxation", 
  "subcategory": "tax_refund",
  "description": "Income tax refund pending for 6 months",
  "suggestedRemarks": "Mention your PAN number, assessment year, ITR acknowledgment number, and refund amount"
}
User: "Speed post not delivered to my address"
{
  "department": "Posts",
  "category": "public_services",
  "subcategory": "passport", 
  "description": "Speed post delivery failure",
  "suggestedRemarks": "Mention tracking number, sender details, expected delivery date, and your complete address"
}
User: "Mobile network is very poor in my area"
{
  "department": "Telecommunications",
  "category": "utilities",
  "subcategory": "internet",
  "description": "Poor mobile network connectivity in the area", 
  "suggestedRemarks": "Mention your mobile operator, specific location, time when issue occurs, and signal strength"
}
User: "Electricity supply issue reported in Adwait Apartment"
Language: English
{
  "department": "Housing and Urban Affairs",
  "category": "utilities",
  "subcategory": "electricity",
  "description": "Electricity supply issue reported in Adwait Apartment",
  "suggestedRemarks": "Mention the exact nature of the electricity issue (outage/voltage/billing), consumer number, and duration of problem"
}
User: "मला वीज पुरवठ्याची समस्या आहे"
Language: Marathi
{
  "department": "Housing and Urban Affairs",
  "category": "utilities",
  "subcategory": "electricity",
  "description": "वीज पुरवठ्याची समस्या",
  "suggestedRemarks": "वीज समस्येचे नेमके स्वरूप (कपात/व्होल्टेज/बिलिंग), ग्राहक क्रमांक आणि समस्येचा कालावधी नमूद करा"
}
User: "मुझे बिजली की समस्या है"
Language: Hindi
{
  "department": "Housing and Urban Affairs",
  "category": "utilities",
  "subcategory": "electricity",
  "description": "बिजली की समस्या",
  "suggestedRemarks": "बिजली समस्या की सटीक प्रकृति (कटौती/वोल्टेज/बिलिंग), उपभोक्ता संख्या और समस्या की अवधि का उल्लेख करें"
}
User: "Water supply not coming for 3 days"
{
  "department": "Housing and Urban Affairs", 
  "category": "infrastructure",
  "subcategory": "water_supply",
  "description": "No water supply for 3 days",
  "suggestedRemarks": "Mention your water connection number, usual supply timings, and if neighbors are also affected"
}
User: "Big pothole on main road causing accidents"
{
  "department": "Housing and Urban Affairs",
  "category": "infrastructure", 
  "subcategory": "roads",
  "description": "Large pothole on main road causing accidents",
  "suggestedRemarks": "Mention exact road name, landmark nearby, size of pothole, and if any accidents have occurred"
}
User: "Hospital staff is rude and not providing proper treatment"
{
  "department": "Health & Family Welfare",
  "category": "health_sanitation",
  "subcategory": "hospital_services", 
  "description": "Poor hospital service and staff behavior",
  "suggestedRemarks": "Mention hospital name, department, staff names if known, date and time of incident, and patient details"
}
NOW EXTRACT FROM THE ACTUAL USER MESSAGE ABOVE. Return ONLY valid JSON, no other text.`;
  try {
    const response = await getGeminiResponse(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Extracted grievance data:", parsed);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Error extracting grievance:", error);
    return null;
  }
}
module.exports = {
  getGeminiResponse,
  getChatbotGuidelines,
  analyzeGrievanceForResolution,
  detectGrievancePriority,
  extractGrievanceFromChat,
  analyzeGrievanceEvidence
};

async function analyzeGrievanceEvidence(description, category, fileBuffer, mimeType) {
  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-flash"
    });

    const base64Image = fileBuffer.toString("base64");

    const prompt = `
You are an AI fraud detection system for a government grievance portal.

Your task:
Check if the uploaded image matches the complaint.

Complaint:
"${description}"

Category:
"${category}"

Rules:
- If image matches complaint → isSpam: false
- If unrelated/fake → isSpam: true

Return ONLY JSON:
{
  "isSpam": true/false,
  "reason": "short explanation"
}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    let text = result.response.text();

    // 🧹 CLEAN JSON
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);

    return parsed;

  } catch (error) {
    console.error("Gemini Evidence Error:", error);
    return { isSpam: false, reason: "Fallback - allowed" };
  }
}