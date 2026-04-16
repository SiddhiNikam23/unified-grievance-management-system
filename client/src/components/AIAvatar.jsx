import React, { useEffect, useRef } from "react";
import { useTour } from "../context/TourContext";
import { useLocation } from "react-router-dom";
import AIgirl from "../assets/AIgirl.png";

const AIAvatar = () => {
  const {
    isTourActive,
    currentStep,
    setIsSpeaking,
    TOUR_STEPS,
    nextStep,
    language // ✅ FIXED NAME
  } = useTour();

  const location = useLocation();
  const utterancesRef = useRef([]);
  const lastSpokenStep = useRef(null); // ✅ prevent repeat speech

  useEffect(() => {
    window.speechSynthesis.cancel();

    // 🚫 Pause if login required
    if (isTourActive && currentStep >= 4 && location.pathname === "/login") {
      setIsSpeaking(false);
      return;
    }

    // ✅ Prevent repeat speech for same step
    if (lastSpokenStep.current === currentStep) return;
    lastSpokenStep.current = currentStep;

    if (isTourActive && currentStep >= 0) {
      const timer = setTimeout(() => speakStep(currentStep), 600);

      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    }
  }, [isTourActive, currentStep, location.pathname]);

  const speakStep = (index) => {
    const step = TOUR_STEPS[index];
    if (!step) return;

    setIsSpeaking(true);

    const textToSpeak = language === "hi" ? step.textHi : step.textEn;
    const langCode = language === "hi" ? "hi-IN" : "en-US";

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = langCode;
    utter.rate = 1.0;

    utter.onend = () => {
      setIsSpeaking(false);

      // 🔐 STOP at login step
      if (index === 3) return;

      setTimeout(nextStep, 2000);
    };

    utterancesRef.current = [utter];
    window.speechSynthesis.speak(utter);
  };

  // 🚫 Hide completely if not active
  if (!isTourActive || currentStep < 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[2500] flex flex-col items-center pointer-events-none pb-4 transition-all">

      {/* 💬 Speech Box */}
      <div className="mb-6 max-w-lg bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-teal-500/30 text-center pointer-events-auto mx-4 animate-fade-in">
        <p className="text-slate-800 font-bold text-lg">
          {language === "hi"
            ? TOUR_STEPS[currentStep]?.textHi
            : TOUR_STEPS[currentStep]?.textEn}
        </p>

        {/* ⛔ Login Wait Indicator */}
        {location.pathname === "/login" && (
          <p className="text-red-500 font-bold mt-2 animate-pulse">
            Waiting for Login...
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={nextStep}
            className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold active:scale-95 shadow-lg"
          >
            {currentStep === TOUR_STEPS.length - 1
              ? "Finish ✓"
              : "Continue ➔"}
          </button>
        </div>
      </div>

      {/* 🤖 AI GIRL — ONLY STEP 0 */}
      {currentStep === 0 && (
        <div className="relative flex flex-col items-center transition-all">
          <img
            src={AIgirl}
            alt="AI"
            className="w-40 animate-bounce-subtle"
          />
        </div>
      )}
    </div>
  );
};

export default AIAvatar;