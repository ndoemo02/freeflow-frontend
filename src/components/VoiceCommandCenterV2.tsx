import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCommandCenterV2Props {
    recording: boolean;
    isProcessing: boolean;
    isSpeaking: boolean;
    interimText: string;
    finalText: string;
    onMicClick: () => void;
    onTextSubmit: (text: string) => void;
}

export default function VoiceCommandCenterV2({
    recording,
    isProcessing,
    isSpeaking,
    interimText,
    finalText,
    onMicClick,
    onTextSubmit
}: VoiceCommandCenterV2Props) {
    const [inputValue, setInputValue] = React.useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onTextSubmit(inputValue);
            setInputValue("");
        }
    };

    // Orb animation state
    const orbState = recording ? 'listening' : isProcessing ? 'processing' : isSpeaking ? 'speaking' : 'idle';

    return (
        <Container>
            {/* Holographic Orb */}
            <OrbContainer onClick={onMicClick}>
                <Orb $state={orbState} />
                <OrbRing $state={orbState} />
                <OrbCore $state={orbState}>
                    {recording ? '🎤' : isProcessing ? '⚡' : isSpeaking ? '🔊' : '🎙️'}
                </OrbCore>
            </OrbContainer>

            {/* Text Input Area */}
            <InputContainer>
                <GlassInput
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={recording ? "Słucham..." : "Napisz wiadomość..."}
                    disabled={recording || isProcessing}
                />
                <SendButton onClick={handleSubmit} disabled={!inputValue.trim()}>
                    ➤
                </SendButton>
            </InputContainer>

            {/* Live Transcript Overlay */}
            <AnimatePresence>
                {(interimText || finalText) && (
                    <TranscriptOverlay
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        {interimText || finalText}
                    </TranscriptOverlay>
                )}
            </AnimatePresence>
        </Container>
    );
}

// Styled Components
const Container = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100;
`;

const OrbContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const Orb = styled.div<{ $state: string }>`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: ${props => {
        switch (props.$state) {
            case 'listening': return 'radial-gradient(circle, #ff0055, #550011)';
            case 'processing': return 'radial-gradient(circle, #bc13fe, #4a0066)';
            case 'speaking': return 'radial-gradient(circle, #00f3ff, #004455)';
            default: return 'radial-gradient(circle, #222, #000)';
        }
    }};
  box-shadow: 0 0 20px ${props => {
        switch (props.$state) {
            case 'listening': return '#ff0055';
            case 'processing': return '#bc13fe';
            case 'speaking': return '#00f3ff';
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    }};
  animation: ${props => props.$state !== 'idle' ? 'orb-pulse 2s infinite' : 'none'};
  transition: all 0.5s ease;
`;

const OrbRing = styled.div<{ $state: string }>`
  position: absolute;
  width: 120%;
  height: 120%;
  border-radius: 50%;
  border: 2px solid ${props => {
        switch (props.$state) {
            case 'listening': return '#ff0055';
            case 'processing': return '#bc13fe';
            case 'speaking': return '#00f3ff';
            default: return 'rgba(255, 255, 255, 0.2)';
        }
    }};
  opacity: 0.5;
  animation: spin 10s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const OrbCore = styled.div<{ $state: string }>`
  z-index: 2;
  font-size: 2rem;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
`;

const InputContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(20, 20, 30, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 40px;
  padding: 5px 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const GlassInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  padding: 15px 20px;
  font-size: 1rem;
  font-family: 'Inter', sans-serif;
  
  &:focus {
    outline: none;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SendButton = styled.button`
  background: transparent;
  border: none;
  color: var(--neon-primary, #00f3ff);
  font-size: 1.5rem;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.1);
    text-shadow: 0 0 10px var(--neon-primary, #00f3ff);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: default;
  }
`;

const TranscriptOverlay = styled(motion.div)`
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 20px;
  border-radius: 20px;
  color: white;
  font-size: 1.1rem;
  white-space: nowrap;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;
