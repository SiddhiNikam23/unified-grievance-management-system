import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mic, MicOff, Globe } from "lucide-react";
import DOMPurify from "dompurify";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../translations/translations";
const Chatbot = ({ setActivePage }) => {
  const navigate = useNavigate();
  const { language: contextLanguage } = useLanguage();
  const t = (key) => getTranslation(contextLanguage, key);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState("en");
  const [autofillData, setAutofillData] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "mr", name: "मराठी", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "te", name: "తెలుగు", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
    { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
    { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" }
  ];
  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return null;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const speechLangMap = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      bn: "bn-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      pa: "pa-IN"
    };
    recognition.lang = speechLangMap[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
  };
  const handleVoiceInput = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    const recognition = initializeSpeechRecognition();
    if (!recognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    recognitionRef.current = recognition;
    recognition.onstart = () => {
      setIsRecording(true);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(prev => prev + " " + transcript);
      setIsRecording(false);
    };
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        alert("❌ Microphone permission denied.\n\n1. Click the lock icon (🔒) in address bar\n2. Set Microphone to 'Allow'\n3. Refresh page and try again");
      } else if (event.error === 'audio-capture') {
        alert("❌ Cannot access microphone.\n\nWindows Settings:\n1. Press Windows + I\n2. Go to Privacy → Microphone\n3. Turn ON 'Allow apps to access microphone'\n4. Turn ON 'Allow desktop apps to access microphone'\n5. Restart browser and try again\n\nOR use text input instead.");
      } else if (event.error === 'no-speech') {
        alert("No speech detected. Please speak clearly and try again.");
      } else {
        alert(`Speech error: ${event.error}\n\nTry:\n- Check microphone is connected\n- Use Chrome or Edge browser\n- Or use text input instead`);
      }
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    try {
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsRecording(false);
      alert("Could not start voice input. Please check microphone permissions.");
    }
  };
  async function fetchGrievanceResponse() {
    if (!question.trim()) {
      alert("Please enter a question or use voice input.");
      return;
    }
    setAnswer("");
    setAutofillData(null);
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/grievance/ai-assistant", {
        question: question,
        language: language
      });
      setAnswer(formatResponse(response.data.answer));
      setAutofillData(response.data.autofillData);
    } catch (error) {
      console.error(error);
      setAnswer(getFallbackResponse(question, language));
      setAutofillData(null);
    } finally {
      setLoading(false);
    }
  }
  const handleFileComplaint = () => {
    if (autofillData) {
      localStorage.setItem('grievanceAutofill', JSON.stringify(autofillData));
    }
    if (setActivePage) {
      setActivePage('grievanceForm');
    } else {
      navigate('/homepage', { state: { page: 'grievanceForm' } });
    }
  };
  const formatResponse = (text) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/(\d+\.)/g, '<br>$1');
    return DOMPurify.sanitize(formatted);
  };
  const getFallbackResponse = (query, lang) => {
    const fallbacks = {
      en: `<strong>Government Grievance Assistance</strong><br><br>
        I'm here to help you with government grievances. Here are common departments:<br><br>
        <strong>1. Electricity Issues:</strong> Contact your State Electricity Board<br>
        <strong>2. Water Supply:</strong> Municipal Corporation Water Department<br>
        <strong>3. Road Repairs:</strong> Public Works Department (PWD)<br>
        <strong>4. Passport/Visa:</strong> Visit <a href="https://www.passportindia.gov.in" target="_blank">passportindia.gov.in</a><br>
        <strong>5. Income Tax:</strong> Contact CBDT or visit <a href="https://www.incometax.gov.in" target="_blank">incometax.gov.in</a><br><br>
        <strong>Helpline:</strong> 1800-111-555 (Toll-free)`,
      hi: `<strong>सरकारी शिकायत सहायता</strong><br><br>
        मैं आपकी सरकारी शिकायतों में मदद के लिए यहाँ हूँ। यहाँ सामान्य विभाग हैं:<br><br>
        <strong>1. बिजली की समस्याएं:</strong> अपने राज्य बिजली बोर्ड से संपर्क करें<br>
        <strong>2. पानी की आपूर्ति:</strong> नगर निगम जल विभाग<br>
        <strong>3. सड़क मरम्मत:</strong> लोक निर्माण विभाग (PWD)<br>
        <strong>4. पासपोर्ट/वीजा:</strong> <a href="https://www.passportindia.gov.in" target="_blank">passportindia.gov.in</a> पर जाएं<br>
        <strong>5. आयकर:</strong> CBDT से संपर्क करें या <a href="https://www.incometax.gov.in" target="_blank">incometax.gov.in</a> पर जाएं<br><br>
        <strong>हेल्पलाइन:</strong> 1800-111-555 (टोल-फ्री)`,
      mr: `<strong>सरकारी तक्रार सहाय्य</strong><br><br>
        मी तुमच्या सरकारी तक्रारींमध्ये मदत करण्यासाठी येथे आहे. येथे सामान्य विभाग आहेत:<br><br>
        <strong>1. वीज समस्या:</strong> तुमच्या राज्य वीज मंडळाशी संपर्क साधा<br>
        <strong>2. पाणी पुरवठा:</strong> महानगरपालिका पाणी विभाग<br>
        <strong>3. रस्ते दुरुस्ती:</strong> सार्वजनिक बांधकाम विभाग (PWD)<br>
        <strong>4. पासपोर्ट/व्हिसा:</strong> <a href="https://www.passportindia.gov.in" target="_blank">passportindia.gov.in</a> ला भेट द्या<br><br>
        <strong>हेल्पलाइन:</strong> 1800-111-555 (टोल-फ्री)`
    };
    return fallbacks[lang] || fallbacks.en;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">
            {t("govGrievanceChatbot")}
          </h1>
          <p className="text-center text-blue-100">{t("getHelpWithComplaints")}</p>
        </div>
        {}
        <div className="p-4 bg-gray-50 border-b flex items-center gap-3">
          <Globe className="text-blue-600" size={20} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
        {}
        <div className="p-6 space-y-6">
          {}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              {t("askYourQuestion")}
            </label>
            <div className="flex gap-2">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("typeQuestionHere")}
                className="flex-1 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
              />
              <button
                onClick={handleVoiceInput}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white font-semibold shadow-lg`}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>
            {isRecording && (
              <p className="text-sm text-red-600 animate-pulse">
                🎤 Listening... Speak now
              </p>
            )}
          </div>
          {}
          <button
            onClick={fetchGrievanceResponse}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            }`}
          >
            {loading ? t("processing") : t("getAssistance")}
          </button>
          {}
          {answer && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-green-800 mb-3">
                  ✅ {t("response")}
                </h3>
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: answer }}
                />
              </div>
              {}
              <button
                type="button"
                onClick={handleFileComplaint}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">📝</span>
                <span>{t("clickToFileComplaint")}</span>
                <span className="text-2xl">→</span>
              </button>
              {autofillData && (
                <p className="text-sm text-center text-green-600 font-semibold">
                  ✨ {t("formAutoFilled")}
                </p>
              )}
            </div>
          )}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {}
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-600 border-t">
          <p>💡 {t("voiceInputTip")}</p>
        </div>
      </div>
    </div>
  );
};
export default Chatbot;
