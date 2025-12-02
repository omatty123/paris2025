// Helper to load a module HTML file into a container
function loadModule(containerId, path) {
  const container = document.getElementById(containerId);
  if (!container) return;

  fetch(path)
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.text();
    })
    .then((html) => {
      container.innerHTML = html;
      container.classList.remove("module-loading");

      // Reactivate any <script> tags inside the loaded module
      const scripts = container.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");

        // Copy attributes (like src, type)
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Inline script content
        newScript.textContent = oldScript.textContent;

        // Replace the old script
        oldScript.replaceWith(newScript);
      });
    })
    .catch((err) => {
      console.error("Failed to load module:", path, err);
      container.classList.remove("module-loading");
      container.innerHTML =
        '<p style="color:#b91c1c;font-size:0.9rem;">Error loading this section.</p>';
    });
}

// Update the Paris time badge
function startParisClock() {
  const el = document.getElementById("paris-time");
  if (!el) return;

  function update() {
    const now = new Date();
    const opts = {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    };
    const fmt = new Intl.DateTimeFormat("en-GB", opts);
    el.textContent = fmt.format(now);
  }

  update();
  setInterval(update, 60000);
}

document.addEventListener("DOMContentLoaded", () => {
  // Load all modules into their cards
  loadModule("map-section", "modules/map.html");
  loadModule("itinerary-section", "modules/itinerary.html");
  loadModule("paris-weather-section", "modules/paris-weather.html");
  loadModule("flight-weather-section", "modules/flight-weather.html");
  loadModule("flight-status-section", "modules/flight-status.html");

  // Start the Paris clock
  startParisClock();
});
