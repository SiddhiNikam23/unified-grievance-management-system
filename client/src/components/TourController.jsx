import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTour } from "../context/TourContext";
import { useAuth } from "../context/AuthContext"; // ✅ NEW

const TourController = () => {
  const {
    isTourActive,
    currentStep,
    TOUR_STEPS,
    isPausedForAuth
  } = useTour();

  const { isAuthenticated } = useAuth(); // ✅ NEW

  const [targetRect, setTargetRect] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // 🚫 STOP if paused or inactive
    if (!isTourActive || currentStep < 0 || isPausedForAuth) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // ✅ 🔐 AUTH PROTECTION (ONLY ADDITION)
    if (step.page === "/homepage" && !isAuthenticated) {
      return; // ⛔ DON'T navigate to dashboard
    }

    // ✅ EXISTING NAVIGATION (UNCHANGED)
    if (step.page && location.pathname !== step.page) {
      navigate(step.page);
      return;
    }

    // 🎯 Find target element
    const updatePosition = () => {
      const element = document.getElementById(step.id);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        }, 100);
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updatePosition, 500);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [
    isTourActive,
    currentStep,
    location.pathname,
    navigate,
    TOUR_STEPS,
    isPausedForAuth,
    isAuthenticated // ✅ NEW DEPENDENCY
  ]);

  if (!isTourActive || !targetRect) return null;

  const { left, top, width, height } = targetRect;

  const padding = 8;
  const holeX = left - padding;
  const holeY = top - padding;
  const holeW = width + padding * 2;
  const holeH = height + padding * 2;

  return (
    <div className="fixed inset-0 pointer-events-none z-[2300]">
      <svg className="w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={holeX}
              y={holeY}
              width={holeW}
              height={holeH}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="rgba(10, 15, 30, 0.85)"
          mask="url(#tour-mask)"
        />

        <rect
          x={holeX}
          y={holeY}
          width={holeW}
          height={holeH}
          rx="12"
          fill="none"
          stroke="#2dd4bf"
          strokeWidth="3"
          className="animate-pulse-slow"
        />
      </svg>

      <style jsx="true">{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            stroke-width: 3px;
            filter: drop-shadow(0 0 5px #2dd4bf);
          }
          50% {
            opacity: 0.6;
            stroke-width: 5px;
            filter: drop-shadow(0 0 15px #2dd4bf);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default TourController;