import { config } from "../config";

/**
 * Fetches the animated NOAA RIDGE radar loop for the configured station and keeps
 * the latest copy in memory. No disk writes, which is kind to Raspberry Pi SD cards.
 */
export class RadarService {
  private image?: Buffer;
  private etag?: string;
  private lastUpdate?: Date;
  private lastError?: string;
  private timer?: NodeJS.Timeout;

  get url(): string {
    return `https://radar.weather.gov/ridge/standard/${config.radar.station}_loop.gif`;
  }

  async start(): Promise<void> {
    console.log(`📡 Starting radar service (${config.radar.station})...`);
    await this.refresh();
    this.timer = setInterval(() => void this.refresh(), config.radar.updateIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async refresh(): Promise<void> {
    try {
      const response = await fetch(this.url, {
        headers: {
          "User-Agent": "StormCast/2.0 (Raspberry Pi photo frame)",
          ...(this.etag ? { "If-None-Match": this.etag } : {}),
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (response.status === 304) {
        this.lastError = undefined;
        return;
      }
      if (!response.ok) throw new Error(`NOAA responded ${response.status}`);

      this.image = Buffer.from(await response.arrayBuffer());
      this.etag = response.headers.get("etag") ?? undefined;
      this.lastUpdate = new Date();
      this.lastError = undefined;
      console.log(`📡 Radar updated (${Math.round(this.image.length / 1024)} KB)`);
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error("📡 Radar update failed:", this.lastError);
    }
  }

  getImage(): Buffer | undefined {
    return this.image;
  }

  getInfo() {
    return {
      available: Boolean(this.image),
      station: config.radar.station,
      updatedAt: this.lastUpdate?.toISOString() ?? null,
      url: this.image ? `/api/radar/image?v=${this.lastUpdate?.getTime()}` : null,
    };
  }

  getStatus() {
    return {
      connected: Boolean(this.image) && !this.lastError,
      lastUpdate: this.lastUpdate?.toISOString() ?? null,
      error: this.lastError ?? null,
    };
  }
}
