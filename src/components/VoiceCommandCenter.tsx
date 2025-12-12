import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface VoiceCommandCenterProps {
  amberResponse?: string;
  interimText?: string;
  finalText?: string;
  recording?: boolean;
  visible?: boolean;
  onMicClick?: () => void;
  onSubmitText?: (value: string) => void;
  isSpeaking?: boolean;
  isProcessing?: boolean;
}

export default function VoiceCommandCenter({
  amberResponse = "",
  interimText = "",
  finalText = "",
  recording = false,
  visible = true,
  onMicClick,
  onSubmitText,
  isSpeaking = false,
  isProcessing = false,
}: VoiceCommandCenterProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current state
  const currentState = recording
    ? 'listening'
    : isProcessing
      ? 'processing'
      : isSpeaking
        ? 'speaking'
        : 'idle';

  // Update input placeholder or value based on voice input
  useEffect(() => {
    if (finalText) {
      setInputValue(finalText);
    }
  }, [finalText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onSubmitText?.(inputValue);
      setInputValue("");
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmitText?.(inputValue);
      setInputValue("");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 100, opacity: 0, x: "-50%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 w-[92%] max-w-lg flex items-center gap-2 
                     rounded-full backdrop-blur-xl bg-[#0F0F16]/90 border border-white/10 
                     shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] p-2 z-50 transform-gpu"
        >
          {/* Mic Orb */}
          <div onClick={onMicClick} className="relative w-12 h-12 flex items-center justify-center flex-shrink-0 cursor-pointer group ml-1">
            {/* Orb Body */}
            <motion.div
              animate={currentState}
              variants={orbVariants}
              className="relative w-10 h-10 rounded-full overflow-hidden flex items-center justify-center 
                                     bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 z-10"
            >
              <AnimatePresence mode="wait">
                {currentState === 'idle' && (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}

                {currentState === 'listening' && (
                  <motion.div
                    key="listening"
                    className="flex items-center gap-[2px] h-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height: [4, 16, 4],
                          backgroundColor: ['#fff', '#22d3ee', '#fff']
                        }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                        className="w-1 rounded-full bg-white"
                      />
                    ))}
                  </motion.div>
                )}

                {currentState === 'processing' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Input Area */}
          <div className="flex-1 relative h-10 transition-all duration-300 flex items-center">
            <input
              ref={inputRef}
              value={inputValue || interimText}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentState === 'listening' ? "Słucham..." : "Napisz wiadomość..."}
              className={`w-full h-full bg-transparent border-none text-white font-sans text-[15px] px-2 outline-none 
                                       placeholder:text-white/30`}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/80 
                                 disabled:opacity-20 disabled:cursor-not-allowed transition-colors mr-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Animation Variants
const orbVariants: Variants = {
  idle: {
    scale: 1,
    transition: { duration: 0.2 }
  },
  listening: {
    scale: 1.1,
    boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
    transition: { duration: 0.2 }
  },
  processing: {
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  speaking: {
    scale: [1, 1.1, 1],
    boxShadow: ["0 0 10px rgba(0, 240, 255, 0.3)", "0 0 20px rgba(255, 0, 170, 0.4)", "0 0 10px rgba(0, 240, 255, 0.3)"],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  }
};
