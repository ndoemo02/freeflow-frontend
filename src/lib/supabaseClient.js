import { createClient } from "@supabase/supabase-js";

// 🧩 Sprawdzamy środowisko Vite (tylko import.meta.env w przeglądarce)
const supabaseUrl =
  import.meta?.env?.VITE_SUPABASE_URL ||
  'https://ezemaacyyvbpjlagchds.supabase.co';

const supabaseKey =
  import.meta?.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6ZW1hYWN5eXZicGpsYWdjaGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODU1MzYsImV4cCI6MjA3NTM2MTUzNn0.uRKmqxL0Isx3DmOxmgc_zPwG5foYXft9WpIROoTTgGU';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ Dodajmy log diagnostyczny:
console.log("%c[Supabase Connected]", "color: lime; font-weight: bold;", supabaseUrl);

// 🔥 AmberLogger — globalny loger diagnostyczny
export const AmberLogger = {
  log: (...args) => {
    console.log("%c[AmberLog]", "color:#f97316;font-weight:bold;", ...args);
    // Wyłączone zapisywanie do bazy - tabela system_logs nie istnieje
    // try {
    //   supabase.from("system_logs").insert({
    //     level: "info",
    //     message: JSON.stringify(args),
    //     created_at: new Date().toISOString(),
    //   });
    // } catch (err) {
    //   console.warn("AmberLogger insert error:", err.message);
    // }
  },
  error: (err) => {
    console.error("%c[AmberError]", "color:red;font-weight:bold;", err);
    // Wyłączone zapisywanie do bazy - tabela system_logs nie istnieje
    // try {
    //   supabase.from("system_logs").insert({
    //     level: "error",
    //     message: err?.message || JSON.stringify(err),
    //     created_at: new Date().toISOString(),
    //   });
    // } catch (e) {
    //   console.warn("AmberLogger failed:", e.message);
    // }
  },
};

// 🧠 AmberBrain — prosty tracker kontekstu użytkownika (frontendowy)
export const AmberBrain = {
  async track(event, payload = {}) {
    // Wyłączone zapisywanie do bazy - tabela user_activity nie istnieje
    AmberLogger.log("BrainTrack:", event, payload);
    // try {
    //   await supabase.from("user_activity").insert({
    //     event,
    //     payload,
    //     created_at: new Date().toISOString(),
    //   });
    //   AmberLogger.log("BrainTrack:", event, payload);
    // } catch (err) {
    //   AmberLogger.error(err);
    // }
  },
};
