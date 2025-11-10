import React from 'react'
import './VoiceTextPanel.css'

export default function VoiceTextPanel() {
  return (
    <div className="voice-panel-container">
      <div className="voice-panel">
        <input 
          type="text" 
          className="voice-input" 
          placeholder="Mów tutaj..." 
          readOnly
        />
        <div className="cursor" />
      </div>
    </div>
  )
}