import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs-extra";
import path from "path";

export class RadarService {
  private browser?: Browser;
  private latitude: number;
  private longitude: number;
  private screenshotDirectory: string;
  private updateInterval: number;
  private intervalId?: NodeJS.Timeout;
  private lastScreenshot?: string;
  private isConnected: boolean = false;

  constructor() {
    this.latitude = parseFloat(process.env.LATITUDE!);
    this.longitude = parseFloat(process.env.LONGITUDE!);
    this.screenshotDirectory = "./uploads/radar";
    this.updateInterval = 5 * 60 * 1000; // 5 minutes

    fs.ensureDirSync(this.screenshotDirectory);
  }

  async start(): Promise<void> {
    console.log("📡 Starting radar service...");

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROME_BIN || puppeteer.executablePath(),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });

      this.isConnected = true;
      await this.captureRadarScreenshot();

      // Update radar every 5 minutes
      this.intervalId = setInterval(async () => {
        await this.captureRadarScreenshot();
      }, this.updateInterval);
    } catch (error) {
      console.error("Failed to start radar service:", error);
      this.isConnected = false;
    }
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (this.browser) {
      await this.browser.close();
    }
  }

  private async captureRadarScreenshot(): Promise<void> {
    if (!this.browser) {
      console.error("Browser not initialized");
      return;
    }

    let page: Page | undefined;

    try {
      page = await this.browser.newPage();
      await page.setViewport({ width: 800, height: 500 });

      const noaaUrl = `https://radar.weather.gov/ridge/standard/${process.env.NOAA_LOCATION}_loop.gif`;

      console.log("📡 Capturing radar from NOAA:", noaaUrl);

      // Set a shorter timeout to prevent hanging
      await page.goto(noaaUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Wait briefly for content
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Clean up old screenshots BEFORE creating new one
      await this.cleanupOldScreenshots();

      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `radar_${timestamp}.png`;
      const filepath = path.join(this.screenshotDirectory, filename);

      // Take screenshot with error handling
      await page.screenshot({
        path: filepath as `${string}.png`,
        fullPage: true,
      });

      // Update the latest screenshot path
      this.lastScreenshot = `/uploads/radar/${filename}`;
      console.log(`📡 Radar screenshot saved: ${filename}`);
    } catch (error) {
      console.error("Failed to capture radar screenshot:", error);
      // Don't mark as disconnected for transient errors
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  private async cleanupOldScreenshots(): Promise<void> {
    try {
      if (!fs.existsSync(this.screenshotDirectory)) {
        return;
      }

      const files = await fs.readdir(this.screenshotDirectory);
      const radarFiles = files
        .filter((file) => file.startsWith("radar_") && file.endsWith(".png"))
        .map((file) => {
          const filepath = path.join(this.screenshotDirectory, file);
          return {
            name: file,
            path: filepath,
            time: fs.statSync(filepath).mtime,
          };
        })
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      // Keep only the 3 most recent (reduced from 5 for better cleanup)
      const filesToDelete = radarFiles.slice(3);

      for (const file of filesToDelete) {
        try {
          await fs.unlink(file.path);
          console.log(`🗑️ Deleted old radar screenshot: ${file.name}`);
        } catch (error) {
          console.error(`Failed to delete ${file.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Failed to cleanup old screenshots:", error);
    }
  }

  getLatestRadarImage(): string | null {
    // Verify the file still exists before returning
    if (this.lastScreenshot) {
      const filename = path.basename(this.lastScreenshot);
      const filepath = path.join(this.screenshotDirectory, filename);

      if (fs.existsSync(filepath)) {
        return this.lastScreenshot;
      } else {
        console.warn(`Radar file ${filename} no longer exists`);
        this.lastScreenshot = undefined;
      }
    }

    return null;
  }

  getStatus(): { connected: boolean } {
    return { connected: this.isConnected };
  }
}
