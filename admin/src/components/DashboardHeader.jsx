import React from "react";

const DashboardHeader = () => {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 p-6 text-white shadow-lg">
      <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-cyan-300/25 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Billing Analytics</p>
        <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-slate-200">Overview of performance metrics and usage insights.</p>
      </div>
    </header>
  );
};

export default DashboardHeader;
