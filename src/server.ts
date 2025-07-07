import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import dotenv from "dotenv";
import fs from "fs-extra";
import { WeatherService } from "./services/WeatherService";
import { EmailService } from "./services/EmailService";
import { ImageService } from "./services/ImageService";
import { RadarService } from "./services/RadarService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
fs.ensureDirSync("./uploads/images");
fs.ensureDirSync("./uploads/radar");
fs.ensureDirSync("./public/styles");

// Services
const weatherService = new WeatherService();
const emailService = new EmailService();
const imageService = new ImageService();
const radarService = new RadarService();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://openweathermap.org"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
  })
);
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// API Routes
app.get("/api/weather", async (req, res) => {
  try {
    const weather = await weatherService.getCurrentWeather();
    res.json(weather);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.get("/api/images", (req, res) => {
  try {
    const images = imageService.getImageList();
    res.json(images);
  } catch (error) {
    console.error("Images API error:", error);
    res.status(500).json({ error: "Failed to get image list" });
  }
});

app.get("/api/radar", async (req, res) => {
  try {
    const radarImage = radarService.getLatestRadarImage();
    if (!radarImage) {
      return res.status(404).json({ error: "No radar image available" });
    }

    // Add cache-busting timestamp
    const cacheBuster = Date.now();

    res.json({
      radarUrl: `${radarImage}?t=${cacheBuster}`,
      timestamp: cacheBuster,
      location: "Central Florida",
    });
  } catch (error) {
    console.error("Radar API error:", error);
    res.status(500).json({ error: "Failed to fetch radar data" });
  }
});

app.get("/api/status", (req, res) => {
  res.json({
    email: emailService.getStatus(),
    weather: weatherService.getStatus(),
    images: imageService.getStatus(),
    radar: radarService.getStatus(),
  });
});

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Start services
emailService.start();
weatherService.start();
radarService.start();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to view the slideshow`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  emailService.stop();
  radarService.stop();
  process.exit(0);
});
