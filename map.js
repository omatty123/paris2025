// map.js
// Google Maps with France anchored geocoding, Paris overrides, home star, bounds fit.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let bounds;

  // Home coordinates
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  // Icon set
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
    home: "http://maps.google.com/mapfiles/kml/shapes/star.png"
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

  // Hard overrides for vague Paris items
  const PARIS_OVERRIDES = {
    "nationale": "Nationale Metro Station, Paris",
    "la halte": "La Halte, 12 Rue Philibert Lucot, 75013 Paris",
    "les chiffonniers": "Les Chiffonniers, 108 Rue de Patay, 75013 Paris",
    "walk home": null
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

    bounds = new google.maps.LatLngBounds();

    addHomeMarker();
    renderPinsWhenReady();
    setupFilters();
    setupSearch();
  };

  function renderPinsWhenReady() {
    const state = window.getItineraryState && window.getItineraryState();
    if (!state || !state.columns) {
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(state);
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    bounds = new google.maps.LatLngBounds();
  }

  // Add the fixed home marker
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

  // Render every itinerary entry
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      col.items.forEach(item => {
        geocodeAndMark(item, col.id, false);
      });
    });

    map.fitBounds(bounds);
  }

  // Geocode with France anchoring and Paris override
  function geocodeAndMark(text, dayId, centerMap) {
    let key = text.trim().toLowerCase();
    let query = text;

    // Override block
    if (PARIS_OVERRIDES.hasOwnProperty(key)) {
      const override = PARIS_OVERRIDES[key];

      if (!override) {
        console.log("No pin generated for", text);
        return;
      }

      query = override;
    }

    // Force France for every location
    let q = query;
    const lowerQ = q.toLowerCase();
    if (!lowerQ.includes("france")) {
      q = q + ", France";
    }

    geocoder.geocode({ address: q }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) {
        console.log("Geocode failed for", text, "query was", q);
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
        content: "<b>" + text + "</b><br>" + (DAY_LABELS[dayId] || "")
      });

      marker.addListener("click", () => inf.open(map, marker));

      markers.push(marker);
      bounds.extend(loc);

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }

      map.fitBounds(bounds);
    });
  }

  // Exposed for itinerary dragging
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // Filter buttons
  function setupFilters() {
    function filter(dayId) {
      clearMarkers();
      addHomeMarker();

      const visible = [];

      markers.forEach(m => m.setMap(null));

      if (dayId === "all") {
        renderPinsWhenReady();
        return;
      }

      const state = window.getItineraryState && window.getItineraryState();
      if (!state) return;

      state.columns.forEach(col => {
        if (col.id === dayId) {
          col.items.forEach(item => {
            geocodeAndMark(item, col.id, false);
          });
        }
      });

      map.fitBounds(bounds);
    }

    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    const btns = document.querySelectorAll("[data-day]");
    btns.forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });
  }

  // Search field
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
