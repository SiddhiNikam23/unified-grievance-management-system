import { useEffect, useState, useRef } from "react";

const landingSteps = [
  {
    element: "#hero-section",
    text: {
      en: "Welcome to Nagrik ConnectAI, a smart platform to raise and track complaints easily.",
      hi: "नागरिक ConnectAI में आपका स्वागत है।",
      mr: "नागरिक ConnectAI मध्ये तुमचे स्वागत आहे.",
    },
  },
  {
    element: "#features",
    text: {
      en: "These are the key features that make the system efficient and user friendly.",
      hi: "ये मुख्य फीचर्स हैं जो सिस्टम को आसान और प्रभावी बनाते हैं।",
      mr: "ही वैशिष्ट्ये प्रणालीला सोपी आणि प्रभावी बनवतात.",
    },
  },
  {
    element: "#services",
    text: {
      en: "Here you can explore different services offered by the platform.",
      hi: "यहाँ आप विभिन्न सेवाओं का उपयोग कर सकते हैं।",
      mr: "इथे तुम्ही विविध सेवा पाहू शकता.",
    },
  },
  {
    element: "#login-btn", // ✅ LOGIN STEP ADDED
    text: {
      en: "Click here to login and get started.",
      hi: "यहाँ क्लिक करके लॉगिन करें और शुरू करें।",
      mr: "इथे क्लिक करून लॉगिन करा आणि सुरुवात करा.",
    },
  },
];

export default function Tour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("hi");
  const [isMuted, setIsMuted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [position, setPosition] = useState({ top: 100, left: 100 });

  const utteranceRef = useRef(null);
  const hasSpokenIntro = useRef(false);

  // 🎤 Voice
  const getVoice = (lang) => {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.includes(lang)) || voices[0];
  };

  const speak = (text, lang) => {
    if (isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang =
      lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : "mr-IN";

    utterance.voice = getVoice(utterance.lang);
    utterance.pitch = 1.1;
    utterance.rate = 0.9;

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // 🌟 INTRO (ONLY ONCE)
  useEffect(() => {
    if (!hasSpokenIntro.current) {
      hasSpokenIntro.current = true;

      speak("नमस्कार! Welcome to Nagrik ConnectAI", "hi");

      setTimeout(() => {
        setShowIntro(false);
      }, 3000);
    }
  }, []);

  // 🎯 STEP HANDLER (STABLE)
  useEffect(() => {
    if (showIntro) return;

    const step = landingSteps[currentStep];
    const el = document.querySelector(step.element);

    if (!el) {
      console.log("❌ Element not found:", step.element);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();

      let top = rect.bottom + window.scrollY + 12;
      let left = rect.left + window.scrollX;

      // Prevent overflow
      if (left + 300 > window.innerWidth) {
        left = window.innerWidth - 320;
      }

      if (top + 200 > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - 220;
      }

      setPosition({ top, left });
    };

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    el.classList.add("tour-highlight");

    speak(step.text[selectedLanguage], selectedLanguage);

    setTimeout(() => {
      el.classList.remove("tour-highlight");
    }, 3000);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, selectedLanguage, showIntro]);

  // ▶ NEXT (NO STOP BUG)
  const nextStep = () => {
    if (currentStep < landingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem("tourSeen", "true");
      window.speechSynthesis.cancel();
    }
  };

  // 🎬 INTRO UI
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 text-white">
        <div className="text-7xl mb-6 animate-bounce">🙏</div>

        <div className="flex gap-2 mb-6">
          <div className="w-2 h-10 bg-indigo-400 animate-pulse"></div>
          <div className="w-2 h-16 bg-purple-500 animate-pulse delay-100"></div>
          <div className="w-2 h-10 bg-blue-400 animate-pulse delay-200"></div>
        </div>

        <h1 className="text-2xl font-semibold text-center px-6">
          नमस्कार! Welcome to Nagrik ConnectAI
        </h1>
      </div>
    );
  }

  // 🎯 TOOLTIP UI
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
          {landingSteps[currentStep].text[selectedLanguage]}
        </p>

        {/* Language */}
        <div className="flex gap-2 mb-3">
          {["en", "hi", "mr"].map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-2 py-1 text-xs rounded ${
                selectedLanguage === lang
                  ? "bg-blue-500"
                  : "bg-gray-700"
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <button onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? "🔇" : "🔊"}
          </button>

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