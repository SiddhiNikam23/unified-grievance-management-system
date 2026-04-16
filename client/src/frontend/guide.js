export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "mr", name: "मराठी" },
];

const COPY = {
  en: {
    ui: {
      title: "Talk to Me",
      start: "Start",
      stop: "Stop",
      next: "Next",
      prev: "Previous",
      mute: "Mute",
      unmute: "Unmute",
      listen: "Voice Command",
      assistant: "Nagrik Saathi",
      idle: "Hi! I can guide you through the website.",
    },
    steps: [
      { key: "welcome", text: "Welcome to Smart Grievance System", page: "home", selector: '[data-guide="welcome"]' },
      { key: "register", text: "Here you can register a complaint", page: "newGrievanceOrganisation", selector: '[data-guide="register"]' },
      { key: "track", text: "Track your complaint status here", page: "status", selector: '[data-guide="status"]' },
      { key: "predict", text: "View predicted complaints and alerts here", page: "home", selector: '[data-guide="predictions"]' },
      { key: "highrisk", text: "Check high-risk areas and preventive actions", page: "home", selector: '[data-guide="high-risk"]' },
    ],
    commandsHelp: "Try saying: next, previous, open status, open complaint, open chatbot, stop",
  },
  hi: {
    ui: {
      title: "मुझसे बात करें",
      start: "शुरू करें",
      stop: "रोकें",
      next: "अगला",
      prev: "पिछला",
      mute: "म्यूट",
      unmute: "अनम्यूट",
      listen: "आवाज़ कमांड",
      assistant: "नागरिक साथी",
      idle: "नमस्ते! मैं आपको वेबसाइट का मार्गदर्शन कर सकती हूँ।",
    },
    steps: [
      { key: "welcome", text: "स्मार्ट शिकायत प्रणाली में आपका स्वागत है", page: "home", selector: '[data-guide="welcome"]' },
      { key: "register", text: "यहाँ आप शिकायत दर्ज कर सकते हैं", page: "newGrievanceOrganisation", selector: '[data-guide="register"]' },
      { key: "track", text: "यहाँ अपनी शिकायत की स्थिति ट्रैक करें", page: "status", selector: '[data-guide="status"]' },
      { key: "predict", text: "अनुमानित शिकायतें और अलर्ट यहाँ देखें", page: "home", selector: '[data-guide="predictions"]' },
      { key: "highrisk", text: "उच्च जोखिम वाले क्षेत्रों और निवारक कार्यों की जाँच करें", page: "home", selector: '[data-guide="high-risk"]' },
    ],
    commandsHelp: "कहें: अगला, पिछला, स्टेटस खोलो, शिकायत खोलो, चैटबॉट खोलो, रोकें",
  },
  mr: {
    ui: {
      title: "माझ्याशी बोला",
      start: "सुरू करा",
      stop: "थांबा",
      next: "पुढे",
      prev: "मागे",
      mute: "म्यूट",
      unmute: "अनम्यूट",
      listen: "व्हॉइस कमांड",
      assistant: "नागरिक साथी",
      idle: "नमस्कार! मी तुम्हाला वेबसाइट वापरायला मदत करू शकते.",
    },
    steps: [
      { key: "welcome", text: "स्मार्ट तक्रार व्यवस्थापन प्रणालीमध्ये आपले स्वागत आहे", page: "home", selector: '[data-guide="welcome"]' },
      { key: "register", text: "इथे तुम्ही तक्रार नोंदवू शकता", page: "newGrievanceOrganisation", selector: '[data-guide="register"]' },
      { key: "track", text: "इथे तक्रारीची स्थिती पाहा", page: "status", selector: '[data-guide="status"]' },
      { key: "predict", text: "अपेक्षित तक्रारी आणि अलर्ट इथे पाहा", page: "home", selector: '[data-guide="predictions"]' },
      { key: "highrisk", text: "उच्च धोक्याचे क्षेत्र आणि प्रतिबंधात्मक उपाय तपासा", page: "home", selector: '[data-guide="high-risk"]' },
    ],
    commandsHelp: "म्हणा: पुढे, मागे, स्टेटस उघडा, तक्रार उघडा, चॅटबॉट उघडा, थांबा",
  },
};

export function getCopy(language) {
  return COPY[language] || COPY.en;
}

export function detectCommand(text = "") {
  const q = text.trim().toLowerCase();
  if (!q) return null;

  if (["next", "agla", "अगला", "पुढे"].some((w) => q.includes(w))) return "next";
  if (["previous", "back", "pichla", "पिछला", "mage", "मागे"].some((w) => q.includes(w))) return "prev";
  if (["stop", "रोक", "थांब"].some((w) => q.includes(w))) return "stop";
  if (["start", "शुरू", "सुरू"].some((w) => q.includes(w))) return "start";
  if (["status", "स्थिति", "स्थिती"].some((w) => q.includes(w))) return "open-status";
  if (["complaint", "grievance", "शिकायत", "तक्रार", "register"].some((w) => q.includes(w))) return "open-register";
  if (["chatbot", "chat bot", "सहायता", "help", "मदत"].some((w) => q.includes(w))) return "open-chatbot";
  if (["home", "dashboard", "मुख्य", "डॅशबोर्ड"].some((w) => q.includes(w))) return "open-home";

  return null;
}
