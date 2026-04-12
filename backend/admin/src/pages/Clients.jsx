import React, { useState, useEffect } from "react";
import SummaryCards from "../components/SummaryCards";
import ClientTable from "../components/ClientTable";
import GrievanceHeatmap from "../components/GrievanceHeatmap";
const Clients = () => {
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [adminDepartment, setAdminDepartment] = useState("");
  const [mapMode, setMapMode] = useState("both");
  useEffect(() => {
    const department = localStorage.getItem('adminDepartment');
    setAdminDepartment(department || "");
  }, []);
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
            
            if (aResolved && !bResolved) return 1;  // a goes to bottom
            if (!aResolved && bResolved) return -1; // b goes to bottom
            return 0; // keep original order
          });
          
          setGrievances(sortedData);
          if (adminDepartment === 'emergency_response') {
            setFilteredGrievances(sortedData);
          } else if (adminDepartment) {
            const filtered = sortedData.filter(g => 
              g.department === getDepartmentFullName(adminDepartment)
            );
            setFilteredGrievances(filtered);
          } else {
            setFilteredGrievances(sortedData);
          }
        } else {
          console.error("Error fetching grievances:", response.statusText);
        }
      } catch (error) {
        console.error("Network error:", error);
      }
    };
    if (adminDepartment !== "") {
      fetchGrievances();
      const interval = setInterval(fetchGrievances, 30000);
      return () => clearInterval(interval);
    }
  }, [adminDepartment]);
  const getDepartmentFullName = (code) => {
    const departmentMap = {
      "emergency_response": "Emergency Response Team",
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
  return (
    <div>
      {}
      <div className={`mb-4 p-4 rounded-lg ${
        adminDepartment === 'emergency_response' 
          ? 'bg-red-100 border-l-4 border-red-600' 
          : 'bg-blue-100'
      }`}>
        <h2 className={`text-xl font-bold ${
          adminDepartment === 'emergency_response' 
            ? 'text-red-900' 
            : 'text-blue-900'
        }`}>
          {adminDepartment === 'emergency_response' && '🚨 '}
          Department: {getDepartmentFullName(adminDepartment)}
        </h2>
        <p className={`text-sm ${
          adminDepartment === 'emergency_response' 
            ? 'text-red-700' 
            : 'text-blue-700'
        }`}>
          {adminDepartment === 'emergency_response' 
            ? `Full system access - Showing all ${filteredGrievances.length} complaints across all departments`
            : `Showing ${filteredGrievances.length} grievances for your department`
          }
        </p>
      </div>
      {}
      {filteredGrievances.filter(g => g.isEscalated).length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-600 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="text-lg font-bold text-red-900">
                {filteredGrievances.filter(g => g.isEscalated).length} Critical Escalated Complaint(s)
              </h3>
              <p className="text-sm text-red-700">
                These complaints require immediate attention from the Emergency Response Team
              </p>
            </div>
          </div>
        </div>
      )}
      <SummaryCards grievances={filteredGrievances} />

      <div className="my-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Area Heatmap View</h3>
            <p className="text-sm text-gray-600">Track complaint concentration by geography.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMapMode("dots")}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                mapMode === "dots" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Red Dots
            </button>
            <button
              type="button"
              onClick={() => setMapMode("heat")}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                mapMode === "heat" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Heat Layer
            </button>
            <button
              type="button"
              onClick={() => setMapMode("both")}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                mapMode === "both" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Both
            </button>
          </div>
        </div>
        <div className="p-4">
          <GrievanceHeatmap grievances={filteredGrievances} mode={mapMode} />
        </div>
      </div>

      <ClientTable grievances={filteredGrievances} />
    </div>
  );
};
export default Clients;
