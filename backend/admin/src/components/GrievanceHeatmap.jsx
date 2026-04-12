import React, { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const MAHARASHTRA_CENTER = [19.7515, 75.7139];
const MAHARASHTRA_BOUNDS = [
  [15.5, 72.3],
  [22.2, 80.95],
];
const GRID_SIZE = 0.01;

function getGridKey(lat, lng) {
  const latBucket = Math.round(lat / GRID_SIZE) * GRID_SIZE;
  const lngBucket = Math.round(lng / GRID_SIZE) * GRID_SIZE;
  return `${latBucket.toFixed(4)},${lngBucket.toFixed(4)}`;
}

function buildClusterData(grievances) {
  const buckets = new Map();

  grievances.forEach((g) => {
    const lat = g?.location?.latitude;
    const lng = g?.location?.longitude;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    const key = getGridKey(lat, lng);
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        lat,
        lng,
        count: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        escalated: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.count += 1;

    const priority = g?.priority || "Medium";
    if (priority === "Critical") bucket.critical += 1;
    else if (priority === "High") bucket.high += 1;
    else if (priority === "Low") bucket.low += 1;
    else bucket.medium += 1;

    if (g?.isEscalated) bucket.escalated += 1;
  });

  return Array.from(buckets.values());
}

function buildComplaintPoints(grievances) {
  return grievances
    .filter((g) => typeof g?.location?.latitude === "number" && typeof g?.location?.longitude === "number")
    .map((g) => ({
      grievanceCode: g.grievanceCode,
      lat: g.location.latitude,
      lng: g.location.longitude,
      priority: g.priority || "Medium",
      department: g.department || "General",
      category: g.category || "General",
      status: g.currentStatus || "Complaint Filed",
      escalated: !!g.isEscalated,
      createdAt: g.createdAt,
      description: g.description || "No description provided",
    }));
}

function HeatLayer({ points, visible }) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !points.length) return undefined;

    const heatPoints = points.map((p) => [
      p.lat,
      p.lng,
      Math.min(1, p.weight),
    ]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 30,
      blur: 24,
      maxZoom: 14,
      minOpacity: 0.45,
      gradient: {
        0.15: "#fde68a",
        0.35: "#f59e0b",
        0.62: "#ef4444",
        0.9: "#b91c1c",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, visible]);

  return null;
}

const GrievanceHeatmap = ({ grievances = [], mode = "dots" }) => {
  const complaintPoints = useMemo(() => buildComplaintPoints(grievances), [grievances]);
  const clusterPoints = useMemo(() => buildClusterData(grievances), [grievances]);

  const heatPoints = useMemo(
    () =>
      complaintPoints.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        weight: p.escalated || p.priority === "Critical" ? 1 : p.priority === "High" ? 0.75 : p.priority === "Low" ? 0.35 : 0.55,
      })),
    [complaintPoints]
  );

  const hasPoints = complaintPoints.length > 0;

  const summary = useMemo(() => {
    const critical = complaintPoints.filter((p) => p.priority === "Critical").length;
    const escalated = complaintPoints.filter((p) => p.escalated).length;
    const high = complaintPoints.filter((p) => p.priority === "High").length;
    const topCells = [...clusterPoints].sort((a, b) => b.count - a.count).slice(0, 3);

    return {
      critical,
      escalated,
      high,
      topCells,
    };
  }, [complaintPoints, clusterPoints]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg md:text-xl font-semibold">Maharashtra Citizen Complaint Density</h3>
            <p className="text-sm text-slate-200 mt-1">
              Region-focused situational view with precise complaint plotting and density overlays.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-white/15 text-slate-100 font-medium border border-white/20">
            Geotagged Complaints: {complaintPoints.length}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-lg bg-white/10 px-3 py-2 border border-white/10">
            <div className="text-xs text-slate-200">Critical</div>
            <div className="text-lg font-semibold">{summary.critical}</div>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 border border-white/10">
            <div className="text-xs text-slate-200">Escalated</div>
            <div className="text-lg font-semibold">{summary.escalated}</div>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 border border-white/10">
            <div className="text-xs text-slate-200">High Priority</div>
            <div className="text-lg font-semibold">{summary.high}</div>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 border border-white/10">
            <div className="text-xs text-slate-200">Hotspot Cells</div>
            <div className="text-lg font-semibold">{clusterPoints.length}</div>
          </div>
        </div>
      </div>

      {!hasPoints ? (
        <div className="p-8 text-center text-gray-500">
          No location-tagged grievances available for map rendering.
        </div>
      ) : (
        <div className="h-[520px] w-full relative">
          <MapContainer
            center={MAHARASHTRA_CENTER}
            zoom={7}
            minZoom={6}
            maxZoom={15}
            maxBounds={MAHARASHTRA_BOUNDS}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <HeatLayer points={heatPoints} visible={mode === "heat" || mode === "both"} />

            {(mode === "dots" || mode === "both") &&
              complaintPoints.map((point) => (
                <CircleMarker
                  key={`${point.grievanceCode}-${point.lat}-${point.lng}`}
                  center={[point.lat, point.lng]}
                  radius={point.escalated || point.priority === "Critical" ? 9 : point.priority === "High" ? 7 : 6}
                  pathOptions={{
                    color: point.escalated || point.priority === "Critical" ? "#7f1d1d" : "#991b1b",
                    fillColor: point.escalated || point.priority === "Critical" ? "#dc2626" : "#ef4444",
                    fillOpacity: 0.78,
                    weight: 1.2,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold mb-1">Grievance {point.grievanceCode}</div>
                      <div>Priority: {point.priority}</div>
                      <div>Status: {point.status}</div>
                      <div>Department: {point.department}</div>
                      <div>Category: {point.category}</div>
                      <div className="mt-1 text-gray-600">{point.description.slice(0, 100)}...</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>

          <div className="absolute bottom-4 right-4 bg-white/95 border border-slate-200 rounded-lg shadow-lg p-3 min-w-[220px]">
            <div className="text-xs font-semibold text-slate-700 mb-2">Citizen Complaint Density</div>
            <div className="h-3 w-full rounded bg-gradient-to-r from-yellow-200 via-orange-400 to-red-700 mb-1" />
            <div className="flex justify-between text-[11px] text-slate-600 mb-2">
              <span>Low</span>
              <span>High</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Critical / Escalated
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> General Complaint Dot
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-white/95 border border-slate-200 rounded-lg shadow p-3 max-w-[260px]">
            <div className="text-xs font-semibold text-slate-700 mb-2">Top Hotspot Zones</div>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              {summary.topCells.map((cell, idx) => (
                <div key={cell.key} className="flex items-center justify-between gap-3">
                  <span>Zone {idx + 1} ({cell.lat.toFixed(3)}, {cell.lng.toFixed(3)})</span>
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-100 font-semibold">
                    {cell.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievanceHeatmap;
