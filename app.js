// -------- ROUTES AND MODULE LOADING --------

const ROUTES = {
  "itinerary": "modules/itinerary.html",
  "flight-weather": "modules/flight-weather.html",
  "paris-weather": "modules/paris-weather.html",
  "map": "modules/map.html",
  "flight-status": "modules/flight-status.html"
};

const moduleContainer = document.getElementById("module-container");
let currentRoute = null;

// Simple SPA routing using hash
function getRouteFromHash() {
  const hash = window.location.hash.replace("#", "");
  return ROUTES[hash] ? hash : "itinerary";
}

async function loadRoute(route, pushHash = true) {
  if (!ROUTES[route]) route = "itinerary";
  if (pushHash) window.location.hash = route;
  currentRoute = route;

  // Active nav state
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  moduleContainer.innerHTML = `
    <div class="loading-placeholder">
      <i class="fas fa-spinner fa-spin"></i> Loading ${route.replace("-", " ")}…
    </div>
  `;

  try {
    const res = await fetch(ROUTES[route]);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const html = await res.text();
    moduleContainer.innerHTML = html;
    initModule(route);
  } catch (err) {
    console.error("Module load failed:", err);
    moduleContainer.innerHTML = `
      <p style="text-align:center;color:#e74c3c">
        Failed to load this section. Check your connection or GitHub paths.
      </p>`;
  }
}

// -------- GLOBAL: PARIS TIME, OFFLINE, SUMMARY WEATHER --------

function updateParisTime() {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const timeStr = parisTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("paris-time").textContent = timeStr;
}

function setupOfflineDetection() {
  const offlineMsg = document.getElementById("offline-message");

  function setState() {
    offlineMsg.style.display = navigator.onLine ? "none" : "block";
  }

  window.addEventListener("online", () => {
    setState();
    refreshActiveModule();
  });
  window.addEventListener("offline", setState);
  setState();
}

// Basic Paris forecast for summary card
async function updateParisSummaryWeather() {
  try {
    // Paris coordinates
    const lat = 48.8566;
    const lon = 2.3522;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      "&current_weather=true&timezone=Europe%2FParis";

    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    const current = data.current_weather;
    const tempC = current.temperature;
    const code = current.weathercode;
    const desc = describeWeatherCode(code);

    const tempF = Math.round(tempC * 9 / 5 + 32);
    document.getElementById("summary-paris-weather").textContent =
      `${tempF}°F, ${desc}`;
  } catch (e) {
    console.error("Paris summary weather error:", e);
  }
}

// -------- FLIGHT WEATHER LOGIC (similar to your previous version) --------

const airports = {
  ATW: { code: "ATW", name: "Appleton ATW", lat: 44.2581, lon: -88.5191, tz: "America/Chicago" },
  DTW: { code: "DTW", name: "Detroit DTW", lat: 42.2162, lon: -83.3554, tz: "America/New_York" },
  CDG: { code: "CDG", name: "Paris CDG", lat: 49.0097, lon: 2.5479, tz: "Europe/Paris" }
};

const events = [
  { id: "ATW_TAKE",  label: "ATW → DTW take-off",   airport: "ATW", iso: "2025-12-01T17:21:00-06:00" },
  { id: "DTW_LAND1", label: "ATW → DTW landing",    airport: "DTW", iso: "2025-12-01T19:43:00-05:00" },
  { id: "DTW_TAKE",  label: "DTW → CDG take-off",   airport: "DTW", iso: "2025-12-01T21:20:00-05:00" },
  { id: "CDG_LAND",  label: "DTW → CDG landing",    airport: "CDG", iso: "2025-12-02T11:05:00+01:00" },
  { id: "CDG_TAKE",  label: "CDG → DTW take-off",   airport: "CDG", iso: "2025-12-08T10:30:00+01:00" },
  { id: "DTW_LAND2", label: "CDG → DTW landing",    airport: "DTW", iso: "2025-12-08T13:45:00-05:00" },
  { id: "DTW_TAKE2", label: "DTW → ATW take-off",   airport: "DTW", iso: "2025-12-08T16:50:00-05:00" },
  { id: "ATW_LAND",  label: "DTW → ATW landing",    airport: "ATW", iso: "2025-12-08T17:14:00-06:00" }
];

const flightCache = new Map();
let lastUpdated = new Date();

function formatDateTimeShort(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function describeWeatherCode(code) {
  const map = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
    96: "Storm with hail",
    99: "Severe hail"
  };
  return map[code] || "Weather";
}

function classifyFlight(code, wind, prec) {
  const badCodes = [65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
  if (badCodes.includes(code) || wind >= 45 || prec >= 4) return "BAD";
  return "GOOD";
}

function getTempColor(tempF) {
  if (tempF < 32) return "#3498db";
  if (tempF < 50) return "#2ecc71";
  if (tempF < 70) return "#f1c40f";
  return "#e74c3c";
}

function nearestIndex(times, target) {
  const t = target.getTime();
  return times.reduce((best, cur, i) =>
    Math.abs(new Date(cur).getTime() - t) <
    Math.abs(new Date(times[best]).getTime() - t) ? i : best, 0);
}

async function fetchForecast(ap) {
  if (flightCache.has(ap.code)) {
    const cached = flightCache.get(ap.code);
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.data;
    }
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${ap.lat}&longitude=${ap.lon}` +
    "&hourly=temperature_2m,weathercode,precipitation,windspeed_10m" +
    `&timezone=${encodeURIComponent(ap.tz)}&forecast_days=16`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    flightCache.set(ap.code, { data, timestamp: Date.now() });
    return data;
  } catch (e) {
    console.error("Flight weather fetch failed:", e);
    return null;
  }
}

function updateLastUpdated() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  const now = new Date();
  const diffMin = Math.floor((now - lastUpdated) / 60000);
  if (diffMin < 1) el.textContent = "Just now";
  else if (diffMin === 1) el.textContent = "1 minute ago";
  else if (diffMin < 60) el.textContent = `${diffMin} minutes ago`;
  else {
    const hours = Math.floor(diffMin / 60);
    if (hours === 1) el.textContent = "1 hour ago";
    else el.textContent = `${hours} hours ago`;
  }
}

function updateNextFlightShort() {
  const now = Date.now();
  const upcoming = events.filter(ev => new Date(ev.iso).getTime() > now);
  const el = document.getElementById("next-flight-short");
  if (!el) return;

  if (upcoming.length === 0) {
    el.textContent = "All flights completed";
    return;
  }

  const next = upcoming[0];
  const diff = new Date(next.iso).getTime() - now;
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  el.textContent = `${next.label} in ${d}d ${h}h ${m}m`;
}

// Initialize table rows in flight-weather module
function initFlightWeatherTableSkeleton() {
  const tbody = document.getElementById("flight-weather-rows");
  if (!tbody) return;
  tbody.innerHTML = "";
  events.forEach(ev => {
    const ap = airports[ev.airport];
    const tr = document.createElement("tr");
    tr.id = "row_" + ev.id;
    tr.innerHTML = `
      <td data-label="Segment">
        <div class="segment-info">
          <strong>${ev.label}</strong>
          <div class="small">${ap.name}</div>
        </div>
      </td>
      <td data-label="Local time">${formatDateTimeShort(new Date(ev.iso))}</td>
      <td data-label="Summary">
        <div class="weather-details">
          <span class="small">Loading…</span>
        </div>
      </td>
      <td data-label="Weather">
        <span class="tag wait">WAIT</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Fetch and fill flight weather data
async function updateAllFlightWeather() {
  const tbody = document.getElementById("flight-weather-rows");
  if (!tbody) return; // not on this module

  lastUpdated = new Date();
  updateLastUpdated();

  const byAirport = {};
  events.forEach(ev => (byAirport[ev.airport] ||= []).push(ev));

  for (const code of Object.keys(byAirport)) {
    const ap = airports[code];
    const data = await fetchForecast(ap);
    if (!data) continue;

    const { time, temperature_2m, weathercode, precipitation, windspeed_10m } =
      data.hourly;

    byAirport[code].forEach(ev => {
      const row = document.getElementById("row_" + ev.id);
      if (!row) return;

      const idx = nearestIndex(time, new Date(ev.iso));
      const t = temperature_2m[idx];
      const p = precipitation[idx];
      const w = windspeed_10m[idx];
      const c = weathercode[idx];

      const rating = classifyFlight(c, w, p);
      const desc = describeWeatherCode(c);
      const tempF = Math.round(t * 9 / 5 + 32);
      const tempColor = getTempColor(tempF);

      row.children[2].innerHTML = `
        <div class="weather-details">
          <div class="temp-with-trend">
            <span style="color:${tempColor}; font-weight:600">${tempF}°F</span>
            <span class="trend">↗</span>
          </div>
          <div class="small">${desc}</div>
          <div class="small">Wind: ${Math.round(w)} mph</div>
        </div>
      `;

      row.children[3].innerHTML =
        `<span class="tag ${rating.toLowerCase()}">${rating}</span>`;
    });
  }
}

// Update the long countdown inside flight-weather module
function updateFlightWeatherCountdown() {
  const el = document.getElementById("flight-countdown");
  if (!el) return;
  const now = Date.now();
  const upcoming = events.filter(ev => new Date(ev.iso).getTime() > now);
  if (upcoming.length === 0) {
    el.textContent = "All flights completed";
    return;
  }
  const next = upcoming[0];
  const diff = new Date(next.iso).getTime() - now;
  const d = Math.floor(diff / 864e5);
  const h = Math.floor((diff % 864e5) / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  el.textContent = `${next.label} in ${d}d ${h}h ${m}m`;
}

// -------- PARIS WEATHER MODULE (5 day) --------

async function initParisWeatherModule() {
  const container = document.getElementById("paris-weather-days");
  if (!container) return;

  container.innerHTML = `
    <div class="skeleton" style="height:18px"></div>
    <div class="skeleton" style="height:60px"></div>
    <div class="skeleton" style="height:60px"></div>
    <div class="skeleton" style="height:60px"></div>
    <div class="skeleton" style="height:60px"></div>
  `;

  try {
    const lat = 48.8566;
    const lon = 2.3522;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      "&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FParis&forecast_days=6";

    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();

    const { time, temperature_2m_max, temperature_2m_min, weathercode } =
      data.daily;

    container.innerHTML = "";

    for (let i = 0; i < Math.min(time.length, 6); i++) {
      const date = new Date(time[i]);
      const maxC = temperature_2m_max[i];
      const minC = temperature_2m_min[i];
      const code = weathercode[i];

      const maxF = Math.round(maxC * 9 / 5 + 32);
      const minF = Math.round(minC * 9 / 5 + 32);
      const desc = describeWeatherCode(code);

      const dayStr = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      const div = document.createElement("div");
      div.style.marginBottom = "0.6rem";
      div.innerHTML = `
        <strong>${dayStr}</strong><br>
        <span>${minF}°F – ${maxF}°F</span><br>
        <span class="small">${desc}</span>
      `;
      container.appendChild(div);
    }
  } catch (e) {
    console.error("Paris weather module error:", e);
    container.innerHTML = `<p style="color:#e74c3c">Could not load forecast.</p>`;
  }
}

// -------- ITINERARY MODULE BEHAVIOR --------

function initItineraryModule() {
  // Mark current day inside itinerary
  const now = new Date();
  const tripStart = new Date(2025, 11, 2); // Dec 2, 2025
  const dayDiff = Math.floor((now - tripStart) / (1000 * 60 * 60 * 24));

  const detailsList = document.querySelectorAll(".itin-details details");
  detailsList.forEach((detail, index) => {
    if (index === dayDiff && dayDiff >= 0 && dayDiff <= 6) {
      detail.open = true;
      detail.classList.add("current-day");
    } else {
      detail.classList.remove("current-day");
    }
  });

  // Copy buttons
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const text = btn.parentNode.textContent.replace("Copy", "").trim();
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.color = "var(--good)";
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.color = "";
        }, 2000);
      }).catch(err => console.error("Copy failed:", err));
    });
  });

  // Share button
  const shareBtn = document.getElementById("share-trip");
  if (shareBtn) {
    if (navigator.share) {
      shareBtn.onclick = async () => {
        try {
          await navigator.share({
            title: "My Paris Trip Itinerary",
            text: "Paris trip itinerary for December 2–8, 2025",
            url: window.location.href
          });
        } catch (err) {
          console.log("Share cancelled:", err);
        }
      };
    } else {
      shareBtn.onclick = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          const original = shareBtn.innerHTML;
          shareBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          setTimeout(() => {
            shareBtn.innerHTML = original;
          }, 2000);
        });
      };
    }
  }
}

// -------- MAP MODULE BEHAVIOR --------

let mapInstance = null;

function initMapModule() {
  const mapDiv = document.getElementById("map");
  if (!mapDiv) return;

  if (mapInstance) {
    mapInstance.invalidateSize();
    return;
  }

  const aptLatLng = [48.8198, 2.3569]; // 7 Av. Stephen Pichon
  mapInstance = L.map("map").setView(aptLatLng, 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(mapInstance);

  // Red dot for Home HQ
  L.circleMarker(aptLatLng, {
    radius: 8,
    color: "#e74c3c",
    fillColor: "#e74c3c",
    fillOpacity: 0.9
  })
    .addTo(mapInstance)
    .bindPopup("<b>Home HQ</b><br>7 Av. Stephen Pichon, Bât. B, rez-de-chaussée");

  mapInstance.invalidateSize();
}

// -------- FLIGHT STATUS MODULE --------

function initFlightStatusModule() {
  // Not much logic needed, mostly static info
}

// -------- MODULE INITIALIZER SWITCH --------

function initModule(route) {
  if (route === "itinerary") {
    initItineraryModule();
  } else if (route === "flight-weather") {
    initFlightWeatherTableSkeleton();
    updateAllFlightWeather();
    updateFlightWeatherCountdown();
  } else if (route === "paris-weather") {
    initParisWeatherModule();
  } else if (route === "map") {
    initMapModule();
  } else if (route === "flight-status") {
    initFlightStatusModule();
  }
}

// When coming back online or at intervals, refresh if needed
function refreshActiveModule() {
  if (currentRoute === "flight-weather") {
    updateAllFlightWeather();
  } else if (currentRoute === "paris-weather") {
    initParisWeatherModule();
  } else if (currentRoute === "map") {
    initMapModule();
  }
}

// -------- INITIAL SETUP --------

document.addEventListener("DOMContentLoaded", () => {
  // Nav button listeners
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route;
      loadRoute(route, true);
    });
  });

  // Routing
  window.addEventListener("hashchange", () => {
    const route = getRouteFromHash();
    loadRoute(route, false);
  });

  // Initial route
  const initialRoute = getRouteFromHash();
  loadRoute(initialRoute, true);

  // Globals
  setupOfflineDetection();
  updateParisTime();
  setInterval(updateParisTime, 60000);

  updateParisSummaryWeather();
  setInterval(updateParisSummaryWeather, 30 * 60 * 1000);

  updateNextFlightShort();
  setInterval(updateNextFlightShort, 60000);

  setInterval(updateLastUpdated, 60000);
});
