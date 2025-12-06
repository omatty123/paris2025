// map.js
// Stable Google Maps version using classic google.maps.Marker.
// Paris-only geocoding except Dec 5 → Rouen. Home base = star.
// Today button fixed to use itinerary.js date logic.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let bounds;

  // HOME BASE — STAR ICON
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };
  const HOME_ICON = "http://maps.google.com/mapfiles/kml/shapes/star.png";

  // Classic Google pin icons
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
    home: HOME_ICON
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

  const SKIP_ITEMS = ["walk home"];

  // Trip date map
  const DAY_DATES = {
    dec3: "2025-12-03",
    dec4: "2025-12-04",
    dec5: "2025-12-05",
    dec6: "2025-12-06",
    dec7: "2025-12-07",
    dec8: "2025-12-08",
    dec9: "2025-12-09"
  };

  // -------------------------------------------------------------------
  // INIT
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // HOME BASE STAR MARKER
  // -------------------------------------------------------------------
  function addHomeMarker() {
    const marker = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      title: "Home Base",
      icon: HOME_ICON
    });

    const inf = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    marker.addListener("click", () => inf.open(map, marker));
    marker.dayId = "home";

    markers.push(marker);
    bounds.extend(HOME_POSITION);
  }

  // Wait for itinerary.js
  function renderPinsWhenReady() {
    const state = window.getItineraryState && window.getItineraryState();
    if (!state || !state.columns) return setTimeout(renderPinsWhenReady, 300);
    renderAllPins(state);
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
    bounds = new google.maps.LatLngBounds();
  }

  // -------------------------------------------------------------------
  // RENDER ALL PINS
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // GEOCODE RULES:
  // - Dec 5 → Rouen
  // - All other days → Paris
  // - Skip "Walk Home"
  // -------------------------------------------------------------------
  function geocodeAndMark(text, dayId, centerMap) {
    const raw = text.trim().toLowerCase();

    if (SKIP_ITEMS.includes(raw)) {
      console.log("Skipping pin for:", text);
      return;
    }

    let query;
    if (dayId === "dec5") {
      query = text + ", Rouen, France";
    } else {
      query = text + ", Paris, France";
    }

    console.log("Geocoding:", query);

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        console.warn("Geocode failed:", text, "→", query);
        return;
      }

      const loc = results[0].geometry.location;

      const marker = new google.maps.Marker({
        position: loc,
        map,
        title: text,
        icon: DAY_ICONS[dayId] || DAY_ICONS.open
      });

      markers.push(marker);
      marker.dayId = dayId;
      bounds.extend(loc);

      const inf = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>${DAY_LABELS[dayId] || ""}`
      });

      marker.addListener("click", () => inf.open(map, marker));

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }

      map.fitBounds(bounds);
    });
  }

  // Exposed for itinerary.js (new item added → add pin)
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // -------------------------------------------------------------------
  // FILTERS + TODAY BUTTON (NOW FIXED)
  // -------------------------------------------------------------------
  function setupFilters() {
    function filter(dayId) {
      markers.forEach(m => m.setMap(null));

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
        refit();
        return;
      }

      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });

      refit();
    }

    function refit() {
      const b = new google.maps.LatLngBounds();
      markers.forEach(m => {
        if (m.getMap()) b.extend(m.getPosition());
      });
      map.fitBounds(b);
    }

    // Built-in day filter buttons
    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });

    // ------ TODAY BUTTON FIXED ------
    const todayBtn = document.createElement("button");
    todayBtn.className = "map-filter-btn";
    todayBtn.textContent = "Today";

    todayBtn.onclick = () => {
      const state = window.getItineraryState && window.getItineraryState();
      if (!state || !state.columns) return;

      const todayParis = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Paris"
      }).format(new Date());

      // Find the FIRST date >= today
      let chosen = null;
      for (const col of state.columns) {
        const d = DAY_DATES[col.id];
        if (d && d >= todayParis) {
          chosen = col.id;
          break;
        }
      }

      // If all days are past → show last day
      if (!chosen) chosen = "dec9";

      filter(chosen);
    };

    document.querySelector(".map-filters").appendChild(todayBtn);
  }

  // -------------------------------------------------------------------
  // SEARCH BOX (Paris only)
  // -------------------------------------------------------------------
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
