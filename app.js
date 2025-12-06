// app.js
// Paris time + weather (today + 5 days) for Paris.

(function() {
'use strict';

/* Constants */
const PARIS_TIME_UPDATE_INTERVAL_MS = 30 * 1000; // 30 seconds
const WEATHER_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

/* Paris time */

let timeUpdateInterval = null;

function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;

  const now = new Date();

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
    hour12: false
  };

  const timeStr = new Intl.DateTimeFormat("en-GB", options).format(now);
  el.textContent = "Paris time: " + timeStr;
}

function startTimeUpdates() {
  updateParisTime();
  if (timeUpdateInterval) clearInterval(timeUpdateInterval);
  timeUpdateInterval = setInterval(updateParisTime, PARIS_TIME_UPDATE_INTERVAL_MS);
}

function stopTimeUpdates() {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval);
    timeUpdateInterval = null;
  }
}

startTimeUpdates();


/* Paris Weather */

let weatherData = null;
let weatherUpdateInterval = null;

// Weather code to emoji mapping
function getWeatherEmoji(code) {
  // WMO Weather interpretation codes
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌧️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "🌨️";
  if (code <= 84) return "🌦️";
  if (code <= 99) return "⛈️";
  return "🌤️";
}

async function fetchParisWeather() {
  try {
    // Paris coordinates: 48.8566° N, 2.3522° E
    const url = "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Paris&forecast_days=5";
    
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather fetch failed");
    
    const data = await response.json();
    weatherData = data;
    
    updateWeatherDisplay();
  } catch (error) {
    console.error("Weather error:", error);
    const weatherDays = document.getElementById("weatherDays");
    if (weatherDays) {
      weatherDays.innerHTML = '<span class="weather-loading">Weather unavailable</span>';
    }
  }
}

function updateWeatherDisplay() {
  const weatherDays = document.getElementById("weatherDays");
  if (!weatherDays || !weatherData) return;

  weatherDays.innerHTML = "";

  const daily = weatherData.daily;
  const dates = daily.time;

  dates.forEach((dateStr, i) => {
    // API returns dates in format "2025-12-05" in Paris timezone
    // Parse using Date constructor which handles YYYY-MM-DD correctly
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create a date using local timezone (API already gives Paris dates)
    // Note: Month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);

    // Format day name using Intl API for consistency
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

    const high = Math.round(daily.temperature_2m_max[i]);
    const low = Math.round(daily.temperature_2m_min[i]);
    const code = daily.weathercode[i];
    const emoji = getWeatherEmoji(code);

    const dayDiv = document.createElement("div");
    dayDiv.className = "weather-day-item";
    dayDiv.innerHTML = `
      <span class="weather-date-short">${dayName}</span>
      <span class="weather-icon-large">${emoji}</span>
      <span class="weather-temp">${high}°/${low}°</span>
    `;

    weatherDays.appendChild(dayDiv);
  });
}

// Start/stop weather updates
function startWeatherUpdates() {
  fetchParisWeather();
  if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
  weatherUpdateInterval = setInterval(fetchParisWeather, WEATHER_UPDATE_INTERVAL_MS);
}

function stopWeatherUpdates() {
  if (weatherUpdateInterval) {
    clearInterval(weatherUpdateInterval);
    weatherUpdateInterval = null;
  }
}

// Initialize weather
document.addEventListener("DOMContentLoaded", () => {
  startWeatherUpdates();

  // Use Page Visibility API to pause updates when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopTimeUpdates();
      stopWeatherUpdates();
    } else {
      // Update immediately when tab becomes visible
      updateParisTime();
      fetchParisWeather();
      // Restart intervals
      startTimeUpdates();
      startWeatherUpdates();
    }
  });
});

})(); // End of IIFE
