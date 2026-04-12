import React, { useState } from "react";

const FilterTabs = ({ grievances, setFilteredGrievances }) => {
  const [selectedTab, setSelectedTab] = useState("All");
  const tabs = ["All", "Rejected", "Under Review"];

  const filterGrievances = (status) => {
    setSelectedTab(status);

    if (status === "All") {
      setFilteredGrievances(grievances);
    } else {
      setFilteredGrievances(
        grievances.filter((g) => g.currentStatus.toLowerCase() === status.toLowerCase())
      );
    }
  };

  return (
    <div className="mb-6 flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => filterGrievances(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              selectedTab === tab
                ? "bg-slate-900 text-white shadow"
                : "text-slate-700 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="relative w-full sm:w-80">
        <input
          type="text"
          placeholder="Search by complainant or grievance code"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 pl-10 text-sm text-slate-700 shadow-inner outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-200"
          onChange={(e) => {
            const searchQuery = e.target.value.toLowerCase();
            setFilteredGrievances(
              grievances.filter(
                (g) =>
                  g.complainantName.toLowerCase().includes(searchQuery) ||
                  g.grievanceCode.toLowerCase().includes(searchQuery)
              )
            );
          }}
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
      </div>
    </div>
  );
};

export default FilterTabs;
