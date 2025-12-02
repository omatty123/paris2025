// Load external modules into <div class="module-box">
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
      console.error(`Module failed: ${url}`, err);
      box.innerHTML = `<p style="color:red;">Error loading ${url}</p>`;
    }
  }
}


// Scroll to section
function scrollToModule(id) {
  document.getElementById(id).scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// Update Paris time
function updateParisTime() {
  const now = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("parisTime").textContent = `Paris time: ${now}`;
}

setInterval(updateParisTime, 15000);


// Initialize after DOM loads
document.addEventListener("DOMContentLoaded", async () => {
  await loadModules();
  updateParisTime();
});
