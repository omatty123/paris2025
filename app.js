// app.js
// Paris time + weather (today + 5 days) for Paris.

/* Paris time */

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

updateParisTime();
setInterval(updateParisTime, 30000);


/* Paris Weather */

let weatherData = null;

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
    const weatherText = document.getElementById("weatherText");
    if (weatherText) {
      weatherText.textContent = "Weather unavailable";
    }
  }
}

function updateWeatherDisplay() {
  const weatherText = document.getElementById("weatherText");
  if (!weatherText || !weatherData) return;
  
  const today = weatherData.daily;
  const todayHigh = Math.round(today.temperature_2m_max[0]);
  const todayLow = Math.round(today.temperature_2m_min[0]);
  const todayCode = today.weathercode[0];
  const emoji = getWeatherEmoji(todayCode);
  
  weatherText.textContent = `${emoji} ${todayHigh}°/${todayLow}°C`;
}

function createWeatherPopup() {
  if (!weatherData) return;
  
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;
  
  // Remove existing popup if any
  const existingPopup = widget.querySelector(".weather-popup");
  if (existingPopup) {
    existingPopup.remove();
  }
  
  const popup = document.createElement("div");
  popup.className = "weather-popup";
  
  const daily = weatherData.daily;
  const dates = daily.time;
  
  dates.forEach((dateStr, i) => {
    const date = new Date(dateStr);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    
    const high = Math.round(daily.temperature_2m_max[i]);
    const low = Math.round(daily.temperature_2m_min[i]);
    const code = daily.weathercode[i];
    const emoji = getWeatherEmoji(code);
    
    const dayDiv = document.createElement("div");
    dayDiv.className = "weather-day";
    dayDiv.innerHTML = `
      <span class="weather-date">${dayName}</span>
      <span class="weather-icon">${emoji}</span>
      <span class="weather-temps">
        <span class="weather-high">${high}°</span>
        <span class="weather-low">${low}°</span>
      </span>
    `;
    
    popup.appendChild(dayDiv);
  });
  
  widget.appendChild(popup);
}

function toggleWeatherPopup() {
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;
  
  let popup = widget.querySelector(".weather-popup");
  
  if (!popup && weatherData) {
    createWeatherPopup();
    popup = widget.querySelector(".weather-popup");
  }
  
  if (popup) {
    popup.classList.toggle("show");
  }
}

// Close popup when clicking outside
document.addEventListener("click", (e) => {
  const widget = document.getElementById("weatherWidget");
  if (!widget) return;
  
  const popup = widget.querySelector(".weather-popup");
  if (popup && !widget.contains(e.target)) {
    popup.classList.remove("show");
  }
});

// Initialize weather
document.addEventListener("DOMContentLoaded", () => {
  fetchParisWeather();
  
  const widget = document.getElementById("weatherWidget");
  if (widget) {
    widget.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWeatherPopup();
    });
  }
  
  // Refresh weather every hour
  setInterval(fetchParisWeather, 3600000);
});
