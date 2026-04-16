import React, { useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const INDIA_CENTER = [22.9734, 78.6569];
const TOMORROW_DEFAULT = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
})();

const BAR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6"];
const CATEGORY_ORDER = ["water", "electricity", "road", "other"];
const CATEGORY_LABELS = {
  water: "Water",
  electricity: "Electricity",
  road: "Road",
  other: "Other",
};

const DEPARTMENT_LABELS = {
  emergency_response: "Emergency Response Team",
  financial_services: "Financial Services (Banking Division)",
  labour_employment: "Labour and Employment",
  income_tax: "Central Board of Direct Taxes (Income Tax)",
  posts: "Posts",
  telecommunications: "Telecommunications",
  personnel_training: "Personnel and Training",
  housing_urban: "Housing and Urban Affairs",
  health_welfare: "Health & Family Welfare",
};

const DEPARTMENT_TYPE_KEYWORDS = {
  emergency_response: [],
  financial_services: ["bank", "finance", "financial", "loan", "atm", "upi", "payment", "insurance", "account", "fraud"],
  labour_employment: ["labour", "labor", "employment", "salary", "wage", "worker", "job", "factory", "pf", "epf", "esic"],
  income_tax: ["tax", "income tax", "tds", "itr", "refund", "pan", "assessment"],
  posts: ["post", "postal", "parcel", "mail", "courier", "speed post", "dak"],
  telecommunications: ["telecom", "network", "internet", "mobile", "signal", "broadband", "call", "tower", "sim"],
  personnel_training: ["personnel", "training", "recruitment", "staff", "service matter", "promotion", "hr", "exam"],
  housing_urban: ["water", "electric", "electricity", "power", "road", "traffic", "sanitation", "waste", "garbage", "sewer", "drain", "pothole", "street", "housing", "urban", "municipal"],
  health_welfare: ["health", "hospital", "medical", "medicine", "ambulance", "clinic", "vaccination", "disease", "family welfare"],
};

function normalizeDepartment(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s&()-]+/g, "_");
}

function resolveDepartmentKey(value) {
  const normalized = normalizeDepartment(value);
  if (DEPARTMENT_LABELS[normalized]) return normalized;

  const aliases = {
    emergency_response_team: "emergency_response",
    financial_services_banking_division: "financial_services",
    labour_and_employment: "labour_employment",
    central_board_of_direct_taxes_income_tax: "income_tax",
    telecommunication: "telecommunications",
    personnel_and_training: "personnel_training",
    housing_and_urban_affairs: "housing_urban",
    health_family_welfare: "health_welfare",
  };

  return aliases[normalized] || normalized;
}

function isPredictionRelevantToDepartment(item, departmentKey) {
  if (!departmentKey || departmentKey === "emergency_response") return true;

  const keywords = DEPARTMENT_TYPE_KEYWORDS[departmentKey] || [];
  if (!keywords.length) return true;

  const haystack = `${item?.complaint_type || ""} ${item?.location || ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function getComplaintCategory(value) {
  const text = String(value || "").toLowerCase();
  if (["water", "sewer", "drain", "sanitation", "waste", "garbage"].some((k) => text.includes(k))) {
    return "water";
  }
  if (["electric", "electricity", "power", "voltage", "transformer", "outage"].some((k) => text.includes(k))) {
    return "electricity";
  }
  if (["road", "traffic", "pothole", "street", "bridge"].some((k) => text.includes(k))) {
    return "road";
  }
  return "other";
}

function HeatLayer({ points }) {
  const map = useMap();

  React.useEffect(() => {
    if (!points.length) return undefined;

    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 12,
      gradient: {
        0.2: "#fde68a",
        0.45: "#f59e0b",
        0.7: "#f97316",
        1.0: "#dc2626",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

export default function FutureComplaintPrediction({ adminDepartment = "" }) {
  const [targetDate, setTargetDate] = useState(TOMORROW_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const rawPredictions = result?.predictions || [];
  const rawAlerts = result?.preventive_action_alerts || [];

  const effectiveDepartment = useMemo(() => {
    return resolveDepartmentKey(adminDepartment || localStorage.getItem("adminDepartment") || "");
  }, [adminDepartment]);

  const departmentLabel = DEPARTMENT_LABELS[effectiveDepartment] || "Your Department";

  const predictions = useMemo(() => {
    return rawPredictions.filter((item) => isPredictionRelevantToDepartment(item, effectiveDepartment));
  }, [rawPredictions, effectiveDepartment]);

  const alerts = useMemo(() => {
    return rawAlerts.filter((item) => isPredictionRelevantToDepartment(item, effectiveDepartment));
  }, [rawAlerts, effectiveDepartment]);

  const mapPoints = useMemo(() => {
    return predictions
      .filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
      .map((item) => ({
        ...item,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
      }));
  }, [predictions]);

  const heatPoints = useMemo(() => {
    if (!predictions.length) return [];
    const maxVolume = Math.max(...predictions.map((item) => Number(item.predicted_volume) || 0), 1);

    return mapPoints.map((item) => [
      item.latitude,
      item.longitude,
      Math.max(0.25, (Number(item.predicted_volume) || 0) / maxVolume),
    ]);
  }, [mapPoints, predictions]);

  const highUrgencyAlerts = useMemo(
    () => alerts.filter((item) => String(item.urgency || "").toUpperCase() === "HIGH"),
    [alerts]
  );

  const categorizedPredictions = useMemo(() => {
    const grouped = {
      water: [],
      electricity: [],
      road: [],
      other: [],
    };

    predictions.forEach((item) => {
      const category = getComplaintCategory(item.complaint_type);
      grouped[category].push(item);
    });

    CATEGORY_ORDER.forEach((category) => {
      grouped[category].sort((a, b) => Number(b.predicted_volume || 0) - Number(a.predicted_volume || 0));
    });

    return grouped;
  }, [predictions]);

  const orderedPredictions = useMemo(() => {
    return CATEGORY_ORDER.flatMap((category) => categorizedPredictions[category]);
  }, [categorizedPredictions]);

  const orderedHighUrgencyAlerts = useMemo(() => {
    const withCategory = highUrgencyAlerts.map((item) => ({
      ...item,
      _category: getComplaintCategory(item.complaint_type),
    }));

    return withCategory.sort((a, b) => {
      const idxA = CATEGORY_ORDER.indexOf(a._category);
      const idxB = CATEGORY_ORDER.indexOf(b._category);
      if (idxA !== idxB) return idxA - idxB;
      return Number(b.predicted_volume || 0) - Number(a.predicted_volume || 0);
    });
  }, [highUrgencyAlerts]);

  const handlePredict = async () => {
    setLoading(true);
    setError("");

    try {
      const endpointCandidates = [
        `http://127.0.0.1:8000/predict-future?date=${targetDate}`,
        `http://127.0.0.1:8000/predict?date=${targetDate}`,
      ];

      let response = null;
      let selectedEndpoint = "";

      for (const endpoint of endpointCandidates) {
        const candidateResponse = await fetch(endpoint, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (candidateResponse.status === 404) {
          continue;
        }

        response = candidateResponse;
        selectedEndpoint = endpoint;
        break;
      }

      if (!response) {
        throw new Error("Prediction route not found. Restart Python server with api:app.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 405) {
          throw new Error(`Prediction API method mismatch on ${selectedEndpoint}. Restart Python server with api:app.`);
        }
        throw new Error(body?.detail || "Prediction request failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || "Unable to fetch predictions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section data-guide="prediction-panel" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-4 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Future Complaint Prediction</h3>
            <p className="text-sm text-slate-200">
              Forecast complaint hotspots so departments can prepare response teams in advance.
            </p>
            <p className="mt-1 text-xs text-cyan-100">
              Showing department-specific forecast for: {departmentLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs uppercase tracking-wider text-cyan-100">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
              />
            </div>
            <button
              type="button"
              onClick={handlePredict}
              disabled={loading || !targetDate}
              className="inline-flex h-[42px] items-center rounded-md border border-cyan-300 bg-cyan-500 px-4 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Predicting..." : "Predict"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4">
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-cyan-800">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="text-sm font-medium">Generating forecast for {targetDate}...</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to predict future complaints: {error}
          </div>
        )}

        {!loading && !error && !result && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Select a target date and click Predict to view forecasted complaint volumes, hotspot map, and preventive alerts.
          </div>
        )}

        {result && (
          <>
            {predictions.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                No predicted complaints matched {departmentLabel} for the selected date.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Forecast Date</p>
                <p className="mt-1 text-lg font-semibold text-slate-800">{result.target_date}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Predicted Locations</p>
                <p className="mt-1 text-lg font-semibold text-slate-800">{orderedPredictions.length}</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase tracking-wider text-red-600">High Urgency Alerts</p>
                <p className="mt-1 text-lg font-semibold text-red-800">{orderedHighUrgencyAlerts.length}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {CATEGORY_ORDER.slice(0, 3).map((category) => (
                <div key={category} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{CATEGORY_LABELS[category]} Complaints</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-800">{categorizedPredictions[category].length}</p>
                </div>
              ))}
            </div>

            {orderedHighUrgencyAlerts.length > 0 && (
              <div data-guide="preventive-actions" className="grid gap-3 md:grid-cols-2">
                {orderedHighUrgencyAlerts.map((alert) => (
                  <div key={`alert-${alert.location}`} className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-base font-semibold text-red-900">{alert.location}</p>
                      <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                        {alert.urgency}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-red-800">
                      Expected: {alert.complaint_type} | Volume: {alert.predicted_volume}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                      Category: {CATEGORY_LABELS[alert._category] || "Other"}
                    </p>
                    <div className="mt-2 text-xs text-red-700">
                      {(alert.recommended_actions || []).slice(0, 2).map((action, idx) => (
                        <p key={`${alert.location}-action-${idx}`}>• {action}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-5">
              <div data-guide="risk-map" className="overflow-hidden rounded-xl border border-slate-200 lg:col-span-3">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">Prediction Risk Map</p>
                </div>
                <div className="relative h-[360px]">
                  <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="h-full w-full">
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <HeatLayer points={heatPoints} />

                    {mapPoints.map((item) => (
                      <CircleMarker
                        key={`point-${item.location}`}
                        center={[item.latitude, item.longitude]}
                        radius={String(item.urgency).toUpperCase() === "HIGH" ? 9 : 7}
                        pathOptions={{
                          color: "#ffffff",
                          weight: 2,
                          fillColor: String(item.urgency).toUpperCase() === "HIGH" ? "#dc2626" : "#f59e0b",
                          fillOpacity: 0.95,
                        }}
                      >
                        <Popup>
                          <div className="space-y-1 text-sm">
                            <p className="font-semibold">{item.location}</p>
                            <p>Type: {item.complaint_type}</p>
                            <p>Volume: {item.predicted_volume}</p>
                            <p>Urgency: {item.urgency}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>

                  {!mapPoints.length && (
                    <div className="absolute inset-0 grid place-items-center bg-slate-900/30">
                      <div className="rounded-lg bg-white/95 px-4 py-3 text-sm text-slate-700 shadow">
                        Map points unavailable for current location data.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 lg:col-span-2">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">Predicted Volume by Location</p>
                </div>
                <div className="h-[360px] p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderedPredictions.slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="location"
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="predicted_volume" name="Predicted Volume" radius={[6, 6, 0, 0]}>
                        {orderedPredictions.slice(0, 10).map((item, index) => (
                          <Cell key={`bar-${item.location}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">Future Complaint Prediction Table (Water → Electricity → Road)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Complaint Type</th>
                      <th className="px-3 py-2">Predicted Volume</th>
                      <th className="px-3 py-2">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedPredictions.map((item) => (
                      <tr key={`row-${item.location}-${item.complaint_type}`} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{item.location}</td>
                        <td className="px-3 py-2 text-slate-700">{item.complaint_type}</td>
                        <td className="px-3 py-2 text-slate-700">{item.predicted_volume}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            String(item.urgency).toUpperCase() === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.urgency}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
