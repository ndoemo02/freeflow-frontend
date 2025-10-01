export default function Settings() {
  return (
    <div className="ff-page" style={{ padding:'24px 16px', maxWidth:860, margin:'92px auto 48px' }}>
      <h1 className="ff-page__title">Ustawienia</h1>
      <div style={{ display:'grid', gap: 12, marginTop: 16 }}>
        <label htmlFor="settings-lang"> Język</label>
          <select id="settings-lang" name="language" className="ff-input">
            <option>Polski</option>
            <option>English</option>
          </select>
        <label htmlFor="settings-theme"> Motyw</label>
          <select id="settings-theme" name="theme" className="ff-input">
            <option>Dark</option>
            <option>Light</option>
          </select>
        <label htmlFor="settings-engine"> TTS / ASR (tryb)</label>
          <select id="settings-engine" name="engine" className="ff-input">
            <option>Gemini (domyślnie)</option>
            <option>OpenAI</option>
          </select>
        <button className="ff-btn ff-btn--primary" type="button">Zapisz</button>
      </div>
    </div>
  )
}


