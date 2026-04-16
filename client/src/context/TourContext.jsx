import React, { createContext, useContext, useState } from "react";

const TourContext = createContext();

export const TOUR_STEPS = [
  // --- Landing Page ---
  {
    id: "tour-hero",
    page: "/",
    textEn: "Namaste! Welcome to NagrikConnect AI. I'm here to help you get started with our platform.",
    textHi: "नमस्ते! NagrikConnect AI में आपका स्वागत है। मैं यहाँ आपको हमारे प्लेटफार्म के साथ शुरुआत करने में मदद करने के लिए हूँ।",
    duration: 5000
  },
  {
    id: "tour-features",
    page: "/",
    textEn: "We use advanced AI to categorize and solve your grievances faster than ever.",
    textHi: "हम आपकी समस्याओं को पहले से कहीं अधिक तेज़ी से हल करने के लिए उन्नत AI का उपयोग करते हैं।",
    duration: 4000
  },
  {
    id: "tour-services",
    page: "/",
    textEn: "Explore all our digital citizen services available at your fingertips.",
    textHi: "अपनी उंगलियों पर उपलब्ध हमारी सभी डिजिटल नागरिक सेवाओं का अन्वेषण करें।",
    duration: 4000
  },
  {
    id: "login-btn",
    page: "/",
    textEn: "Please Log In to start filing your grievances and tracking their status.",
    textHi: "अपनी शिकायतें दर्ज करने और उनकी स्थिति को ट्रैक करने के लिए कृपया लॉग इन करें।",
    duration: 5000
  },

  // --- Dashboard ---
  {
    id: "dashboard-welcome",
    page: "/homepage",
    textEn: "Welcome to your Citizen Workspace! Let me show you around your new dashboard.",
    textHi: "आपके नागरिक कार्यक्षेत्र में आपका स्वागत है! आइए मैं आपको आपके नए डैशबोर्ड की जानकारी देती हूँ।",
    duration: 5000
  },
  {
    id: "sidebar-home",
    page: "/homepage",
    textEn: "This is your main Dashboard view, giving you a summary of all your activities.",
    textHi: "यह आपका मुख्य डैशबोर्ड व्यू है, जो आपकी सभी गतिविधियों का सारांश देता है।",
    duration: 4500
  },
  {
    id: "sidebar-newGrievanceOrganisation",
    page: "/homepage",
    textEn: "Click here to lodge a new grievance.",
    textHi: "नई शिकायत दर्ज करने के लिए यहाँ क्लिक करें।",
    duration: 5000
  },
  {
    id: "sidebar-status",
    page: "/homepage",
    textEn: "Track your complaints here.",
    textHi: "अपनी शिकायतों की स्थिति यहाँ देखें।",
    duration: 4500
  },
  {
    id: "sidebar-chatbot",
    page: "/homepage",
    textEn: "AI Chatbot is available 24/7.",
    textHi: "AI चैटबॉट 24/7 उपलब्ध है।",
    duration: 5000
  },
  {
    id: "grievance-table",
    page: "/homepage",
    textEn: "Your activity is listed here.",
    textHi: "आपकी गतिविधियाँ यहाँ दिखाई देती हैं।",
    duration: 5000
  },
  {
    id: "dashboard-stats",
    page: "/homepage",
    textEn: "Monitor all stats here.",
    textHi: "सभी आँकड़े यहाँ देखें।",
    duration: 5000
  }
];

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ✅ NEW STATES
  const [language, setLanguage] = useState("en");
  const [tourPhase, setTourPhase] = useState("landing"); // landing | auth | dashboard
  const [isPausedForAuth, setIsPausedForAuth] = useState(false);

  const startTour = (lang = "en") => {
    setLanguage(lang);
    setIsTourActive(true);
    setCurrentStep(0);
    setTourPhase("landing");
  };

  const pauseForAuth = () => {
    setIsPausedForAuth(true);
    setIsTourActive(false);
    setTourPhase("auth");
  };

  const resumeAfterLogin = () => {
    setIsPausedForAuth(false);
    setIsTourActive(true);
    setTourPhase("dashboard");
    setCurrentStep(4); // resume from dashboard step
  };

  const endTour = () => {
    setIsTourActive(false);
    setCurrentStep(-1);
    setIsSpeaking(false);
    localStorage.setItem("nagrik_tour_completed", "true");
  };

  const nextStep = () => {
    // 🔥 KEY FIX: Stop at login step
    if (currentStep === 3) {
      pauseForAuth();
      return;
    }

    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTour();
    }
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        isSpeaking,
        setIsSpeaking,
        startTour,
        endTour,
        nextStep,
        setCurrentStep,

        // ✅ NEW
        language,
        setLanguage,
        tourPhase,
        isPausedForAuth,
        pauseForAuth,
        resumeAfterLogin,

        TOUR_STEPS
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);