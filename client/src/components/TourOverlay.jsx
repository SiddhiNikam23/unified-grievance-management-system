import React from "react";
import { useTour } from "../context/TourContext";
import { useLocation } from "react-router-dom";

const TourOverlay = () => {
  const { isTourActive, startTour, currentStep } = useTour();
  const location = useLocation();

  const isLandingPage = location.pathname === "/";

  const isTourCompleted = isLandingPage
    ? localStorage.getItem("nagrik_tour_completed") === "true"
    : localStorage.getItem("nagrik_dash_tour_completed") === "true";

  // ✅ Only show on landing page
  if (!isLandingPage || isTourCompleted || isTourActive || currentStep !== -1) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />

      <div className="relative bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full text-center border border-white/20 animate-pop-in">
        <div className="mb-6">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
            👋
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welcome!
          </h2>
          <p className="text-gray-600 text-lg">
            Choose your preferred language to start the tour.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* ✅ Language Selection */}
          <button
            onClick={() => startTour("en")}
            className="w-full bg-slate-800 hover:bg-black text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95 shadow-lg"
          >
            Start in English
          </button>

          <button
            onClick={() => startTour("hi")}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95 shadow-lg"
          >
            हिंदी में शुरू करें
          </button>

          {/* Skip */}
          <button
            onClick={() => {
              localStorage.setItem("nagrik_tour_completed", "true");
              window.location.reload();
            }}
            className="text-gray-500 hover:text-gray-800 font-medium py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;