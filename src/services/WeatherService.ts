import { config } from "../config";

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number; // hPa
  windSpeed: number;
  windGust: number | null;
  windDirection: number;
  visibility: number | null; // meters
  clouds: number;
  description: string;
  icon: string;
  location: string;
  sunrise: string;
  sunset: string;
  updatedAt: string;
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD in the location's local time
  high: number;
  low: number;
  icon: string;
  description: string;
  precipitationChance: number; // 0..1
}

export interface HourlyPoint {
  time: string; // ISO timestamp
  temperature: number;
  icon: string;
  description: string;
  precipitationChance: number; // 0..1
}

export interface WeatherSnapshot {
  units: "imperial" | "metric";
  current: CurrentWeather;
  hourly: HourlyPoint[];
  forecast: ForecastDay[];
}

const BASE = "https://api.openweathermap.org/data/2.5";

export class WeatherService {
  private snapshot?: WeatherSnapshot;
  private lastUpdate?: Date;
  private lastError?: string;
  private timer?: NodeJS.Timeout;

  async start(): Promise<void> {
    if (!config.weather.configured) {
      console.warn("🌤️  OPENWEATHER_API_KEY not set; weather is disabled");
      this.lastError = "OPENWEATHER_API_KEY is not configured";
      return;
    }
    console.log("🌤️  Starting weather service...");
    await this.update();
    this.timer = setInterval(() => void this.update(), config.weather.updateIntervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async fetchJson(endpoint: string): Promise<any> {
    const { apiKey, latitude, longitude, units } = config.weather;
    const url = `${BASE}/${endpoint}?lat=${latitude}&lon=${longitude}&units=${units}&appid=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) {
      const body: any = await response.json().catch(() => ({}));
      throw new Error(body?.message ? `${response.status}: ${body.message}` : `HTTP ${response.status}`);
    }
    return response.json();
  }

  private async update(): Promise<void> {
    try {
      const [current, forecast] = await Promise.all([
        this.fetchJson("weather"),
        this.fetchJson("forecast").catch((error) => {
          console.warn("🌤️  Forecast unavailable:", error.message);
          return null;
        }),
      ]);

      this.snapshot = {
        units: config.weather.units,
        current: this.parseCurrent(current),
        hourly: forecast ? this.parseHourly(forecast) : [],
        forecast: forecast ? this.parseForecast(forecast) : [],
      };
      this.lastUpdate = new Date();
      this.lastError = undefined;
      console.log(
        `🌤️  Weather updated: ${Math.round(this.snapshot.current.temperature)}° ` +
          `${this.snapshot.current.description} in ${this.snapshot.current.location}`
      );
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error("🌤️  Weather update failed:", this.lastError);
    }
  }

  private parseCurrent(data: any): CurrentWeather {
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      tempMin: data.main.temp_min,
      tempMax: data.main.temp_max,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind?.speed ?? 0,
      windGust: data.wind?.gust ?? null,
      windDirection: data.wind?.deg ?? 0,
      visibility: data.visibility ?? null,
      clouds: data.clouds?.all ?? 0,
      description: data.weather?.[0]?.description ?? "",
      icon: data.weather?.[0]?.icon ?? "01d",
      location: data.name || "Unknown",
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /** The next 24 hours in the 3-hour steps the free OpenWeatherMap tier provides. */
  private parseHourly(data: any): HourlyPoint[] {
    return (data.list ?? []).slice(0, 8).map((item: any) => ({
      time: new Date(item.dt * 1000).toISOString(),
      temperature: item.main.temp,
      icon: item.weather?.[0]?.icon ?? "01d",
      description: item.weather?.[0]?.description ?? "",
      precipitationChance: item.pop ?? 0,
    }));
  }

  /** Collapse the 3-hourly forecast into one entry per local calendar day. */
  private parseForecast(data: any): ForecastDay[] {
    const offset: number = data.city?.timezone ?? 0;
    interface DayBucket {
      temps: number[];
      pops: number[];
      icons: Map<string, number>;
      descriptions: Map<string, number>;
      dayIcons: Map<string, number>;
    }
    const days = new Map<string, DayBucket>();

    for (const item of data.list ?? []) {
      const local = new Date((item.dt + offset) * 1000);
      const key = local.toISOString().slice(0, 10);
      const hour = local.getUTCHours();
      const icon: string = (item.weather?.[0]?.icon ?? "01d").replace("n", "d");
      const description: string = item.weather?.[0]?.description ?? "";

      const day: DayBucket = days.get(key) ?? {
        temps: [],
        pops: [],
        icons: new Map(),
        descriptions: new Map(),
        dayIcons: new Map(),
      };
      day.temps.push(item.main.temp_min, item.main.temp_max);
      day.pops.push(item.pop ?? 0);
      day.icons.set(icon, (day.icons.get(icon) ?? 0) + 1);
      day.descriptions.set(description, (day.descriptions.get(description) ?? 0) + 1);
      if (hour >= 9 && hour <= 18) day.dayIcons.set(icon, (day.dayIcons.get(icon) ?? 0) + 1);
      days.set(key, day);
    }

    const mostCommon = (map: Map<string, number>) =>
      [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

    return [...days.entries()].map(([date, day]) => ({
      date,
      high: Math.max(...day.temps),
      low: Math.min(...day.temps),
      icon: mostCommon(day.dayIcons) ?? mostCommon(day.icons) ?? "01d",
      description: mostCommon(day.descriptions) ?? "",
      precipitationChance: Math.max(...day.pops),
    }));
  }

  getSnapshot(): WeatherSnapshot | undefined {
    return this.snapshot;
  }

  getStatus() {
    return {
      configured: config.weather.configured,
      connected: Boolean(this.snapshot) && !this.lastError,
      lastUpdate: this.lastUpdate?.toISOString() ?? null,
      error: this.lastError ?? null,
    };
  }
}
