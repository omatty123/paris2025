// map.js
// Creates an interactive Google map and exposes MapAPI for itinerary.js

let mapInstance = null;
let markers = {};
let selectedDayId = null;

// Trip date mapping for the "today" filter
const DAY_DATE_MAP = {
  dec3: "2025-12-03",
  dec4: "2025-12-04",
  dec5: "2025-12-05",
  dec6: "2025-12-06",
  dec7: "2025-12-07",
  dec8: "2025-12-08",
  dec9: "2025-12-09"
};

// Initialize the Google map (called by API callback)
function initLiveMap() {
  const mapEl = document.getElementById("liveMap");
  if (!mapEl) return;

  mapInstance = new google.maps.Map(mapEl, {
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true
  });

  // Load places.json and create markers
  fetch("places.json")
    .then((res) => res.json())
    .then((places) => {
      const bounds = new google.maps.LatLngBounds();

      Object.keys(places).forEach((name) => {
        const p = places[name];
        const position = { lat: p.lat, lng: p.lng };

        const marker = new google.maps.Marker({
          position,
          map: mapInstance,
          title: name
        });

        const info = new google.maps.InfoWindow({
          content: `<div style="font-family: 'Cormorant Garamond', serif; font-size: 14px;">
                      <strong>${name}</strong>
                    </div>`
        });

        marker.addListener("click", () => {
          info.open(mapInstance, marker);
        });

        markers[name] = marker;
        bounds.extend(position);
      });

      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds);
      }
    })
    .catch((err) => {
      console.error("Failed to load places.json", err);
    });

  // Wire toolbar after map exists
  wireMapToolbar();
}

// Highlight a place by name (bounce and center)
function highlightPlace(name) {
  if (!mapInstance) return;
  const marker = markers[name];
  if (!marker) return;

  mapInstance.panTo(marker.getPosition());
  mapInstance.setZoom(Math.max(mapInstance.getZoom(), 14));

  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => {
    marker.setAnimation(null);
  }, 1500);
}

// Focus a place by name (center and open info window)
function focusPlace(name) {
  if (!mapInstance) return;
  const marker = markers[name];
  if (!marker) return;

  mapInstance.panTo(marker.getPosition());
  mapInstance.setZoom(15);
}

// Show only markers whose names are in the list
function showMarkersForList(names) {
  const nameSet = new Set(names);

  Object.entries(markers).forEach(([name, marker]) => {
    marker.setVisible(nameSet.has(name));
  });

  const visibleMarkers = Object.values(markers).filter((m) => m.getVisible());
  if (visibleMarkers.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    visibleMarkers.forEach((m) => {
      bounds.extend(m.getPosition());
    });
    mapInstance.fitBounds(bounds);
  }
}

// Show all markers
function showAllMarkers() {
  Object.values(markers).forEach((marker) => marker.setVisible(true));

  const all = Object.values(markers);
  if (all.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    all.forEach((m) => bounds.extend(m.getPosition()));
    mapInstance.fitBounds(bounds);
  }
}

// Clear visual highlighting (currently just a no-op hook)
function clearHighlights() {
  // Bounce animation stops automatically, nothing persistent to clear now.
}

// Filter markers by actual calendar date string "YYYY-MM-DD"
function filterMarkersByDate(dateString, dayColumnsMap) {
  const dayId = Object.keys(DAY_DATE_MAP).find(
    (id) => DAY_DATE_MAP[id] === dateString
  );

  if (!dayId) {
    alert("Today is outside the trip range.");
    return;
  }

  const names = dayColumnsMap[dayId] || [];
  if (!names.length) {
    alert("No items mapped for this day.");
    return;
  }

  showMarkersForList(names);
}

// Wire the toolbar buttons
function wireMapToolbar() {
  const toolbar = document.getElementById("mapToolbar");
  if (!toolbar) return;

  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (!window.MapAPI) return;

    if (action === "showAll") {
      window.MapAPI.showAllMarkers();
    } else if (action === "today") {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      window.MapAPI.filterToday(dateStr);
    } else if (action === "selected") {
      window.MapAPI.filterSelectedDay();
    } else if (action === "clear") {
      window.MapAPI.clearHighlights();
    }
  });
}

// Expose an API for itinerary.js
window.MapAPI = {
  highlightPlace,
  focusPlace,
  showMarkersForList,
  showAllMarkers,
  clearHighlights,
  setSelectedDayId(id) {
    selectedDayId = id;
  },
  filterToday(dateStr) {
    if (!window.DayColumnMap) {
      alert("Day data not available yet.");
      return;
    }
    filterMarkersByDate(dateStr, window.DayColumnMap);
  },
  filterSelectedDay() {
    if (!selectedDayId) {
      alert("No day selected.");
      return;
    }
    if (!window.DayColumnMap) return;
    const names = window.DayColumnMap[selectedDayId] || [];
    if (!names.length) {
      alert("Selected day has no mapped places.");
      return;
    }
    showMarkersForList(names);
  }
};
