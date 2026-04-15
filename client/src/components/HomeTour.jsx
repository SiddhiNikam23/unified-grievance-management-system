import { useEffect, useState, useRef } from "react";

const steps = [
  {
    id: "dashboard-section",
    text: {
      en: "This is your personal grievance dashboard, your control center.",
      hi: "यह आपका डैशबोर्ड है, जहाँ से आपकी सभी गतिविधियाँ शुरू होती हैं।",
    },
  },
  {
    id: "stats-section",
    text: {
      en: "Here you can see total, pending and resolved grievances.",
      hi: "यहाँ आप कुल और लंबित शिकायतें देख सकते हैं।",
    },
  },
  {
    id: "grievance-table",
    text: {
      en: "This table shows all your complaints and their status.",
      hi: "यह तालिका आपकी सभी शिकायतों की स्थिति दिखाती है।",
    },
  },
  {
    id: "chatbot-btn",
    text: {
      en: "Need help? Our AI chatbot is here for you.",
      hi: "मदद चाहिए? हमारा AI चैटबॉट आपकी सहायता करता है।",
    },
  },
  {
    id: "lodge-btn",
    text: {
      en: "Click here to lodge a grievance easily.",
      hi: "यहाँ क्लिक करके शिकायत दर्ज करें।",
    },
  },
  {
    id: "status-btn",
    text: {
      en: "Track your complaint status in real time.",
      hi: "अपनी शिकायत की स्थिति यहाँ देखें।",
    },
  },
  {
    id: "activity-btn",
    text: {
      en: "View your past activities and complaint history.",
      hi: "यहाँ आप अपनी पिछली गतिविधियाँ देख सकते हैं।",
    },
  },
];

export default function HomeTour() {
  const [stepIndex, setStepIndex] = useState(0);
  const [position, setPosition] = useState({ top: 100, left: 100 });

  const hasStarted = useRef(false);

  // 🔊 Voice
  const speak = (text) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  };

  // 🚀 Start Tour (FIXED)
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;

      setTimeout(() => {
        runStep(0);
      }, 800); // wait for DOM
    }
  }, []);

  // 🎯 Run Step
  const runStep = (index) => {
    const step = steps[index];
    const el = document.getElementById(step.id);

    if (!el) {
      console.log("❌ Element not found:", step.id);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const rect = el.getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;

    // prevent overflow
    if (left + 280 > window.innerWidth) {
      left = window.innerWidth - 300;
    }

    if (top + 180 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 200;
    }

    setPosition({ top, left });

    // highlight
    el.classList.add("tour-highlight");

    speak(step.text.hi);

    setTimeout(() => {
      el.classList.remove("tour-highlight");
    }, 2500);
  };

  // ▶ Next
  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      const next = stepIndex + 1;
      setStepIndex(next);
      runStep(next);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div
      className="absolute z-50 w-72 transition-all duration-300"
      style={{ top: position.top, left: position.left }}
    >
      <div className="relative bg-gray-900 border border-blue-500/30 shadow-2xl rounded-xl p-4 text-white">

        {/* Arrow */}
        <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-900 rotate-45 border-l border-t border-blue-500/30"></div>

        {/* Text */}
        <p className="text-sm mb-3 text-gray-200">
          {steps[stepIndex].text.hi}
        </p>

        {/* Progress */}
        <div className="w-full h-1 bg-gray-700 rounded mb-3">
          <div
            className="h-full bg-blue-500"
            style={{
              width: `${((stepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Step {stepIndex + 1} / {steps.length}
          </span>

          <button
            onClick={nextStep}
            className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}