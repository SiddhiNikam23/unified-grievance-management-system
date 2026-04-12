const Parser = require("rss-parser");
const axios = require("axios");
const Grievance = require("../models/grievance");
const { searchTweets } = require("./realTwitterScraper");
const { detectDuplicateComplaints, linkComplaints } = require("./duplicateDetection");
const { onComplaintRegistered } = require("./notificationEngine");
const { upsertEvidenceFromComplaint, verifyRecentEvidence } = require("./socialProofEngine");

const parser = new Parser();

const COMPLAINT_KEYWORDS = [
  "pipeline issue",
  "water leakage",
  "road damage",
  "waste issue",
  "waster issie",
  "traffic jam",
  "cyber crime",
  "cyber fraud",
  "online scam",
  "garbage",
  "electricity problem",
  "complaint",
  "urgent repair"
];

const TRACKED_HASHTAGS = [
  "#pipelineissue",
  "#waterleak",
  "#roadrepair",
  "#wasteissue",
  "#trafficjam",
  "#cybercrime",
  "#civicissue",
  "#mumbaiproblems"
];

const CIVIC_CONTEXT_TERMS = [
  "municipal",
  "civic",
  "ward",
  "bmc",
  "bbmp",
  "nagar",
  "corporation",
  "drainage",
  "sewer",
  "manhole",
  "water supply",
  "pipeline",
  "leakage",
  "pothole",
  "street light",
  "garbage",
  "waste issue",
  "traffic jam",
  "traffic",
  "cyber crime",
  "cyber fraud",
  "online scam",
  "waste",
  "electricity",
  "power cut",
  "transformer",
  "public road",
  "repair"
];

const NON_CIVIC_BLOCKLIST = [
  "scripture",
  "gospel",
  "christ",
  "spiritual",
  "philosophy",
  "manifesto",
  "meditation",
  "astrology",
  "stock market"
];

const ISSUE_RULES = [
  {
    issueType: "Water",
    department: "Water Department",
    category: "infrastructure",
    subcategory: "water_supply",
    terms: ["water", "pipeline", "leak", "leakage", "drain", "sewage"]
  },
  {
    issueType: "Road",
    department: "Road Maintenance",
    category: "infrastructure",
    subcategory: "roads",
    terms: [
      "road",
      "pothole",
      "street",
      "road damage",
      "bridge",
      "repair",
      "traffic jam",
      "traffic"
    ]
  },
  {
    issueType: "Waste",
    department: "Waste Management",
    category: "health_sanitation",
    subcategory: "waste_management",
    terms: ["garbage", "trash", "waste", "dump", "unclean", "overflowing bin"]
  },
  {
    issueType: "Cyber Crime",
    department: "Cyber Crime Cell",
    category: "law_order",
    subcategory: "cyber_crime",
    terms: [
      "cyber crime",
      "cybercrime",
      "cyber fraud",
      "online scam",
      "phishing",
      "upi fraud",
      "otp fraud",
      "hacked account"
    ]
  },
  {
    issueType: "Electricity",
    department: "Electricity Board",
    category: "utilities",
    subcategory: "electricity",
    terms: ["electricity", "power", "outage", "transformer", "blackout", "voltage"]
  }
];

const CITY_COORDS = {
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  bombay: { latitude: 19.076, longitude: 72.8777 },
  thane: { latitude: 19.2183, longitude: 72.9781 },
  "navi mumbai": { latitude: 19.033, longitude: 73.0297 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 }
};

const RING_ALERT_LIMIT = 100;
const recentAlerts = [];
const seenPostKeys = new Map();

let pollTimer = null;
let running = false;

function nowIso() {
  return new Date().toISOString();
}

function keepRecentSeen(maxAgeMs = 6 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAgeMs;
  for (const [key, ts] of seenPostKeys.entries()) {
    if (ts < cutoff) {
      seenPostKeys.delete(key);
    }
  }
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getHashtags(text) {
  const tags = text.match(/#[a-z0-9_]+/gi) || [];
  return tags.map((t) => t.toLowerCase());
}

function containsTrackedTerms(text) {
  const lower = text.toLowerCase();
  const hasKeyword = COMPLAINT_KEYWORDS.some((k) => lower.includes(k));
  const hasHashtag = TRACKED_HASHTAGS.some((h) => lower.includes(h));
  return hasKeyword || hasHashtag;
}

function computeValidityScore(text) {
  const lower = text.toLowerCase();
  let score = 20;

  const complaintSignals = [
    "not working",
    "broken",
    "need repair",
    "please fix",
    "problem",
    "issue",
    "complaint",
    "urgent",
    "help",
    "danger"
  ];

  const civicSignals = ["traffic jam", "waste issue", "cyber crime", "cyber fraud", "online scam"];

  const spamSignals = [
    "buy now",
    "sale",
    "promo",
    "follow me",
    "subscribe",
    "meme",
    "lol",
    "haha"
  ];

  const signalMatches = complaintSignals.filter((s) => lower.includes(s)).length;
  const spamMatches = spamSignals.filter((s) => lower.includes(s)).length;

  score += signalMatches * 12;
  score -= spamMatches * 20;
  score += civicSignals.filter((s) => lower.includes(s)).length * 10;

  if (containsTrackedTerms(lower)) {
    score += 20;
  }

  if (lower.length < 20) {
    score -= 10;
  }

  if (lower.includes("?") && !lower.includes("please")) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function isActionableComplaint(text) {
  const lower = text.toLowerCase();
  const spamLike = /(buy now|free giveaway|promo code|subscribe)/i.test(lower);
  const obviousJoke = /(just kidding|jk|meme only|sarcasm)/i.test(lower);
  const hasIssueTerm = ISSUE_RULES.some((rule) =>
    rule.terms.some((term) => lower.includes(term))
  );
  const hasCivicContext = CIVIC_CONTEXT_TERMS.some((term) => lower.includes(term));
  const hasBlockedTopic = NON_CIVIC_BLOCKLIST.some((term) => lower.includes(term));
  const likelyThreadEssay = lower.length > 1200 && !hasCivicContext;

  if (spamLike || obviousJoke || hasBlockedTopic || likelyThreadEssay) {
    return false;
  }

  return hasIssueTerm && containsTrackedTerms(lower) && hasCivicContext;
}

function classifyIssue(text) {
  const lower = text.toLowerCase();
  for (const rule of ISSUE_RULES) {
    if (rule.terms.some((term) => lower.includes(term))) {
      return rule;
    }
  }

  return {
    issueType: "General",
    department: "General",
    category: "General",
    subcategory: "Other"
  };
}

function extractLocationText(text) {
  const lower = text.toLowerCase();

  for (const city of Object.keys(CITY_COORDS)) {
    if (lower.includes(city)) {
      return city
        .split(" ")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
    }
  }

  const inMatch = text.match(/(?:in|at|near)\s+([A-Za-z ]{3,40})/i);
  if (inMatch && inMatch[1]) {
    return normalizeText(inMatch[1]);
  }

  return "Unknown";
}

function geotagLocation(locationText) {
  if (!locationText || locationText.toLowerCase() === "unknown") {
    return null;
  }

  const key = locationText.toLowerCase();
  return CITY_COORDS[key] || null;
}

function detectSentimentTag(text) {
  const lower = text.toLowerCase();
  const criticalTerms = ["accident", "danger", "electrocution", "flood", "life risk"];
  const urgentTerms = ["urgent", "immediately", "asap", "emergency", "critical"];

  if (criticalTerms.some((t) => lower.includes(t))) {
    return "Critical";
  }

  if (urgentTerms.some((t) => lower.includes(t))) {
    return "Urgent";
  }

  return "Negative";
}

function toPriority(sentimentTag, duplicateCount) {
  if (sentimentTag === "Critical") {
    return "Critical";
  }

  if (sentimentTag === "Urgent" || duplicateCount >= 2) {
    return "High";
  }

  if (duplicateCount === 1) {
    return "Medium";
  }

  return "Low";
}

function addAlert(alert) {
  recentAlerts.unshift(alert);
  if (recentAlerts.length > RING_ALERT_LIMIT) {
    recentAlerts.pop();
  }
}

function getPostTimestamp(rawTimestamp) {
  const parsed = rawTimestamp ? new Date(rawTimestamp) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

async function upsertComplaintFromPost(post) {
  const text = normalizeText(post.content || post.text || "");
  if (!text) {
    return { status: "ignored", reason: "empty-content" };
  }

  if (!containsTrackedTerms(text)) {
    return { status: "ignored", reason: "no-tracked-keyword" };
  }

  const validityScore = computeValidityScore(text);
  if (validityScore < 50 || !isActionableComplaint(text)) {
    return { status: "ignored", reason: "non-actionable", validityScore };
  }

  const issue = classifyIssue(text);
  const locationText = extractLocationText(text);
  const coordinates = geotagLocation(locationText);
  const sentimentTag = detectSentimentTag(text);
  const hashtags = getHashtags(text);
  const postTimestamp = getPostTimestamp(post.timestamp);

  const postKey = `${post.platform}:${post.postId || "na"}:${post.username || "unknown"}`;
  if (seenPostKeys.has(postKey)) {
    return { status: "ignored", reason: "already-seen" };
  }

  const existing = await Grievance.findOne({
    source: post.platform,
    "sourceMetadata.socialPostUrl": post.url
  }).lean();

  if (existing) {
    try {
      await upsertEvidenceFromComplaint({
        grievanceCode: existing.grievanceCode,
        platform: post.platform,
        postId: post.postId,
        postUrl: post.url,
        username: post.username,
        complaintText: text,
        issueType: existing.issueType || issue.issueType,
        locationText: existing.locationText || locationText,
        hashtags,
        validityScore,
        sourceProbe: "ingestion"
      });
    } catch (proofError) {
      console.warn("[social-proof] existing-upsert failed:", proofError.message);
    }

    seenPostKeys.set(postKey, Date.now());
    return { status: "ignored", reason: "already-stored" };
  }

  const duplicateCheck = await detectDuplicateComplaints({
    description: text,
    location: coordinates,
    department: issue.department,
    category: issue.category
  });

  const duplicateCount = duplicateCheck.isDuplicate
    ? Math.min((duplicateCheck.similarComplaints || []).length, 5)
    : 0;

  const priority = toPriority(sentimentTag, duplicateCount);

  const grievance = new Grievance({
    complainantName: post.username || "Unknown User",
    complainantEmail: `${(post.username || "unknown").replace(/[^a-zA-Z0-9_.-]/g, "") || "unknown"}@${post.platform}.social`,
    department: issue.department,
    category: issue.category,
    subcategory: issue.subcategory,
    description: text,
    issueType: issue.issueType,
    locationText,
    location: coordinates
      ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: 5000,
          timestamp: new Date()
        }
      : null,
    priority,
    priorityReason: duplicateCount >= 2
      ? "Raised due to repeated complaints from social media"
      : `Detected as ${sentimentTag.toLowerCase()} social complaint`,
    sentimentTag,
    validityScore,
    moderationStatus: "Pending",
    moderationReason: "Awaiting admin verification",
    detectedAt: new Date(),
    dateOfReceipt: postTimestamp,
    source: post.platform,
    sourceMetadata: {
      socialPostUrl: post.url || "",
      socialPlatform: post.platform,
      socialUsername: post.username || "",
      socialHashtags: hashtags,
      socialCapturedAt: new Date(),
      twitterTweetId: post.platform === "twitter" ? (post.postId || "") : undefined,
      twitterHandle: post.platform === "twitter" ? (post.username || "") : undefined,
      redditPostId: post.platform === "reddit" ? (post.postId || "") : undefined,
      redditPermalink: post.platform === "reddit" ? (post.url || "") : undefined,
      redditSubreddit: post.platform === "reddit" ? (post.subreddit || "") : undefined,
      instagramPostId: post.platform === "instagram" ? (post.postId || "") : undefined,
      instagramPermalink: post.platform === "instagram" ? (post.url || "") : undefined
    }
  });

  const saved = await grievance.save();

  try {
    await upsertEvidenceFromComplaint({
      grievanceCode: saved.grievanceCode,
      platform: post.platform,
      postId: post.postId,
      postUrl: post.url,
      username: post.username,
      complaintText: text,
      issueType: issue.issueType,
      locationText,
      hashtags,
      validityScore,
      sourceProbe: "ingestion"
    });
  } catch (proofError) {
    console.warn("[social-proof] capture failed:", proofError.message);
  }

  try {
    await onComplaintRegistered(saved);
  } catch (notifyError) {
    console.error("[social-listener] notification failed:", notifyError.message);
  }

  if (duplicateCheck.isDuplicate && duplicateCheck.similarComplaints?.length) {
    const top = duplicateCheck.similarComplaints[0];
    if (top && top.grievanceCode) {
      await linkComplaints(saved.grievanceCode, top.grievanceCode);
      await Grievance.updateOne(
        { grievanceCode: saved.grievanceCode },
        {
          $set: {
            similarityScore: top.similarityScore,
            duplicateReason: top.reason,
            isDuplicate: true
          }
        }
      );
    }
  }

  if (saved.priority === "High" || saved.priority === "Critical") {
    addAlert({
      grievanceCode: saved.grievanceCode,
      platform: post.platform,
      user: post.username,
      content: text.slice(0, 280),
      issueType: issue.issueType,
      location: locationText,
      priority: saved.priority,
      timestamp: nowIso()
    });
  }

  seenPostKeys.set(postKey, Date.now());

  return {
    status: "stored",
    grievanceCode: saved.grievanceCode,
    priority: saved.priority,
    validityScore,
    platform: post.platform
  };
}

async function fetchTwitterPosts() {
  const query = [
    ...COMPLAINT_KEYWORDS.map((q) => `"${q}"`),
    ...TRACKED_HASHTAGS
  ].join(" OR ");

  const tweets = await searchTweets(query, 25);
  return tweets.map((t) => ({
    platform: "twitter",
    postId: t.id,
    username: t.username,
    content: t.text,
    url: t.id ? `https://x.com/${t.username}/status/${t.id}` : "",
    timestamp: t.createdAt
  }));
}

async function fetchRedditPosts() {
  const terms = [...COMPLAINT_KEYWORDS, ...TRACKED_HASHTAGS].join(" OR ");
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(terms)}&sort=new&t=day&limit=50`;

  const { data } = await axios.get(url, {
    timeout: 12000,
    headers: {
      "User-Agent": "NagrikConnectAI/1.0 (social complaint listener)",
      "Accept": "application/json"
    }
  });

  const children = data?.data?.children || [];
  return children.slice(0, 40).map((item) => {
    const post = item?.data || {};
    const title = post.title || "";
    const body = post.selftext || "";
    const combined = normalizeText(`${title} ${body}`);
    const permalink = post.permalink
      ? `https://www.reddit.com${post.permalink}`
      : "";

    return {
      platform: "reddit",
      postId: post.id || "",
      username: post.author || "reddit_user",
      content: combined,
      url: permalink,
      timestamp: post.created_utc
        ? new Date(post.created_utc * 1000).toISOString()
        : new Date().toISOString(),
      subreddit: post.subreddit || ""
    };
  });
}

async function fetchInstagramPosts() {
  const feedUrls = String(process.env.INSTAGRAM_FEED_URLS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (!feedUrls.length) {
    return [];
  }

  const results = [];
  for (const feedUrl of feedUrls) {
    try {
      const { data } = await axios.get(feedUrl, { timeout: 12000 });
      const list = Array.isArray(data) ? data : data.posts;
      if (!Array.isArray(list)) {
        continue;
      }

      for (const post of list.slice(0, 20)) {
        results.push({
          platform: "instagram",
          postId: post.id || post.shortcode || "",
          username: post.username || post.user || "instagram_user",
          content: post.caption || post.text || "",
          url: post.permalink || post.url || "",
          timestamp: post.timestamp || post.created_at
        });
      }
    } catch (error) {
      console.warn("Instagram feed read failed:", feedUrl, error.message);
    }
  }

  return results;
}

async function scanAndStoreSocialComplaints() {
  const scanResult = {
    scanned: 0,
    stored: 0,
    ignored: 0,
    errors: 0,
    startedAt: nowIso(),
    details: []
  };

  const sourceFns = [fetchTwitterPosts, fetchRedditPosts, fetchInstagramPosts];

  for (const sourceFn of sourceFns) {
    try {
      const posts = await sourceFn();
      scanResult.scanned += posts.length;

      for (const post of posts) {
        try {
          const result = await upsertComplaintFromPost(post);
          scanResult.details.push(result);
          if (result.status === "stored") {
            scanResult.stored += 1;
          } else {
            scanResult.ignored += 1;
          }
        } catch (error) {
          scanResult.errors += 1;
          scanResult.details.push({ status: "error", reason: error.message });
        }
      }
    } catch (error) {
      scanResult.errors += 1;
      scanResult.details.push({ status: "error", reason: error.message });
    }
  }

  scanResult.completedAt = nowIso();
  keepRecentSeen();

  try {
    const verificationReport = await verifyRecentEvidence(
      Number(process.env.SOCIAL_PROOF_VERIFY_LIMIT || 20)
    );
    scanResult.verification = verificationReport;
  } catch (verificationError) {
    scanResult.verification = { error: verificationError.message };
  }

  return scanResult;
}

function startSocialComplaintListener(options = {}) {
  const enabled = String(process.env.SOCIAL_LISTENER_ENABLED || "true") === "true";
  if (!enabled) {
    return null;
  }

  if (running) {
    return pollTimer;
  }

  const intervalMinutes = Number(
    options.intervalMinutes || process.env.SOCIAL_SCAN_INTERVAL_MINUTES || 3
  );
  const safeInterval = Math.max(1, intervalMinutes) * 60 * 1000;

  running = true;
  pollTimer = setInterval(async () => {
    try {
      const report = await scanAndStoreSocialComplaints();
      console.log(
        `[social-listener] scanned=${report.scanned} stored=${report.stored} ignored=${report.ignored} errors=${report.errors}`
      );
    } catch (error) {
      console.error("[social-listener] cycle failed:", error.message);
    }
  }, safeInterval);

  setTimeout(async () => {
    try {
      const report = await scanAndStoreSocialComplaints();
      console.log(
        `[social-listener] initial scan scanned=${report.scanned} stored=${report.stored} ignored=${report.ignored}`
      );
    } catch (error) {
      console.error("[social-listener] initial scan failed:", error.message);
    }
  }, 5000);

  return pollTimer;
}

function stopSocialComplaintListener() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  running = false;
}

function getRecentAlerts(limit = 20) {
  return recentAlerts.slice(0, Math.max(1, Number(limit) || 20));
}

module.exports = {
  COMPLAINT_KEYWORDS,
  TRACKED_HASHTAGS,
  upsertComplaintFromPost,
  scanAndStoreSocialComplaints,
  startSocialComplaintListener,
  stopSocialComplaintListener,
  getRecentAlerts
};
