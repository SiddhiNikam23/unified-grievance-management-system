const crypto = require("crypto");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const Grievance = require("../models/grievance");
const SocialComplaintEvidence = require("../models/socialComplaintEvidence");

let cachedChromium = null;

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function confidenceBand(overallScore) {
  if (overallScore >= 75) return "High";
  if (overallScore >= 45) return "Medium";
  return "Low";
}

function ensureSafeFilePart(value, fallback = "unknown") {
  const clean = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || fallback;
}

function getBrowserExecutablePath() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) {
    return process.env.CHROMIUM_PATH;
  }

  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ];

  return candidates.find((item) => fs.existsSync(item));
}

async function getChromium() {
  if (cachedChromium) return cachedChromium;
  try {
    const pkg = require("playwright-core");
    cachedChromium = pkg.chromium;
    return cachedChromium;
  } catch (_error) {
    return null;
  }
}

function uploadBufferToGridFS(buffer, filename, contentType = "image/png") {
  return new Promise((resolve, reject) => {
    if (!mongoose.connection || mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      reject(new Error("Database connection is not ready for GridFS upload"));
      return;
    }

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    const stream = bucket.openUploadStream(filename, {
      contentType,
      metadata: {
        source: "social-proof",
        uploadedAt: new Date()
      }
    });

    stream.on("finish", () => {
      resolve({ fileId: stream.id, filename });
    });

    stream.on("error", (error) => reject(error));
    stream.end(buffer);
  });
}

function hasScreenshotProof(snapshots = []) {
  return snapshots.some((snap) => {
    const meta = snap?.metadata || {};
    return Boolean(meta.screenshotFileName || meta.screenshotUrl);
  });
}

async function capturePostScreenshot({ postUrl, platform, postId }) {
  if (!postUrl) {
    return { ok: false, reason: "no-post-url" };
  }

  const chromium = await getChromium();
  if (!chromium) {
    return { ok: false, reason: "playwright-core-not-available" };
  }

  const executablePath = getBrowserExecutablePath();
  if (!executablePath) {
    return { ok: false, reason: "no-browser-executable" };
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(1500);

    const pngBuffer = await page.screenshot({ fullPage: true, type: "png" });
    const stamp = Date.now();
    const fileName = `social-proof-${ensureSafeFilePart(platform)}-${ensureSafeFilePart(postId, String(stamp))}-${stamp}.png`;
    await uploadBufferToGridFS(pngBuffer, fileName, "image/png");

    return {
      ok: true,
      screenshotFileName: fileName,
      screenshotUrl: `/file/${encodeURIComponent(fileName)}`
    };
  } catch (error) {
    return { ok: false, reason: error.message };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_err) {
        // ignore close errors
      }
    }
  }
}

async function getCrossSourceSignals({ complaintText, issueType, locationText, grievanceCode }) {
  const baseQuery = {
    grievanceCode: { $ne: grievanceCode },
    issueType: issueType || "General"
  };

  const locationQuery = locationText && locationText !== "Unknown" ? { locationText } : {};

  const candidates = await Grievance.find({
    ...baseQuery,
    ...locationQuery,
    source: { $in: ["twitter", "reddit", "instagram", "web", "mobile"] }
  })
    .sort({ createdAt: -1 })
    .limit(40)
    .select("grievanceCode description")
    .lean();

  const text = complaintText.toLowerCase();
  const topWords = text
    .split(/[^a-zA-Z0-9]+/)
    .filter((token) => token.length > 4)
    .slice(0, 20);

  const matching = candidates.filter((item) => {
    const d = String(item.description || "").toLowerCase();
    return topWords.some((w) => d.includes(w));
  });

  return {
    matchingComplaintCodes: matching.map((m) => m.grievanceCode),
    totalMatches: matching.length
  };
}

function buildAuthenticity({ validityScore, duplicateHints, text }) {
  const reasons = [];
  let aiScore = Math.max(0, Math.min(100, Number(validityScore || 0)));
  let crossSourceScore = Math.min(100, (duplicateHints.totalMatches || 0) * 20);
  let signalScore = 20;

  const lower = String(text || "").toLowerCase();
  const urgencyWords = ["urgent", "immediately", "danger", "not working", "broken", "leak", "scam"];
  const detailSignals = ["near", "at", "road", "ward", "station", "sector", "block"];

  const urgencyHits = urgencyWords.filter((w) => lower.includes(w)).length;
  const detailHits = detailSignals.filter((w) => lower.includes(w)).length;
  signalScore += urgencyHits * 8 + detailHits * 5;

  if (aiScore >= 70) reasons.push("Complaint language contains actionable civic issue indicators.");
  if (duplicateHints.totalMatches > 0) reasons.push("Similar complaints detected across additional records.");
  if (detailHits > 0) reasons.push("Post includes location/context clues usable for field action.");

  const overallScore = Math.max(
    0,
    Math.min(100, Math.round(aiScore * 0.5 + crossSourceScore * 0.25 + signalScore * 0.25))
  );

  return {
    aiScore,
    crossSourceScore,
    signalScore: Math.min(100, signalScore),
    overallScore,
    confidenceBand: confidenceBand(overallScore),
    reasons,
    verifiedAt: new Date()
  };
}

async function upsertEvidenceFromComplaint({
  grievanceCode,
  platform,
  postId,
  postUrl,
  username,
  complaintText,
  issueType,
  locationText,
  hashtags,
  validityScore,
  sourceProbe = "ingestion"
}) {
  const text = normalizeText(complaintText);
  if (!text) return null;

  const cleanPostId = String(postId || "").trim();
  const cleanPostUrl = String(postUrl || "").trim();

  const contentHash = sha256(text);
  const duplicateHints = await getCrossSourceSignals({ complaintText: text, issueType, locationText, grievanceCode });
  const authenticity = buildAuthenticity({ validityScore, duplicateHints, text });

  const findQuery = cleanPostId
    ? { platform, externalPostId: cleanPostId }
    : cleanPostUrl
      ? { platform, postUrl: cleanPostUrl }
      : { grievanceCode, platform, complaintText: text };

  const doc = await SocialComplaintEvidence.findOne(findQuery);
  if (doc) {
    let screenshotResult = null;
    if (platform === "reddit" && !hasScreenshotProof(doc.snapshots)) {
      screenshotResult = await capturePostScreenshot({ postUrl: cleanPostUrl || doc.postUrl, platform, postId: cleanPostId });
    }

    doc.grievanceCode = grievanceCode || doc.grievanceCode;
    doc.authorHandle = username || doc.authorHandle;
    doc.complaintText = text;
    doc.issueType = issueType || doc.issueType;
    doc.locationText = locationText || doc.locationText;
    doc.hashtags = Array.isArray(hashtags) ? hashtags : doc.hashtags;
    doc.lastObservedAt = new Date();
    doc.availabilityStatus = "live";
    doc.duplicateHints = duplicateHints;
    doc.authenticity = authenticity;
    doc.snapshots.push({
      capturedAt: new Date(),
      contentText: text,
      contentHash,
      postUrl: cleanPostUrl || doc.postUrl,
      sourceProbe,
      metadata: {
        grievanceCode,
        observation: "refresh",
        screenshotCaptured: Boolean(screenshotResult?.ok),
        screenshotFileName: screenshotResult?.screenshotFileName,
        screenshotUrl: screenshotResult?.screenshotUrl,
        screenshotError: screenshotResult && !screenshotResult.ok ? screenshotResult.reason : undefined
      }
    });
    doc.verificationEvents.push({
      checkedAt: new Date(),
      availability: "live",
      notes: "Observed during social scan",
      checker: "listener"
    });

    await doc.save();
    return doc;
  }

  let screenshotResult = null;
  if (platform === "reddit") {
    screenshotResult = await capturePostScreenshot({ postUrl: cleanPostUrl, platform, postId: cleanPostId });
  }

  const created = await SocialComplaintEvidence.create({
    grievanceCode,
    platform,
    externalPostId: cleanPostId || undefined,
    postUrl: cleanPostUrl || undefined,
    authorHandle: username || "",
    issueType: issueType || "General",
    locationText: locationText || "Unknown",
    hashtags: Array.isArray(hashtags) ? hashtags : [],
    complaintText: text,
    firstCapturedAt: new Date(),
    lastObservedAt: new Date(),
    lastVerifiedAt: new Date(),
    availabilityStatus: "live",
    lifecycleStatus: "Detected",
    authenticity,
    duplicateHints,
    snapshots: [
      {
        capturedAt: new Date(),
        contentText: text,
        contentHash,
        postUrl: cleanPostUrl || "",
        sourceProbe,
        metadata: {
          grievanceCode,
          observation: "first-capture",
          screenshotCaptured: Boolean(screenshotResult?.ok),
          screenshotFileName: screenshotResult?.screenshotFileName,
          screenshotUrl: screenshotResult?.screenshotUrl,
          screenshotError: screenshotResult && !screenshotResult.ok ? screenshotResult.reason : undefined
        }
      }
    ],
    verificationEvents: [
      {
        checkedAt: new Date(),
        availability: "live",
        notes: "Captured by listener",
        checker: "listener"
      }
    ]
  });

  return created;
}

async function probePostAvailability(evidence) {
  const url = evidence.postUrl;
  if (!url) {
    return {
      availability: "unknown",
      httpStatus: null,
      notes: "No URL present for probe"
    };
  }

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 3,
      validateStatus: () => true,
      headers: {
        "User-Agent": "NagrikConnectAI/1.0 ProofVerifier"
      }
    });

    const status = response.status;
    if ([404, 410].includes(status)) {
      return { availability: "deleted", httpStatus: status, notes: "Post appears removed" };
    }

    if (status >= 200 && status < 400) {
      return { availability: "live", httpStatus: status, notes: "Post is currently reachable" };
    }

    return { availability: "unknown", httpStatus: status, notes: "Platform response is inconclusive" };
  } catch (error) {
    return {
      availability: "unknown",
      httpStatus: null,
      notes: `Probe error: ${error.message}`
    };
  }
}

async function verifyEvidenceById(evidenceId, checker = "manual") {
  const evidence = await SocialComplaintEvidence.findById(evidenceId);
  if (!evidence) {
    throw new Error("Evidence not found");
  }

  const probe = await probePostAvailability(evidence);
  let screenshotResult = null;
  if (evidence.platform === "reddit" && probe.availability !== "deleted" && !hasScreenshotProof(evidence.snapshots)) {
    screenshotResult = await capturePostScreenshot({
      postUrl: evidence.postUrl,
      platform: evidence.platform,
      postId: evidence.externalPostId
    });
  }

  evidence.lastVerifiedAt = new Date();
  evidence.availabilityStatus = probe.availability;
  evidence.verificationEvents.push({
    checkedAt: new Date(),
    availability: probe.availability,
    httpStatus: probe.httpStatus,
    notes: probe.notes,
    checker
  });

  evidence.snapshots.push({
    capturedAt: new Date(),
    contentText: evidence.complaintText,
    contentHash: sha256(evidence.complaintText),
    postUrl: evidence.postUrl,
    sourceProbe: "verification",
    metadata: {
      checker,
      availability: probe.availability,
      httpStatus: probe.httpStatus,
      screenshotCaptured: Boolean(screenshotResult?.ok),
      screenshotFileName: screenshotResult?.screenshotFileName,
      screenshotUrl: screenshotResult?.screenshotUrl,
      screenshotError: screenshotResult && !screenshotResult.ok ? screenshotResult.reason : undefined
    }
  });

  await evidence.save();
  return evidence;
}

async function verifyRecentEvidence(limit = 30) {
  const items = await SocialComplaintEvidence.find({})
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Number(limit) || 30));

  let checked = 0;
  let deleted = 0;
  for (const item of items) {
    const updated = await verifyEvidenceById(item._id, "scheduled");
    checked += 1;
    if (updated.availabilityStatus === "deleted") {
      deleted += 1;
    }
  }

  return { checked, deleted };
}

async function updateLifecycleStatus(evidenceId, lifecycleStatus) {
  const updated = await SocialComplaintEvidence.findByIdAndUpdate(
    evidenceId,
    {
      $set: {
        lifecycleStatus,
        lastVerifiedAt: new Date()
      }
    },
    { new: true }
  );

  if (!updated) {
    throw new Error("Evidence not found");
  }

  return updated;
}

module.exports = {
  upsertEvidenceFromComplaint,
  verifyEvidenceById,
  verifyRecentEvidence,
  updateLifecycleStatus
};
