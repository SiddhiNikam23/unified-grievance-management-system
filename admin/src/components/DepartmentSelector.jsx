import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Building2 } from "lucide-react";

const DepartmentSelector = ({ currentDepartment, onDepartmentChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(currentDepartment);
  const dropdownRef = useRef(null);

  const departments = [
    { code: "emergency_response", name: "Emergency Response Team", color: "red" },
    { code: "financial_services", name: "Financial Services (Banking Division)", color: "blue" },
    { code: "labour_employment", name: "Labour and Employment", color: "green" },
    { code: "income_tax", name: "Central Board of Direct Taxes (Income Tax)", color: "purple" },
    { code: "posts", name: "Posts", color: "yellow" },
    { code: "telecommunications", name: "Telecommunications", color: "indigo" },
    { code: "personnel_training", name: "Personnel and Training", color: "pink" },
    { code: "housing_urban", name: "Housing and Urban Affairs", color: "orange" },
    { code: "health_welfare", name: "Health & Family Welfare", color: "cyan" },
  ];

  const deptMap = {
    "emergency_response": { name: "Emergency Response Team", color: "red" },
    "financial_services": { name: "Financial Services (Banking Division)", color: "blue" },
    "labour_employment": { name: "Labour and Employment", color: "green" },
    "income_tax": { name: "Central Board of Direct Taxes (Income Tax)", color: "purple" },
    "posts": { name: "Posts", color: "yellow" },
    "telecommunications": { name: "Telecommunications", color: "indigo" },
    "personnel_training": { name: "Personnel and Training", color: "pink" },
    "housing_urban": { name: "Housing and Urban Affairs", color: "orange" },
    "health_welfare": { name: "Health & Family Welfare", color: "cyan" },
  };

  const colorClasses = {
    red: "bg-red-100 text-red-900 border-red-300",
    blue: "bg-blue-100 text-blue-900 border-blue-300",
    green: "bg-green-100 text-green-900 border-green-300",
    purple: "bg-purple-100 text-purple-900 border-purple-300",
    yellow: "bg-yellow-100 text-yellow-900 border-yellow-300",
    indigo: "bg-indigo-100 text-indigo-900 border-indigo-300",
    pink: "bg-pink-100 text-pink-900 border-pink-300",
    orange: "bg-orange-100 text-orange-900 border-orange-300",
    cyan: "bg-cyan-100 text-cyan-900 border-cyan-300",
  };

  const colorHoverClasses = {
    red: "hover:bg-red-200",
    blue: "hover:bg-blue-200",
    green: "hover:bg-green-200",
    purple: "hover:bg-purple-200",
    yellow: "hover:bg-yellow-200",
    indigo: "hover:bg-indigo-200",
    pink: "hover:bg-pink-200",
    orange: "hover:bg-orange-200",
    cyan: "hover:bg-cyan-200",
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectDept = (code) => {
    setSelectedDept(code);
    setIsOpen(false);
    onDepartmentChange(code);
    localStorage.setItem('adminDepartment', code);
  };

  const currentDeptInfo = deptMap[selectedDept] || deptMap["emergency_response"];
  const bgClass = colorClasses[currentDeptInfo.color] || colorClasses.blue;
  const hoverClass = colorHoverClasses[currentDeptInfo.color] || colorHoverClasses.blue;

  return (
    <div ref={dropdownRef} className="relative inline-block w-full max-w-sm">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-600">
          Selected Department
        </label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 transition-all ${bgClass} font-semibold`}
        >
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <span className="text-left">{currentDeptInfo.name}</span>
          </div>
          <ChevronDown 
            size={18} 
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {departments.map((dept) => (
              <button
                key={dept.code}
                onClick={() => handleSelectDept(dept.code)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedDept === dept.code
                    ? `${colorClasses[dept.color]} ring-2 ring-offset-1 ring-offset-white`
                    : `${colorClasses[dept.color]} ${colorHoverClasses[dept.color]}`
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 p-3 bg-slate-100 rounded-lg border border-slate-300">
        <p className="text-xs text-slate-600 font-medium">
          💡 Switch departments to view and manage grievances specific to your assigned department.
        </p>
      </div>
    </div>
  );
};

export default DepartmentSelector;
