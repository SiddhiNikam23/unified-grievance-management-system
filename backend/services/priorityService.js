const PRIORITY_ADJUSTMENTS = {
  CRITICAL: 0.6,
  HIGH: 0.7,
  MEDIUM: 1,
  LOW: 1.3
};

function normalizePriority(priority) {
  return String(priority || "Medium").trim().toUpperCase();
}

function getPriorityAdjustment(priority) {
  const normalized = normalizePriority(priority);
  return {
    priority: normalized,
    factor: PRIORITY_ADJUSTMENTS[normalized] || 1,
    label: normalized.toLowerCase()
  };
}

function inferUrgencySignal(complaintText = "") {
  const text = String(complaintText || "").toLowerCase();

  if (/\b(critical|life[- ]threatening|severe|danger|electrocution|flood|fire)\b/.test(text)) {
    return {
      level: "critical",
      factor: 0.75,
      reason: "Complaint text indicates a critical safety issue."
    };
  }

  if (/\b(urgent|immediately|asap|emergency|serious)\b/.test(text)) {
    return {
      level: "urgent",
      factor: 0.85,
      reason: "Complaint text indicates urgent handling is needed."
    };
  }

  if (/\b(minor|small|low[- ]priority|non[- ]urgent|routine)\b/.test(text)) {
    return {
      level: "minor",
      factor: 1.15,
      reason: "Complaint text suggests a lower urgency issue."
    };
  }

  return {
    level: "normal",
    factor: 1,
    reason: "No strong urgency signal detected from the complaint text."
  };
}

module.exports = {
  PRIORITY_ADJUSTMENTS,
  getPriorityAdjustment,
  inferUrgencySignal,
  normalizePriority
};