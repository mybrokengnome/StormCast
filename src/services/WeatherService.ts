import axios from "axios";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  location: string;
  timestamp: Date;
}

export class WeatherService {
  private apiKey: string;
  private latitude: number;
  private longitude: number;
  private updateInterval: number;
  private lastUpdate?: Date;
  private currentWeather?: WeatherData;
  private intervalId?: NodeJS.Timeout;
  private isConnected: boolean = false;

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY!;
    this.latitude = parseFloat(process.env.LATITUDE!);
    this.longitude = parseFloat(process.env.LONGITUDE!);
    this.updateInterval =
      parseInt(process.env.WEATHER_UPDATE_INTERVAL!) || 600000;
  }

  async start(): Promise<void> {
    console.log("🌤️  Starting weather service...");
    await this.updateWeather();

    this.intervalId = setInterval(async () => {
      await this.updateWeather();
    }, this.updateInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async updateWeather(): Promise<void> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${
        this.latitude
      }&lon=${this.longitude}&appid=${this.apiKey}&units=${
        process.env.UNITS || "imperial"
      }`;

      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;

      this.currentWeather = {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind?.speed || 0,
        windDirection: data.wind?.deg || 0,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        location: data.name,
        timestamp: new Date(),
      };

      this.lastUpdate = new Date();
      this.isConnected = true;
      console.log(
        `Weather updated: ${this.currentWeather.temperature}°F in ${this.currentWeather.location}`
      );
    } catch (error) {
      console.error("Failed to update weather:", error);
      this.isConnected = false;
    }
  }

  async getCurrentWeather(): Promise<WeatherData> {
    if (!this.currentWeather) {
      await this.updateWeather();
    }

    if (!this.currentWeather) {
      throw new Error("No weather data available");
    }

    return this.currentWeather;
  }

  getStatus(): { connected: boolean; lastUpdate?: Date } {
    return {
      connected: this.isConnected,
      lastUpdate: this.lastUpdate,
    };
  }
}
