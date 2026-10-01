# StormCast

StormCast turns a Raspberry Pi and a touchscreen into a smart photo frame with live weather and NOAA radar.

- **Photo slideshow.** Email photos to the frame; they appear within 30 seconds. Swipe or tap to navigate.
- **Live weather.** Current conditions, feels-like, humidity, wind, pressure, sunrise/sunset, visibility, the next 18 hours in 3-hour steps, and a 4-day forecast from OpenWeatherMap.
- **Weather alerts.** Active National Weather Service watches and warnings for your location appear as a banner over the photos, color-coded by severity.
- **Live radar.** The animated NOAA/NWS radar loop for your nearest NEXRAD site, shown in the rotation every few photos (or on demand).
- **Smart ordering.** Photos play in a weighted random order so new arrivals show up often while old favorites still come around. Plain shuffle and newest-first are available too.
- **Kiosk friendly.** Dark UI designed for 1024x600, controls auto-hide, cursor hides when idle, works offline-tolerant (each service degrades independently).
- **Light on the Pi.** Plain Node.js + Express, no browser automation, no CSS build step, radar is cached in memory so the SD card is not hammered.

## Requirements

- Node.js 20 or newer
- An [OpenWeatherMap](https://home.openweathermap.org/api_keys) API key (free tier is fine) for weather
- A dedicated email account (Gmail works well) if you want to add photos by email

## Quick start

```bash
npm install
cp .env.example .env     # then edit .env
npm run setup            # creates uploads/images and compiles the server
npm start
```

Open <http://localhost:3000>.

For development with auto-reload:

```bash
npm run dev
```

## Configuration

All settings live in `.env` (see `.env.example` for every option).

| Variable | What it does |
| --- | --- |
| `EMAIL_USER`, `EMAIL_PASSWORD` | IMAP login. For Gmail, enable 2-step verification and create an [App Password](https://myaccount.google.com/apppasswords). Leave blank to disable email. |
| `ALLOWED_EMAILS` | Comma-separated senders allowed to add photos. Anyone else is ignored. |
| `REQUIRED_SUBJECT` | Word that must appear in the subject line (default `slideshow`). |
| `OPENWEATHER_API_KEY`, `LATITUDE`, `LONGITUDE` | Weather location. |
| `WEATHER_UNITS` | `imperial` (°F, mph, inHg) or `metric` (°C, km/h, hPa). |
| `NOAA_LOCATION` | NEXRAD site ID, e.g. `KTBW`. Find yours at <https://radar.weather.gov>. |
| `WEATHER_ALERTS` | `true`/`false`. NWS alerts, US only, no key needed (default `true`). |
| `SLIDESHOW_INTERVAL` | Milliseconds per photo (default 10000). |
| `SLIDESHOW_ORDER` | `smart` (default), `shuffle`, or `newest`. |
| `RADAR_EVERY` | Show radar after every N photos (default 5, `0` to disable). |
| `MAX_IMAGES` | Oldest photos are deleted beyond this count (default 200). |

Every unread email in the inbox is fetched and marked as read, whether or not it is accepted, so use a mailbox dedicated to the frame.

## Adding photos

Send an email to the frame's address with `slideshow` (or your `REQUIRED_SUBJECT`) in the subject and the photos attached. Supported formats: JPG, PNG, GIF, WebP, BMP. New photos are shown immediately.

You can also copy files straight into `uploads/images`.

## Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Next / previous photo | Swipe left / right | → / ← |
| Show or hide controls | Tap | |
| Pause / resume | Pause button | Space |
| Show radar now | Radar button | R |

## API

| Endpoint | Returns |
| --- | --- |
| `GET /api/config` | Public display settings |
| `GET /api/weather` | Current conditions, 3-hourly, and daily forecast |
| `GET /api/alerts` | Active NWS alerts, most severe first |
| `GET /api/images` | Photo list, newest first |
| `GET /api/radar` | Radar metadata; `GET /api/radar/image` serves the GIF |
| `GET /api/status` | Health of each service |
| `GET /healthz` | `ok` |

## Running on a Raspberry Pi

1. Install Node.js 20+ (for example via [NodeSource](https://github.com/nodesource/distributions)).
2. Clone this repo to `/home/pi/StormCast`, then run the Quick start steps.
3. Run StormCast as a service so it starts on boot:

   ```ini
   # /etc/systemd/system/stormcast.service
   [Unit]
   Description=StormCast photo frame
   After=network-online.target
   Wants=network-online.target

   [Service]
   WorkingDirectory=/home/pi/StormCast
   ExecStart=/usr/bin/node dist/server.js
   Restart=always
   RestartSec=5
   User=pi

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable --now stormcast
   ```

4. Launch Chromium in kiosk mode on the touchscreen, for example from `~/.config/wayfire.ini` or an autostart entry:

   ```bash
   chromium-browser --kiosk --noerrdialogs --disable-infobars --app=http://localhost:3000
   ```

## Project layout

```
src/
  config.ts              # reads and validates .env
  server.ts              # Express app and API routes
  services/
    AlertService.ts      # NWS active alerts
    EmailService.ts      # IMAP polling, attachment intake
    ImageService.ts      # photo listing, saving, pruning
    RadarService.ts      # NOAA radar loop fetcher
    WeatherService.ts    # OpenWeatherMap current + forecast
public/
  index.html, css/app.css, js/app.js   # the display (no build step)
```

## License

MIT
