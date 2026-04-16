import React, { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "./avatar.jsx";
import { detectCommand, getCopy, LANGUAGES } from "./guide";
import { createRecognition, speak, stopSpeaking, supportsRecognition, warmupVoices } from "./speech";
import { useLanguage } from "../context/LanguageContext";
import "./styles.css";

const AVATAR_PRIMARY = "/images/assistant-lady.png";
const AVATAR_FALLBACK = "/images/avatar-fallback.svg";

function typeText(text, setText, speed = 22) {
  let i = 0;
  setText("");
  const timer = setInterval(() => {
    i += 1;
    setText(text.slice(0, i));
    if (i >= text.length) {
      clearInterval(timer);
    }
  }, speed);
  return () => clearInterval(timer);
}

export default function TalkGuide({ activePage, setActivePage }) {
  const { language } = useLanguage();
  const [running, setRunning] = useState(false);
  const [talking, setTalking] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [caption, setCaption] = useState("");
  const [listening, setListening] = useState(false);

  const cleanupTypingRef = useRef(null);
  const highlightedNodeRef = useRef(null);
  const recognitionRef = useRef(null);
  
  const stepIndexRef = useRef(-1);
  const runningRef = useRef(false);

  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);
  useEffect(() => { runningRef.current = running; }, [running]);

  const copy = useMemo(() => getCopy(language), [language]);
  const steps = useMemo(() => copy.steps, [copy]);

  const clearHighlight = () => {
    if (highlightedNodeRef.current) {
      highlightedNodeRef.current.classList.remove("nc-guide-highlight");
      highlightedNodeRef.current = null;
    }
  };

  const highlight = (selector) => {
    clearHighlight();
    const node = document.querySelector(selector);
    if (!node) return;
    node.classList.add("nc-guide-highlight");
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    highlightedNodeRef.current = node;
  };

  const goToStep = (index) => {
    const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[safeIndex];
    if (!step) return;

    setStepIndex(safeIndex);
    if (setActivePage) setActivePage(step.page);

    if (cleanupTypingRef.current) cleanupTypingRef.current();
    cleanupTypingRef.current = typeText(step.text, setCaption);

    setTimeout(() => highlight(step.selector), 260);

    speak({
      text: step.text,
      language,
      muted: false,
      onStart: () => {
        setTalking(true);
      },
      onEnd: () => {
        setTalking(false);
        if (runningRef.current) {
          if (stepIndexRef.current < steps.length - 1) {
            setTimeout(() => {
              if (runningRef.current) goToStep(stepIndexRef.current + 1);
            }, 1000);
          } else {
            setRunning(false);
            setStepIndex(-1);
            setCaption("");
            handleListen();
          }
        }
      },
    });
  };

  const startTour = () => {
    setRunning(true);
    goToStep(0);
  };

  const stopTour = () => {
    setRunning(false);
    setTalking(false);
    setStepIndex(-1);
    stopSpeaking();
    clearHighlight();
    if (cleanupTypingRef.current) cleanupTypingRef.current();
    setCaption("");
  };

  const executeCommand = (command) => {
    if (!command) return;
    if (command === "start") return startTour();
    if (command === "stop") return stopTour();
    if (command === "next" && runningRef.current) return goToStep(stepIndexRef.current + 1);
    if (command === "prev" && runningRef.current) return goToStep(stepIndexRef.current - 1);
    if (command === "open-status") return setActivePage && setActivePage("status");
    if (command === "open-register") return setActivePage && setActivePage("newGrievanceOrganisation");
    if (command === "open-chatbot") return setActivePage && setActivePage("chatbot");
    if (command === "open-home") return setActivePage && setActivePage("home");
  };

  const handleListen = () => {
    if (!supportsRecognition()) {
      setCaption("Voice recognition is not supported in this browser.");
      setTimeout(() => setCaption(""), 3000);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      return;
    }

    const recognition = createRecognition({
      language,
      onStart: () => {
        setListening(true);
        setCaption("Listening...");
      },
      onEnd: () => {
        setListening(false);
        recognitionRef.current = null;
        setTimeout(() => setCaption(""), 2000);
      },
      onError: () => {
        setListening(false);
        recognitionRef.current = null;
        setCaption("Couldn't hear you clearly.");
        setTimeout(() => setCaption(""), 2000);
      },
      onResult: (text) => {
        setCaption(`You said: ${text}`);
        const command = detectCommand(text);
        if (command) executeCommand(command);
      },
    });

    if (!recognition) return;
    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    warmupVoices();
  }, [language]);

  useEffect(() => {
    if (!running) return;
    const step = steps[stepIndex];
    if (!step) return;
    if (activePage !== step.page) return;
    highlight(step.selector);
  }, [activePage, stepIndex, running, steps]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (runningRef.current && e.target.closest(".nc-assistant-wrap") === null) {
        stopTour();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      stopSpeaking();
      clearHighlight();
      if (cleanupTypingRef.current) cleanupTypingRef.current();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (running) {
      stopTour();
    } else {
      startTour();
    }
  };

  return (
    <Avatar
      avatarSrc={AVATAR_PRIMARY}
      fallbackSrc={AVATAR_FALLBACK}
      talking={talking}
      caption={caption}
      listening={listening}
      onAvatarClick={handleAvatarClick}
      onListen={handleListen}
    />
  );
}
