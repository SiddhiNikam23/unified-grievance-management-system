import React, { useEffect, useState } from "react";
import FutureComplaintPrediction from "../components/FutureComplaintPrediction";

const FuturePrediction = () => {
  const [adminDepartment, setAdminDepartment] = useState("");

  useEffect(() => {
    setAdminDepartment(localStorage.getItem("adminDepartment") || "");
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Future Prediction Control Room</h1>
        <p className="mt-2 text-sm text-slate-600">
          Forecast complaint hotspots by date and prepare preventive response actions in advance.
        </p>
      </section>

      <FutureComplaintPrediction adminDepartment={adminDepartment} />
    </div>
  );
};

export default FuturePrediction;
