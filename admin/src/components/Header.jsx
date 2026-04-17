import React, { useState, useEffect } from "react";
import { ChevronDown, Building2 } from "lucide-react";

const Header = () => {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail') || "admin@example.com";
    const department = localStorage.getItem('adminDepartment') || "";
    setAdminEmail(email);
    setAdminDepartment(department);
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
    return departmentMap[code] || "Admin Department";
  };

  const departments = [
    { code: "emergency_response", name: "Emergency Response Team" },
    { code: "financial_services", name: "Financial Services (Banking Division)" },
    { code: "labour_employment", name: "Labour and Employment" },
    { code: "income_tax", name: "Central Board of Direct Taxes (Income Tax)" },
    { code: "posts", name: "Posts" },
    { code: "telecommunications", name: "Telecommunications" },
    { code: "personnel_training", name: "Personnel and Training" },
    { code: "housing_urban", name: "Housing and Urban Affairs" },
    { code: "health_welfare", name: "Health & Family Welfare" },
  ];

  const handleDepartmentChange = (newDept) => {
    setAdminDepartment(newDept);
    localStorage.setItem('adminDepartment', newDept);
    setIsDropdownOpen(false);
    // Reload page to reflect changes
    window.location.reload();
  };

  return (
    <header className="z-10 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{getDepartmentFullName(adminDepartment)}</h1>
          <p className="text-sm text-slate-500">Government Grievance Administration</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Department Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-2 font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all"
            >
              <Building2 size={16} />
              <span className="hidden sm:inline text-sm">Switch Department</span>
              <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-max max-w-sm rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                <div className="p-2">
                  {departments.map((dept) => (
                    <button
                      key={dept.code}
                      onClick={() => handleDepartmentChange(dept.code)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                        adminDepartment === dept.code
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Section */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-sky-700 text-sm font-bold text-white">
              {adminEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">{adminEmail}</p>
              <p className="text-xs text-slate-500">Signed in</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
