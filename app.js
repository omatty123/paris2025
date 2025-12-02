// Smooth scroll to a module card
function scrollToModule(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Paris time updater
function startParisClock() {
  function update() {
    const t = new Date().toLocaleTimeString("en-US", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit"
    });
    const span = document.getElementById("parisTime");
    if (span) {
      span.textContent = "Paris time: " + t;
    }
  }
  update();
  setInterval(update, 30000);
}

// Execute scripts inside an injected HTML fragment
function executeModuleScripts(container) {
  const scripts = container.querySelectorAll("script");
  scripts.forEach(oldScript => {
    const newScript = document.createElement("script");

    if (oldScript.src) {
      // Special case: itinerary.js path inside modules/itinerary.html
      if (oldScript.src.includes("itinerary.js")) {
        // We will load itinerary.js explicitly from modules folder
        oldScript.remove();
        return;
      } else {
        newScript.src = oldScript.src;
      }
    } else {
      newScript.textContent = oldScript.textContent;
    }

    document.body.appendChild(newScript);
    oldScript.remove();
  });
}

// Load all [data-module] boxes
async function loadModules() {
  const boxes = document.querySelectorAll(".module-box[data-module]");
  const tasks = [];

  boxes.forEach(box => {
    const url = box.getAttribute("data-module");
    if (!url) return;

    const job = fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch " + url);
        return res.text();
      })
      .then(html => {
        box.innerHTML = html;
        executeModuleScripts(box);
      })
      .catch(err => {
        console.error("Module load error for", url, err);
        box.innerHTML = `<p style="color:red; font-size:13px;">Failed to load module: ${url}</p>`;
      });

    tasks.push(job);
  });

  // After all modules are loaded, explicitly load itinerary.js once
  await Promise.all(tasks);
  injectItineraryScript();
}

function injectItineraryScript() {
  const script = document.createElement("script");
  script.src = "modules/itinerary.js";
  document.body.appendChild(script);
}

// Init on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  startParisClock();
  loadModules();
});
