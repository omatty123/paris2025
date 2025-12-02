// app.js
// Paris time + simple 6-day weather (today + 5).

// Paris time
function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;

  const now = new Date();
  const opts = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
    hour12: false
  };
  const timeStr = new Intl.DateTimeFormat("en-GB", opts).format(now);
  el.textContent = `Paris time: ${timeStr}`;
}

updateParisTime();
setInterval(updateParisTime, 30_000);

// Weather helpers

function iconForCode(code) {
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

async function loadParisWeather() {
  const container = document.getElementById("paris-weather-days");
  if (!container) return;

  const baseUrl =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.8566&longitude=2.3522" +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min" +
    "&timezone=Europe%2FParis";

  async function fetchWeather(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Weather HTTP " + res.status);
    return res.json();
  }

  let data;
  try {
    data = await fetchWeather(baseUrl);
  } catch (e) {
    const proxy =
      "https://cors-proxy.api.exponential-hub.workers.dev/?" + baseUrl;
    try {
      data = await fetchWeather(proxy);
    } catch (err) {
      container.textContent = "Could not load weather.";
      console.error(err);
      return;
    }
  }

  container.innerHTML = "";

  const days = data.daily.time;
  const codes = data.daily.weathercode;
  const tmax = data.daily.temperature_2m_max;
  const tmin = data.daily.temperature_2m_min;

  // Compute today's date in Europe/Paris and start from there
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris"
  }); // YYYY-MM-DD

  let startIndex = 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i] >= todayStr) {
      startIndex = i;
      break;
    }
  }

  // Today + next 5
  let count = 0;
  for (let i = startIndex; i < days.length && count < 6; i++, count++) {
    const d = new Date(days[i]);
    const label = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    const icon = iconForCode(codes[i]);
    const hi = Math.round(tmax[i]);
    const lo = Math.round(tmin[i]);

    const link =
      "https://www.meteofrance.com/previsions-meteo-france/paris-75000?day=" +
      d.toISOString().slice(0, 10);

    const card = document.createElement("div");
    card.className = "weather-day";
    card.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener noreferrer">
        <div class="weather-emoji">${icon}</div>
        <div class="weather-date">${label}</div>
        <div class="weather-temps">${hi}° / ${lo}°C</div>
      </a>
    `;
    container.appendChild(card);
  }
}

loadParisWeather();
