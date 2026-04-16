const VOICE_LOCALE = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

function getSpeechSynthesisSafe() {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return null;
  }
  return window.speechSynthesis;
}

export function cancelSpeech() {
  const synth = getSpeechSynthesisSafe();
  if (!synth) return;
  synth.cancel();
}

export function getVoiceLocale(language) {
  return VOICE_LOCALE[language] || VOICE_LOCALE.en;
}

export function getAvailableVoices() {
  const synth = getSpeechSynthesisSafe();
  if (!synth) return [];
  return synth.getVoices();
}

function pickBestVoice(language) {
  const locale = getVoiceLocale(language);
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  const exact = voices.find((voice) => voice.lang?.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;

  const prefix = locale.split("-")[0].toLowerCase();
  const sameLanguage = voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix));
  if (sameLanguage) return sameLanguage;

  return voices[0] || null;
}

export function speakText({ text, language = "en", muted = false, onStart, onEnd, onError }) {
  const synth = getSpeechSynthesisSafe();
  if (!synth || muted || !text) {
    if (onEnd) onEnd();
    return;
  }

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickBestVoice(language);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = getVoiceLocale(language);
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    if (onError) onError(event);
    if (onEnd) onEnd();
  };

  synth.speak(utterance);
}

export function warmupVoices() {
  const synth = getSpeechSynthesisSafe();
  if (!synth) return;
  synth.getVoices();
}
