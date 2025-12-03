// map.js
// Interactive map driven directly by the itinerary
// Every item in the itinerary becomes a pin with a color by day
// No places.json, no manual coordinates

let mapInstance = null;
let geocoder = null;

// Cache geocoding results so we do not keep hitting the API
const geocodeCache = {};

// All markers: key -> google.maps.Marker
// key format: `${dayId}::${name}`
let markers = {};

// Places waiting for the map to be ready
let pendingPlaces = [];

// Optional: map day ids to dates if you ever want date based filtering
const DAY_DATE_MAP = {
  dec3: "2025-12-03",
  dec4: "2025-12-04",
  dec5: "2025-12-05",
  dec6: "2025-12-06",
  dec7: "2025-12-07",
  dec8: "2025-12-08",
  dec9: "2025-12-09"
};

// Icons per day or bucket
const ICONS = {
  home: "https://maps.google.com/mapfiles/kml/shapes/star.png",
  open: "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",
  dec3: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  dec4: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  dec5: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  dec6: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
  dec7: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
  dec8: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
  dec9: "https://maps.google.com/mapfiles/ms/icons/pink-dot.png",
  default: "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png"
};

function getMarkerKey(dayId, name) {
  return `${dayId}::${name}`;
}

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

  geocoder = new google.maps.Geocoder();

  // Home base star marker
  createHomeMarker();

  // Process places that itinerary.js already queued before map was ready
  if (pendingPlaces.length > 0) {
    const queued = [...pendingPlaces];
    pendingPlaces = [];
    queued.forEach((p) => ensureMarker(p.dayId, p.name));
  }

  // Optionally wire toolbar if you later add one
  wireMapToolbar();
}

// Home base star
function createHomeMarker() {
  if (!mapInstance || !geocoder) return;

  const name = "Home base";
  const query = "7 Avenue Stephen Pichon, 75013 Paris, France";
  const dayId = "home";
  const key = getMarkerKey(dayId, name);

  if (markers[key]) return;

  if (geocodeCache[query]) {
    const loc = geocodeCache[query];
    const position = new google.maps.LatLng(loc.lat, loc.lng);
    markers[key] = new google.maps.Marker({
      position,
      map: mapInstance,
      title: name,
      icon: ICONS.home
    });
    return;
  }

  geocoder.geocode({ address: query }, (results, status) => {
    if (status === "OK" && results[0]) {
      const loc = results[0].geometry.location;
      geocodeCache[query] = { lat: loc.lat(), lng: loc.lng() };

      markers[key] = new google.maps.Marker({
        position: loc,
        map: mapInstance,
        title: name,
        icon: ICONS.home
      });
    } else {
      console.warn("Geocode failed for home base", status);
    }
  });
}

// Heuristic to build a geocoding query from an itinerary item
function buildQueryForItem(name) {
  const lower = name.toLowerCase();

  if (lower.includes("rouen")) {
    return `${name}, Rouen, France`;
  }
  if (lower.includes("croisset")) {
    return `${name}, Rouen, France`;
  }
  if (lower.includes("vegan & cie".toLowerCase())) {
    return "Vegan & Cie, Rouen, France";
  }

  // Default to Paris
  return `${name}, Paris, France`;
}

// Ensure a marker exists for this (dayId, name) pair
function ensureMarker(dayId, name) {
  if (!name) return;
  if (!dayId) dayId = "open";

  const key = getMarkerKey(dayId, name);

  if (!mapInstance || !geocoder) {
    // Map not ready yet, queue
    pendingPlaces.push({ dayId, name });
    return;
  }

  // If marker already exists, just ensure it is visible and has correct icon
  if (markers[key]) {
    markers[key].setVisible(true);
    const iconUrl = ICONS[dayId] || ICONS.default;
    markers[key].setIcon(iconUrl);
    return;
  }

  const query = buildQueryForItem(name);
  const iconUrl = ICONS[dayId] || ICONS.default;

  const useCached = geocodeCache[query];
  if (useCached) {
    const position = new google.maps.LatLng(useCached.lat, useCached.lng);
    markers[key] = new google.maps.Marker({
      position,
      map: mapInstance,
      title: name,
      icon: iconUrl
    });
    return;
  }

  geocoder.geocode({ address: query }, (results, status) => {
    if (status === "OK" && results[0]) {
      const loc = results[0].geometry.location;
      geocodeCache[query] = { lat: loc.lat(), lng: loc.lng() };

      markers[key] = new google.maps.Marker({
        position: loc,
        map: mapInstance,
        title: name,
        icon: iconUrl
      });
    } else {
      console.warn("Geocode failed for", name, query, status);
    }
  });
}

// Public API called by itinerary.js

function resetPlaces() {
  // Remove all non home markers from the map
  Object.entries(markers).forEach(([key, marker]) => {
    if (key.startsWith("home::")) return;
    marker.setMap(null);
  });
  markers = Object.fromEntries(
    Object.entries(markers).filter(([key]) => key.startsWith("home::"))
  );
  pendingPlaces = [];
}

function addPlace(dayId, name) {
  ensureMarker(dayId, name);
}

// Focus a specific item when user clicks the card
function highlightPlace(name) {
  if (!mapInstance) return;

  // Try all markers that match this name, regardless of day
  const matching = Object.entries(markers).filter(([key]) => {
    const parts = key.split("::");
    const n = parts.slice(1).join("::");
    return n === name;
  });

  if (matching.length === 0) return;

  const marker = matching[0][1];
  const pos = marker.getPosition();
  if (!pos) return;

  mapInstance.panTo(pos);
  mapInstance.setZoom(Math.max(mapInstance.getZoom(), 14));

  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => {
    marker.setAnimation(null);
  }, 1500);
}

function showAllMarkers() {
  if (!mapInstance) return;
  Object.values(markers).forEach((marker) => marker.setVisible(true));

  const list = Object.values(markers);
  if (!list.length) return;
  const bounds = new google.maps.LatLngBounds();
  list.forEach((m) => {
    const pos = m.getPosition();
    if (pos) bounds.extend(pos);
  });
  mapInstance.fitBounds(bounds);
}

function clearHighlights() {
  // No persistent highlight state at the moment
}

// Toolbar wiring is optional; if you do not have a mapToolbar element this does nothing
function wireMapToolbar() {
  const toolbar = document.getElementById("mapToolbar");
  if (!toolbar) return;

  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "showAll") {
      showAllMarkers();
    } else if (action === "clear") {
      clearHighlights();
    }
  });
}

// Expose a minimal API to the rest of the app
window.MapAPI = {
  resetPlaces,
  addPlace,
  highlightPlace,
  showAllMarkers
};
