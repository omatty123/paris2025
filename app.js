// -------- MODULE LOADER -------- //
async function loadModules() {
  const modules = document.querySelectorAll(".module-box");

  for (const box of modules) {
    const url = box.dataset.module;

    try {
      const html = await fetch(url).then(r => r.text());
      box.innerHTML = html;

      // Execute any scripts inside the loaded module
      const scripts = box.querySelectorAll("script");
      scripts.forEach(oldScript => {
        const newScript = document.createElement("script");
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
      });

    } catch (err) {
      console.error(`Failed loading module: ${url}`, err);
      box.innerHTML = `<p style="color:red;">Error loading module: ${url}</p>`;
    }
  }
}

// -------- INITIALIZE EVERYTHING AFTER MODULES LOAD -------- //
async function init() {
  await loadModules();

  updateParisTime();
  setInterval(updateParisTime, 15000);

  if (typeof loadParisWeather === "function") loadParisWeather();
  if (typeof loadFlightWeather === "function") loadFlightWeather();
  if (typeof initItinerary === "function") initItinerary();
}

document.addEventListener("DOMContentLoaded", init);

// -------- SCROLL TO MODULE -------- //
function scrollToModule(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// -------- PARIS CLOCK -------- //
function updateParisTime() {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("parisTime").textContent = `Paris time: ${now}`;
}

// -------- PARIS WEATHER (ICONS + CLICKABLE LINKS) -------- //
async function loadParisWeather() {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis";

  try {
    const data = await fetch(url).then(r => r.json());

    const container = document.getElementById("paris-weather-days");
    if (!container) return;
    container.innerHTML = "";

    const days = data.daily.time;
    const icons = data.daily.weathercode;
    const tmax = data.daily.temperature_2m_max;
    const tmin = data.daily.temperature_2m_min;

    const iconURL = (code) =>
      `https://www.open-meteo.com/images/weather-icons/${code}.png`;

    days.forEach((day, i) => {
      const pretty = new Date(day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      // Link to weather.com
      const link = `https://weather.com/weather/tenday/l/Paris+France?day=${i}`;

      const div = document.createElement("div");
      div.className = "weather-day";

      div.innerHTML = `
        <a href="${link}" target="_blank" rel="noopener noreferrer">
          <img src="${iconURL(icons[i])}" alt="weather icon">
          <div style="font-weight:600; margin-bottom:4px;">${pretty}</div>
          <div>${Math.round(tmax[i])}° / ${Math.round(tmin[i])}°C</div>
        </a>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Weather load error", err);
  }
}
