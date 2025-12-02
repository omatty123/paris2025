console.log("App JS loaded.");

/* MODULE LOADER */
document.querySelectorAll(".module-box").forEach(box => {
  const url = box.dataset.module;

  fetch(url)
    .then(res => res.text())
    .then(html => (box.innerHTML = html))
    .catch(err => {
      box.innerHTML =
        "<p style='color:red;'>Module failed to load: " + url + "</p>";
    });
});

/* PARIS CLOCK */
function updateParisTime() {
  const now = new Date().toLocaleTimeString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  document.getElementById("parisTime").textContent = "Paris time: " + now;
}
setInterval(updateParisTime, 1000);
updateParisTime();

/* SMOOTH SCROLL */
function scrollToModule(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
