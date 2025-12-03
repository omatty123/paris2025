// map.js
// Interactive Google Map with persistent markers in localStorage

let map;
let markers = [];

// This is called by the Google Maps JS API callback in index.html
function initLiveMap() {
  const savedMarkers = loadMarkers();

  map = new google.maps.Map(document.getElementById("liveMap"), {
    center: { lat: 48.8335, lng: 2.3569 },
    zoom: 14,
    mapTypeId: "roadmap"
  });

  // Restore saved markers
  savedMarkers.forEach((m) => {
    addMarker(m.position, m.title, false);
  });

  // Click on map to add a new marker
  map.addListener("click", (event) => {
    const position = event.latLng;
    const title = prompt("Name this location:");
    if (title && title.trim() !== "") {
      addMarker(position, title.trim(), true);
    }
  });
}

function addMarker(position, title, save = true) {
  const marker = new google.maps.Marker({
    position,
    map,
    draggable: true
  });

  marker.title = title;

  const info = new google.maps.InfoWindow({
    content: `
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 16px;">
        <strong>${escapeHtml(title)}</strong><br />
        <button id="renameBtn">Rename</button>
        <button id="deleteBtn">Delete</button>
      </div>
    `
  });

  marker.addListener("click", () => {
    info.open(map, marker);

    google.maps.event.addListenerOnce(info, "domready", () => {
      const renameBtn = document.getElementById("renameBtn");
      const deleteBtn = document.getElementById("deleteBtn");

      if (renameBtn) {
        renameBtn.onclick = () => {
          const newTitle = prompt("New name for this spot:", marker.title || "");
          if (newTitle && newTitle.trim() !== "") {
            marker.title = newTitle.trim();
            saveMarkers();
            info.close();
          }
        };
      }

      if (deleteBtn) {
        deleteBtn.onclick = () => {
          marker.setMap(null);
          markers = markers.filter((m) => m !== marker);
          saveMarkers();
          info.close();
        };
      }
    });
  });

  marker.addListener("dragend", () => {
    saveMarkers();
  });

  markers.push(marker);
  if (save) {
    saveMarkers();
  }
}

function saveMarkers() {
  const data = markers.map((m) => ({
    position: { lat: m.getPosition().lat(), lng: m.getPosition().lng() },
    title: m.title || ""
  }));
  try {
    localStorage.setItem("paris-map-markers", JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save map markers:", e);
  }
}

function loadMarkers() {
  try {
    const raw = localStorage.getItem("paris-map-markers");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("Could not load map markers:", e);
    return [];
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
