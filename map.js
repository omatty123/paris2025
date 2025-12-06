// map.js
// Home base map with daily pins and filter buttons

(function() {
'use strict';

/* Constants */
const DEFAULT_MAP_ZOOM = 12;
const DETAIL_MAP_ZOOM = 15;
const MAX_DETAIL_ZOOM = 14;

let map;
let geocoder;

// Home coordinates for 7 Avenue Stephen Pichon, Bâtiment B, 13ᵉ arrondissement, Paris
const HOME = {
  lat: 48.8320,
  lng: 2.3580
};

// Trip dates for the Today button (Paris time)
const TRIP_DATES = {
  dec3: "2025-12-03",
  dec4: "2025-12-04",
  dec5: "2025-12-05",
  dec6: "2025-12-06",
  dec7: "2025-12-07",
  dec8: "2025-12-08",
  dec9: "2025-12-09"
};

// Colors per day, roughly matching your screenshot palette
const DAY_CONFIG = {
  dec3: { color: "purple", label: "Dec 3" },
  dec4: { color: "green", label: "Dec 4" },
  dec5: { color: "blue", label: "Dec 5" },
  dec6: { color: "orange", label: "Dec 6" },
  dec7: { color: "ltblue", label: "Dec 7" },
  dec8: { color: "red", label: "Dec 8" },
  dec9: { color: "yellow", label: "Dec 9" }
};

function markerIcon(color) {
  return "https://maps.google.com/mapfiles/ms/icons/" + color + "-dot.png";
}

const HOME_ICON =
  "https://maps.google.com/mapfiles/kml/shapes/star.png";

// Empty PLACES array - only show pins from itinerary and manual search
const PLACES = [];

let markersByDay = {};
let allMarkers = [];
let homeMarker = null;
let activeFilter = "all";

// Fit map bounds to show all currently visible markers
function fitMapToVisibleMarkers() {
  const visibleMarkers = allMarkers.filter(m => m.getMap() !== null);
  
  if (visibleMarkers.length === 0) {
    // No markers visible, just show home
    map.setCenter(HOME);
    map.setZoom(DEFAULT_MAP_ZOOM);
    return;
  }
  
  const bounds = new google.maps.LatLngBounds();
  
  // Include home marker
  if (homeMarker && homeMarker.getMap() !== null) {
    bounds.extend(homeMarker.getPosition());
  }
  
  // Include all visible markers
  visibleMarkers.forEach(m => {
    bounds.extend(m.getPosition());
  });
  
  map.fitBounds(bounds);
  
  // Don't zoom in too close if only a few markers
  const listener = google.maps.event.addListener(map, "idle", () => {
    if (map.getZoom() > MAX_DETAIL_ZOOM) {
      map.setZoom(MAX_DETAIL_ZOOM);
    }
    google.maps.event.removeListener(listener);
  });
}

// Convert geocode callback to Promise for better async handling
function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    if (!geocoder) {
      reject(new Error('Geocoder not initialized'));
      return;
    }

    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0]) {
        resolve(results[0]);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// Delete a marker from the map and all tracking arrays
function deleteMarker(marker, place) {
  if (!marker) return;

  // Remove from map
  marker.setMap(null);

  // Remove from allMarkers array
  const allIndex = allMarkers.indexOf(marker);
  if (allIndex > -1) {
    allMarkers.splice(allIndex, 1);
  }

  // Remove from markersByDay array
  if (place.dayId && markersByDay[place.dayId]) {
    const dayIndex = markersByDay[place.dayId].indexOf(marker);
    if (dayIndex > -1) {
      markersByDay[place.dayId].splice(dayIndex, 1);
    }
  }

  // Remove from customMarkers array if it's there
  const customIndex = customMarkers.indexOf(marker);
  if (customIndex > -1) {
    customMarkers.splice(customIndex, 1);
  }

  // If this marker was from the itinerary, remove the item from itinerary too
  if (place.fromItinerary && place.dayId && typeof window.removeItemFromDay === 'function') {
    window.removeItemFromDay(place.dayId, place.label);
  }

  console.log('Deleted marker:', place.label);
}

async function addMarkerForPlace(place) {
  if (!geocoder) {
    console.warn('Geocoder not initialized');
    return null;
  }

  try {
    const result = await geocodeAddress(place.query || place.label);
    const loc = result.geometry.location;
    const cfg = DAY_CONFIG[place.dayId] || {};

    const marker = new google.maps.Marker({
      position: loc,
      map,
      title: place.label,
      icon: markerIcon(cfg.color || "red")
    });

    // Store reference to place data on the marker
    marker.placeData = place;

    const infoHtml = `
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px;">
        <strong>${place.label}</strong><br/>
        <span>${cfg.label || ""}</span><br/>
        <button
          onclick="window.deleteMarkerByLabel('${place.label.replace(/'/g, "\\'")}', '${place.dayId}')"
          style="margin-top: 8px; padding: 4px 8px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 3px; font-size: 12px;"
        >
          Delete Pin
        </button>
      </div>
    `;
    const infoWindow = new google.maps.InfoWindow({ content: infoHtml });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    allMarkers.push(marker);
    if (!markersByDay[place.dayId]) {
      markersByDay[place.dayId] = [];
    }
    markersByDay[place.dayId].push(marker);

    // If a day filter is active, respect it as new markers arrive
    if (activeFilter !== "all") {
      marker.setMap(null);
      if (activeFilter === place.dayId) {
        marker.setMap(map);
      }
    }

    return marker;
  } catch (error) {
    console.warn("Geocode failed for", place.label, ":", error.message);
    return null;
  }
}

function setActiveMapButton(buttonId) {
  const buttons = document.querySelectorAll(".map-filter-btn");
  buttons.forEach(btn => btn.classList.remove("active"));
  const btn = document.getElementById(buttonId);
  if (btn) btn.classList.add("active");
}

function showAllPins() {
  activeFilter = "all";
  allMarkers.forEach(m => m.setMap(map));
  if (homeMarker) homeMarker.setMap(map);
  setActiveMapButton("mapShowAll");
  fitMapToVisibleMarkers();
}

function showDayPins(dayId) {
  activeFilter = dayId;
  allMarkers.forEach(m => m.setMap(null));
  if (homeMarker) homeMarker.setMap(map);
  const arr = markersByDay[dayId] || [];
  arr.forEach(m => m.setMap(map));
  const btnId = "map" + dayId.charAt(0).toUpperCase() + dayId.slice(1);
  setActiveMapButton(btnId);
  fitMapToVisibleMarkers();
}

function showTodayPins() {
  // Use Intl.DateTimeFormat to reliably get Paris date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // en-CA locale gives us YYYY-MM-DD format directly
  const todayStr = formatter.format(new Date());

  let matchedDay = null;
  Object.entries(TRIP_DATES).forEach(([dayId, dateStr]) => {
    if (dateStr === todayStr) {
      matchedDay = dayId;
    }
  });

  if (matchedDay) {
    showDayPins(matchedDay);
    setActiveMapButton("mapToday");
  } else {
    showAllPins();
    setActiveMapButton("mapToday");
  }
}

function clearFilters() {
  showAllPins();
  setActiveMapButton("mapClear");
}

// Wire filter buttons
function wireMapButtons() {
  const btnShowAll = document.getElementById("mapShowAll");
  const btnToday = document.getElementById("mapToday");
  const btnClear = document.getElementById("mapClear");

  if (btnShowAll) btnShowAll.addEventListener("click", showAllPins);
  if (btnToday) btnToday.addEventListener("click", showTodayPins);
  if (btnClear) btnClear.addEventListener("click", clearFilters);

  const dayButtons = document.querySelectorAll(".map-filter-btn[data-day]");
  dayButtons.forEach(btn => {
    const dayId = btn.getAttribute("data-day");
    btn.addEventListener("click", () => {
      showDayPins(dayId);
    });
  });
}

// Search and add pin functionality
let customMarkers = [];

function searchAndAddPin() {
  const searchInput = document.getElementById("mapSearchInput");
  const query = searchInput.value.trim();
  
  if (!query) {
    alert("Please enter a place to search for");
    return;
  }
  
  if (!geocoder) {
    alert("Map not ready yet");
    return;
  }
  
  geocoder.geocode({ address: query + ", Paris, France" }, function(results, status) {
    if (status !== "OK" || !results[0]) {
      alert("Location not found. Try a different search term.");
      return;
    }

    const location = results[0].geometry.location;
    const placeName = results[0].formatted_address;

    // Ask which day to add to
    const dayChoice = prompt("Add '" + query + "' to which day?\n\nEnter: dec3, dec4, dec5, dec6, dec7, dec8, dec9, or 'open' for Open Bin\n(Leave blank to only add pin to map)");

    let dayId = null;
    if (dayChoice) {
      dayId = dayChoice.toLowerCase().trim();
      if (dayId !== 'open' && typeof window.addItemToDay === "function") {
        window.addItemToDay(dayId, query);
      }
    }

    const marker = new google.maps.Marker({
      position: location,
      map: map,
      title: placeName,
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      animation: google.maps.Animation.DROP
    });

    // Store place data on marker for deletion
    marker.placeData = {
      label: query,
      dayId: dayId,
      fromItinerary: !!dayId,
      query: query + ", Paris, France"
    };

    const infoContent = `
      <div style="font-family: 'Cormorant Garamond', serif;">
        <strong>${query}</strong><br/>
        <span style="font-size: 12px;">${placeName}</span><br/>
        <button
          onclick="window.deleteMarkerByLabel('${query.replace(/'/g, "\\'")}', '${dayId || ''}')"
          style="margin-top: 8px; padding: 4px 8px; cursor: pointer; background: #dc3545; color: white; border: none; border-radius: 3px; font-size: 12px;"
        >
          Delete Pin
        </button>
      </div>
    `;
    const infoWindow = new google.maps.InfoWindow({ content: infoContent });

    marker.addListener("click", function() {
      infoWindow.open(map, marker);
    });

    customMarkers.push(marker);
    allMarkers.push(marker);
    if (dayId && dayId !== 'open') {
      if (!markersByDay[dayId]) {
        markersByDay[dayId] = [];
      }
      markersByDay[dayId].push(marker);
    }

    map.setCenter(location);
    map.setZoom(DETAIL_MAP_ZOOM);

    searchInput.value = "";

    infoWindow.open(map, marker);
    setTimeout(function() { infoWindow.close(); }, 3000);
  });
}

function wireSearchButton() {
  const searchBtn = document.getElementById("mapSearchBtn");
  const searchInput = document.getElementById("mapSearchInput");
  
  if (searchBtn) {
    searchBtn.addEventListener("click", searchAndAddPin);
  }
  
  if (searchInput) {
    searchInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        searchAndAddPin();
      }
    });
  }
}

// Load pins from saved itinerary (with retry logic for timing issues)
async function loadPinsFromItinerary(retryCount = 0) {
  const maxRetries = 10;

  if (typeof window.getItineraryState !== 'function') {
    if (retryCount < maxRetries) {
      console.log(`Itinerary not ready yet, retry ${retryCount + 1}/${maxRetries}...`);
      setTimeout(() => loadPinsFromItinerary(retryCount + 1), 200);
      return;
    }
    console.warn('Itinerary state not available after retries');
    return;
  }

  const itinState = window.getItineraryState();
  if (!itinState || !itinState.columns) {
    console.warn('Itinerary state is empty');
    return;
  }

  const itineraryPlaces = [];

  // Convert all itinerary items (except Open Bin) to places
  itinState.columns.forEach(col => {
    if (col.id === 'open') return; // Skip Open Bin

    col.items.forEach(itemText => {
      itineraryPlaces.push({
        dayId: col.id,
        label: itemText,
        query: itemText + ", Paris, France",
        fromItinerary: true
      });
    });
  });

  console.log(`Found ${itineraryPlaces.length} items in itinerary to create pins for`);

  // Create pins for itinerary items
  const itineraryPromises = itineraryPlaces.map(place =>
    addMarkerForPlace(place).catch(err => {
      console.warn('Failed to add itinerary pin for:', place.label, err);
      return null;
    })
  );

  await Promise.all(itineraryPromises);
  console.log(`Successfully loaded ${itineraryPlaces.length} pins from itinerary`);

  // Fit map to show all markers
  fitMapToVisibleMarkers();
}

// Google callback
async function initLiveMap() {
  const el = document.getElementById("liveMap");
  if (!el) return;

  map = new google.maps.Map(el, {
    center: HOME,
    zoom: DEFAULT_MAP_ZOOM,
    mapTypeControl: false,
    streetViewControl: false
  });

  geocoder = new google.maps.Geocoder();

  homeMarker = new google.maps.Marker({
    position: HOME,
    map,
    title: "Home base: 7 Avenue Stephen Pichon, Bâtiment B, 13ᵉ arrondissement",
    icon: HOME_ICON
  });

  allMarkers = [];
  markersByDay = {};
  activeFilter = "all";

  // Use Promise.all to wait for all geocoding operations to complete
  const geocodePromises = PLACES.map(place =>
    addMarkerForPlace(place).catch(err => {
      console.warn('Failed to add marker for:', place.label, err);
      return null; // Continue even if one fails
    })
  );

  await Promise.all(geocodePromises);

  // Load additional pins from saved itinerary
  await loadPinsFromItinerary();

  wireMapButtons();
  wireSearchButton();

  // Set "Show all pins" as active and fit bounds after all markers are loaded
  setActiveMapButton("mapShowAll");
  fitMapToVisibleMarkers();
}

// Expose necessary functions to global scope
window.initLiveMap = initLiveMap;
window.addPinForItineraryItem = function(dayId, itemText) {
  if (!map || !geocoder) {
    console.warn("Map not initialized yet");
    return;
  }

  const place = {
    dayId: dayId,
    label: itemText,
    query: itemText + ", Paris, France",
    fromItinerary: true
  };

  addMarkerForPlace(place);
};

// Delete marker by label and dayId (called from info window button)
window.deleteMarkerByLabel = function(label, dayId) {
  // Find the marker with matching label and dayId
  const marker = allMarkers.find(m =>
    m.placeData &&
    m.placeData.label === label &&
    m.placeData.dayId === dayId
  );

  if (marker && marker.placeData) {
    if (confirm(`Delete pin for "${label}"?`)) {
      deleteMarker(marker, marker.placeData);

      // Refit map to visible markers after deletion
      fitMapToVisibleMarkers();
    }
  } else {
    console.warn('Marker not found for:', label, dayId);
  }
};

})(); // End of IIFE
