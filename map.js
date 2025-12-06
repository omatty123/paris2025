// map.js
// Stable Google Maps version using classic google.maps.Marker.
// Paris-only geocoding except Rouen day. Home marker always visible.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // HOME BASE — correct coordinates (star marker)
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  // Marker icons
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png", // Rouen day
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
    home: "http://maps.google.com/mapfiles/ms/icons/yellow-star.png"
  };

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

  // Google callback
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
    renderPinsWhenReady();
    setupFilters();
    setupSearch();
    insertTodayButton();
  };

  // Wait for itinerary.js state
  function renderPinsWhenReady() {
    const state =
      window.getItineraryState && window.getItineraryState();
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
  }

  // Add HOME star
  function addHomeMarker() {
    const marker = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      icon: DAY_ICONS.home,
      title: "Home Base"
    });

    const inf = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    marker.addListener("click", () => inf.open(map, marker));

    marker.dayId = "home";
    markers.push(marker);
  }

  // Render all itinerary pins
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;

      col.items.forEach(item => {
        geocodeAndMark(item, col.id);
      });
    });

    fitAllVisibleMarkers();
  }

  // Determine correct geocode query string
  function buildQuery(text, dayId) {
    // Day 5 → Rouen day
    if (dayId === "dec5") {
      return `${text}, Rouen, France`;
    }

    // Everything else is Paris
    return `${text}, Paris, France`;
  }

  // Geocode + place marker
  function geocodeAndMark(text, dayId) {
    const query = buildQuery(text, dayId);

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        console.log("Geocode failed:", text, "query:", query);
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
      fitAllVisibleMarkers();
    });
  }

  // Always center map on visible markers
  function fitAllVisibleMarkers() {
    const visible = markers.filter(m => m.getMap());
    if (!visible.length) return;

    const bounds = new google.maps.LatLngBounds();
    visible.forEach(m => bounds.extend(m.getPosition()));

    map.fitBounds(bounds);
  }

  // Add pin from itinerary.js when user adds item
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId);
  };

  // Insert ONE Today button dynamically
  function insertTodayButton() {
    const container = document.querySelector(".map-filters");

    if (!container) return;

    const btn = document.createElement("button");
    btn.className = "map-filter-btn";
    btn.id = "mapToday";
    btn.innerHTML = `<i class="fas fa-sun"></i> Today`;

    btn.onclick = () => {
      const today = getTodayDayId();
      if (today) filter(today);
    };

    container.insertBefore(btn, container.children[1]); // after Show All
  }

  // Determine today's day ID (Paris time)
  function getTodayDayId() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const today = formatter.format(new Date()); // YYYY-MM-DD

    const map = {
      "2025-12-03": "dec3",
      "2025-12-04": "dec4",
      "2025-12-05": "dec5",
      "2025-12-06": "dec6",
      "2025-12-07": "dec7",
      "2025-12-08": "dec8",
      "2025-12-09": "dec9"
    };

    return map[today] || null;
  }

  // Filters
  function setupFilters() {
    function filter(dayId) {
      // Hide everything
      markers.forEach(m => m.setMap(null));

      // Always show Home Base
      markers.forEach(m => {
        if (m.dayId === "home") m.setMap(map);
      });

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
        fitAllVisibleMarkers();
        return;
      }

      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });

      fitAllVisibleMarkers();
    }

    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });
  }

  // Search box → adds item into Open Bin
  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      window.addItemToDay("open", text);
      geocodeAndMark(text, "open");
      input.value = "";
    };
  }

})();
