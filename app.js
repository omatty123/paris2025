// Load external module HTML into each module-box
async function loadModules() {
  const modules = document.querySelectorAll(".module-box");

  for (const box of modules) {
    const url = box.dataset.module;

    const html = await fetch(url).then(r => r.text());
    box.innerHTML = html;

    // Execute scripts inside loaded module
    const scripts = box.querySelectorAll("script");
    scripts.forEach(oldScript => {
      const newScript = document.createElement("script");
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.replaceWith(newScript);
    });
  }
}

loadModules();

// Smooth scroll
function scrollToModule(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Paris time updater
function updateParisTime() {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("parisTime").textContent = `Paris time: ${now}`;
}

setInterval(updateParisTime, 15000);
updateParisTime();

// Leaflet map
document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([48.83055, 2.35582], 17);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const marker = L.marker([48.83055, 2.35582]).addTo(map);
  marker.bindPopup(
    `<b>Home HQ</b><br>7 Avenue Stephen Pichon<br>Bât. B, rez de chaussée<br>75013 Paris`
  ).openPopup();
});
