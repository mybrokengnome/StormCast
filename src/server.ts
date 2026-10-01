import { config, envLoaded, projectRoot } from "./config";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { WeatherService } from "./services/WeatherService";
import { EmailService } from "./services/EmailService";
import { ImageService } from "./services/ImageService";
import { RadarService } from "./services/RadarService";
import { AlertService } from "./services/AlertService";

const app = express();
const startedAt = Date.now();

const imageService = new ImageService();
const weatherService = new WeatherService();
const radarService = new RadarService();
const alertService = new AlertService();
const emailService = new EmailService(imageService);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        // The frame is served over plain HTTP on the LAN; never force HTTPS upgrades.
        upgradeInsecureRequests: null,
      },
    },
    hsts: false,
    crossOriginEmbedderPolicy: false,
  })
);

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, { maxAge: "1h", etag: true }));
app.use("/images", express.static(imageService.directory, { maxAge: "7d", immutable: true }));

// ---- API -------------------------------------------------------------------

app.get("/api/config", (_req, res) => {
  res.json({
    emailAddress: config.email.configured ? config.email.user : null,
    requiredSubject: config.email.requiredSubject,
    slideshowIntervalMs: config.slideshowIntervalMs,
    radarEvery: config.radarEvery,
    slideshowOrder: config.slideshowOrder,
    radarStation: config.radar.station,
    units: config.weather.units,
  });
});

app.get("/api/weather", (_req, res) => {
  const snapshot = weatherService.getSnapshot();
  if (!snapshot) {
    res.status(503).json({ error: weatherService.getStatus().error ?? "Weather not available yet" });
    return;
  }
  res.json(snapshot);
});

app.get("/api/images", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(imageService.list());
});

app.get("/api/alerts", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(alertService.getAlerts());
});

app.get("/api/radar", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(radarService.getInfo());
});

app.get("/api/radar/image", (_req, res) => {
  const image = radarService.getImage();
  if (!image) {
    res.status(404).json({ error: "No radar image available" });
    return;
  }
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store");
  res.send(image);
});

app.get("/api/status", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    email: emailService.getStatus(),
    weather: weatherService.getStatus(),
    radar: radarService.getStatus(),
    alerts: alertService.getStatus(),
    images: imageService.getStatus(),
  });
});

app.get("/healthz", (_req, res) => {
  res.send("ok");
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---- Boot ------------------------------------------------------------------

const server = app.listen(config.port, () => {
  console.log(`🚀 StormCast running at http://localhost:${config.port}`);
  console.log(
    envLoaded
      ? `⚙️  Loaded ${path.join(projectRoot, ".env")}`
      : `⚙️  No .env found at ${path.join(projectRoot, ".env")}; using defaults and process environment`
  );
  console.log(
    `⚙️  Email ${config.email.configured ? `on (${config.email.user})` : "off"}, ` +
      `weather ${config.weather.configured ? "on" : "off"}, ` +
      `radar ${config.radar.station}, alerts ${config.alerts.enabled ? "on" : "off"}`
  );
  console.log(`🖼️  Photos folder: ${imageService.directory}`);
  void weatherService.start();
  void radarService.start();
  void alertService.start();
  emailService.start();
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down...`);
  weatherService.stop();
  radarService.stop();
  alertService.stop();
  await emailService.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
