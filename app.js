/* --------------------------------------------------
   PARIS LIVE CLOCK
-------------------------------------------------- */
function updateParisClock() {
  const options = {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  };

  const nowParis = new Intl.DateTimeFormat("en-US", options).format(new Date());
  document.getElementById("parisTime").textContent = `Paris time: ${nowParis}`;
}
setInterval(updateParisClock, 1000);
updateParisClock();

/* --------------------------------------------------
   WEATHER (TODAY + 5 DAYS)
   Using Open-Meteo (no key, no limits)
-------------------------------------------------- */

const weatherBox = document.getElementById("paris-weather-days");

// Emoji icon dictionary
const emojiIcons = {
  "clear-day": "☀️",
  "clear-night": "🌙",
  "cloudy": "☁️",
  "partly-cloudy": "⛅️",
  "rain": "🌧️",
  "thunderstorm": "⛈️",
  "snow": "❄️"
};

// Convert Open-Meteo weathercode → emoji
function getEmojiFromWeatherCode(code) {
  if (code === 0) return emojiIcons["clear-day"];
  if (code === 1 || code === 2) return emojiIcons["partly-cloudy"];
  if (code === 3) return emojiIcons["cloudy"];
  if (code >= 51 && code <= 67) return emojiIcons["rain"];
  if (code >= 71 && code <= 77) return emojiIcons["snow"];
  if (code >= 80 && code <= 82) return emojiIcons["rain"];
  if (code >= 95) return emojiIcons["thunderstorm"];
  return "⛅️";
}

// Load weather
async function loadWeather() {
  try {
    weatherBox.innerHTML = "<p>Loading weather…</p>";

    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis";

    const response = await fetch(url);
    const data = await response.json();

    const { time, weathercode, temperature_2m_max, temperature_2m_min } =
      data.daily;

    const todayIndex = 0; // ALWAYS today, not December 1
    const daysToShow = 6; // today + 5 next days

    let html = "";

    for (let i = 0; i < daysToShow; i++) {
      const date = time[todayIndex + i];
      const code = weathercode[todayIndex + i];
      const tmax = Math.round(temperature_2m_max[todayIndex + i]);
      const tmin = Math.round(temperature_2m_min[todayIndex + i]);

      const icon = getEmojiFromWeatherCode(code);

      html += `
        <div class="weather-day"
             onclick="window.open('https://meteofrance.com/previsions-meteo-france/paris-75000/${date}', '_blank')">
          <div>${icon}</div>
          <div style="margin-top:6px; font-size:1.05rem;">
            ${new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
          </div>
          <div style="opacity:0.7; font-size:0.9rem;">
            ${tmax}° / ${tmin}°
          </div>
        </div>
      `;
    }

    weatherBox.innerHTML = html;

  } catch (err) {
    console.error("Weather error:", err);
    weatherBox.innerHTML = "<p>Weather unavailable.</p>";
  }
}

loadWeather();
