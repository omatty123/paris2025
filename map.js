// map.js
// Home base map with daily pins and filter buttons

let map;
let geocoder;

const HOME = {
  lat: 48.8334836,
  lng: 2.3571846
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

// Places by day. Queries are what the geocoder searches.
const PLACES = [
  // Dec 3
  { dayId: "dec3", label: "Arrive apartment", query: "Place d'Italie, Paris" },
  { dayId: "dec3", label: "Musée d'Orsay", query: "Musée d'Orsay, Paris" },
  { dayId: "dec3", label: "Pont Neuf", query: "Pont Neuf, Paris" },
  { dayId: "dec3", label: "Notre-Dame exterior", query: "Cathédrale Notre-Dame de Paris" },

  // Dec 4
  { dayId: "dec4", label: "La Halte Paris 13", query: "La Halte, Paris 13" },
  { dayId: "dec4", label: "Nationale", query: "Métro Nationale, Paris" },
  { dayId: "dec4", label: "Louvre nineteenth-century rooms", query: "Louvre Museum, Paris" },
  { dayId: "dec4", label: "Tuileries Garden", query: "Jardin des Tuileries, Paris" },
  { dayId: "dec4", label: "Walk toward Passy", query: "Passy, Paris" },
  { dayId: "dec4", label: "Maison de Balzac", query: "Maison de Balzac, Paris" },
  { dayId: "dec4", label: "Walk to Trocadéro", query: "Trocadéro, Paris" },
  { dayId: "dec4", label: "Le Temps des Cerises", query: "Le Temps des Cerises, Paris" },

  // Dec 5
  { dayId: "dec5", label: "Metro to Opéra", query: "Opéra, Paris" },
  { dayId: "dec5", label: "Gare Saint-Lazare", query: "Gare Saint-Lazare, Paris" },
  { dayId: "dec5", label: "Train to Rouen", query: "Gare de Rouen Rive Droite" },
  { dayId: "dec5", label: "Cathedral and Gros Horloge", query: "Cathédrale Notre-Dame de Rouen" },
  { dayId: "dec5", label: "Lunch at Vegan & Cie", query: "Vegan & Cie, Rouen" },
  { dayId: "dec5", label: "Musée Flaubert", query: "Musée Flaubert et d'Histoire de la Médecine, Rouen" },
  { dayId: "dec5", label: "Cimetière Monumental", query: "Cimetière Monumental, Rouen" },
  { dayId: "dec5", label: "Croisset", query: "Croisset, Rouen" },
  { dayId: "dec5", label: "Brasserie Le Lazare", query: "Brasserie Lazare, Paris" },

  // Dec 6
  { dayId: "dec6", label: "Belleville", query: "Belleville, Paris" },
  { dayId: "dec6", label: "Promenade Dora Bruder", query: "Boulevard Ornano, Paris" },
  { dayId: "dec6", label: "Montmartre and Sacré-Cœur", query: "Basilique du Sacré-Cœur, Paris" },
  { dayId: "dec6", label: "Père Lachaise", query: "Cimetière du Père-Lachaise, Paris" },
  { dayId: "dec6", label: "Pain Vin Fromages", query: "Pain Vin Fromages, Paris" },

  // Dec 7
  { dayId: "dec7", label: "Parc Montsouris", query: "Parc Montsouris, Paris" },
  { dayId: "dec7", label: "Covered passages", query: "Passage des Panoramas, Paris" },
  { dayId: "dec7", label: "Tuileries Christmas Market", query: "Jardin des Tuileries, Paris Christmas market" },
  { dayId: "dec7", label: "Galeries Lafayette", query: "Galeries Lafayette Haussmann, Paris" },
  { dayId: "dec7", label: "Carrefour Italie 2", query: "Carrefour Market Italie 2, Paris" },
  { dayId: "dec7", label: "Darkoum Cantine Marocaine", query: "Darkoum Cantine Marocaine, Rue Daguerre, Paris" },

  // Dec 8 and 9 currently empty in your itinerary; you can add later if you like.
];

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
    map.setZoom(12);
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
    if (map.getZoom() > 14) {
      map.setZoom(14);
    }
    google.maps.event.removeListener(listener);
  });
}

function addMarkerForPlace(place) {
  if (!geocoder) return;

  geocoder.geocode({ address: place.query || place.label }, (results, status) => {
    if (status !== "OK" || !results[0]) {
      console.warn("Geocode failed for", place.label, status);
      return;
    }

    const loc = results[0].geometry.location;
    const cfg = DAY_CONFIG[place.dayId] || {};
    const marker = new google.maps.Marker({
      position: loc,
      map,
      title: place.label,
      icon: markerIcon(cfg.color || "red")
    });

    const infoHtml = `
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px;">
        <strong>${place.label}</strong><br/>
        <span>${cfg.label || ""}</span>
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
  });
}

// Function to add a pin for a new itinerary item
window.addPinForItineraryItem = function(dayId, itemText) {
  if (!map || !geocoder) {
    console.warn("Map not initialized yet");
    return;
  }
  
  const place = {
    dayId: dayId,
    label: itemText,
    query: itemText + ", Paris, France"
  };
  
  addMarkerForPlace(place);
};
      <div style="font-family: 'Cormorant Garamond', serif; font-size: 14px;">
        <strong>${place.label}</strong><br/>
        <span>${cfg.label || ""}</span>
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
  });
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
  const now = new Date();
  const parisNow = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const y = parisNow.getFullYear();
  const m = String(parisNow.getMonth() + 1).padStart(2, "0");
  const d = String(parisNow.getDate()).padStart(2, "0");
  const todayStr = `${y}-${m}-${d}`;

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
  
  // Geocode the search query
  geocoder.geocode({ address: query + ", Paris, France" }, (results, status) => {
    if (status !== "OK" || !results[0]) {
      alert("Location not found. Try a different search term.");
      return;
    }
    
    const location = results[0].geometry.location;
    const placeName = results[0].formatted_address;
    
    // Create a custom marker
    const marker = new google.maps.Marker({
      position: location,
      map: map,
      title: placeName,
      icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      animation: google.maps.Animation.DROP
    });
    
    // Info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: 'Cormorant Garamond', serif;">
          <strong>${query}</strong><br/>
          <span style="font-size: 12px;">${placeName}</span><br/>
          <button onclick="removeCustomMarker(${customMarkers.length})" 
                  style="margin-top: 8px; padding: 4px 8px; cursor: pointer;">
            Remove Pin
          </button>
        </div>
      `
    });
    
    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
    
    customMarkers.push(marker);
    allMarkers.push(marker);
    
    // Center map on new marker
    map.setCenter(location);
    map.setZoom(15);
    
    // Clear search input
    searchInput.value = "";
    
    // Show info window briefly
    infoWindow.open(map, marker);
    setTimeout(() => infoWindow.close(), 3000);
  });
}

// Remove custom marker
window.removeCustomMarker = function(index) {
  if (customMarkers[index]) {
    customMarkers[index].setMap(null);
    const allIndex = allMarkers.indexOf(customMarkers[index]);
    if (allIndex > -1) {
      allMarkers.splice(allIndex, 1);
    }
    customMarkers[index] = null;
  }
};

function wireSearchButton() {
  const searchBtn = document.getElementById("mapSearchBtn");
  const searchInput = document.getElementById("mapSearchInput");
  
  if (searchBtn) {
    searchBtn.addEventListener("click", searchAndAddPin);
  }
  
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        searchAndAddPin();
      }
    });
  }
}

// Google callback
function initLiveMap() {
  const el = document.getElementById("liveMap");
  if (!el) return;

  map = new google.maps.Map(el, {
    center: HOME,
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false
  });

  geocoder = new google.maps.Geocoder();

  homeMarker = new google.maps.Marker({
    position: HOME,
    map,
    title: "Home base",
    icon: HOME_ICON
  });

  allMarkers = [];
  markersByDay = {};
  activeFilter = "all";

  PLACES.forEach(place => addMarkerForPlace(place));
  wireMapButtons();
  wireSearchButton();
  
  // Set "Show all pins" as active and fit bounds after markers load
  setActiveMapButton("mapShowAll");
  
  // Wait a moment for geocoding to complete, then fit bounds
  setTimeout(() => {
    fitMapToVisibleMarkers();
  }, 2000);
}

// Expose for the Google Maps callback
window.initLiveMap = initLiveMap;
