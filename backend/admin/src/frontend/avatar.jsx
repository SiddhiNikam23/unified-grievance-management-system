import React from "react";

export default function AvatarUI({
  avatarSrc,
  fallbackSrc,
  isSpeaking,
  bubbleOpen,
  caption,
  controls,
  language,
  languages,
  onLanguageChange,
  onStart,
  onStop,
  onPrev,
  onNext,
  onMuteToggle,
  muted,
  running,
  stepIndex,
  totalSteps,
}) {
  return (
    <div className="sgs-assistant" aria-live="polite">
      <div className={`sgs-avatar-wrap ${isSpeaking ? "speaking" : "idle"}`}>
        <img
          src={avatarSrc}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackSrc;
          }}
          alt="AI Guide Avatar"
          className="sgs-avatar"
        />
      </div>

      <div className={`sgs-bubble ${bubbleOpen ? "open" : ""}`}>
        <div className="sgs-bubble-header">
          <div>
            <p className="sgs-assistant-name">{controls.assistantName}</p>
            <p className="sgs-assistant-subtitle">{controls.tourLabel}</p>
          </div>
          <select
            className="sgs-language"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {languages.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sgs-caption">{caption}</div>

        <div className="sgs-controls">
          {!running ? (
            <button className="sgs-btn primary" onClick={onStart}>{controls.start}</button>
          ) : (
            <button className="sgs-btn danger" onClick={onStop}>{controls.stop}</button>
          )}
          <button className="sgs-btn" onClick={onPrev} disabled={!running}>{controls.prev}</button>
          <button className="sgs-btn" onClick={onNext} disabled={!running}>{controls.next}</button>
          <button className="sgs-btn" onClick={onMuteToggle}>
            {muted ? controls.unmute : controls.mute}
          </button>
        </div>

        <div className="sgs-step-indicator">
          {running ? `Step ${stepIndex + 1} / ${totalSteps}` : "Ready"}
        </div>
      </div>
    </div>
  );
}
