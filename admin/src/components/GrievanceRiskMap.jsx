import React, { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

const RISK_STYLES = {
  Critical: { color: "#b91c1c", label: "Critical", weight: 1 },
  High: { color: "#ef4444", label: "High", weight: 0.85 },
  Medium: { color: "#eab308", label: "Medium", weight: 0.6 },
  Low: { color: "#2563eb", label: "Low", weight: 0.4 },
};

const MAP_REGIONS = {
  india: {
    label: "India",
    center: [22.9734, 78.6569],
    zoom: 5,
  },
  maharashtra: {
    label: "Maharashtra",
    center: [19.7515, 75.7139],
    zoom: 7,
  },
};

function getRiskStyle(priority) {
  return RISK_STYLES[priority] || RISK_STYLES.Medium;
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return date.toLocaleString();
}

function MapViewController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [map, center, zoom]);

  return null;
}

function HeatLayer({ points }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!points.length) {
      return undefined;
    }

    layerRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 12,
      gradient: {
        0.2: "#3b82f6",
        0.45: "#eab308",
        0.7: "#f97316",
        1.0: "#dc2626",
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

export default function GrievanceRiskMap({ grievances = [], adminDepartment = "" }) {
  const [region, setRegion] = useState("india");

  useEffect(() => {
    if (adminDepartment === "emergency_response") {
      setRegion("india");
      return;
    }
    setRegion("maharashtra");
  }, [adminDepartment]);

  const mappedPoints = useMemo(() => {
    return grievances
      .filter((g) => {
        const lat = Number(g?.location?.latitude);
        const lng = Number(g?.location?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      })
      .map((g) => {
        const lat = Number(g.location.latitude);
        const lng = Number(g.location.longitude);
        const risk = getRiskStyle(g.priority);

        return {
          id: g._id || g.grievanceCode,
          grievanceCode: g.grievanceCode || "N/A",
          department: g.department || "Unknown Department",
          priority: g.priority || "Medium",
          status: g.currentStatus || "Complaint Filed",
          date: g.createdAt || g.dateOfReceipt,
          position: [lat, lng],
          color: risk.color,
          heatWeight: risk.weight,
          description: g.description || "No description",
        };
      });
  }, [grievances]);

  const heatPoints = useMemo(
    () => mappedPoints.map((p) => [p.position[0], p.position[1], p.heatWeight]),
    [mappedPoints]
  );

  const riskCounts = useMemo(() => {
    return mappedPoints.reduce(
      (acc, point) => {
        acc[point.priority] = (acc[point.priority] || 0) + 1;
        return acc;
      },
      { Critical: 0, High: 0, Medium: 0, Low: 0 }
    );
  }, [mappedPoints]);

  const currentRegion = MAP_REGIONS[region];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Complaint Risk Heat Map</h3>
          <p className="text-sm text-slate-600">
            Red shows high-risk complaint density. Yellow marks medium zones and blue marks low risk.
          </p>
        </div>

        <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 shadow-sm">
          {Object.entries(MAP_REGIONS).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRegion(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                region === key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[58vh] min-h-[420px] w-full">
        <MapContainer
          center={currentRegion.center}
          zoom={currentRegion.zoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapViewController center={currentRegion.center} zoom={currentRegion.zoom} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <HeatLayer points={heatPoints} />

          {mappedPoints.map((point) => (
            <CircleMarker
              key={point.id}
              center={point.position}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: point.color,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{point.grievanceCode}</p>
                  <p className="text-xs text-slate-700">Priority: {point.priority}</p>
                  <p className="text-xs text-slate-700">Status: {point.status}</p>
                  <p className="text-xs text-slate-700">Department: {point.department}</p>
                  <p className="text-xs text-slate-700">Filed: {formatDate(point.date)}</p>
                  <p className="text-xs text-slate-600">{point.description}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {!mappedPoints.length && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-900/40">
            <div className="rounded-xl bg-white/95 px-4 py-3 text-center shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-slate-800">No complaint locations available</p>
              <p className="text-xs text-slate-600">Location dots and heatmap will appear once users share location in complaints.</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-4 right-4 z-[500] w-[220px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Legend</p>
          <div className="space-y-2">
            {Object.entries(RISK_STYLES).map(([key, style]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: style.color }} />
                <span className="text-sm font-medium text-slate-700">{style.label}</span>
                <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {riskCounts[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
