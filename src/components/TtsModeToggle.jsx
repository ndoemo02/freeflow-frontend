import { useState } from "react";

export default function TtsModeToggle({ onChange }) {
  const [mode, setMode] = useState("classic");

  const toggleMode = () => {
    const newMode = mode === "classic" ? "live" : "classic";
    setMode(newMode);
    if (onChange) onChange(newMode);
  };

  return (
    <button
      onClick={toggleMode}
      className={`fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 font-semibold text-white transition-all duration-300 shadow-md ${
        mode === "classic"
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(255,0,0,0.6)] breathing"
      }`}
      title={`Tryb: ${mode === "classic" ? "Classic HD" : "Live Streaming"}`}
    >
      {mode === "classic" ? "🎧 Classic HD" : "🔴 Live Mode"}
    </button>
  );
}
