import { useState, useEffect } from "react";

export default function Settings() {
  const [language, setLanguage] = useState("Polski");
  const [theme, setTheme] = useState("Dark");
  const [engine, setEngine] = useState("Gemini (domyślnie)");
  const [selectedVoice, setSelectedVoice] = useState("pl-PL-Standard-A");

  const availableVoices = [
    { id: "pl-PL-Standard-A", name: "Kobieta (Standard)" },
    { id: "pl-PL-Standard-B", name: "Mężczyzna (Standard)" },
    { id: "pl-PL-Wavenet-A", name: "Kobieta (Premium)" },
    { id: "pl-PL-Wavenet-B", name: "Mężczyzna (Premium)" },
    { id: "pl-PL-Neural2-A", name: "Kobieta (Neural)" },
    { id: "pl-PL-Neural2-B", name: "Mężczyzna (Neural)" }
  ];

  // Załaduj ustawienia z localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('freeflow-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setLanguage(settings.language || "Polski");
      setTheme(settings.theme || "Dark");
      setEngine(settings.engine || "Gemini (domyślnie)");
      setSelectedVoice(settings.voice || "pl-PL-Standard-A");
    }
  }, []);

  const handleSave = () => {
    const settings = {
      language,
      theme,
      engine,
      voice: selectedVoice
    };
    
    localStorage.setItem('freeflow-settings', JSON.stringify(settings));
    
    // Wyślij event żeby inne komponenty mogły się zaktualizować
    window.dispatchEvent(new CustomEvent('freeflow-settings-changed', { 
      detail: settings 
    }));
    
    alert('✅ Ustawienia zostały zapisane!');
  };

  return (
    <div className="ff-page" style={{ padding:'24px 16px', maxWidth:860, margin:'92px auto 48px' }}>
      <h1 className="ff-page__title">Ustawienia</h1>
      <div style={{ display:'grid', gap: 12, marginTop: 16 }}>
        
        <label htmlFor="settings-lang">🌐 Język</label>
        <select 
          id="settings-lang" 
          name="language" 
          className="ff-input"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>Polski</option>
          <option>English</option>
        </select>
        
        <label htmlFor="settings-theme">🎨 Motyw</label>
        <select 
          id="settings-theme" 
          name="theme" 
          className="ff-input"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          <option>Dark</option>
          <option>Light</option>
        </select>
        
        <label htmlFor="settings-voice">🎤 Głos asystenta</label>
        <select 
          id="settings-voice" 
          name="voice" 
          className="ff-input"
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
        >
          {availableVoices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name}
            </option>
          ))}
        </select>
        
        <label htmlFor="settings-engine">🤖 TTS / ASR (tryb)</label>
        <select 
          id="settings-engine" 
          name="engine" 
          className="ff-input"
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
        >
          <option>Gemini (domyślnie)</option>
          <option>OpenAI</option>
        </select>
        
        <button 
          className="ff-btn ff-btn--primary" 
          type="button"
          onClick={handleSave}
        >
          💾 Zapisz ustawienia
        </button>
      </div>
    </div>
  )
}


