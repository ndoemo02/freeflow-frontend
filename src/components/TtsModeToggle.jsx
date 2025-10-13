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
      className={`fixed bottom-4 right-4 z-50 rounded-full px-4 py-2 font-medium shadow-md transition-all duration-200 ${
        mode === "classic"
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-red-600 hover:bg-red-700 text-white animate-pulse"
      }`}
      title={`Tryb: ${mode === "classic" ? "Classic HD" : "Live Streaming"}`}
    >
      {mode === "classic" ? "🎧 Classic HD" : "🔴 Live Mode"}
    </button>
  );
}
