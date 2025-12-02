// ===============================
//   Modular loader for the site
// ===============================

// This function loads an HTML fragment into the main content area
async function loadModule(moduleName) {
  const container = document.getElementById("content");
  if (!container) {
    console.error("No #content container found in index.html");
    return;
  }

  try {
    const response = await fetch(`modules/${moduleName}.html`);
    const html = await response.text();
    container.innerHTML = html;

    // After inserting module HTML into the page,
    // We now check whether we must load a JS module

    if (moduleName === "itinerary") {
      // Load Trello style itinerary board logic
      import("./modules/itinerary.js");
    }

    if (moduleName === "map") {
      // If you add map JS later, load it here
      // import("./modules/map.js");
    }

    if (moduleName === "paris-weather") {
      // If you add weather logic, load it here
      // import("./modules/paris-weather.js");
    }

    if (moduleName === "flight-weather") {
      // If needed
      // import("./modules/flight-weather.js");
    }

    if (moduleName === "flight-status") {
      // If needed
      // import("./modules/flight-status.js");
    }

  } catch (err) {
    console.error("Error loading module:", moduleName, err);
    if (container) {
      container.innerHTML = `<p>Could not load module: ${moduleName}</p>`;
    }
  }
}

// ========================================
//   NAVIGATION HANDLING
// ========================================

// Attach click handlers for navigation links if present
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-module]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const mod = link.dataset.module;
      loadModule(mod);
    });
  });

  // Load default module on first page load
  loadModule("itinerary");
});
