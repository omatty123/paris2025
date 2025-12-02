/* ============================================================
   APP.JS — Clean version
   - Paris time clock
   - Weather (today + next 5 days)
   ============================================================ */

/* -------------------- PARIS TIME --------------------------- */

function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;

  const nowParis = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  el.textContent = `Paris time: ${nowParis}`;
}

setInterval(updateParisTime, 1000);
updateParisTime();


/* -------------------- WEATHER ------------------------------ */

/* Weather icons based on Open-Meteo weather codes */
function iconFor(code) {
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

async function loadWeather() {
  const container = document.getElementById("paris-weather-days");
  if (!container) return;

  container.innerHTML = "<p>Loading…</p>";

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.8566&longitude=2.3522" +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min" +
    "&timezone=Europe%2FParis";

  let data;

  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    container.innerHTML = "<p>Weather unavailable.</p>";
    console.error("Weather error:", err);
    return;
  }

  container.innerHTML = "";

  const todayParis = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  });

  const startIndex = data.daily.time.indexOf(todayParis);

  /* Guarantees today + next 5 days */
  for (let i = startIndex; i < startIndex + 6; i++) {
    const dayISO = data.daily.time[i];
    const d = new Date(dayISO);

    const displayDate = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const code = data.daily.weathercode[i];
    const hi = Math.round(data.daily.temperature_2m_max[i]);
    const lo = Math.round(data.daily.temperature_2m_min[i]);

    const link =
      "https://www.meteofrance.com/previsions-meteo-france/paris-75000?day=" +
      dayISO;

    const div = document.createElement("div");
    div.className = "weather-day";
    div.innerHTML = `
      <div class="weather-emoji">${iconFor(code)}</div>
      <div class="weather-date">${displayDate}</div>
      <div class="weather-temps">${hi}° / ${lo}°C</div>
    `;

    div.onclick = () => window.open(link, "_blank");
    container.appendChild(div);
  }
}

loadWeather();
