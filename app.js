// app.js
// Handles Paris time display and weather starting from "today".

// Paris clock
function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;

  const nowParis = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );

  const timeString = nowParis.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });

  el.textContent = "Paris time: " + timeString;
}

updateParisTime();
setInterval(updateParisTime, 30000);

// Weather icons
function parisWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

// Helper: get today's date in Paris as YYYY-MM-DD
function getTodayParisISO() {
  const nowParis = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const y = nowParis.getFullYear();
  const m = String(nowParis.getMonth() + 1).padStart(2, "0");
  const d = String(nowParis.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Load Paris weather from Open-Meteo and start from "today" in Paris
async function loadParisWeather() {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.8566&longitude=2.3522" +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min" +
    "&timezone=Europe%2FParis";

  let data;
  try {
    const res = await fetch(url, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    // Fallback through a simple CORS proxy
    const proxy =
      "https://cors-proxy.api.exponential-hub.workers.dev/?" + url;
    const res = await fetch(proxy);
    data = await res.json();
  }

  const container = document.getElementById("paris-weather-days");
  if (!container) return;

  container.innerHTML = "";

  const days = data.daily.time;
  const codes = data.daily.weathercode;
  const tmax = data.daily.temperature_2m_max;
  const tmin = data.daily.temperature_2m_min;

  const todayParis = getTodayParisISO();
  let startIndex = days.findIndex((d) => d === todayParis);
  if (startIndex === -1) startIndex = 0;

  const maxCards = 6;
  const endIndex = Math.min(startIndex + maxCards, days.length);

  for (let i = startIndex; i < endIndex; i++) {
    const d = new Date(days[i]);
    const pretty = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const icon = parisWeatherIcon(codes[i]);
    const hi = Math.round(tmax[i]);
    const lo = Math.round(tmin[i]);

    const link =
      "https://www.meteofrance.com/previsions-meteo-france/paris-75000?day=" +
      days[i];

    const card = document.createElement("div");
    card.className = "weather-day";
    card.innerHTML = `
      <a href="${link}" target="_blank">
        <div class="weather-emoji">${icon}</div>
        <div class="weather-date">${pretty}</div>
        <div class="weather-temps">${hi}° / ${lo}°C</div>
      </a>
    `;
    container.appendChild(card);
  }
}

loadParisWeather();
