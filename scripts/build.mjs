import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envPath = resolve(projectRoot, ".env");
let fileEnv = {};
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  fileEnv = parseEnvFile(content);
}

const rawBase = (process.env.VITE_API_BASE || fileEnv.VITE_API_BASE || "").trim();
if (!rawBase) {
  console.error("[build] Missing VITE_API_BASE in environment variables or .env file.");
  process.exit(1);
}

const sanitizedBase = rawBase.replace(/\/+$/, "");
console.log(`[build] VITE_API_BASE resolved to: ${sanitizedBase}`);
