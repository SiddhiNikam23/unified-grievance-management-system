import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const LIFECYCLE_OPTIONS = ["Detected", "Triaged", "Investigating", "Actioned", "Resolved", "Rejected"];

function MetricCard({ title, value, hint, tone = "slate" }) {
  const toneClass = {
    slate: "border-slate-200 bg-white text-slate-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-rose-200 bg-rose-50 text-rose-900"
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm opacity-80">{hint}</p>
    </div>
  );
}

function StatusBadge({ value, kind = "lifecycle" }) {
  const map =
    kind === "availability"
      ? {
          live: "bg-emerald-100 text-emerald-700",
          deleted: "bg-rose-100 text-rose-700",
          unknown: "bg-slate-100 text-slate-700"
        }
      : {
          Detected: "bg-blue-100 text-blue-700",
          Triaged: "bg-violet-100 text-violet-700",
          Investigating: "bg-amber-100 text-amber-700",
          Actioned: "bg-cyan-100 text-cyan-700",
          Resolved: "bg-emerald-100 text-emerald-700",
          Rejected: "bg-rose-100 text-rose-700"
        };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${map[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

export default function Complaints() {
  const location = useLocation();
  const searchValue = new URLSearchParams(location.search).get("search") || "";
  const [query, setQuery] = useState(searchValue);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    live: 0,
    deleted: 0,
    highConfidence: 0,
    openCases: 0
  });
  const [selectedId, setSelectedId] = useState("");
  const [history, setHistory] = useState(null);
  const [message, setMessage] = useState("");

  const selectedRow = useMemo(() => items.find((i) => i.id === selectedId) || null, [items, selectedId]);

  async function fetchDashboard() {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "150");

      const response = await fetch(`http://localhost:5000/social-proof/dashboard?${params.toString()}`, {
        credentials: "include"
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "Failed to load dashboard");
      setItems(payload.items || []);
      setMetrics(payload.metrics || metrics);
      if ((payload.items || []).length > 0 && !selectedId) {
        setSelectedId(payload.items[0].id);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(id) {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:5000/social-proof/${id}/history`, { credentials: "include" });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "Failed to load proof history");
      setHistory(payload.evidence);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function verifyNow(id) {
    try {
      const response = await fetch(`http://localhost:5000/social-proof/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "Verification failed");
      setMessage("Evidence verification completed.");
      await fetchDashboard();
      await fetchHistory(id);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateLifecycle(id, lifecycleStatus) {
    try {
      const response = await fetch(`http://localhost:5000/social-proof/${id}/lifecycle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lifecycleStatus })
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "Lifecycle update failed");
      setMessage(`Lifecycle updated to ${lifecycleStatus}.`);
      await fetchDashboard();
      await fetchHistory(id);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    fetchDashboard();
  }, [query, statusFilter]);

  useEffect(() => {
    if (selectedId) {
      fetchHistory(selectedId);
    }
  }, [selectedId]);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Social Complaint Intelligence</h2>
            <p className="mt-1 text-sm text-slate-600">
              Real-time ingestion, immutable proof snapshots, authenticity scoring, and lifecycle tracking.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search service, issue, location, user"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-[320px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Lifecycle States</option>
              {LIFECYCLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Captured" value={metrics.total} hint="Persisted in evidence store" tone="slate" />
        <MetricCard title="Still Live" value={metrics.live} hint="Posts currently reachable" tone="green" />
        <MetricCard title="Deleted Later" value={metrics.deleted} hint="Proof remains preserved" tone="red" />
        <MetricCard title="High Authenticity" value={metrics.highConfidence} hint="AI + cross-source confidence" tone="blue" />
        <MetricCard title="Open Cases" value={metrics.openCases} hint="Needs active handling" tone="slate" />
      </div>

      {message && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Captured Complaint Feed</h3>
          </div>
          <div className="max-h-[560px] overflow-auto">
            {loading ? (
              <p className="px-5 py-8 text-sm text-slate-500">Loading complaint intelligence...</p>
            ) : items.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500">No captured social complaints yet.</p>
            ) : (
              items.map((row) => (
                <button
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className={`w-full border-b border-slate-100 px-5 py-4 text-left transition hover:bg-slate-50 ${
                    selectedId === row.id ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{row.grievanceCode || "Pending Code"}</span>
                    <StatusBadge kind="availability" value={row.availabilityStatus} />
                    <StatusBadge value={row.lifecycleStatus} />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{row.platform}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-700">{row.complaintText}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Author: @{row.author || "unknown"}</span>
                    <span>Issue: {row.issueType}</span>
                    <span>Location: {row.location}</span>
                    <span>Proof: {row.proofSnapshots} snapshots</span>
                    <span>Authenticity: {row.authenticityScore}/100</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Case Controls</h3>
            {!selectedRow ? (
              <p className="mt-3 text-sm text-slate-500">Select a complaint to view proof details.</p>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Case:</span> {selectedRow.grievanceCode || "Pending"}
                </p>
                <p>
                  <span className="font-semibold">Confidence:</span> {selectedRow.authenticityScore}/100 ({selectedRow.confidenceBand})
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => verifyNow(selectedRow.id)}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Verify Now
                  </button>
                  {LIFECYCLE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateLifecycle(selectedRow.id, opt)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedRow.postUrl && (
                  <a href={selectedRow.postUrl} target="_blank" rel="noreferrer" className="inline-block text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Open Source Post
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Proof Timeline</h3>
            {!history ? (
              <p className="mt-3 text-sm text-slate-500">Select a case to load snapshots and verification history.</p>
            ) : (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Authenticity Reasons</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {(history.authenticity?.reasons || []).slice(0, 4).map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">Recent Verification Checks</p>
                  <div className="mt-2 max-h-48 space-y-2 overflow-auto text-xs">
                    {(history.verificationEvents || []).slice(-8).reverse().map((event, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600">
                        <p className="font-semibold text-slate-700">{event.availability?.toUpperCase() || "UNKNOWN"}</p>
                        <p>{new Date(event.checkedAt).toLocaleString()}</p>
                        <p>{event.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">Immutable Snapshots</p>
                  <div className="mt-2 max-h-48 space-y-2 overflow-auto text-xs">
                    {(history.snapshots || []).slice(-6).reverse().map((snap, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-slate-600">
                        <p className="font-semibold text-slate-700">{new Date(snap.capturedAt).toLocaleString()}</p>
                        <p>Hash: {String(snap.contentHash || "").slice(0, 16)}...</p>
                        <p>Probe: {snap.sourceProbe}</p>
                        {snap?.metadata?.proofUrl ? (
                          <a
                            href={snap.metadata.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block rounded-md bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                          >
                            View Proof
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
