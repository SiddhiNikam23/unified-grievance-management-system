import React, { useEffect, useMemo, useState } from "react";
import GrievanceRiskMap from "../components/GrievanceRiskMap";

const API_BASE = "http://localhost:5000";

const DEPARTMENT_LABELS = {
  emergency_response: "Emergency Response Team",
  financial_services: "Financial Services (Banking Division)",
  labour_employment: "Labour and Employment",
  income_tax: "Central Board of Direct Taxes (Income Tax)",
  posts: "Posts",
  telecommunications: "Telecommunications",
  personnel_training: "Personnel and Training",
  housing_urban: "Housing and Urban Affairs",
  health_welfare: "Health & Family Welfare"
};

const DEPARTMENT_KEYWORDS = {
  financial_services: ["bank", "atm", "loan", "credit", "debit", "upi", "payment", "refund", "account", "card", "fraud"],
  labour_employment: ["labour", "labor", "employment", "salary", "wage", "job", "pf", "epf", "gratuity", "workplace", "contract"],
  income_tax: ["income tax", "tax", "itr", "refund", "pan", "notice", "assessment", "tds"],
  posts: ["post", "postal", "courier", "parcel", "speed post", "delivery", "mail", "tracking"],
  telecommunications: ["telecom", "telecommunications", "network", "internet", "mobile", "signal", "broadband", "call", "tower", "sim", "wifi", "data"],
  personnel_training: ["recruitment", "transfer", "promotion", "training", "service matter", "cadre", "posting", "appointment"],
  housing_urban: ["water", "electric", "electricity", "power", "road", "traffic", "sanitation", "waste", "garbage", "sewer", "drain", "pothole", "street", "housing", "urban", "municipal"],
  health_welfare: ["hospital", "doctor", "medicine", "health", "treatment", "ambulance", "clinic", "welfare", "patient"]
};

function normalizeDepartment(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s\-/]+/g, "_");
}

function resolveDepartmentKey(value) {
  const normalized = normalizeDepartment(value);
  if (!normalized) return "";
  if (DEPARTMENT_LABELS[normalized]) return normalized;

  const aliases = {
    labour_and_employment: "labour_employment",
    labor_and_employment: "labour_employment",
    telecommunication: "telecommunications",
    telecom: "telecommunications",
    housing: "housing_urban",
    urban: "housing_urban",
    electricity: "housing_urban",
    water: "housing_urban",
    road: "housing_urban",
    postal: "posts",
    post: "posts",
    bank: "financial_services",
    banking: "financial_services",
    labour: "labour_employment",
    labor: "labour_employment",
    employment: "labour_employment",
    income: "income_tax",
    tax: "income_tax",
    health: "health_welfare",
    welfare: "health_welfare"
  };

  return aliases[normalized] || normalized;
}

function complaintMatchesDepartment(complaint, departmentKey) {
  // Emergency response department sees everything
  if (!departmentKey || departmentKey === "emergency_response") return true;

  // Check for explicit department assignment FIRST (priority)
  const explicitDepartment = resolveDepartmentKey(
    complaint.department || complaint.departmentLabel || complaint.assignedDepartment || complaint.department_name || ""
  );
  
  // If complaint has explicit department, it MUST match the requested department
  if (explicitDepartment && explicitDepartment !== "emergency_response") {
    return explicitDepartment === departmentKey;
  }

  // For complaints without explicit department, check keywords
  const text = [
    complaint.issue_type,
    complaint.issueType,
    complaint.content,
    complaint.description,
    complaint.platform,
    complaint.category,
    complaint.tags
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // STRICT: Only return true if keywords match THIS department
  const keywords = DEPARTMENT_KEYWORDS[departmentKey] || [];
  
  // Don't show complaints if they match OTHER departments' keywords
  const allOtherDepts = Object.keys(DEPARTMENT_KEYWORDS).filter(dept => dept !== departmentKey && dept !== "emergency_response");
  const hasOtherDeptKeywords = allOtherDepts.some(otherDept => {
    const otherKeywords = DEPARTMENT_KEYWORDS[otherDept] || [];
    return otherKeywords.some(keyword => text.includes(keyword));
  });

  // If complaint matches another department's keywords, don't show it
  if (hasOtherDeptKeywords) {
    return false;
  }

  // Only show if matches THIS department's keywords
  return keywords.length > 0 && keywords.some((keyword) => text.includes(keyword));
}

const DEPARTMENTS = [
  "Water Department",
  "Road Maintenance",
  "Waste Management",
  "Electricity Board"
];

function priorityClass(priority) {
  if (priority === "Critical" || priority === "High") {
    return "bg-red-100 text-red-800";
  }
  if (priority === "Medium") {
    return "bg-yellow-100 text-yellow-800";
  }
  return "bg-green-100 text-green-800";
}

function isAllowedSocialComplaint(complaint) {
  const aiLabel = String(complaint.aiClassification || "").toUpperCase();
  const aiConfidence = Number(complaint.aiConfidence || 0);
  const moderation = String(complaint.moderation_status || "").toLowerCase();

  if (moderation === "rejected") return false;
  if (complaint.isValidComplaint === true) return true;
  return aiLabel === "HELP_REQUEST" && aiConfidence >= 0.6;
}

function isBlockedSocialComplaint(complaint) {
  const aiLabel = String(complaint.aiClassification || "").toUpperCase();
  const moderation = String(complaint.moderation_status || "").toLowerCase();

  if (moderation === "rejected") return true;
  if (complaint.isValidComplaint === false) return true;
  return ["SPAM", "UNCLASSIFIED", "INFORMATIONAL", "RESOLVED"].includes(aiLabel);
}

export default function SocialComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");

  useEffect(() => {
    setAdminDepartment(localStorage.getItem("adminDepartment") || "");
  }, []);

  const effectiveDepartment = useMemo(
    () => resolveDepartmentKey(adminDepartment || localStorage.getItem("adminDepartment") || ""),
    [adminDepartment]
  );

  const departmentLabel = DEPARTMENT_LABELS[effectiveDepartment] || "Your Department";

  const fetchComplaints = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-listener/complaints?limit=200`, {
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch complaints (${res.status})`);
      }
      const data = await res.json();
      setComplaints(Array.isArray(data.complaints) ? data.complaints : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to fetch social complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/social-listener/alerts?limit=15`, {
        credentials: "include"
      });
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (_err) {
      // Keep silent for alerts to avoid interrupting dashboard usage.
    }
  };

  const triggerScan = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`${API_BASE}/social-listener/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Scan failed (${res.status})`);
      }
      await fetchComplaints();
      await fetchAlerts();
    } catch (err) {
      setError(err.message || "Failed to scan social sources");
    } finally {
      setSyncing(false);
    }
  };

  const updateModeration = async (grievanceCode, action, department) => {
    try {
      const res = await fetch(`${API_BASE}/social-listener/${grievanceCode}/moderation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, department })
      });

      if (!res.ok) {
        throw new Error(`Update failed (${res.status})`);
      }

      await fetchComplaints();
    } catch (err) {
      setError(err.message || "Failed to update complaint");
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchAlerts();

    const poll = setInterval(() => {
      fetchComplaints();
      fetchAlerts();
    }, 15000);

    const stream = new EventSource(`${API_BASE}/social-listener/stream`);
    stream.addEventListener("alerts", (event) => {
      try {
        const parsed = JSON.parse(event.data || "{}");
        setAlerts(Array.isArray(parsed.alerts) ? parsed.alerts : []);
      } catch (_err) {
        // Ignore malformed stream packets.
      }
    });

    return () => {
      clearInterval(poll);
      stream.close();
    };
  }, []);

  const departmentComplaints = useMemo(
    () => complaints
      .filter((complaint) => complaintMatchesDepartment(complaint, effectiveDepartment)),
    [complaints, effectiveDepartment]
  );

  const filteredComplaints = useMemo(
    () => departmentComplaints.filter((complaint) => isAllowedSocialComplaint(complaint)),
    [departmentComplaints]
  );

  const blockedComplaints = useMemo(
    () => departmentComplaints.filter((complaint) => isBlockedSocialComplaint(complaint)),
    [departmentComplaints]
  );

  const filteredAlerts = useMemo(
    () => alerts.filter((alert) => complaintMatchesDepartment(alert, effectiveDepartment)),
    [alerts, effectiveDepartment]
  );

  const mapGrievances = useMemo(() => {
    return filteredComplaints
      .filter((c) => c.coordinates && c.coordinates !== "Unknown")
      .map((c) => ({
        grievanceCode: c.grievanceCode,
        description: c.content,
        priority: c.priority,
        location: {
          latitude: c.coordinates.latitude,
          longitude: c.coordinates.longitude
        }
      }));
  }, [filteredComplaints]);

  const highPriorityCount = filteredComplaints.filter(
    (c) => c.priority === "High" || c.priority === "Critical"
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Social Complaint Listener</h1>
            <p className="mt-1 text-sm text-slate-600">
              Live social-media complaints from Reddit, Twitter (X), and Instagram-like feeds.
            </p>
          </div>
          <button
            onClick={triggerScan}
            disabled={syncing}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
          >
            {syncing ? "Syncing..." : "Scan Now"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Social Complaints</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{filteredComplaints.length}</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-xs uppercase tracking-wide text-red-500">High/Critical</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{highPriorityCount}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-600">Live Alerts</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{filteredAlerts.length}</p>
          </div>
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 md:col-span-3">
            <p className="text-xs uppercase tracking-wide text-slate-600">Blocked Complaints (Spam/Invalid)</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{blockedComplaints.length}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Showing complaints for: {departmentLabel}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
          Blocked Complaints (Spam/Invalid)
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-100 text-slate-800">
              <tr>
                {["Complaint ID", "Platform", "User", "AI Tag", "Confidence", "Reason"].map((head) => (
                  <th key={head} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading...</td>
                </tr>
              ) : blockedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No blocked complaints for {departmentLabel.toLowerCase()}.</td>
                </tr>
              ) : (
                blockedComplaints.map((item) => (
                  <tr key={`blocked-${item.grievanceCode}`} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.grievanceCode}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-700">{item.platform}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.user}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.aiClassification || "UNCLASSIFIED"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{((item.aiConfidence || 0) * 100).toFixed(0)}%</td>
                    <td className="max-w-[320px] px-4 py-3 text-xs text-slate-600" title={item.aiClassificationReason || "Blocked by AI/moderation filters"}>
                      {item.aiClassificationReason || "Blocked by AI/moderation filters"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {filteredAlerts.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-red-700">Urgent Alert Feed</h2>
          <div className="mt-2 space-y-2">
            {filteredAlerts.slice(0, 5).map((alert) => (
              <div key={`${alert.grievanceCode}-${alert.timestamp}`} className="rounded-lg border border-red-200 bg-white p-3">
                <p className="text-sm font-semibold text-red-800">{alert.issueType} - {alert.priority}</p>
                <p className="text-sm text-slate-700">{alert.location}: {alert.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <GrievanceRiskMap grievances={mapGrievances} adminDepartment={effectiveDepartment} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                {[
                  "Complaint ID",
                  "Platform",
                  "User",
                  "Issue",
                  "Location",
                  "Validity",
                  "AI Verification",
                  "Priority",
                  "Status",
                  "Action"
                ].map((head) => (
                  <th key={head} className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-slate-500">No social complaints found for {departmentLabel.toLowerCase()}.</td>
                </tr>
              ) : (
                filteredComplaints.map((item) => (
                  <tr key={item.grievanceCode} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{item.grievanceCode}</td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-700">{item.platform}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.user}</td>
                    <td className="max-w-[260px] px-4 py-3 text-sm text-slate-700" title={item.content}>{item.issue_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.location || "Unknown"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.validity_score}</td>
                    {/* ✅ NEW: AI Verification Column */}
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={`rounded-full px-2 py-1 text-xs font-bold inline-block whitespace-nowrap ${
                          item.aiClassification === "HELP_REQUEST"
                            ? "bg-green-100 text-green-800"
                            : item.aiClassification === "SPAM"
                            ? "bg-red-100 text-red-800"
                            : item.aiClassification === "RESOLVED"
                            ? "bg-blue-100 text-blue-800"
                            : item.aiClassification === "INFORMATIONAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {item.aiClassification || "UNCLASSIFIED"}
                        </span>
                        <small className="text-gray-600">
                          Confidence: {((item.aiConfidence || 0) * 100).toFixed(0)}%
                        </small>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${priorityClass(item.priority)}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{item.status}</div>
                      <div className="mt-1 rounded bg-slate-100 px-2 py-1 inline-block">{item.moderation_status}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          onClick={() => updateModeration(item.grievanceCode, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                          onClick={() => updateModeration(item.grievanceCode, "reject")}
                        >
                          Reject
                        </button>
                        <button
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          onClick={() => updateModeration(item.grievanceCode, "resolve")}
                        >
                          Resolve
                        </button>
                        <select
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            updateModeration(item.grievanceCode, "approve", value);
                          }}
                        >
                          <option value="">Assign Department</option>
                          {DEPARTMENTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      {item.post_url && (
                        <button
                          className="mt-2 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-900"
                          onClick={() => window.open(item.post_url, "_blank", "noopener,noreferrer")}
                        >
                          View Post
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </div>
  );
}
