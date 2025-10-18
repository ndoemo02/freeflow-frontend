import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import amberVideo from "../assets/amber_avatar.mp4";

export default function AmberAvatar() {
  const [isHovered, setIsHovered] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load debug data
  useEffect(() => {
    if (!showDebug) return;
    
    const load = async () => {
      try {
        const res = await fetch("/api/debug/session");
        if (res.ok) {
          const sessionData = await res.json();
          setDebugData(sessionData);
        }
      } catch (error) {
        console.warn("Failed to load session data:", error);
      }
    };

    load();
    const timer = setInterval(load, 1000);
    return () => clearInterval(timer);
  }, [showDebug]);

  const logToServer = async () => {
    if (!debugData) return;
    
    setLoading(true);
    try {
      await fetch("/api/debug/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...debugData,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
      console.log("✅ Session logged to server");
    } catch (error) {
      console.error("❌ Failed to log session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-30 group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-500/30 blur-xl"
        animate={{
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 0.8 : 0.4,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Video container */}
      <motion.div
        className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-orange-500/50 shadow-lg cursor-pointer"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDebug(!showDebug)}
      >
        <video
          src={amberVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Debug indicator */}
        {showDebug && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </motion.div>

      {/* Tooltip */}
      <motion.div
        className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        {showDebug ? "Kliknij aby ukryć debug" : "Kliknij aby pokazać debug"} 🎤
      </motion.div>

      {/* Debug Panel - nad polem transkrypcji */}
      {showDebug && (
        <motion.div
          className="absolute left-2 bottom-24 bg-black/60 text-white p-3 rounded-lg text-xs shadow-lg backdrop-blur-sm border border-white/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowDebug(false)}
            className="absolute top-1 right-1 text-gray-300 hover:text-white text-lg"
            title="Zamknij"
          >
            ×
          </button>
          
          <div className="space-y-1 pr-6">
            <p><span className="text-blue-300">🧠</span> Intent: <span className="font-mono">{debugData?.intent || "none"}</span></p>
            <p><span className="text-green-300">🍽️</span> Restaurant: <span className="font-mono">{debugData?.restaurant || "brak"}</span></p>
            <p><span className="text-purple-300">🧩</span> Session: <span className="font-mono">{debugData?.sessionId || "brak"}</span></p>
            <p><span className="text-yellow-300">💬</span> Confidence: <span className="font-mono">{debugData?.confidence || "0.00"}</span></p>
          </div>
          
          <button
            onClick={logToServer}
            disabled={loading}
            className="mt-2 px-2 py-1 text-[10px] bg-white/20 rounded hover:bg-white/30 disabled:opacity-50 transition-colors"
          >
            {loading ? "⏳" : "📋"} Log to Server
          </button>
          
          <div className="mt-1 text-[10px] text-gray-300">
            Auto-refresh: 1s
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

