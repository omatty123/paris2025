// map.js
// Interactive map driven by the itinerary
// Each item becomes a pin, color coded by day, with toolbar controls

let mapInstance = null;
let geocoder = null;

const geocodeCache = {};
let markers = {}; // key: `${dayId}::${name}` -> google.maps.Marker
let pendingPlaces = [];
let selectedDayId = null;

const DAY_DATE_MAP = {
  dec3: "2025-12-03",
  dec4: "2025-12-04",
  dec5: "2025-12-05",
  dec6: "2025-12-06",
  dec7: "2025-12-07",
  dec8: "2025-12-08",
  dec9: "2025-12-09"
};

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

  createHomeMarker();

  if (pendingPlaces.length > 0) {
    const queued = [...pendingPlaces];
    pendingPlaces = [];
    queued.forEach((p) => ensureMarker(p.dayId, p.name));
  }

  wireMapToolbar();
}

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
    markers[key] = createMarker(name, position, ICONS.home, dayId);
    return;
  }

  geocoder.geocode({ address: query }, (results, status) => {
    if (status === "OK" && results[0]) {
      const loc = results[0].geometry.location;
      geocodeCache[query] = { lat: loc.lat(), lng: loc.lng() };
      markers[key] = createMarker(name, loc, ICONS.home, dayId);
    } else {
      console.warn("Geocode failed for home base", status);
    }
  });
}

function buildQueryForItem(name) {
  const lower = name.toLowerCase();

  if (lower.includes("rouen") || lower.includes("croisset")) {
    return `${name}, Rouen, France`;
  }
  if (lower.includes("vegan & cie")) {
    return "Vegan & Cie, Rouen, France";
  }

  return `${name}, Paris, France`;
}

function ensureMarker(dayId, name) {
  if (!name) return;
  if (!dayId) dayId = "open";

  const key = getMarkerKey(dayId, name);

  if (!mapInstance || !geocoder) {
    pendingPlaces.push({ dayId, name });
    return;
  }

  if (markers[key]) {
    markers[key].setVisible(true);
    const iconUrl = ICONS[dayId] || ICONS.default;
    markers[key].setIcon(iconUrl);
    return;
  }

  const query = buildQueryForItem(name);
  const iconUrl = ICONS[dayId] || ICONS.default;

  if (geocodeCache[query]) {
    const loc = geocodeCache[query];
    const position = new google.maps.LatLng(loc.lat, loc.lng);
    markers[key] = createMarker(name, position, iconUrl, dayId);
    return;
  }

  geocoder.geocode({ address: query }, (results, status) => {
    if (status === "OK" && results[0]) {
      const loc = results[0].geometry.location;
      geocodeCache[query] = { lat: loc.lat(), lng: loc.lng() };
      markers[key] = createMarker(name, loc, iconUrl, dayId);
    } else {
      console.warn("Geocode failed for", name, query, status);
    }
  });
}

function createMarker(name, position, iconUrl, dayId) {
  const marker = new google.maps.Marker({
    position,
    map: mapInstance,
    title: name,
    icon: iconUrl
  });

  const prettyDay =
    dayId === "home"
      ? "Home base"
      : dayId === "open"
      ? "Open bin"
      : `Day id: ${dayId}`;

  const info = new google.maps.InfoWindow({
    content: `<div style="font-family: 'Cormorant Garamond', serif; font-size: 14px;">
                <strong>${name}</strong><br/>
                <span>${prettyDay}</span>
              </div>`
  });

  marker.addListener("click", () => {
    info.open(mapInstance, marker);
  });

  return marker;
}

// API for itinerary.js

function resetPlaces() {
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

function highlightPlace(name) {
  if (!mapInstance) return;

  const matching = Object.entries(markers).filter(([key]) => {
    const parts = key.split("::");
    const n = parts.slice(1).join("::");
    return n === name;
  });

  if (!matching.length) return;

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
  showAllMarkers();
}

// Filtering logic

function showMarkersForDayList(dayId, names) {
  if (!mapInstance) return;

  const nameSet = new Set(names);

  Object.entries(markers).forEach(([key, marker]) => {
    const parts = key.split("::");
    const markerDayId = parts[0];
    const markerName = parts.slice(1).join("::");

    const visible =
      markerDayId === "home" || (markerDayId === dayId && nameSet.has(markerName));
    marker.setVisible(visible);
  });

  const visibleMarkers = Object.values(markers).filter((m) => m.getVisible());
  if (!visibleMarkers.length) return;

  const bounds = new google.maps.LatLngBounds();
  visibleMarkers.forEach((m) => {
    const pos = m.getPosition();
    if (pos) bounds.extend(pos);
  });
  mapInstance.fitBounds(bounds);
}

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

  showMarkersForDayList(dayId, names);
}

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

// Expose API

window.MapAPI = {
  resetPlaces,
  addPlace,
  highlightPlace,
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
      alert("No day selected yet. Click a day header first.");
      return;
    }
    if (!window.DayColumnMap) {
      alert("Day data not available yet.");
      return;
    }
    const names = window.DayColumnMap[selectedDayId] || [];
    if (!names.length) {
      alert("Selected day has no mapped places.");
      return;
    }
    showMarkersForDayList(selectedDayId, names);
  }
};
