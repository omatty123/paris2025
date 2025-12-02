// Smooth scroll
function scrollToModule(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// Paris time updater
function updateParisTime() {
  const time = new Date().toLocaleTimeString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("parisTime").textContent = `Paris time: ${time}`;
}
setInterval(updateParisTime, 1000);
updateParisTime();

// Load modules dynamically
async function loadModules() {
  const boxes = document.querySelectorAll(".module-box");

  for (const box of boxes) {
    const url = box.dataset.module;
    if (!url) continue;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed ${url}`);
      const html = await res.text();
      box.innerHTML = html;

    } catch (err) {
      console.error("Module load error:", err);
      box.innerHTML = `<p style="color:red;">Failed to load module: ${url}</p>`;
    }
  }
}

loadModules();
