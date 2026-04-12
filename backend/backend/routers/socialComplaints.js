const express = require('express');
const SocialComplaint = require('../models/socialComplaint');
const { checkLogin } = require('../middlewares/auth');
const { analyzeSocialComplaint, createSocialGrievanceDraft } = require('../services/socialComplaintListener');

const router = express.Router();

function normalizeBatchPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.posts)) return payload.posts;
  return [payload];
}

router.get('/', checkLogin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const status = req.query.status;
    const query = status ? { status } : {};
    const items = await SocialComplaint.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json(items);
  } catch (error) {
    console.error('Error listing social complaints:', error);
    res.status(500).json({ error: 'Failed to list social complaints' });
  }
});

router.post('/intake', checkLogin, async (req, res) => {
  try {
    const posts = normalizeBatchPayload(req.body);
    const results = [];

    for (const post of posts) {
      if (!post || !post.sourceContent) {
        results.push({ error: 'sourceContent is required' });
        continue;
      }

      const socialComplaint = await SocialComplaint.create({
        sourcePlatform: post.sourcePlatform || 'unknown',
        sourcePostId: post.sourcePostId || null,
        sourcePostUrl: post.sourcePostUrl || null,
        sourceHandle: post.sourceHandle || null,
        sourceAuthorName: post.sourceAuthorName || null,
        sourceContent: post.sourceContent,
        sourceLanguage: post.sourceLanguage || 'en',
        sourcePostedAt: post.sourcePostedAt || Date.now(),
        detectedLocationText: post.detectedLocationText || null,
        detectedLocationHint: post.detectedLocationHint || null,
        status: 'Detected'
      });

      const analysis = await analyzeSocialComplaint(post);
      socialComplaint.isComplaint = !!analysis.isComplaint;
      socialComplaint.verificationScore = analysis.verificationScore || 0;
      socialComplaint.verificationReason = analysis.verificationReason || '';
      socialComplaint.department = analysis.department || '';
      socialComplaint.category = analysis.category || '';
      socialComplaint.subcategory = analysis.subcategory || '';
      socialComplaint.priority = analysis.priority || 'Medium';
      socialComplaint.priorityReason = analysis.priorityReason || '';
      socialComplaint.matchedKeywords = analysis.matchedKeywords || [];
      socialComplaint.detectedLocationText = analysis.detectedLocationText || post.detectedLocationText || null;
      socialComplaint.status = analysis.isComplaint ? 'Verified' : 'Rejected';
      await socialComplaint.save();

      results.push(socialComplaint);
    }

    res.status(201).json({ success: true, results });
  } catch (error) {
    console.error('Error creating social complaint intake:', error);
    res.status(500).json({ error: 'Failed to intake social posts' });
  }
});

router.post('/:id/import', checkLogin, async (req, res) => {
  try {
    const socialComplaint = await SocialComplaint.findById(req.params.id);
    if (!socialComplaint) {
      return res.status(404).json({ error: 'Social complaint not found' });
    }

    if (!socialComplaint.isComplaint) {
      return res.status(400).json({ error: 'Only verified complaint posts can be imported' });
    }

    if (socialComplaint.grievanceCreated) {
      return res.status(200).json({
        success: true,
        message: 'Complaint already imported',
        grievanceCode: socialComplaint.grievanceCode
      });
    }

    const imported = await createSocialGrievanceDraft({
      sourcePlatform: socialComplaint.sourcePlatform,
      sourcePostId: socialComplaint.sourcePostId,
      sourcePostUrl: socialComplaint.sourcePostUrl,
      sourceHandle: socialComplaint.sourceHandle,
      sourceAuthorName: socialComplaint.sourceAuthorName,
      sourceContent: socialComplaint.sourceContent,
      sourceLanguage: socialComplaint.sourceLanguage,
      sourcePostedAt: socialComplaint.sourcePostedAt,
      detectedLocationText: socialComplaint.detectedLocationText,
      detectedLocationHint: socialComplaint.detectedLocationHint
    }, req.user?.user?.email || 'admin', socialComplaint);

    res.json({
      success: true,
      socialComplaint: imported.socialRecord,
      grievance: imported.grievance,
      duplicateCheck: imported.duplicateCheck
    });
  } catch (error) {
    console.error('Error importing social complaint:', error);
    res.status(500).json({ error: 'Failed to import social complaint into grievance' });
  }
});

router.post('/verify', checkLogin, async (req, res) => {
  try {
    const posts = normalizeBatchPayload(req.body);
    const results = [];

    for (const post of posts) {
      const analysis = await analyzeSocialComplaint(post);
      results.push({
        sourcePlatform: post.sourcePlatform || 'unknown',
        sourceHandle: post.sourceHandle || null,
        isComplaint: analysis.isComplaint,
        verificationScore: analysis.verificationScore,
        verificationReason: analysis.verificationReason,
        department: analysis.department,
        category: analysis.category,
        subcategory: analysis.subcategory,
        priority: analysis.priority,
        priorityReason: analysis.priorityReason,
        detectedLocationText: analysis.detectedLocationText || null,
        matchedKeywords: analysis.matchedKeywords || []
      });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error verifying social complaint posts:', error);
    res.status(500).json({ error: 'Failed to verify social complaint posts' });
  }
});

module.exports = router;
