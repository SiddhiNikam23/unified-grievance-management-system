const Grievance = require("../models/grievance");

const BASE_RESOLUTION_TIME = {
  WATER: 5,
  ELECTRICITY: 2,
  GAS: 1,
  CYBER_CRIME: 7,
  SANITATION: 3,
  ROADS: 4,
  GENERAL: 4
};

const DAILY_CAPACITY = {
  WATER: 50,
  ELECTRICITY: 80,
  GAS: 60,
  CYBER_CRIME: 30,
  SANITATION: 70,
  ROADS: 40,
  GENERAL: 40
};

const DEPARTMENT_RULES = [
  {
    key: "WATER",
    label: "Water Department",
    aliases: ["Water Department", "Housing and Urban Affairs", "Water Board"],
    issueTypes: ["Water"],
    subcategories: ["water_supply", "water"],
    terms: ["water", "pipeline", "leak", "leakage", "drain", "sewage", "pani"]
  },
  {
    key: "ELECTRICITY",
    label: "Electricity Board",
    aliases: ["Electricity Board", "Housing and Urban Affairs", "Power Department"],
    issueTypes: ["Electricity"],
    subcategories: ["electricity", "power"],
    terms: ["electricity", "power", "outage", "transformer", "blackout", "voltage", "bijli"]
  },
  {
    key: "GAS",
    label: "Gas Department",
    aliases: ["Gas Department", "Energy Department", "General"],
    issueTypes: ["Gas"],
    subcategories: ["gas"],
    terms: ["gas", "lpg", "png", "cng", "gas leakage"]
  },
  {
    key: "CYBER_CRIME",
    label: "Cyber Crime Cell",
    aliases: ["Cyber Crime Cell", "Law & Order", "Police"],
    issueTypes: ["Cyber Crime"],
    subcategories: ["cyber_crime"],
    terms: ["cyber crime", "cybercrime", "cyber fraud", "online scam", "phishing", "upi fraud", "otp fraud", "hacked account"]
  },
  {
    key: "SANITATION",
    label: "Sanitation Department",
    aliases: ["Waste Management", "Sanitation Department", "Housing and Urban Affairs", "Health & Family Welfare"],
    issueTypes: ["Waste"],
    subcategories: ["waste_management", "sanitation"],
    terms: ["garbage", "trash", "waste", "dump", "unclean", "overflowing bin", "drain", "sewer"]
  },
  {
    key: "ROADS",
    label: "Road Maintenance",
    aliases: ["Road Maintenance", "Housing and Urban Affairs"],
    issueTypes: ["Road"],
    subcategories: ["roads"],
    terms: ["road", "pothole", "street", "bridge", "traffic jam", "traffic", "road damage", "street light", "streetlight"]
  },
  {
    key: "GENERAL",
    label: "General Department",
    aliases: ["General"],
    issueTypes: ["General"],
    subcategories: ["Other"],
    terms: []
  }
];

const RESOLVED_STATUSES = ["Resolved", "Rejected"];

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findDepartmentRule({ department, issueType, subcategory, category, complaintText } = {}) {
  const haystack = normalizeText([department, issueType, subcategory, category, complaintText].filter(Boolean).join(" "));

  const directRule = DEPARTMENT_RULES.find((rule) => rule.terms.some((term) => haystack.includes(term)));
  if (directRule) {
    return directRule;
  }

  const byName = DEPARTMENT_RULES.find((rule) => {
    const names = [rule.key, rule.label, ...rule.aliases, ...rule.issueTypes, ...rule.subcategories]
      .map(normalizeText)
      .filter(Boolean);
    return names.some((name) => haystack.includes(name));
  });

  return byName || DEPARTMENT_RULES.find((rule) => rule.key === "GENERAL");
}

function buildDepartmentMatchQuery(rule) {
  return {
    $or: [
      { serviceDepartmentKey: rule.key },
      { department: { $in: [rule.label, ...rule.aliases] } },
      { issueType: { $in: [rule.label, ...rule.issueTypes] } },
      { subcategory: { $in: rule.subcategories } }
    ]
  };
}

async function getPendingComplaints(department, context = {}) {
  const rule = findDepartmentRule({ department, ...context });
  const query = {
    currentStatus: { $nin: RESOLVED_STATUSES },
    ...buildDepartmentMatchQuery(rule)
  };

  return Grievance.countDocuments(query);
}

module.exports = {
  BASE_RESOLUTION_TIME,
  DAILY_CAPACITY,
  DEPARTMENT_RULES,
  findDepartmentRule,
  buildDepartmentMatchQuery,
  getPendingComplaints
};