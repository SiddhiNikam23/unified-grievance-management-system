import React from "react";
import { FiMic } from "react-icons/fi";

export default function Avatar({
  avatarSrc,
  fallbackSrc,
  talking,
  caption,
  listening,
  onAvatarClick,
  onListen,
}) {
  return (
    <div className="nc-assistant-wrap" aria-live="polite">
      {caption && (
        <div className="nc-speech-subtitle visible">
          {caption}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <div 
          className={`nc-avatar-shell ${talking ? "talking" : "idle"}`}
          onClick={onAvatarClick}
        >
          <img
            src={avatarSrc}
            alt="Guide Avatar"
            className="nc-avatar-img"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackSrc;
            }}
          />
        </div>
        
        <button 
          className={`nc-mic-btn ${listening ? "listening" : ""}`}
          onClick={(e) => { e.stopPropagation(); onListen(); }}
          title={listening ? "Listening..." : "Voice Command"}
        >
          <FiMic />
        </button>
      </div>
    </div>
  );
}
