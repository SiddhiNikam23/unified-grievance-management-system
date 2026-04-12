import React from "react";
import { CheckCircle, Hourglass, List } from "lucide-react";

const SummaryCards = ({ grievances }) => {
  const totalGrievances = grievances.length;
  const pendingGrievances = grievances.filter((g) => (g.currentStatus !== "Resolution Provided" && g.currentStatus !== "Rejected")).length;
  const closedGrievances = totalGrievances - pendingGrievances;

  const cards = [
    {
      title: "Total Grievances",
      value: totalGrievances,
      subtitle: "Across all selected records",
      icon: <List size={28} className="text-cyan-700" />,
      theme: "from-cyan-100 to-sky-50 border-cyan-200",
    },
    {
      title: "Pending Grievances",
      value: pendingGrievances,
      subtitle: "Requires active follow-up",
      icon: <Hourglass size={28} className="text-amber-700" />,
      theme: "from-amber-100 to-yellow-50 border-amber-200",
    },
    {
      title: "Resolution Provided Grievances",
      value: closedGrievances,
      subtitle: "Completed and closed",
      icon: <CheckCircle size={28} className="text-emerald-700" />,
      theme: "from-emerald-100 to-green-50 border-emerald-200",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`group overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${card.theme}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl border border-white/80 bg-white/80 p-2 shadow-sm">{card.icon}</div>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
          </div>
          <h2 className="text-4xl font-bold leading-none text-slate-900">{card.value}</h2>
          <p className="mt-2 text-base font-semibold text-slate-800">{card.title}</p>
          <p className="mt-1 text-sm text-slate-600">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
