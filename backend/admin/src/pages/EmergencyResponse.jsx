import React, { useState, useEffect } from "react";
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
        avgResponseTime: 0
    });
    const playAlertSound = () => {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0vBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bxdju+zooVARC0yl4fG5ZRwFNo3V7859LwUofsz');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };
    useEffect(() => {
        fetchEscalatedGrievances();
        const interval = setInterval(fetchEscalatedGrievances, 30000);
        return () => clearInterval(interval);
    }, []);
    const fetchEscalatedGrievances = async () => {
        try {
            const response = await fetch("http://localhost:5000/grievance/allGrievances", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                const escalated = data.filter(g => g.isEscalated);
                if (escalated.length > escalatedGrievances.length && escalatedGrievances.length > 0) {
                    playAlertSound();
                }
                setEscalatedGrievances(escalated);
                const critical = escalated.filter(g => g.priority === 'Critical').length;
                const high = escalated.filter(g => g.priority === 'High').length;
                setStats({
                    total: escalated.length,
                    critical,
                    high,
                    avgResponseTime: calculateAvgResponseTime(escalated)
                });
            }
        } catch (error) {
            console.error("Error fetching escalated grievances:", error);
        } finally {
            setLoading(false);
        }
    };
    const calculateAvgResponseTime = (grievances) => {
        if (grievances.length === 0) return 0;
        const times = grievances.map(g => {
            const escalatedAt = new Date(g.escalatedAt);
            const now = new Date();
            return (now - escalatedAt) / (1000 * 60); 
        });
        return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
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
            'Critical': 'bg-red-600 text-white',
            'High': 'bg-orange-500 text-white',
            'Medium': 'bg-yellow-500 text-white',
            'Low': 'bg-green-500 text-white'
        };
        return colors[priority] || 'bg-gray-500 text-white';
    };
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
            </div>
        );
    }
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <AlertTriangle className="text-red-600" size={36} />
                    Emergency Response Center
                </h1>
                <p className="text-gray-600 mt-2">
                    Real-time monitoring of escalated complaints requiring immediate attention
                </p>
            </div>
            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold">Total Escalated</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
                        </div>
                        <AlertTriangle className="text-red-600" size={40} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold">Critical Cases</p>
                            <p className="text-3xl font-bold text-red-700 mt-2">{stats.critical}</p>
                        </div>
                        <AlertTriangle className="text-red-700" size={40} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold">High Priority</p>
                            <p className="text-3xl font-bold text-orange-500 mt-2">{stats.high}</p>
                        </div>
                        <TrendingUp className="text-orange-500" size={40} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold">Avg Response Time</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.avgResponseTime}m</p>
                        </div>
                        <Clock className="text-blue-600" size={40} />
                    </div>
                </div>
            </div>
            {}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={24} />
                    Escalation Timeline
                </h2>
                <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-4 mb-2">
                        <span className="font-semibold">🔴 Critical:</span>
                        <span>Escalates in 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="font-semibold">🟠 High:</span>
                        <span>Escalates in 12 hours</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="font-semibold">🟡 Medium:</span>
                        <span>Escalates in 72 hours</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-semibold">🟢 Low:</span>
                        <span>Escalates in 7 days</span>
                    </div>
                </div>
            </div>
            {}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 bg-red-600 text-white">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle size={28} />
                        Active Escalated Complaints ({escalatedGrievances.length})
                    </h2>
                </div>
                {escalatedGrievances.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="mx-auto text-gray-400 mb-4" size={64} />
                        <p className="text-xl text-gray-600">No escalated complaints at this time</p>
                        <p className="text-gray-500 mt-2">All complaints are being handled within normal timeframes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="py-4 px-6 text-left">Status</th>
                                    <th className="py-4 px-6 text-left">Grievance Code</th>
                                    <th className="py-4 px-6 text-left">Complainant</th>
                                    <th className="py-4 px-6 text-left">Priority</th>
                                    <th className="py-4 px-6 text-left">Department</th>
                                    <th className="py-4 px-6 text-left">Escalated</th>
                                    <th className="py-4 px-6 text-left">Reason</th>
                                    <th className="py-4 px-6 text-left">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {escalatedGrievances.map((grievance, index) => (
                                    <tr
                                        key={index}
                                        className={`border-b hover:bg-red-50 transition duration-200 ${
                                            grievance.priority === 'Critical' ? 'bg-red-100 animate-pulse' : ''
                                        }`}
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-2xl">🚨</span>
                                        </td>
                                        <td className="py-4 px-6 font-semibold text-gray-800">
                                            {grievance.grievanceCode}
                                        </td>
                                        <td className="py-4 px-6">{grievance.complainantName}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(grievance.priority)}`}>
                                                {grievance.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-sm">{grievance.department}</td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {getTimeSinceEscalation(grievance.escalatedAt)}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {grievance.escalationReason || 'Auto-escalated'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => navigate(`/grievance/${grievance.grievanceCode}`)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
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
