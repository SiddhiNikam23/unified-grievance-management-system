import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import GoalsChart from "../components/GoalsChart";
import DevicesChart from "../components/DevicesChart";

const Billing = () => {
  return <div className="space-y-6">
    <DashboardHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DevicesChart />
        <GoalsChart />
      </div>
  </div>;
};

export default Billing;
