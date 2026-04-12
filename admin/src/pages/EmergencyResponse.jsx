import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, TrendingUp, Users } from "lucide-react";

const EmergencyResponse = () => {
  const navigate = useNavigate();
  const [escalatedGrievances, setEscalatedGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    avgResponseTime: 0,
  });

  const playAlertSound = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zooVARC0yl4fG5ZRwFNo3V7859LwUofsz"
    );
    audio.play().catch((e) => console.log("Audio play failed:", e));
  };

  useEffect(() => {
    fetchEscalatedGrievances();
    const interval = setInterval(fetchEscalatedGrievances, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateAvgResponseTime = (grievances) => {
    if (!grievances.length) {
      return 0;
    }

    const times = grievances.map((g) => {
      const escalatedAt = new Date(g.escalatedAt);
      const now = new Date();
      return (now - escalatedAt) / (1000 * 60);
    });

    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  };

  const fetchEscalatedGrievances = async () => {
    try {
      const response = await fetch("http://localhost:5000/grievance/allGrievances", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const escalated = data.filter((g) => g.isEscalated);

        if (escalated.length > escalatedGrievances.length && escalatedGrievances.length > 0) {
          playAlertSound();
        }

        setEscalatedGrievances(escalated);

        const critical = escalated.filter((g) => g.priority === "Critical").length;
        const high = escalated.filter((g) => g.priority === "High").length;

        setStats({
          total: escalated.length,
          critical,
          high,
          avgResponseTime: calculateAvgResponseTime(escalated),
        });
      }
    } catch (error) {
      console.error("Error fetching escalated grievances:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSinceEscalation = (escalatedAt) => {
    const now = new Date();
    const escalated = new Date(escalatedAt);
    const diffMinutes = Math.floor((now - escalated) / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Critical: "bg-red-600 text-white",
      High: "bg-red-500 text-white",
      Medium: "bg-yellow-500 text-white",
      Low: "bg-green-500 text-white",
    };
    return colors[priority] || "bg-gray-500 text-white";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-r from-red-900 via-red-800 to-orange-700 p-6 text-white shadow-lg">
        <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-orange-300/25 blur-2xl" />
        <div className="relative">
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <AlertTriangle className="text-red-200" size={36} />
            Emergency Response Center
          </h1>
          <p className="mt-2 text-red-100">
            Real-time monitoring of escalated complaints requiring immediate attention
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Escalated</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <AlertTriangle className="text-red-600" size={36} />
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Critical Cases</p>
              <p className="mt-2 text-3xl font-bold text-red-700">{stats.critical}</p>
            </div>
            <AlertTriangle className="text-red-700" size={36} />
          </div>
        </div>

        <div className="rounded-2xl border border-orange-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">High Priority</p>
              <p className="mt-2 text-3xl font-bold text-orange-500">{stats.high}</p>
            </div>
            <TrendingUp className="text-orange-500" size={36} />
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Avg Response Time</p>
              <p className="mt-2 text-3xl font-bold text-cyan-700">{stats.avgResponseTime}m</p>
            </div>
            <Clock className="text-cyan-700" size={36} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-800">
          <Clock size={24} />
          Escalation Timeline
        </h2>
        <div className="text-sm text-slate-600">
          <div className="mb-2 flex items-center gap-4">
            <span className="font-semibold">🔴 Critical:</span>
            <span>Escalates in 5 minutes</span>
          </div>
          <div className="mb-2 flex items-center gap-4">
            <span className="font-semibold">🟠 High:</span>
            <span>Escalates in 12 hours</span>
          </div>
          <div className="mb-2 flex items-center gap-4">
            <span className="font-semibold">🟡 Medium:</span>
            <span>Escalates in 72 hours</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">🟢 Low:</span>
            <span>Escalates in 7 days</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-red-600 p-6 text-white">
          <h2 className="flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle size={28} />
            Active Escalated Complaints ({escalatedGrievances.length})
          </h2>
        </div>

        {escalatedGrievances.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-xl text-gray-600">No escalated complaints at this time</p>
            <p className="mt-2 text-gray-500">All complaints are being handled within normal timeframes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Grievance Code</th>
                  <th className="px-6 py-4 text-left">Complainant</th>
                  <th className="px-6 py-4 text-left">Priority</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Escalated</th>
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {escalatedGrievances.map((grievance, index) => (
                  <tr
                    key={index}
                    className={`border-b transition hover:bg-red-50 ${
                      grievance.priority === "Critical" ? "bg-red-100" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-2xl">🚨</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{grievance.grievanceCode}</td>
                    <td className="px-6 py-4">{grievance.complainantName}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityColor(grievance.priority)}`}>
                        {grievance.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{grievance.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getTimeSinceEscalation(grievance.escalatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{grievance.escalationReason || "Auto-escalated"}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/grievance/${grievance.grievanceCode}`)}
                        className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyResponse;
