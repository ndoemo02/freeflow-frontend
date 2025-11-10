import React from 'react'
import styled from 'styled-components'

type Props = {
  amberResponse?: string
  interimText?: string
  finalText?: string
  recording?: boolean
}

export default function VoicePanelText({ amberResponse = "", interimText = "", finalText = "", recording = false }: Props) {
  const liveFinal = (finalText || "").trim()
  const liveInterim = (interimText || "").trim()
  const hasLive = !!(liveFinal || liveInterim)
  return (
    <StyledWrapper>
      <div>
        <div className="grid" />
        <div id="poda">
          <div className="glow" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          <div className="darkBorderBg" />
          {/* <div className="white" /> */}
          {/* <div className="border" /> */}
          <div id="main">
            {amberResponse ? (
              <div className="amber-text">{amberResponse}</div>
            ) : hasLive ? (
              <div className="live-text" aria-live="polite">
                {liveFinal && <span className="live-final">{liveFinal} </span>}
                {liveInterim && <span className="live-interim">{liveInterim}</span>}
              </div>
            ) : (
              <input placeholder="Czekam na polecenie..." type="text" name="text" className="input" readOnly />
            )}
            <div id="input-mask" />
            <div id="pink-mask" />
          </div>
        </div>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  position: fixed;
  left: 50%;
  /* lekko obniżone, by nie zasłaniać blatu/kieliszka */
  bottom: calc(-6px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 60;
  width: clamp(280px, 80vw, 640px);
  padding: clamp(1rem, 3vh, 1.5rem);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  
  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  .grid {
    height: 800px;
    width: 800px;
    background-image: linear-gradient(to right, #0f0f10 1px, transparent 1px),
      linear-gradient(to bottom, #0f0f10 1px, transparent 1px);
    background-size: 1rem 1rem;
    background-position: center center;
    position: absolute;
    z-index: -1;
    filter: blur(1px);
  }
  .white,
  .border,
  .darkBorderBg,
  .glow {
    max-height: 70px;
    max-width: 100%;
    height: 100%;
    width: 100%;
    position: absolute;
    overflow: hidden;
    z-index: -1;
    border-radius: 12px;
    filter: blur(3px);
  }
  .input {
    background-color: #010201;
    border: none;
    width: clamp(260px, 75vw, 600px);
    height: 56px;
    border-radius: 10px;
    color: white;
    padding-inline: 59px;
    font-size: clamp(14px, 4vw, 18px);
  }
  
  .amber-text {
    background-color: #010201;
    width: clamp(260px, 75vw, 600px);
    min-height: 56px;
    border-radius: 10px;
    color: #00ff77;
    padding: 16px 20px;
    font-size: clamp(14px, 4vw, 18px);
    line-height: 1.5;
    display: flex;
    align-items: center;
    text-align: left;
    animation: fadeIn 0.5s ease;
  }
  .live-text {
    background-color: #010201;
    width: clamp(260px, 75vw, 600px);
    min-height: 56px;
    border-radius: 10px;
    color: #ffffff;
    padding: 16px 20px;
    font-size: clamp(14px, 4vw, 18px);
    line-height: 1.5;
    display: flex;
    align-items: center;
    text-align: left;
  }
  .live-final { color: #ffffff; }
  .live-interim { color: #b3b3b3; opacity: 0.8; }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  #poda {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .input::placeholder { color: #c0b9c0; }
  .input:focus { outline: none; }
  #main:focus-within > #input-mask { display: none; }
  #input-mask {
    pointer-events: none;
    width: 100px;
    height: 20px;
    position: absolute;
    background: linear-gradient(90deg, transparent, black);
    top: 18px;
    left: 70px;
  }
  #pink-mask {
    pointer-events: none;
    width: 30px;
    height: 20px;
    position: absolute;
    background: #cf30aa;
    top: 10px;
    left: 5px;
    filter: blur(20px);
    opacity: 0.8;
    transition: all 2s;
  }
  #main:hover > #pink-mask { opacity: 0; }

  .white {
    max-height: 63px;
    max-width: 100%;
    border-radius: 10px;
    filter: blur(2px);
  }
  .white::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(83deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    filter: brightness(1.4);
    background-image: conic-gradient(
      rgba(0, 0, 0, 0) 0%,
      #a099d8,
      rgba(0, 0, 0, 0) 8%,
      rgba(0, 0, 0, 0) 50%,
      #dfa2da,
      rgba(0, 0, 0, 0) 58%
    );
    transition: all 2s;
  }
  .border {
    max-height: 59px;
    max-width: 100%;
    border-radius: 11px;
    filter: blur(0.5px);
  }
  .border::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(70deg);
    position: absolute;
    width: 600px;
    height: 600px;
    filter: brightness(1.3);
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      #1c191c,
      #402fb5 5%,
      #1c191c 14%,
      #1c191c 50%,
      #cf30aa 60%,
      #1c191c 64%
    );
    transition: all 2s;
  }
  .darkBorderBg { max-height: 65px; max-width: 100%; }
  .darkBorderBg::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(82deg);
    position: absolute;
    width: 600px;
    height: 600px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(
      rgba(0, 0, 0, 0),
      #18116a,
      rgba(0, 0, 0, 0) 10%,
      rgba(0, 0, 0, 0) 50%,
      #6e1b60,
      rgba(0, 0, 0, 0) 60%
    );
    transition: all 2s;
  }
  #poda:hover > .darkBorderBg::before { transform: translate(-50%, -50%) rotate(262deg); }
  #poda:hover > .glow::before { transform: translate(-50%, -50%) rotate(240deg); }
  #poda:hover > .white::before { transform: translate(-50%, -50%) rotate(263deg); }
  #poda:hover > .border::before { transform: translate(-50%, -50%) rotate(250deg); }
  #poda:focus-within > .darkBorderBg::before { transform: translate(-50%, -50%) rotate(442deg); transition: all 4s; }
  #poda:focus-within > .glow::before { transform: translate(-50%, -50%) rotate(420deg); transition: all 4s; }
  #poda:focus-within > .white::before { transform: translate(-50%, -50%) rotate(443deg); transition: all 4s; }
  #poda:focus-within > .border::before { transform: translate(-50%, -50%) rotate(430deg); transition: all 4s; }

  .glow { overflow: hidden; filter: blur(30px); opacity: 0.4; max-height: 130px; max-width: 100%; }
  .glow:before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(60deg);
    position: absolute;
    width: 999px;
    height: 999px;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: conic-gradient(#000, #402fb5 5%, #000 38%, #000 50%, #cf30aa 60%, #000 87%);
    transition: all 2s;
  }

  @keyframes rotate { 100% { transform: translate(-50%, -50%) rotate(450deg);} }

  #filter-icon {
    position: absolute; top: 8px; right: 8px; display: flex; align-items: center; justify-content: center; z-index: 2;
    max-height: 40px; max-width: 38px; height: 100%; width: 100%; isolation: isolate; overflow: hidden; border-radius: 10px;
    background: linear-gradient(180deg, #161329, black, #1d1b4b); border: 1px solid transparent;
  }
  .filterBorder { height: 42px; width: 40px; position: absolute; overflow: hidden; top: 7px; right: 7px; border-radius: 10px; }
  .filterBorder::before {
    content: ""; text-align: center; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(90deg); position: absolute; width: 600px; height: 600px; background-repeat: no-repeat; background-position: 0 0; filter: brightness(1.35);
    background-image: conic-gradient(rgba(0,0,0,0), #3d3a4f, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 50%, #3d3a4f, rgba(0,0,0,0) 100%);
    animation: rotate 4s linear infinite;
  }
  #main { position: relative; }
  #search-icon { position: absolute; left: 20px; top: 15px; }
`
