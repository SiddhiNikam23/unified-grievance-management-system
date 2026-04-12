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
    <header className="flex justify-between items-center bg-white p-6 shadow">
      <div>
        <h1 className="text-2xl font-bold">{getDepartmentFullName(adminDepartment)}</h1>
        <p className="text-gray-600">Admin Panel</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          {adminEmail.charAt(0).toUpperCase()}
        </div>
        <span className="text-gray-700">{adminEmail}</span>
      </div>
    </header>
  );
};
export default Header;
