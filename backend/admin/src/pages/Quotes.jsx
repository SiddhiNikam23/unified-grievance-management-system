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
    <div className="p-8 overflow-y-hidden bg-gray-100">
      {}
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-900">
          Department: {getDepartmentFullName(adminDepartment)}
        </h2>
        <p className="text-sm text-blue-700">
          Analytics for {filteredGrievances.length} grievances in your department
        </p>
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        🏛️ Insights 
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📊 Grievance Status Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📌 Grievance Categories</h3>
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
        {}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">📅 Monthly Grievance Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {}
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">🤖 AI Resolution Efficiency</h3>
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
