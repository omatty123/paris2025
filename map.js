// map.js — Google Maps with AdvancedMarkerElement, color pins, no forced Paris.

// -----------------------------------------------------------------------------
// GLOBALS
// -----------------------------------------------------------------------------
let map;
let geocoder;
let markers = [];

// Home base coordinates
const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

// Color dictionary (day → hex)
const DAY_COLORS = {
  dec3: "#d62828",
  dec4: "#1d4ed8",
  dec5: "#2a9d8f",
  dec6: "#6a0dad",
  dec7: "#f77f00",
  dec8: "#8d6e63",
  dec9: "#000000",
  open: "#666666",
  home: "#000000"
};

// Label mapping
const DAY_LABELS = {
  dec3: "Dec 3",
  dec4: "Dec 4",
  dec5: "Dec 5",
  dec6: "Dec 6",
  dec7: "Dec 7",
  dec8: "Dec 8",
  dec9: "Dec 9",
  open: "Open Bin",
  home: "Home Base"
};

// -----------------------------------------------------------------------------
// CALLBACK FROM GOOGLE
// -----------------------------------------------------------------------------
window.initGoogleMap = function () {
  console.log("Google Maps initializing");

  geocoder = new google.maps.Geocoder();

  map = new google.maps.Map(document.getElementById("liveMap"), {
    center: HOME_POSITION,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false
  });

  addHomeMarker();
  waitForItineraryThenRenderPins();
  setupFilters();
  setupSearch();
};

// -----------------------------------------------------------------------------
// WAIT FOR ITINERARY.JS
// -----------------------------------------------------------------------------
function waitForItineraryThenRenderPins() {
  const state = window.getItineraryState && window.getItineraryState();
  if (!state || !state.columns) {
    setTimeout(waitForItineraryThenRenderPins, 200);
    return;
  }
  renderAllPins(state);
}

// -----------------------------------------------------------------------------
// MARKERS
// -----------------------------------------------------------------------------
function clearMarkers() {
  markers.forEach(m => m.map = null);
  markers = [];
}

function svgPin(color) {
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.4
  };
}

function addHomeMarker() {
  const { AdvancedMarkerElement } = google.maps.marker;

  const marker = new AdvancedMarkerElement({
    map,
    position: HOME_POSITION,
    title: "Home Base",
    content: makeColoredPin("#000000")
  });

  marker.dayId = "home";

  const info = new google.maps.InfoWindow({
    content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
  });

  marker.addListener("click", () => info.open(map, marker));

  markers.push(marker);
}

function makeColoredPin(color) {
  const div = document.createElement("div");
  div.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    </svg>
  `;
  return div;
}

// -----------------------------------------------------------------------------
// RENDER ALL PINS
// -----------------------------------------------------------------------------
function renderAllPins(state) {
  clearMarkers();
  addHomeMarker();

  state.columns.forEach(col => {
    if (col.id === "open") return; // open bin handled separately by search/add
    col.items.forEach(item => {
      geocodeAndPlace(item, col.id, false);
    });
  });
}

// -----------------------------------------------------------------------------
// GEOCODING
// -----------------------------------------------------------------------------
function geocodeAndPlace(text, dayId, centerMap) {
  // DO NOT force “Paris” — allow Rouen, day trips, anything
  geocoder.geocode({ address: text }, (results, status) => {
    if (status !== "OK" || !results || !results.length) {
      console.log("Geocode failed for:", text);
      return;
    }

    const result = results[0];
    const pos = result.geometry.location;

    placePin(pos, text, dayId, centerMap);
  });
}

function placePin(position, label, dayId, centerMap) {
  const color = DAY_COLORS[dayId] || "#666";

  const { AdvancedMarkerElement } = google.maps.marker;

  const marker = new AdvancedMarkerElement({
    map,
    position,
    title: label,
    content: makeColoredPin(color)
  });

  marker.dayId = dayId;

  const info = new google.maps.InfoWindow({
    content: `<b>${label}</b><br>${DAY_LABELS[dayId] || ""}`
  });

  marker.addListener("click", () => info.open(map, marker));

  markers.push(marker);

  if (centerMap) {
    map.setCenter(position);
    map.setZoom(15);
  }
}

// Add from itinerary.js
window.addPinForItineraryItem = function (dayId, text) {
  geocodeAndPlace(text, dayId, true);
};

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------
function setupFilters() {
  function filter(dayId) {
    markers.forEach(m => m.map = null);
    if (dayId === "all") {
      markers.forEach(m => m.map = map);
      return;
    }
    markers.forEach(m => {
      if (m.dayId === dayId) m.map = map;
    });
  }

  const allBtn = document.getElementById("mapShowAll");
  const clearBtn = document.getElementById("mapClear");
  const dayButtons = document.querySelectorAll("[data-day]");

  if (allBtn) allBtn.onclick = () => filter("all");
  if (clearBtn) clearBtn.onclick = () => filter("all");

  dayButtons.forEach(btn => {
    btn.onclick = () => filter(btn.dataset.day);
  });
}

// -----------------------------------------------------------------------------
// SEARCH → adds to Open Bin and map
// -----------------------------------------------------------------------------
function setupSearch() {
  const input = document.getElementById("mapSearchInput");
  const btn = document.getElementById("mapSearchBtn");

  if (!input || !btn) return;

  btn.onclick = () => {
    const text = input.value.trim();
    if (!text) return;

    window.addItemToDay("open", text);
    geocodeAndPlace(text, "open", true);
    input.value = "";
  };
}
