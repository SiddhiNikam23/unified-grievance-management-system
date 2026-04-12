import React, { useState, useEffect } from "react";

const Header = () => {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminDepartment, setAdminDepartment] = useState("");

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

  return (
    <header className="z-10 border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{getDepartmentFullName(adminDepartment)}</h1>
        <p className="text-sm text-slate-500">Government Grievance Administration</p>
      </div>

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
    </header>
  );
};

export default Header;
