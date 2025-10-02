/* eslint-disable jsx-a11y/alt-text */
import { useState } from "react";
import MenuDrawer from "../ui/MenuDrawer";
import { useUI } from "../state/ui";

export default function Home() {
  const openDrawer = useUI((s) => s.openDrawer);
  const [isRecording, setIsRecording] = useState(false);

  const handleOptionClick = (option: string) => {
    console.log(`Wybrano: ${option}`);
    // Tutaj można dodać logikę obsługi wybranej opcji
  };

  return (
    <section
      className="
        relative min-h-screen text-slate-100
        bg-cover bg-center bg-no-repeat
      "
      style={{
        backgroundImage: "url('/images/hero-bg-blur.png')"
      }}
    >
      {/* Logo FreeFlow na górze - hasło jak na screenshocie */}
      <div className="absolute top-4 left-4 z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            <span className="text-orange-400">Free</span>
            <span className="text-white">Flow</span>
          </h1>
          <p className="text-white/90 text-base mt-1">
            Voice to order — <span className="font-medium">Złóż zamówienie</span>
          </p>
          <p className="text-white/70 text-sm">
            Restauracja, taxi albo hotel?
          </p>
        </div>
      </div>

      {/* Ikonki po prawej */}
      <div className="absolute top-4 right-4 flex gap-1.5 z-10">
        {/* Koszyk */}
        <button className="
          w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm
          border border-orange-400/20 text-orange-200
          flex items-center justify-center
          hover:bg-black/30 hover:border-orange-400/40 transition-all
          focus:outline-none
        ">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6H19" />
          </svg>
        </button>

        {/* Przycisk Menu */}
        <button
          onClick={openDrawer}
          className="
            w-8 h-8 rounded-lg bg-black/20 backdrop-blur-sm
            border border-orange-400/20 text-orange-200
            flex items-center justify-center
            hover:bg-black/30 hover:border-orange-400/40 transition-all
            focus:outline-none
          "
          aria-label="Otwórz menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* MenuDrawer */}
      <MenuDrawer />

      {/* Główna kolumna: mobile layout */}
      <div className="mx-auto max-w-3xl px-4 min-h-screen flex flex-col justify-center">
        
        <div className="flex flex-col items-center space-y-2 pt-16">
          {/* Logo z animacjami */}
          <div 
            className="w-[360px] sm:w-[420px] md:w-[460px] aspect-[3/4] relative select-none cursor-pointer"
            onClick={() => setIsRecording(!isRecording)}
          >
            {/* Fale neonowe podczas nagrywania - za logo */}
            {isRecording && (
              <>
                <div className="absolute inset-[-8px] rounded-full border-2 border-orange-400/60 bg-transparent animate-ping z-0" style={{animationDelay: '0.1s'}} />
                <div className="absolute inset-[-16px] rounded-full border-2 border-orange-400/40 bg-transparent animate-ping z-0" style={{animationDelay: '0.4s'}} />
                <div className="absolute inset-[-24px] rounded-full border-2 border-orange-400/20 bg-transparent animate-ping z-0" style={{animationDelay: '0.7s'}} />
              </>
            )}
            
            {/* Gradient tła - za logo */}
            <div
              className="
                absolute inset-0 rounded-[40px] z-0
                bg-[conic-gradient(at_50%_30%,#ff7a18_0deg,#7c3aed_120deg,#0ea5e9_240deg,#ff7a18_360deg)]
                opacity-[.08]
                blur-3xl
              "
            />
            
            {/* Dodatkowy glow podczas nagrywania - za logo */}
            {isRecording && (
              <div className="absolute inset-0 rounded-[40px] bg-orange-400/20 blur-2xl animate-pulse z-0" />
            )}
            
            {/* Logo z pulsowaniem - na wierzchu */}
            <img
              src="/images/freeflow-drop.png"
              alt="FreeFlow logo"
              className={`
                relative z-10 h-full w-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,.45)]
                transition-transform duration-300
                ${isRecording ? 'animate-pulse scale-105' : 'hover:scale-105'}
              `}
              role="button"
              tabIndex={0}
              aria-label="FreeFlow - naciśnij aby mówić"
              title="Naciśnij aby mówić"
            />
          </div>

          {/* Pole transkrypcji */}
          <div
            className="
              w-full max-w-2xl min-h-[50px]
              rounded-lg bg-orange-900/15 ring-1 ring-orange-400/25 backdrop-blur
              shadow-[0_6px_20px_rgba(0,0,0,.2)]
              flex items-center justify-center px-4 py-3
            "
          >
            <span className="text-orange-100/80 text-center text-xs sm:text-sm">
              {isRecording ? "🎙️ Nasłuchuję..." : "Naciśnij logo i zacznij mówić..."}
            </span>
          </div>

          {/* 3 panele w rzędzie */}
          <div className="w-full max-w-2xl grid grid-cols-3 gap-2">
            <Tile onClick={() => handleOptionClick('Jedzenie')}>🍽️&nbsp;Jedzenie</Tile>
            <Tile onClick={() => handleOptionClick('Taxi')}>🚕&nbsp;Taxi</Tile>
            <Tile onClick={() => handleOptionClick('Hotel')}>🏨&nbsp;Hotel</Tile>
          </div>
        </div>
        
      </div>
    </section>
  );
}

/** Kafelek o stałej wysokości i tym samym stylu */
function Tile({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        h-10 w-full
        rounded-md bg-orange-900/20 ring-1 ring-orange-400/30 backdrop-blur
        text-orange-100 font-medium text-xs sm:text-sm
        shadow-[0_4px_15px_rgba(0,0,0,.25)]
        hover:bg-orange-900/30 hover:ring-orange-400/50 hover:scale-105 
        active:scale-95 transition-all duration-200
        cursor-pointer
      "
    >
      {children}
    </button>
  );
}
