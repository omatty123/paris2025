// map.js
// Google Maps version with:
// - HOME BASE restored
// - Auto fit-to-bounds
// - "Today" button restored
// - Paris-only geocoding (except Rouen)
// - No forced country errors

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let bounds;

  // HOME BASE — correct coordinates
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  // Classic pin colors
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
    home: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
  };

  // Labels
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

  // Determine today's dayId in Paris timezone
  function getTodayDayId() {
    const paris = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const map = {
      "2025-12-03": "dec3",
      "2025-12-04": "dec4",
      "2025-12-05": "dec5",
      "2025-12-06": "dec6",
      "2025-12-07": "dec7",
      "2025-12-08": "dec8",
      "2025-12-09": "dec9"
    };
    return map[paris] || null;
  }

  // Google callback
  window.initGoogleMap = function () {
    console.log("Google Maps initializing");

    geocoder = new google.maps.Geocoder();
    bounds = new google.maps.LatLngBounds();

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: HOME_POSITION,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    addHomeMarker();
    renderPinsWhenReady();
    setupFilters();
    setupSearch();
  };

  // Wait for itinerary.js to load
  function renderPinsWhenReady() {
    const state = window.getItineraryState && window.getItineraryState();
    if (!state || !state.columns) {
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(state);
  }

  // Clear markers
  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    bounds = new google.maps.LatLngBounds();
  }

  // Add HOME marker
  function addHomeMarker() {
    const marker = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      title: "Home Base",
      icon: DAY_ICONS.home
    });

    const inf = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    marker.addListener("click", () => inf.open(map, marker));

    marker.dayId = "home";
    markers.push(marker);
    bounds.extend(HOME_POSITION);
  }

  // Render all pins
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => {
        geocodeAndMark(item, col.id, false);
      });
    });
  }

  // Geocode + place marker
  function geocodeAndMark(text, dayId, centerMap) {
    let query = text;

    // Force Paris EXCEPT:
    // - Rouen day (dec5)
    // - Open bin
    if (["dec3","dec4","dec6","dec7","dec8","dec9"].includes(dayId)) {
      query = `${text}, Paris, France`;
    }

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        console.log("Geocode failed:", text);
        return;
      }

      const loc = results[0].geometry.location;

      const marker = new google.maps.Marker({
        position: loc,
        map,
        title: text,
        icon: DAY_ICONS[dayId] || DAY_ICONS.open
      });

      marker.dayId = dayId;

      const inf = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>${DAY_LABELS[dayId] || ""}`
      });

      marker.addListener("click", () => inf.open(map, marker));

      markers.push(marker);
      bounds.extend(loc);

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }

      // Always auto-fit after adding
      map.fitBounds(bounds);
    });
  }

  // Allow itinerary.js to add pins live
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // FILTER LOGIC + TODAY BUTTON
  function setupFilters() {
    function applyFilter(dayId) {
      bounds = new google.maps.LatLngBounds();
      markers.forEach(m => m.setMap(null));

      markers.forEach(m => {
        if (dayId === "all" || m.dayId === dayId) {
          m.setMap(map);
          bounds.extend(m.getPosition());
        }
      });

      map.fitBounds(bounds);
    }

    document.getElementById("mapShowAll").onclick = () => applyFilter("all");
    document.getElementById("mapClear").onclick = () => applyFilter("all");

    // Day buttons
    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });

    // TODAY button
    const todayId = getTodayDayId();
    if (todayId) {
      const btn = document.createElement("button");
      btn.className = "map-filter-btn";
      btn.textContent = "Today";
      btn.onclick = () => applyFilter(todayId);
      document.querySelector(".map-filters").appendChild(btn);
    }
  }

  // SEARCH BOX LOGIC
  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      window.addItemToDay("open", text);
      geocodeAndMark(text, "open", true);
      input.value = "";
    };
  }
})();
