// app.js
// Paris time + weather (today + 5 days) for Paris.

/* Paris time */

function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;

  const now = new Date();

  const options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
    hour12: false
  };

  const timeStr = new Intl.DateTimeFormat("en-GB", options).format(now);
  el.textContent = "Paris time: " + timeStr;
}

updateParisTime();
setInterval(updateParisTime, 30000);


