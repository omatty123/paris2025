// -----------------------
// DYNAMIC MODULE LOADING
// -----------------------

document.addEventListener("DOMContentLoaded", () => {
  
  // Load all module boxes
  document.querySelectorAll(".module-box").forEach(box => {
    const url = box.dataset.module;
    if (!url) return;

    fetch(url)
      .then(response => response.text())
      .then(html => {
        box.innerHTML = html;
      })
      .catch(err => {
        box.innerHTML = `<p style="color:red;">Failed to load module.</p>`;
        console.error("Module load error:", err);
      });
  });

  // Start Paris clock
  startParisClock();
});


// -----------------------
// PARIS CLOCK
// -----------------------

function startParisClock() {
  function update() {
    const parisTime = new Date().toLocaleTimeString("en-US", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
    });

    const el = document.getElementById("parisTime");
    if (el) el.textContent = `Paris time: ${parisTime}`;
  }

  update();
  setInterval(update, 30000);
}


// -----------------------
// SCROLL TO MODULE
// -----------------------

function scrollToModule(id) {
  const el = document.getElementById(id);
  if (el) {
    window.scrollTo({
      top: el.offsetTop - 40,
      behavior: "smooth",
    });
  }
}
