export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिंदी" },
  { value: "mr", label: "मराठी" },
];

const COPY = {
  en: {
    controls: {
      start: "Talk to Me",
      stop: "Stop",
      next: "Next",
      prev: "Previous",
      mute: "Mute",
      unmute: "Unmute",
      assistantName: "Nagrik Saathi",
      tourLabel: "Guided Assistant",
    },
    steps: {
      welcome: "Welcome to Smart Grievance System.",
      register: "Here you can register a complaint.",
      track: "Track your complaint status here.",
      predict: "View predicted complaints and alerts here.",
      risk: "Check high-risk areas and preventive actions here.",
    },
  },
  hi: {
    controls: {
      start: "मुझसे बात करें",
      stop: "रोकें",
      next: "अगला",
      prev: "पिछला",
      mute: "म्यूट",
      unmute: "अनम्यूट",
      assistantName: "नागरिक साथी",
      tourLabel: "मार्गदर्शक सहायक",
    },
    steps: {
      welcome: "स्मार्ट शिकायत प्रणाली में आपका स्वागत है।",
      register: "यहां आप शिकायत दर्ज कर सकते हैं।",
      track: "यहां अपनी शिकायत की स्थिति ट्रैक करें।",
      predict: "यहां संभावित शिकायतें और अलर्ट देखें।",
      risk: "यहां उच्च जोखिम क्षेत्र और रोकथाम के उपाय देखें।",
    },
  },
  mr: {
    controls: {
      start: "माझ्याशी बोला",
      stop: "थांबा",
      next: "पुढे",
      prev: "मागे",
      mute: "म्यूट",
      unmute: "अनम्यूट",
      assistantName: "नागरिक साथी",
      tourLabel: "मार्गदर्शक सहाय्यक",
    },
    steps: {
      welcome: "स्मार्ट तक्रार व्यवस्थापन प्रणालीमध्ये आपले स्वागत आहे.",
      register: "येथे तुम्ही तक्रार नोंदवू शकता.",
      track: "येथे तुमच्या तक्रारीची स्थिती पाहू शकता.",
      predict: "येथे अंदाजित तक्रारी आणि अलर्ट पहा.",
      risk: "येथे उच्च जोखीम क्षेत्रे आणि प्रतिबंधात्मक कृती पहा.",
    },
  },
};

export function getLocaleCopy(language) {
  return COPY[language] || COPY.en;
}

export function getTourSteps(language) {
  const t = getLocaleCopy(language).steps;
  return [
    {
      id: "welcome",
      route: "/clients",
      selector: '[data-guide="welcome"]',
      text: t.welcome,
    },
    {
      id: "register",
      route: "/clients",
      selector: '[data-guide="register-complaint"]',
      text: t.register,
    },
    {
      id: "track",
      route: "/clients",
      selector: '[data-guide="track-status"]',
      text: t.track,
    },
    {
      id: "predict",
      route: "/future-prediction",
      selector: '[data-guide="prediction-panel"]',
      text: t.predict,
    },
    {
      id: "risk",
      route: "/future-prediction",
      selector: '[data-guide="risk-map"]',
      text: t.risk,
    },
  ];
}
