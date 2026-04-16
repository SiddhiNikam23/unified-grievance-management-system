import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AvatarUI from "./avatar.jsx";
import { LANGUAGE_OPTIONS, getLocaleCopy, getTourSteps } from "./guide";
import { cancelSpeech, speakText, warmupVoices } from "./speech";
import "./styles.css";

const AVATAR_PRIMARY = "/images/assistant-lady.png";
const AVATAR_FALLBACK = "/assets/avatar-fallback.svg";

function typeText(text, setTyped, speed = 24, done) {
  let index = 0;
  setTyped("");
  const timer = setInterval(() => {
    index += 1;
    setTyped(text.slice(0, index));
    if (index >= text.length) {
      clearInterval(timer);
      if (done) done();
    }
  }, speed);
  return () => clearInterval(timer);
}

export default function AssistantGuide() {
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState("en");
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const [caption, setCaption] = useState("");

  const cleanupTypingRef = useRef(null);
  const previousHighlightedRef = useRef(null);
  const lastSpokenRef = useRef("");

  const copy = useMemo(() => getLocaleCopy(language), [language]);
  const steps = useMemo(() => getTourSteps(language), [language]);

  const clearHighlight = () => {
    if (previousHighlightedRef.current) {
      previousHighlightedRef.current.classList.remove("sgs-highlight");
      previousHighlightedRef.current = null;
    }
  };

  const applyHighlight = (selector) => {
    clearHighlight();
    const node = document.querySelector(selector);
    if (!node) return null;
    node.classList.add("sgs-highlight");
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    previousHighlightedRef.current = node;
    return node;
  };

  const stopTour = () => {
    setRunning(false);
    setSpeaking(false);
    setActiveStepIndex(-1);
    lastSpokenRef.current = "";
    cancelSpeech();
    clearHighlight();
    if (cleanupTypingRef.current) cleanupTypingRef.current();
    setCaption("");
  };

  useEffect(() => {
    warmupVoices();
    const onVoicesChanged = () => warmupVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      stopTour();
    };
  }, []);

  useEffect(() => {
    if (!running || activeStepIndex < 0 || activeStepIndex >= steps.length) return;

    const step = steps[activeStepIndex];
    if (!step) return;

    if (location.pathname !== step.route) {
      navigate(step.route);
      return;
    }

    const typingCleanup = typeText(step.text, setCaption);
    cleanupTypingRef.current = typingCleanup;

    const key = `${step.id}:${language}:${location.pathname}`;
    const runSpeech = () => {
      applyHighlight(step.selector);
      if (lastSpokenRef.current === key) return;
      lastSpokenRef.current = key;

      speakText({
        text: step.text,
        language,
        muted,
        onStart: () => {
          setSpeaking(true);
          setBubbleOpen(true);
        },
        onEnd: () => {
          setSpeaking(false);
          setBubbleOpen(true);
        },
      });
    };

    const timer = setTimeout(runSpeech, 250);

    return () => {
      clearTimeout(timer);
      if (typingCleanup) typingCleanup();
    };
  }, [running, activeStepIndex, location.pathname, steps, language, muted, navigate]);

  const startTour = () => {
    setBubbleOpen(true);
    setRunning(true);
    setActiveStepIndex(0);
    lastSpokenRef.current = "";
  };

  const nextStep = () => {
    if (!running) return;
    setActiveStepIndex((prev) => {
      const next = Math.min(prev + 1, steps.length - 1);
      if (next === prev) {
        setRunning(false);
      }
      return next;
    });
    lastSpokenRef.current = "";
  };

  const previousStep = () => {
    if (!running) return;
    setActiveStepIndex((prev) => Math.max(prev - 1, 0));
    lastSpokenRef.current = "";
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (next) {
        cancelSpeech();
        setSpeaking(false);
      } else {
        lastSpokenRef.current = "";
      }
      return next;
    });
  };

  const onLanguageChange = (value) => {
    setLanguage(value);
    lastSpokenRef.current = "";
    setBubbleOpen(true);
  };

  return (
    <AvatarUI
      avatarSrc={AVATAR_PRIMARY}
      fallbackSrc={AVATAR_FALLBACK}
      isSpeaking={speaking}
      bubbleOpen={bubbleOpen}
      caption={caption || copy.steps.welcome}
      controls={copy.controls}
      language={language}
      languages={LANGUAGE_OPTIONS}
      onLanguageChange={onLanguageChange}
      onStart={startTour}
      onStop={stopTour}
      onPrev={previousStep}
      onNext={nextStep}
      onMuteToggle={toggleMute}
      muted={muted}
      running={running}
      stepIndex={Math.max(activeStepIndex, 0)}
      totalSteps={steps.length}
    />
  );
}
