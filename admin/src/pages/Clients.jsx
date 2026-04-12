import React, { useState, useEffect } from "react";
import SummaryCards from "../components/SummaryCards";
import ClientTable from "../components/ClientTable";
import GrievanceRiskMap from "../components/GrievanceRiskMap";
const Clients = () => {
  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [adminDepartment, setAdminDepartment] = useState("");
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

  const escalatedCount = filteredGrievances.filter((g) => g.isEscalated).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-lg">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Government Control Panel</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Citizen Complaints Intelligence</h1>
            <p className="mt-2 text-sm text-slate-200 sm:text-base">
              Track risk hotspots, monitor department queues, and act faster on citizen grievances.
            </p>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-cyan-100">Live Complaints</p>
            <p className="mt-1 text-2xl font-bold">{filteredGrievances.length}</p>
          </div>
        </div>
      </section>

      <div className={`rounded-2xl border p-4 shadow-sm ${
        adminDepartment === 'emergency_response' 
          ? 'border-red-200 bg-red-50' 
          : 'border-cyan-200 bg-cyan-50'
      }`}>
        <h2 className={`text-lg font-semibold ${
          adminDepartment === 'emergency_response' 
            ? 'text-red-900' 
            : 'text-cyan-900'
        }`}>
          Department Access: {getDepartmentFullName(adminDepartment)}
        </h2>
        <p className={`mt-1 text-sm ${
          adminDepartment === 'emergency_response' 
            ? 'text-red-700' 
            : 'text-cyan-700'
        }`}>
          {adminDepartment === 'emergency_response' 
            ? `Full system access - Showing all ${filteredGrievances.length} complaints across all departments`
            : `Showing ${filteredGrievances.length} grievances for your department`
          }
        </p>
      </div>

      {escalatedCount > 0 && (
        <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚨</span>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                {escalatedCount} Critical Escalated Complaint(s)
              </h3>
              <p className="text-sm text-red-700">
                These complaints require immediate attention from the Emergency Response Team
              </p>
            </div>
          </div>
        </div>
      )}

      <GrievanceRiskMap grievances={filteredGrievances} adminDepartment={adminDepartment} />
      <SummaryCards grievances={filteredGrievances} />
      <ClientTable grievances={filteredGrievances} />
    </div>
  );
};
export default Clients;
