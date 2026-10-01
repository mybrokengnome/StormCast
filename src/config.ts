import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

// Resolve everything relative to the project folder, not the shell's working
// directory, so launching from pm2, systemd or another folder still works.
export const projectRoot = path.resolve(__dirname, "..");
export const envPath = path.join(projectRoot, ".env");

// Values in .env win over anything already in the process environment, so a
// stale variable cached by pm2 or systemd cannot shadow the file.
export const envInfo: { exists: boolean; keys: string[]; error: string | null } = {
  exists: fs.existsSync(envPath),
  keys: [],
  error: null,
};
if (envInfo.exists) {
  const result = dotenv.config({ path: envPath, override: true });
  envInfo.keys = Object.keys(result.parsed ?? {});
  envInfo.error = result.error ? result.error.message : null;
  if (!envInfo.error && envInfo.keys.length === 0) envInfo.error = "file is empty or could not be parsed";
}

const PLACEHOLDERS = new Set([
  "",
  "email@gmail.com",
  "app_password",
  "openweather_api_key",
  "comma_separated_list_of_emails",
]);

function str(name: string, fallback = ""): string {
  const value = process.env[name]?.trim();
  return value === undefined || PLACEHOLDERS.has(value.toLowerCase()) ? fallback : value;
}

function num(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function list(name: string): string[] {
  return str(name)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const emailUser = str("EMAIL_USER");
const emailPassword = str("EMAIL_PASSWORD");
const weatherApiKey = str("OPENWEATHER_API_KEY");
const units = str("WEATHER_UNITS", "imperial") === "metric" ? "metric" : "imperial";
const orderSetting = str("SLIDESHOW_ORDER", "smart").toLowerCase();
const slideshowOrder = orderSetting === "shuffle" || orderSetting === "newest" ? orderSetting : "smart";
const flag = (name: string, fallback: boolean) => {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === undefined || value === "") return fallback;
  return !["0", "false", "no", "off"].includes(value);
};

export const config = {
  port: num("PORT", 3000),
  imageDirectory: path.resolve(projectRoot, str("IMAGE_DIRECTORY", "./uploads/images")),
  maxImages: num("MAX_IMAGES", 200),
  slideshowIntervalMs: num("SLIDESHOW_INTERVAL", 10_000),
  radarEvery: Math.round(num("RADAR_EVERY", 5)),
  slideshowOrder: slideshowOrder as "smart" | "shuffle" | "newest",

  email: {
    configured: Boolean(emailUser && emailPassword),
    user: emailUser,
    password: emailPassword,
    host: str("EMAIL_HOST", "imap.gmail.com"),
    port: num("EMAIL_PORT", 993),
    allowedSenders: list("ALLOWED_EMAILS"),
    requiredSubject: str("REQUIRED_SUBJECT", "slideshow").toLowerCase(),
    checkIntervalMs: Math.max(num("EMAIL_CHECK_INTERVAL", 30_000), 10_000),
  },

  weather: {
    configured: Boolean(weatherApiKey),
    apiKey: weatherApiKey,
    latitude: Number(process.env.LATITUDE ?? 27.9517),
    longitude: Number(process.env.LONGITUDE ?? -82.4588),
    units: units as "imperial" | "metric",
    updateIntervalMs: Math.max(num("WEATHER_UPDATE_INTERVAL", 600_000), 60_000),
  },

  radar: {
    station: str("NOAA_LOCATION", "KTBW").toUpperCase(),
    updateIntervalMs: Math.max(num("RADAR_UPDATE_INTERVAL", 300_000), 60_000),
  },

  alerts: {
    enabled: flag("WEATHER_ALERTS", true),
    updateIntervalMs: Math.max(num("ALERT_UPDATE_INTERVAL", 180_000), 60_000),
  },
} as const;

export type Units = typeof config.weather.units;
