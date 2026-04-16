export const LOCALE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

function getSynth() {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis || null;
}

export function stopSpeaking() {
  const synth = getSynth();
  if (!synth) return;
  synth.cancel();
}

export function warmupVoices() {
  const synth = getSynth();
  if (!synth) return [];
  return synth.getVoices();
}

function getPreferredVoice(language) {
  const voices = warmupVoices();
  const locale = (LOCALE_MAP[language] || LOCALE_MAP.en).toLowerCase();
  const exact = voices.find((voice) => voice.lang?.toLowerCase() === locale);
  if (exact) return exact;

  const prefix = locale.split("-")[0];
  const fallback = voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix));
  if (fallback) return fallback;

  return voices[0] || null;
}

export function speak({ text, language = "en", muted = false, onStart, onEnd }) {
  const synth = getSynth();
  if (!synth || muted || !text) {
    if (onEnd) onEnd();
    return;
  }

  stopSpeaking();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice(language);
  utter.voice = voice;
  utter.lang = voice?.lang || LOCALE_MAP[language] || LOCALE_MAP.en;
  utter.rate = 1;
  utter.pitch = 1;

  utter.onstart = () => onStart && onStart();
  utter.onend = () => onEnd && onEnd();
  utter.onerror = () => onEnd && onEnd();

  synth.speak(utter);
}

export function supportsRecognition() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createRecognition({ language = "en", onResult, onError, onStart, onEnd }) {
  if (!supportsRecognition()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = LOCALE_MAP[language] || LOCALE_MAP.en;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => onStart && onStart();
  recognition.onend = () => onEnd && onEnd();
  recognition.onerror = (event) => onError && onError(event);
  recognition.onresult = (event) => {
    const transcript = event?.results?.[0]?.[0]?.transcript || "";
    onResult && onResult(transcript);
  };

  return recognition;
}
