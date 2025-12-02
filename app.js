// -----------------------------------------
// MAIN APP.JS — CLEAN UTF-8 SAFE VERSION
// -----------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  loadModules();
  startParisClock();
});

// -----------------------------------------
// MODULE LOADER (loads module.html into cards)
// -----------------------------------------

async function loadModules() {
  const modules = document.querySelectorAll(".module-box");

  for (const box of modules) {
    const url = box.dataset.module;

    try {
      const html = await fetch(url, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        cache: "no-store"
      }).then(res => res.text());

      box.innerHTML = html;

    } catch (err) {
      box.innerHTML = `<p style="color:red;">Module failed to load: ${url}</p>`;
      console.error("Module load error:", url, err);
    }
  }
}

// -----------------------------------------
// PARIS LOCAL TIME CLOCK
// -----------------------------------------

function startParisClock() {
  function update() {
    try {
      const now = new Date();
      const paris = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Paris"
      }).format(now);

      const el = document.getElementById("parisTime");
      if (el) el.textContent = `Paris time: ${paris}`;
    } catch (e) {
      console.warn("Clock error:", e);
    }
  }

  update();
  setInterval(update, 10000);
}

// -----------------------------------------
// UTF-8 JSON LOADER (used by itinerary.js)
// -----------------------------------------

export async function loadJSON(path) {
  return fetch(path, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
    cache: "no-store"
  }).then(res => res.json());
}
