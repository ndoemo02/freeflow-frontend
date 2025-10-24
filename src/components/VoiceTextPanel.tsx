import React, { useState } from "react";
import "./VoiceTextPanel.css";

export default function VoiceTextPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <div className={`voice-panel-container ${isOpen ? "open" : ""}`}>
      <div className="toggle-handle" onClick={togglePanel}>
        ✎
      </div>

      <div className="voice-panel">
        <input
          type="text"
          placeholder="Wpisz wiadomość..."
          className="voice-input"
        />
        <span className="cursor"></span>
      </div>
    </div>
  );
}
