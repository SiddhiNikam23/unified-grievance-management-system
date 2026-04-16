const axios = require("axios");
const Grievance = require("../models/grievance");
const { BASE_RESOLUTION_TIME, DAILY_CAPACITY, findDepartmentRule, buildDepartmentMatchQuery, getPendingComplaints } = require("./backlogService");
const { getPriorityAdjustment, inferUrgencySignal } = require("./priorityService");

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function roundDays(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value * 10) / 10);
}

function formatDays(value) {
  const rounded = roundDays(value);
  return Number.isInteger(rounded) ? `${rounded} days` : `${rounded.toFixed(1)} days`;
}

function buildReadableMessage({ departmentLabel, baseTimeDays, finalEtaDays, status }) {
  const roundedFinal = formatDays(finalEtaDays);
  const roundedBase = formatDays(baseTimeDays);

  if (status === "OVERLOADED") {
    return `Due to high workload in the ${departmentLabel}, your complaint is expected to be resolved in approximately ${roundedFinal}, which is longer than the normal ${roundedBase}.`;
  }

  return `The ${departmentLabel} is currently operating within normal workload. Your complaint is expected to be resolved in approximately ${roundedFinal}, compared with the normal ${roundedBase}.`;
}

async function getHistoricalAverageResolutionDays(rule) {
  const query = {
    currentStatus: "Resolved",
    ...buildDepartmentMatchQuery(rule)
  };

  const records = await Grievance.find(query)
    .select("createdAt updatedAt aiResolvedAt")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  if (!records.length) {
    return null;
  }

  const durations = records
    .map((record) => {
      const resolvedAt = record.aiResolvedAt || record.updatedAt;
      const createdAt = record.createdAt;
      const duration = (new Date(resolvedAt).getTime() - new Date(createdAt).getTime()) / MS_PER_DAY;
      return Number.isFinite(duration) && duration >= 0 ? duration : null;
    })
    .filter((value) => value !== null);

  if (durations.length < 3) {
    return null;
  }

  const sum = durations.reduce((acc, value) => acc + value, 0);
  return sum / durations.length;
}

async function getAiSeveritySignal(complaintText) {
  const endpoint = process.env.ETA_AI_ENDPOINT || process.env.HUGGINGFACE_ETA_ENDPOINT;
  const token = process.env.ETA_AI_TOKEN || process.env.HUGGINGFACE_API_TOKEN;

  if (endpoint && token) {
    try {
      const response = await axios.post(
        endpoint,
        { text: complaintText },
        {
          timeout: 12000,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const payload = response.data || {};
      const severity = String(payload.severity || payload.label || payload.level || "normal").toLowerCase();

      if (severity.includes("critical")) {
        return { level: "critical", factor: 0.75, reason: "External ML model marked the complaint as critical." };
      }

      if (severity.includes("urgent") || severity.includes("high")) {
        return { level: "urgent", factor: 0.85, reason: "External ML model marked the complaint as urgent." };
      }

      if (severity.includes("minor") || severity.includes("low")) {
        return { level: "minor", factor: 1.15, reason: "External ML model marked the complaint as minor." };
      }
    } catch (error) {
      console.warn("[eta-service] external severity model failed:", error.message);
    }
  }

  return inferUrgencySignal(complaintText);
}

async function calculateBacklogAwareEta({
  department,
  priority,
  complaintText = "",
  issueType,
  subcategory,
  category
} = {}) {
  const rule = findDepartmentRule({ department, issueType, subcategory, category, complaintText });
  const departmentKey = rule.key;
  const departmentLabel = rule.label;
  const baseTimeDays = Number(BASE_RESOLUTION_TIME[departmentKey] || BASE_RESOLUTION_TIME.GENERAL || 4);
  const capacityPerDay = Number(DAILY_CAPACITY[departmentKey] || DAILY_CAPACITY.GENERAL || 40);
  const backlogCount = await getPendingComplaints(department, { issueType, subcategory, category, complaintText });
  const backlogDays = backlogCount / capacityPerDay;
  const backlogAwareEta = baseTimeDays + backlogDays;
  const status = backlogDays > baseTimeDays ? "OVERLOADED" : "NORMAL";

  const prioritySignal = getPriorityAdjustment(priority);
  const aiSignal = await getAiSeveritySignal(complaintText);
  const historicalAverageDays = await getHistoricalAverageResolutionDays(rule);

  let refinedEta = backlogAwareEta * prioritySignal.factor * aiSignal.factor;

  if (historicalAverageDays) {
    refinedEta = refinedEta * 0.75 + historicalAverageDays * 0.25;
  }

  const finalEtaDays = roundDays(refinedEta);
  const message = buildReadableMessage({
    departmentLabel,
    baseTimeDays,
    finalEtaDays,
    status
  });

  return {
    department: departmentKey,
    departmentLabel,
    status,
    baseTimeDays,
    backlogCount,
    backlogDays: roundDays(backlogDays),
    finalEtaDays,
    priorityFactor: prioritySignal.factor,
    priorityLevel: prioritySignal.priority,
    aiFactor: aiSignal.factor,
    aiLevel: aiSignal.level,
    aiReason: aiSignal.reason,
    historicalAverageDays: historicalAverageDays ? roundDays(historicalAverageDays) : null,
    capacityPerDay,
    message,
    calculatedAt: new Date()
  };
}

module.exports = {
  calculateBacklogAwareEta,
  buildReadableMessage,
  formatDays,
  roundDays
};