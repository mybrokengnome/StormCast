# StormCast

StormCast is a customizable smart photo frame and weather display built with Node.js, TypeScript, and a Raspberry Pi touchscreen.

It combines local photo slideshows with live weather data, radar images, and more — making it a beautiful and functional addition to your home or workspace.

## Features

- **Image Slideshow**: Add photos by sending them to your email address
- **Weather Station**: Real-time weather data with imperial units (°F, mph, inHg)
- **Touch-Friendly UI**: Modern interface built with Tailwind CSS
- **Auto-Updates**: Automatic email checking and weather updates
- **System Status**: Monitor email and weather service connections

## Setup Instructions

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create directories:**

   ```bash
   npm run setup
   ```

3. **Configure environment:**

   - Copy the `.env` file and update with your credentials
   - Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
   - Set up email app password for Gmail
   - Add your NOAA location

4. **Build and start:**

   ```bash
   npm run build
   npm start
   ```

   For development:

   ```bash
   npm run dev
   ```

## Email Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password for the application
3. Use the app password in the `EMAIL_PASSWORD` field

## Usage

- **Adding Images**: Send photos as email attachments to your configured email addresses with the subject line you specified, default is 'slideshow'
- **Slideshow Controls**: Touch/swipe to navigate, or use the control buttons
- **Auto-Play**: Slideshow automatically advances every 10 seconds
- **Weather**: Updates every 10 minutes with current conditions

## API Endpoints

- `GET /api/weather` - Current weather data
- `GET /api/images` - List of available images
- `GET /api/status` - System status information
- `GET /api/radar` - Radar data

## Raspberry Pi Optimization

- Designed for 10.1" touchscreen displays (1024x600)
- Optimized touch controls and gestures
- Automatic image cleanup to prevent storage issues
- Low-power operation suitable for continuous use

## Environment Variables

See the `.env` file for all configuration options including:

- Email credentials and settings
- Weather API configuration
- Display and timing preferences
- Radar location
