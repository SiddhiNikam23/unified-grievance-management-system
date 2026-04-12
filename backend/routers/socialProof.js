const express = require("express");
const SocialComplaintEvidence = require("../models/socialComplaintEvidence");
const {
  verifyEvidenceById,
  verifyRecentEvidence,
  updateLifecycleStatus
} = require("../services/socialProofEngine");

const router = express.Router();

function toAbsoluteUrl(req, urlPath) {
  if (!urlPath) return "";
  if (/^https?:\/\//i.test(urlPath)) return urlPath;
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
}

router.get("/dashboard", async (req, res) => {
  try {
    const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 100));
    const platform = req.query.platform;
    const status = req.query.status;
    const q = String(req.query.q || "").trim();

    const filter = {};
    if (platform) filter.platform = platform;
    if (status) filter.lifecycleStatus = status;
    if (q) {
      filter.$or = [
        { complaintText: { $regex: q, $options: "i" } },
        { issueType: { $regex: q, $options: "i" } },
        { locationText: { $regex: q, $options: "i" } },
        { authorHandle: { $regex: q, $options: "i" } }
      ];
    }

    const rows = await SocialComplaintEvidence.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const metrics = {
      total: rows.length,
      live: rows.filter((r) => r.availabilityStatus === "live").length,
      deleted: rows.filter((r) => r.availabilityStatus === "deleted").length,
      highConfidence: rows.filter((r) => Number(r.authenticity?.overallScore || 0) >= 75).length,
      openCases: rows.filter((r) => ["Detected", "Triaged", "Investigating"].includes(r.lifecycleStatus)).length
    };

    const items = rows.map((r) => ({
      id: r._id,
      grievanceCode: r.grievanceCode,
      platform: r.platform,
      author: r.authorHandle,
      issueType: r.issueType,
      location: r.locationText,
      complaintText: r.complaintText,
      postUrl: r.postUrl,
      availabilityStatus: r.availabilityStatus,
      lifecycleStatus: r.lifecycleStatus,
      firstCapturedAt: r.firstCapturedAt,
      lastObservedAt: r.lastObservedAt,
      lastVerifiedAt: r.lastVerifiedAt,
      proofSnapshots: (r.snapshots || []).length,
      verificationEvents: (r.verificationEvents || []).length,
      authenticityScore: Number(r.authenticity?.overallScore || 0),
      confidenceBand: r.authenticity?.confidenceBand || "Low",
      reasons: r.authenticity?.reasons || []
    }));

    res.json({ success: true, metrics, items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    const item = await SocialComplaintEvidence.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ success: false, error: "Evidence not found" });
    }

    const snapshots = (item.snapshots || []).map((snap) => {
      const metadata = snap.metadata || {};
      const proofUrl = metadata.screenshotUrl
        ? toAbsoluteUrl(req, metadata.screenshotUrl)
        : metadata.screenshotFileName
          ? toAbsoluteUrl(req, `/file/${encodeURIComponent(metadata.screenshotFileName)}`)
          : "";

      return {
        ...snap,
        metadata: {
          ...metadata,
          proofUrl
        }
      };
    });

    res.json({
      success: true,
      evidence: {
        id: item._id,
        grievanceCode: item.grievanceCode,
        platform: item.platform,
        postUrl: item.postUrl,
        snapshots,
        verificationEvents: item.verificationEvents || [],
        authenticity: item.authenticity || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/:id/verify", async (req, res) => {
  try {
    const updated = await verifyEvidenceById(req.params.id, "manual");
    res.json({ success: true, evidence: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verify-recent", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.body.limit) || 30));
    const report = await verifyRecentEvidence(limit);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch("/:id/lifecycle", async (req, res) => {
  try {
    const allowed = ["Detected", "Triaged", "Investigating", "Actioned", "Resolved", "Rejected"];
    const { lifecycleStatus } = req.body || {};

    if (!allowed.includes(lifecycleStatus)) {
      return res.status(400).json({ success: false, error: "Invalid lifecycleStatus" });
    }

    const updated = await updateLifecycleStatus(req.params.id, lifecycleStatus);
    res.json({ success: true, evidence: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
