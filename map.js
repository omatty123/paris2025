// map.js
// Stable Google Maps version using classic google.maps.Marker.
// Home Base always visible on all filters.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // HOME BASE — star coordinate
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  // Classic colored pin URLs
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",

    // ★ STAR for Home Base
    home: "https://maps.google.com/mapfiles/kml/shapes/star.png"
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
  };

  // Wait for itinerary.js
  function renderPinsWhenReady() {
    const s = window.getItineraryState && window.getItineraryState();
    if (!s || !s.columns) {
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(s);
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  // HOME MARKER (ALWAYS SHOWN)
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
  }

  // Render all itinerary pins
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => geocodeAndMark(item, col.id, false));
    });
  }

  // Geocode + place pin
  function geocodeAndMark(text, dayId, center) {
    const query = text;

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.length) return;

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

      if (center) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // ⭐ FILTERS — FIXED SO HOME BASE ALWAYS SHOWS
  function setupFilters() {
    function filter(dayId) {
      // Hide everything
      markers.forEach(m => m.setMap(null));

      // ALWAYS show home base
      markers.forEach(m => {
        if (m.dayId === "home") m.setMap(map);
      });

      if (dayId === "all") {
        // Show all non-home markers too
        markers.forEach(m => {
          if (m.dayId !== "home") m.setMap(map);
        });
        return;
      }

      // Show only selected day’s markers + home
      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });
    }

    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });
  }

  // Search bar: add to Open Bin
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
