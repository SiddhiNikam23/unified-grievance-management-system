import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from "recharts";
const AdminDashboard = () => {
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [adminDepartment, setAdminDepartment] = useState("");
  const [total, setTotal] = useState(0);
  const [pendingGrievances, setPendingGrievances] = useState(0);
  const [closedGrievances, setClosedGrievances] = useState(0);
  const [spam, setSpam] = useState(0);
  const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#6B7280", "#D946EF"];
  useEffect(() => {
    const department = localStorage.getItem('adminDepartment');
    setAdminDepartment(department || "");
  }, []);
  const getDepartmentFullName = (code) => {
    const departmentMap = {
      "financial_services": "Financial Services (Banking Division)",
      "labour_employment": "Labour and Employment",
      "income_tax": "Central Board of Direct Taxes (Income Tax)",
      "posts": "Posts",
      "telecommunications": "Telecommunications",
      "personnel_training": "Personnel and Training",
      "housing_urban": "Housing and Urban Affairs",
      "health_welfare": "Health & Family Welfare"
    };
    return departmentMap[code] || code;
  };
  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const response = await fetch("http://localhost:5000/grievance/allGrievances", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          
          // Sort: Move resolved/resolution provided to bottom
          const sortedData = data.sort((a, b) => {
            const aResolved = a.currentStatus === 'Resolved' || a.currentStatus === 'Resolution Provided';
            const bResolved = b.currentStatus === 'Resolved' || b.currentStatus === 'Resolution Provided';
            
            if (aResolved && !bResolved) return 1;
            if (!aResolved && bResolved) return -1;
            return 0;
          });
          
          setGrievances(sortedData);
          let filtered = sortedData;
          if (adminDepartment) {
            filtered = sortedData.filter(g => 
              g.department === getDepartmentFullName(adminDepartment)
            );
          }
          setFilteredGrievances(filtered);
          const total = filtered.length;
          const pending = filtered.filter((g) => g.currentStatus !== "Resolution Provided" && g.currentStatus !== "Rejected" && g.currentStatus !== "Under Review").length;
          const closed = filtered.filter((g) => g.currentStatus === "Resolution Provided" || g.currentStatus === "Rejected").length;
          const spam = filtered.filter((g) => g.isSpam === true).length;
          setSpam(spam);
          setTotal(total);
          setPendingGrievances(pending);
          setClosedGrievances(closed);
        } else {
          console.error("Error fetching grievances:", response.statusText);
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };
    if (adminDepartment !== "") {
      fetchGrievances();
    }
  }, [adminDepartment]);
  const barData = [
    { name: "Pending", value: pendingGrievances },
    { name: "Resolved", value: closedGrievances },
    { name: "Under Review", value: total-pendingGrievances-closedGrievances },
    { name: "Spam", value: spam },
  ];
  const pieData = [
    { name: "Public Safety", value: 80 },
    { name: "Water Supply", value: 60 },
    { name: "Electricity", value: 50 },
    { name: "Infrastructure", value: 45 },
    { name: "Health Issues", value: 40 },
    { name: "Others", value: 30 },
  ];
  const lineData = [
    { name: "Jan", value: 120 },
    { name: "Feb", value: 95 },
    { name: "Mar", value: 150 },
    { name: "Apr", value: 180 },
    { name: "May", value: 210 },
    { name: "Jun", value: 230 },
    { name: "Jul", value: 250 },
    { name: "Aug", value: 270 },
  ];
  const scatterData = [
    { x: 5, y: 40 },
    { x: 10, y: 90 },
    { x: 15, y: 150 },
    { x: 20, y: 200 },
    { x: 25, y: 250 },
    { x: 30, y: 270 },
  ];
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Insights Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Department Performance & Analytics</h2>
          <p className="mt-2 text-sm text-slate-200">Visual intelligence for grievance status, trends, categories, and response efficiency.</p>
        </div>
      </section>

      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-cyan-900">
          Department: {getDepartmentFullName(adminDepartment)}
        </h2>
        <p className="mt-1 text-sm text-cyan-700">
          Analytics for {filteredGrievances.length} grievances in your department
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Grievance Status Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Grievance Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    className="transition-all duration-300 hover:opacity-75"
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} cases`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Monthly Grievance Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">AI Resolution Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Days Taken" />
              <YAxis type="number" dataKey="y" name="Resolved Cases" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatterData} fill="#EF4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
