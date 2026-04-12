const SocialComplaint = require('../models/socialComplaint');
const Grievance = require('../models/grievance');
const { detectGrievancePriority, extractGrievanceFromChat } = require('./gemini');
const { detectDuplicateComplaints } = require('./duplicateDetection');

function normalizeText(text = '') {
  return String(text).toLowerCase().replace(/\s+/g, ' ').trim();
}

function deriveComplaintGuess(text = '') {
  const lower = normalizeText(text);
  const keywordMap = [
    { keyword: 'electricity', department: 'Housing and Urban Affairs', category: 'utilities', subcategory: 'electricity' },
    { keyword: 'power cut', department: 'Housing and Urban Affairs', category: 'utilities', subcategory: 'electricity' },
    { keyword: 'water', department: 'Housing and Urban Affairs', category: 'infrastructure', subcategory: 'water_supply' },
    { keyword: 'road', department: 'Housing and Urban Affairs', category: 'infrastructure', subcategory: 'roads' },
    { keyword: 'pothole', department: 'Housing and Urban Affairs', category: 'infrastructure', subcategory: 'roads' },
    { keyword: 'garbage', department: 'Housing and Urban Affairs', category: 'infrastructure', subcategory: 'waste_management' },
    { keyword: 'street light', department: 'Housing and Urban Affairs', category: 'infrastructure', subcategory: 'street_lights' },
    { keyword: 'hospital', department: 'Health & Family Welfare', category: 'health_sanitation', subcategory: 'hospital_services' },
    { keyword: 'doctor', department: 'Health & Family Welfare', category: 'health_sanitation', subcategory: 'hospital_services' },
    { keyword: 'train', department: 'Posts', category: 'public_services', subcategory: 'postal_services' },
    { keyword: 'bank', department: 'Financial Services (Banking Division)', category: 'public_services', subcategory: 'banking_issues' },
    { keyword: 'salary', department: 'Labour and Employment', category: 'employment', subcategory: 'salary_delay' },
    { keyword: 'job', department: 'Labour and Employment', category: 'employment', subcategory: 'job_application' },
    { keyword: 'tax', department: 'Central Board of Direct Taxes (Income Tax)', category: 'revenue_taxation', subcategory: 'tax_refund' },
    { keyword: 'mobile', department: 'Telecommunications', category: 'utilities', subcategory: 'internet' },
    { keyword: 'internet', department: 'Telecommunications', category: 'utilities', subcategory: 'internet' }
  ];

  for (const entry of keywordMap) {
    if (lower.includes(entry.keyword)) {
      return entry;
    }
  }

  return {
    department: 'Housing and Urban Affairs',
    category: 'infrastructure',
    subcategory: 'general'
  };
}

function computeVerificationScore(result = {}) {
  const base = result.isComplaint ? 55 : 20;
  const priorityBoost = result.priority === 'Critical' ? 25 : result.priority === 'High' ? 18 : result.priority === 'Medium' ? 10 : 5;
  const locationBoost = result.detectedLocationText ? 7 : 0;
  const keywordBoost = Math.min(15, (result.matchedKeywords || []).length * 4);
  return Math.min(100, base + priorityBoost + locationBoost + keywordBoost);
}

async function analyzeSocialComplaint(postData) {
  const sourceContent = postData.sourceContent || '';
  const sourceLanguage = postData.sourceLanguage || 'en';
  const guess = deriveComplaintGuess(sourceContent);

  let mapped = {
    ...guess,
    priority: 'Medium',
    priorityReason: 'Default priority before AI verification.',
    isComplaint: true,
    verificationReason: 'Initial social post inspection passed.'
  };

  try {
    const prompt = `You are an AI government complaint verifier.

Analyze this social media post and decide whether it is a genuine citizen complaint that should be forwarded to a government grievance system.

Social post:
${sourceContent}

Language: ${sourceLanguage}

Return ONLY valid JSON in this exact schema:
{
  "isComplaint": true/false,
  "verificationReason": "one short sentence",
  "department": "department name",
  "category": "category code",
  "subcategory": "subcategory code",
  "priority": "Low|Medium|High|Critical",
  "priorityReason": "one short sentence",
  "detectedLocationText": "text location if found or empty string",
  "matchedKeywords": ["word1", "word2"]
}

Rules:
- If it is a complaint about public services, infrastructure, health, electricity, water, roads, transport, police, education, or civic issues, set isComplaint to true.
- If it is spam, promotion, personal chat, or unrelated content, set isComplaint to false.
- Priority must reflect urgency and safety impact.`;

    const { getGeminiResponse } = require('./gemini');
    const response = await getGeminiResponse(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      mapped = {
        ...mapped,
        ...parsed
      };
    }
  } catch (error) {
    console.error('Social complaint AI analysis failed, using fallback:', error.message);
  }

  if (!mapped.priority || !['Low', 'Medium', 'High', 'Critical'].includes(mapped.priority)) {
    const priority = await detectGrievancePriority({
      category: mapped.category,
      subcategory: mapped.subcategory,
      description: sourceContent,
      location: postData.detectedLocationHint || null
    });
    mapped.priority = priority.priority || 'Medium';
    mapped.priorityReason = priority.priorityReason || 'Standard priority assigned by fallback analyzer.';
  }

  const keywords = ['complaint', 'issue', 'problem', 'help', 'urgent', 'wrong', 'broken', 'damage', 'water', 'electricity', 'road', 'pothole', 'hospital', 'salary', 'tax', 'noise'];
  const lower = normalizeText(sourceContent);
  const matchedKeywords = keywords.filter((k) => lower.includes(k));
  mapped.matchedKeywords = Array.from(new Set([...(mapped.matchedKeywords || []), ...matchedKeywords]));
  mapped.verificationScore = computeVerificationScore(mapped);

  if (!mapped.department || !mapped.category || !mapped.subcategory) {
    const fallback = deriveComplaintGuess(sourceContent);
    mapped.department = mapped.department || fallback.department;
    mapped.category = mapped.category || fallback.category;
    mapped.subcategory = mapped.subcategory || fallback.subcategory;
  }

  return mapped;
}

async function createSocialGrievanceDraft(postData, importedBy = null, existingSocialRecord = null) {
  const analysis = existingSocialRecord
    ? {
        isComplaint: !!existingSocialRecord.isComplaint,
        verificationScore: existingSocialRecord.verificationScore || 0,
        verificationReason: existingSocialRecord.verificationReason || '',
        department: existingSocialRecord.department || '',
        category: existingSocialRecord.category || '',
        subcategory: existingSocialRecord.subcategory || '',
        priority: existingSocialRecord.priority || 'Medium',
        priorityReason: existingSocialRecord.priorityReason || '',
        detectedLocationText: existingSocialRecord.detectedLocationText || null,
        matchedKeywords: existingSocialRecord.matchedKeywords || []
      }
    : await analyzeSocialComplaint(postData);

  const socialRecord = existingSocialRecord || await SocialComplaint.create({
    sourcePlatform: postData.sourcePlatform,
    sourcePostId: postData.sourcePostId || null,
    sourcePostUrl: postData.sourcePostUrl || null,
    sourceHandle: postData.sourceHandle || null,
    sourceAuthorName: postData.sourceAuthorName || null,
    sourceContent: postData.sourceContent,
    sourceLanguage: postData.sourceLanguage || 'en',
    sourcePostedAt: postData.sourcePostedAt || Date.now(),
    detectedLocationText: analysis.detectedLocationText || postData.detectedLocationText || null,
    detectedLocationHint: postData.detectedLocationHint || null,
    isComplaint: !!analysis.isComplaint,
    verificationScore: analysis.verificationScore,
    verificationReason: analysis.verificationReason || '',
    department: analysis.department || '',
    category: analysis.category || '',
    subcategory: analysis.subcategory || '',
    priority: analysis.priority || 'Medium',
    priorityReason: analysis.priorityReason || '',
    matchedKeywords: analysis.matchedKeywords || [],
    status: analysis.isComplaint ? 'Verified' : 'Rejected'
  });

  if (existingSocialRecord) {
    socialRecord.isComplaint = !!analysis.isComplaint;
    socialRecord.verificationScore = analysis.verificationScore;
    socialRecord.verificationReason = analysis.verificationReason || '';
    socialRecord.department = analysis.department || '';
    socialRecord.category = analysis.category || '';
    socialRecord.subcategory = analysis.subcategory || '';
    socialRecord.priority = analysis.priority || 'Medium';
    socialRecord.priorityReason = analysis.priorityReason || '';
    socialRecord.matchedKeywords = analysis.matchedKeywords || [];
    socialRecord.detectedLocationText = analysis.detectedLocationText || postData.detectedLocationText || null;
    socialRecord.status = analysis.isComplaint ? 'Verified' : 'Rejected';
  }

  if (!analysis.isComplaint) {
    return { socialRecord, grievance: null, duplicateCheck: null };
  }

  const grievancePayload = {
    description: sourceContent,
    department: analysis.department,
    category: analysis.category,
    subcategory: analysis.subcategory,
    location: postData.detectedLocationHint || null
  };

  const duplicateCheck = await detectDuplicateComplaints(grievancePayload);
  const grievance = await Grievance.create({
    complainantName: postData.sourceAuthorName || postData.sourceHandle || 'Social Media User',
    complainantEmail: `${postData.sourcePlatform}:${postData.sourceHandle || 'anonymous'}@social.local`,
    department: analysis.department,
    category: analysis.category,
    subcategory: analysis.subcategory,
    description: sourceContent,
    location: postData.detectedLocationHint || null,
    priority: analysis.priority,
    priorityReason: analysis.priorityReason,
    currentStatus: 'Complaint Filed',
    isSpam: false,
    fileName: postData.sourcePostUrl || postData.sourcePostId || null,
    sourcePlatform: postData.sourcePlatform,
    sourcePostId: postData.sourcePostId || null,
    sourcePostUrl: postData.sourcePostUrl || null,
    sourceHandle: postData.sourceHandle || null,
    sourceAuthorName: postData.sourceAuthorName || null,
    sourceContent: sourceContent,
    sourceVerified: true,
    sourceImported: true,
    sourceImportedFrom: postData.sourcePlatform,
    sourceImportedAt: new Date(),
    sourceVerificationScore: analysis.verificationScore,
    sourceVerificationReason: analysis.verificationReason,
    sourceDetectedLocationText: analysis.detectedLocationText || null
  });

  socialRecord.grievanceCreated = true;
  socialRecord.grievanceCode = grievance.grievanceCode;
  socialRecord.grievanceId = grievance._id;
  socialRecord.importedBy = importedBy;
  socialRecord.importedAt = new Date();
  socialRecord.status = 'Imported';
  await socialRecord.save();

  return { socialRecord, grievance, duplicateCheck };
}

module.exports = {
  analyzeSocialComplaint,
  createSocialGrievanceDraft
};
