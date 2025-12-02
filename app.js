// -------- MODULE LOADER -------- //
async function loadModules() {
  const modules = document.querySelectorAll(".module-box");

  for (const box of modules) {
    const url = box.dataset.module;

    try {
      const html = await fetch(url).then(r => r.text());
      box.innerHTML = html;

      // Re-execute any scripts inside loaded module
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

// -------- INITIALIZE EVERYTHING AFTER MODULES LOADED -------- //
async function init() {
  await loadModules();

  // Now we can safely initialize map & widgets
  initializeMap();
  updateParisTime();
  setInterval(updateParisTime, 15000);

  // If your modules include weather scripts:
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

// -------- LEAFLET MAP (waits until module is injected) -------- //
function initializeMap() {
  const container = document.getElementById("map");
  if (!container) {
    console.warn("Map container not found — module may not have loaded yet.");
    return;
  }

  const map = L.map("map").setView([48.83055, 2.35582], 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const marker = L.marker([48.83055, 2.35582]).addTo(map);
  marker.bindPopup(
    `<b>Home HQ</b><br>7 Avenue Stephen Pichon<br>Bât. B, rez de chaussée<br>75013 Paris`
  ).openPopup();
}
