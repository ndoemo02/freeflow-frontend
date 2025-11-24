import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { css, keyframes } from 'styled-components';

interface VoiceCommandCenterProps {
    amberResponse?: string;
    interimText?: string;
    finalText?: string;
    recording?: boolean;
    visible?: boolean;
    onMicClick?: () => void;
    onSubmitText?: (value: string) => void;
    // New props for enhanced states
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
        <DockContainer
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
        >
            <GlassPanel>
                {/* Input Area */}
                <InputWrapper>
                    <GlassInput
                        ref={inputRef}
                        value={inputValue || interimText}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={currentState === 'listening' ? "Słucham..." : "Napisz wiadomość..."}
                        $isListening={currentState === 'listening'}
                    />
                    <SendButton
                        onClick={handleSubmit}
                        disabled={!inputValue.trim()}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
                        </svg>
                    </SendButton>
                </InputWrapper>

                {/* The Orb */}
                <OrbContainer onClick={onMicClick}>
                    <Orb
                        animate={currentState}
                        variants={orbVariants}
                    >
                        {/* Internal visuals based on state */}
                        <AnimatePresence mode="wait">
                            {currentState === 'idle' && (
                                <OrbCore key="idle" />
                            )}

                            {currentState === 'listening' && (
                                <WaveformContainer key="listening">
                                    {[...Array(5)].map((_, i) => (
                                        <WaveBar
                                            key={i}
                                            animate={{
                                                height: [10, 25, 10],
                                                backgroundColor: ['#00F0FF', '#FFFFFF', '#00F0FF']
                                            }}
                                            transition={{
                                                duration: 0.8,
                                                repeat: Infinity,
                                                delay: i * 0.1,
                                                ease: "easeInOut"
                                            }}
                                        />
                                    ))}
                                </WaveformContainer>
                            )}

                            {currentState === 'processing' && (
                                <ProcessingRing key="processing">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <Dot style={{ top: 0, left: '50%' }} />
                                        <Dot style={{ top: '50%', right: 0 }} />
                                        <Dot style={{ bottom: 0, left: '50%' }} />
                                        <Dot style={{ top: '50%', left: 0 }} />
                                    </motion.div>
                                </ProcessingRing>
                            )}

                            {currentState === 'speaking' && (
                                <SpeakingCore key="speaking" />
                            )}
                        </AnimatePresence>
                    </Orb>

                    {/* Glow effect under the Orb */}
                    <OrbGlow
                        animate={currentState}
                        variants={glowVariants}
                    />
                </OrbContainer>
            </GlassPanel>
        </DockContainer>
    );
}

// --- Animation Variants ---

const orbVariants = {
    idle: {
        scale: [1, 1.05, 1],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    },
    listening: {
        scale: 1.1,
        boxShadow: "0 0 30px rgba(0, 240, 255, 0.4)",
        transition: { duration: 0.3 }
    },
    processing: {
        scale: 0.95,
        boxShadow: "0 0 10px rgba(255, 0, 170, 0.3)",
        transition: { duration: 0.3 }
    },
    speaking: {
        scale: [1, 1.15, 1],
        boxShadow: ["0 0 20px rgba(0, 240, 255, 0.5)", "0 0 40px rgba(255, 0, 170, 0.6)", "0 0 20px rgba(0, 240, 255, 0.5)"],
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    }
};

const glowVariants = {
    idle: { opacity: 0.3, scale: 1 },
    listening: { opacity: 0.6, scale: 1.2, background: "radial-gradient(circle, rgba(0,240,255,0.8) 0%, transparent 70%)" },
    processing: { opacity: 0.4, scale: 0.9, background: "radial-gradient(circle, rgba(255,0,170,0.8) 0%, transparent 70%)" },
    speaking: { opacity: 0.8, scale: 1.3, background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)" }
};

// --- Styled Components ---

const DockContainer = styled(motion.div)`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) !important; /* Override framer-motion x for centering */
  width: 95%;
  max-width: 800px;
  z-index: 100;
  display: flex;
  justify-content: center;
  pointer-events: none; /* Let clicks pass through outside */

  @media (max-width: 600px) {
    bottom: 16px;
    width: 92%;
  }
`;

const GlassPanel = styled.div`
  pointer-events: auto;
  width: 100%;
  height: 80px;
  background: rgba(10, 10, 15, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 16px;
  position: relative;
  overflow: visible;

  @media (max-width: 600px) {
    height: 70px;
    padding: 6px 10px;
  }
`;

const InputWrapper = styled.div`
  flex: 1;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:focus-within {
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(0, 240, 255, 0.3);
    box-shadow: 0 0 15px rgba(0, 240, 255, 0.1);
  }
`;

const GlassInput = styled.input<{ $isListening: boolean }>`
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  padding: 0 50px 0 20px;
  outline: none;
  
  &::placeholder {
    color: ${props => props.$isListening ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'};
    transition: color 0.3s ease;
  }
`;

const SendButton = styled(motion.button)`
  position: absolute;
  right: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 240, 255, 0.2);
    color: #00F0FF;
  }
`;

const OrbContainer = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
`;

const Orb = styled(motion.div)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #4a00e0, #8e2de2);
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(255,255,255,0.3);

  /* Neon gradient overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(0,240,255,0.2), rgba(255,0,170,0.2));
    border-radius: 50%;
  }
`;

const OrbGlow = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  filter: blur(20px);
  z-index: 1;
  pointer-events: none;
`;

// --- Orb Internals ---

const OrbCore = styled.div`
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 15px #fff;
  opacity: 0.8;
`;

const WaveformContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  height: 30px;
`;

const WaveBar = styled(motion.div)`
  width: 4px;
  background: #fff;
  border-radius: 2px;
`;

const ProcessingRing = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  padding: 8px;
`;

const Dot = styled.div`
  position: absolute;
  width: 6px;
  height: 6px;
  background: #00F0FF;
  border-radius: 50%;
  box-shadow: 0 0 8px #00F0FF;
  transform: translate(-50%, -50%);
`;

const SpeakingCore = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,0,170,0.5) 50%, transparent 80%);
  animation: pulseSpeak 1s infinite alternate;

  @keyframes pulseSpeak {
    from { transform: scale(0.8); opacity: 0.6; }
    to { transform: scale(1.1); opacity: 1; }
  }
`;
