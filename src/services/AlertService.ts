import { config } from "../config";

export interface WeatherAlert {
  id: string;
  event: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  urgency: string;
  headline: string;
  areas: string;
  sender: string;
  onset: string | null;
  ends: string | null;
  description: string;
  instruction: string | null;
}

const SEVERITY_RANK: Record<string, number> = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };

/**
 * Active National Weather Service alerts for the configured coordinates.
 * Uses the free, keyless api.weather.gov feed (United States only).
 */
export class AlertService {
  private alerts: WeatherAlert[] = [];
  private lastUpdate?: Date;
  private lastError?: string;
  private timer?: NodeJS.Timeout;

  async start(): Promise<void> {
    if (!config.alerts.enabled) {
      console.log("⚠️  Weather alerts disabled (WEATHER_ALERTS=false)");
      return;
    }
    console.log("⚠️  Starting weather alert service...");
    await this.refresh();
    this.timer = setInterval(() => void this.refresh(), config.alerts.updateIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async refresh(): Promise<void> {
    try {
      // The NWS API rejects coordinates with more than four decimal places.
      const lat = config.weather.latitude.toFixed(4);
      const lon = config.weather.longitude.toFixed(4);
      const response = await fetch(`https://api.weather.gov/alerts/active?point=${lat},${lon}`, {
        headers: {
          "User-Agent": "StormCast/2.0 (https://github.com/stormcast photo frame)",
          Accept: "application/geo+json",
        },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`NWS responded ${response.status}`);

      const data: any = await response.json();
      const now = Date.now();
      this.alerts = (data.features ?? [])
        .map((feature: any) => feature.properties ?? {})
        .filter((p: any) => p.status === "Actual" && p.messageType !== "Cancel")
        .filter((p: any) => {
          const until = p.ends ?? p.expires;
          return !until || new Date(until).getTime() > now;
        })
        .map(
          (p: any): WeatherAlert => ({
            id: p.id,
            event: p.event ?? "Weather Alert",
            severity: SEVERITY_RANK[p.severity] !== undefined ? p.severity : "Unknown",
            urgency: p.urgency ?? "Unknown",
            headline: p.headline ?? "",
            areas: p.areaDesc ?? "",
            sender: p.senderName ?? "NWS",
            onset: p.onset ?? p.effective ?? null,
            ends: p.ends ?? p.expires ?? null,
            description: (p.description ?? "").replace(/\s*\n\s*/g, " ").trim(),
            instruction: p.instruction ? p.instruction.replace(/\s*\n\s*/g, " ").trim() : null,
          })
        )
        .sort((a: WeatherAlert, b: WeatherAlert) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

      if (this.alerts.length) {
        console.log(`⚠️  ${this.alerts.length} active alert(s): ${this.alerts.map((a) => a.event).join(", ")}`);
      }
      this.lastUpdate = new Date();
      this.lastError = undefined;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error("⚠️  Alert update failed:", this.lastError);
    }
  }

  getAlerts(): WeatherAlert[] {
    return this.alerts;
  }

  getStatus() {
    return {
      configured: config.alerts.enabled,
      connected: Boolean(this.lastUpdate) && !this.lastError,
      active: this.alerts.length,
      lastUpdate: this.lastUpdate?.toISOString() ?? null,
      error: this.lastError ?? null,
    };
  }
}
