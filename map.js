// map.js
// FINAL VERSION: France-only geocoding + Rouen on Dec 5 + Home Base always visible.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  let pinsToLoad = 0;
  let pinsLoaded = 0;

  // HOME BASE (Paris 13e)
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",

    // STAR for Home Base
    home: "https://maps.google.com/mapfiles/kml/shapes/star.png"
  };

  const DAY_LABELS = {
    dec3: "Dec 3",
    dec4: "Dec 4",
    dec5: "Dec 5 (Rouen)",
    dec6: "Dec 6",
    dec7: "Dec 7",
    dec8: "Dec 8",
    dec9: "Dec 9",
    open: "Open Bin",
    home: "Home Base"
  };

  // GOOGLE MAP INIT
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

  // HOME ALWAYS SHOWN
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

  // RENDER ITINERARY PINS
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    pinsLoaded = 0;
    pinsToLoad = 0;

    state.columns.forEach(col => {
      if (col.id === "open") return;

      col.items.forEach(item => {
        pinsToLoad++;
        geocodeAndMark(item, col.id, false);
      });
    });
  }

  // FORCE FRANCE GEOCODING
  function getForcedLocation(query, dayId) {

    // Day 5 is Rouen ONLY
    if (dayId === "dec5") {
      return `${query}, Rouen, France`;
    }

    // All other days & open bin = PARIS
    return `${query}, Paris, France`;
  }

  // GEOCODE & MARK
  function geocodeAndMark(text, dayId, center) {
    const forcedQuery = getForcedLocation(text, dayId);

    geocoder.geocode({ address: forcedQuery }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        pinsLoaded++;
        if (pinsLoaded === pinsToLoad) fitAllPins();
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

      pinsLoaded++;
      if (pinsLoaded === pinsToLoad) {
        fitAllPins();
      }

      if (center) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // ALWAYS KEEP HOME BASE VISIBLE
  function setupFilters() {
    function filter(dayId) {

      markers.forEach(m => m.setMap(null));

      // Always show HOME
      markers.forEach(m => {
        if (m.dayId === "home") m.setMap(map);
      });

      if (dayId === "all") {
        markers.forEach(m => {
          if (m.dayId !== "home") m.setMap(map);
        });
        fitAllPins();
        return;
      }

      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });

      fitAllPins();
    }

    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });
  }

  // FIT MAP TO ALL VISIBLE MARKERS
  function fitAllPins() {
    const visible = markers.filter(m => m.getMap());
    if (visible.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    visible.forEach(m => bounds.extend(m.getPosition()));
    map.fitBounds(bounds);
  }

  // SEARCH ADDS TO OPEN BIN (Paris)
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
