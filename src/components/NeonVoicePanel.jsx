import React from "react";

export default function NeonVoicePanel({ value, onChange, onMicToggle }) {
  return (
    <div className="neon-voice-dock">
      <div className="neon-search-container">
        <div className="particle-container">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>

        <div className="glow-container">
          <div className="glow-effect-left" />
          <div className="glow-effect-right" />
          <div className="search-bar">
            <div className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Mów albo pisz..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <button className="filter-container" onClick={onMicToggle}>
              <div className="filter-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


