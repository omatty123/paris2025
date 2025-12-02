document.addEventListener("DOMContentLoaded", () => {
  const moduleBoxes = document.querySelectorAll(".module-box");

  moduleBoxes.forEach(box => {
    const url = box.dataset.module;
    if (!url) return;

    fetch(url)
      .then(res => res.text())
      .then(html => {
        box.innerHTML = html;

        // If this is the itinerary module, load its JS after HTML inserted
        if (url.includes("itinerary.html")) {
          const script = document.createElement("script");
          script.src = "modules/itinerary.js";
          document.body.appendChild(script);
        }
      })
      .catch(err => {
        box.innerHTML = `<p style="color:red;">Module failed to load.</p>`;
      });
  });
});
