import React from "react";

type Msg = { id: string|number; role: "user"|"assistant"; text: string };

export default function VoiceDock({
  messages,
  value,
  onChange,
  onSubmit,
  recording,
  onMicClick,
}: {
  messages: Msg[];
  value: string;
  onChange: (v: string)=>void;
  onSubmit: ()=>void;
  recording: boolean;
  onMicClick: ()=>void;
}) {
  return (
    <div className="
      fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:px-6
    ">
      <div className="
        w-full max-w-3xl rounded-2xl bg-black/55 backdrop-blur
        ring-1 ring-white/10 shadow-xl
      ">
        {/* historia (krótka) */}
        <div className="max-h-40 overflow-y-auto p-3 space-y-2">
          {messages.slice(-6).map(m => (
            <div
              key={m.id}
              className={[
                "text-sm leading-snug",
                m.role === "assistant"
                  ? "text-slate-200"
                  : "text-slate-100 text-right"
              ].join(" ")}
            >
              <span className={[
                "inline-block rounded-lg px-3 py-2",
                m.role === "assistant"
                  ? "bg-white/5 ring-1 ring-white/10"
                  : "bg-orange-500/20 ring-1 ring-orange-400/20"
              ].join(" ")}>{m.text}</span>
            </div>
          ))}
        </div>

        {/* wiersz inputu */}
        <form
          onSubmit={(e)=>{e.preventDefault(); onSubmit();}}
          className="flex items-center gap-2 p-3 border-t border-white/10"
        >
          <input
            className="
              flex-1 rounded-xl bg-white/5 text-white placeholder:text-slate-400
              px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-2
              focus:ring-orange-500/60
            "
            placeholder="Powiedz lub wpisz…"
            value={value}
            onChange={(e)=>onChange(e.target.value)}
          />
          <button
            type="button"
            onClick={onMicClick}
            className={[
              "rounded-xl px-3 py-2 text-sm ring-1",
              recording
                ? "bg-red-600/80 text-white ring-red-400/40"
                : "bg-white/5 text-slate-100 ring-white/10 hover:bg-white/10"
            ].join(" ")}
            aria-pressed={recording}
            title={recording ? "Zatrzymaj" : "Mów"}
          >
            {recording ? "🛑" : "🎙️"}
          </button>
          <button
            type="submit"
            className="
              rounded-xl bg-orange-500 text-slate-900 px-3 py-2 text-sm
              font-semibold hover:bg-orange-400
            "
          >
            Wyślij
          </button>
        </form>
      </div>
    </div>
  );
}
