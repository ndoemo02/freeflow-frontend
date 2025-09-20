import { readFileSync, writeFileSync, existsSync } from "node:fs";
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
    const [key, ...rest] = line.split("=");
    result[key] = rest.join("=");
  }
  return result;
}

const envPath = resolve(projectRoot, ".env");
let baseUrl = "";

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  const envVars = parseEnvFile(envContent);
  baseUrl = envVars.VITE_API_BASE || "";
}

const rawBase = baseUrl || "";
const sanitizedBase = rawBase.replace(/\/+$/, "");

const configPath = resolve(projectRoot, "config.js");
const fileContent = `window.__FREEFLOW_API_BASE = "${sanitizedBase}";\n`;

writeFileSync(configPath, fileContent);
console.log(`[build] Generated config.js with API base: ${sanitizedBase}`);
