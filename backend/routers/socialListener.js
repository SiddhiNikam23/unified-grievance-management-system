const express = require("express");
const Grievance = require("../models/grievance");
const NotificationLog = require("../models/notificationLog");
const {
  scanAndStoreSocialComplaints,
  getRecentAlerts,
  COMPLAINT_KEYWORDS,
  TRACKED_HASHTAGS,
  upsertComplaintFromPost
} = require("../services/socialComplaintListener");
const { onStatusUpdated } = require("../services/notificationEngine");

const router = express.Router();

router.get("/config", async (_req, res) => {
  res.json({
    keywords: COMPLAINT_KEYWORDS,
    hashtags: TRACKED_HASHTAGS,
    enabled: String(process.env.SOCIAL_LISTENER_ENABLED || "true") === "true"
  });
});

router.post("/scan", async (_req, res) => {
  try {
    const report = await scanAndStoreSocialComplaints();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/simulate", async (req, res) => {
  try {
    const {
      platform = "reddit",
      username = "civic_user",
      content = "Pipeline issue and water leakage near Sion, Bombay. #PipelineIssue #MumbaiProblems urgent repair needed.",
      postId = `SIM_${Date.now()}`,
      url = "https://example.com/simulated-post",
      timestamp = new Date().toISOString()
    } = req.body || {};

    const result = await upsertComplaintFromPost({
      platform,
      username,
      content,
      postId,
      url,
      timestamp
    });

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/complaints", async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
    const items = await Grievance.find({ source: { $in: ["twitter", "reddit", "instagram"] } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const payload = items.map((g) => ({
      grievanceCode: g.grievanceCode,
      platform: g.source,
      user: g.sourceMetadata?.socialUsername || g.complainantName,
      content: g.description,
      post_url: g.sourceMetadata?.socialPostUrl || g.sourceMetadata?.redditPermalink || g.sourceMetadata?.twitterTweetId || "",
      issue_type: g.issueType || g.subcategory || "General",
      location: g.locationText || "Unknown",
      coordinates:
        g.location && g.location.latitude != null && g.location.longitude != null
          ? { latitude: g.location.latitude, longitude: g.location.longitude }
          : "Unknown",
      priority: g.priority,
      validity_score: g.validityScore || 0,
      sentiment: g.sentimentTag || "Negative",
      department: g.department,
      timestamp: g.dateOfReceipt || g.createdAt,
      status: g.currentStatus,
      moderation_status: g.moderationStatus || "Pending",
      is_duplicate: Boolean(g.isDuplicate),
      eta: {
        department: g.etaDepartmentKey || g.serviceDepartmentKey || g.department || "GENERAL",
        department_label: g.etaDepartmentLabel || g.serviceDepartmentLabel || g.department || "General Department",
        status: g.etaStatus || "NORMAL",
        base_time_days: g.etaBaseDays ?? null,
        backlog_delay_days: g.etaBacklogDays ?? null,
        final_eta_days: g.etaFinalDays ?? null,
        backlog_count: g.etaBacklogCount ?? 0,
        capacity_per_day: g.etaCapacityPerDay ?? null,
        historical_average_days: g.etaHistoricalDays ?? null,
        priority_factor: g.etaPriorityFactor ?? null,
        ai_factor: g.etaAiFactor ?? null,
        message: g.etaMessage || "ETA will be calculated when available.",
        calculated_at: g.etaCalculatedAt || g.updatedAt || g.createdAt
      }
    }));

    res.json({ success: true, complaints: payload });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/map-pins", async (req, res) => {
  try {
    const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 100));
    const grievances = await Grievance.find({
      source: { $in: ["twitter", "reddit", "instagram"] },
      "location.latitude": { $ne: null },
      "location.longitude": { $ne: null }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const pins = grievances.map((g) => ({
      grievanceCode: g.grievanceCode,
      lat: g.location.latitude,
      lng: g.location.longitude,
      priority: g.priority,
      issueType: g.issueType,
      location: g.locationText,
      color:
        g.priority === "Critical" || g.priority === "High"
          ? "Red"
          : g.priority === "Medium"
            ? "Yellow"
            : "Green"
    }));

    res.json({ success: true, pins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/alerts", async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  res.json({ success: true, alerts: getRecentAlerts(limit) });
});

router.get("/notification-logs", async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const logs = await NotificationLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const output = logs.map((log) => ({
      notification_type: log.notificationType,
      channel: log.channel,
      recipient: log.recipient,
      status: log.deliveryStatus,
      timestamp: log.createdAt,
      complaint_id: log.grievanceCode
    }));

    res.json({ success: true, logs: output });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/cleanup", async (req, res) => {
  try {
    const {
      dryRun = true,
      removeSimulation = true,
      removeNonCivicLongPosts = true,
      removeByGrievanceCodes = []
    } = req.body || {};

    const socialSources = ["twitter", "reddit", "instagram"];
    const deleteConditions = [{ source: { $in: socialSources } }];

    if (removeSimulation) {
      deleteConditions.push({
        $or: [
          { "sourceMetadata.socialPostUrl": /example\.com\/(simulated-post|mock-)/i },
          { "sourceMetadata.redditPermalink": /example\.com\/(simulated-post|mock-)/i },
          { "sourceMetadata.redditPostId": /^SIM_/i },
          { complainantEmail: /@reddit\.social$/i }
        ]
      });
    }

    if (removeNonCivicLongPosts) {
      deleteConditions.push({
        description: /scripture|gospel|spiritual corruption|linguistics as a tool for spiritual corruption/i,
        source: "reddit"
      });
    }

    if (Array.isArray(removeByGrievanceCodes) && removeByGrievanceCodes.length > 0) {
      deleteConditions.push({ grievanceCode: { $in: removeByGrievanceCodes } });
    }

    const finalQuery = { $or: deleteConditions };

    const candidates = await Grievance.find(finalQuery)
      .select("grievanceCode source complainantName description sourceMetadata.socialPostUrl")
      .lean();

    if (String(dryRun) !== "false") {
      return res.json({
        success: true,
        mode: "dry-run",
        matchedCount: candidates.length,
        matched: candidates
      });
    }

    const codes = candidates.map((c) => c.grievanceCode);
    const deletion = await Grievance.deleteMany({ grievanceCode: { $in: codes } });

    res.json({
      success: true,
      mode: "delete",
      matchedCount: candidates.length,
      deletedCount: deletion.deletedCount || 0,
      deletedCodes: codes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let lastPayload = "";

  const push = () => {
    const latest = getRecentAlerts(15);
    const payload = JSON.stringify({ alerts: latest, ts: new Date().toISOString() });
    if (payload !== lastPayload) {
      res.write(`event: alerts\n`);
      res.write(`data: ${payload}\n\n`);
      lastPayload = payload;
    } else {
      res.write(`event: heartbeat\n`);
      res.write(`data: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
    }
  };

  push();
  const timer = setInterval(push, 10000);

  req.on("close", () => {
    clearInterval(timer);
    res.end();
  });
});

router.patch("/:grievanceCode/moderation", async (req, res) => {
  try {
    const { grievanceCode } = req.params;
    const { action, department, reason } = req.body;

    const allowed = ["approve", "reject", "resolve"];
    if (!allowed.includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const previous = await Grievance.findOne({ grievanceCode });
    if (!previous) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    const update = {};

    if (action === "approve") {
      update.moderationStatus = "Approved";
      update.currentStatus = "Under Review";
      update.moderationReason = reason || "Approved by admin";
    }

    if (action === "reject") {
      update.moderationStatus = "Rejected";
      update.currentStatus = "Rejected";
      update.moderationReason = reason || "Rejected by admin";
    }

    if (action === "resolve") {
      update.moderationStatus = "Approved";
      update.currentStatus = "Resolved";
      update.moderationReason = reason || "Resolved by admin";
    }

    if (department) {
      update.department = department;
    }

    const updated = await Grievance.findOneAndUpdate(
      { grievanceCode },
      { $set: update },
      { new: true }
    );

    try {
      await onStatusUpdated({
        previousStatus: previous.currentStatus,
        previousDepartment: previous.department,
        grievance: updated
      });
    } catch (notifyError) {
      console.error("Notification error (social moderation):", notifyError.message);
    }

    res.json({ success: true, grievance: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
