// map.js
// Full Google Maps version with stable callback initGoogleMap.
// Pins work reliably. Filtering works. Search works.

(function() {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // Home address
  const HOME_POSITION = { lat: 48.8287, lng: 2.3559 };

  // Day colors for map markers
  const DAY_COLORS = {
    dec3: "red",
    dec4: "blue",
    dec5: "green",
    dec6: "purple",
    dec7: "orange",
    dec8: "brown",
    dec9: "black",
    open: "gray"
  };

  // Label for info windows
  const DAY_LABELS = {
    dec3: "Dec 3",
    dec4: "Dec 4",
    dec5: "Dec 5",
    dec6: "Dec 6",
    dec7: "Dec 7",
    dec8: "Dec 8",
    dec9: "Dec 9",
    open: "Open Bin"
  };

  // Google callback function
  window.initGoogleMap = function() {
    console.log("Google Maps initializing");

    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
    });

    addHomeMarker();

    // Wait for itinerary.js to finish populating its state
    renderAllPinsStable();

    setupFilters();
    setupSearch();
  };

  // --------------------------------------------------------------------
  // Safe rendering that retries until itinerary.js is ready
  // --------------------------------------------------------------------

  function renderAllPinsStable() {
    const state = window.getItineraryState && window.getItineraryState();

    if (!state || !state.columns) {
      console.log("Itinerary not ready, retrying pins");
      setTimeout(renderAllPinsStable, 300);
      return;
    }

    renderAllPins(state);
  }

  // --------------------------------------------------------------------
  // Marker creation and clearing
  // --------------------------------------------------------------------

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  function addHomeMarker() {
    const m = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      title: "Home Base"
    });

    const inf = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    m.addListener("click", () => inf.open(map, m));

    m.dayId = "home";

    markers.push(m);
  }

  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;

      col.items.forEach(item => {
        geocodeAndPlace(item, col.id, false);
      });
    });
  }

  // --------------------------------------------------------------------
  // Geocoding and marker placement
  // --------------------------------------------------------------------

  function geocodeAndPlace(text, dayId, shouldCenter) {
    const query = text + " Paris";

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || !results.length) {
        console.log("No geocode result for", text);
        return;
      }

      const result = results[0];
      const pos = result.geometry.location;

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: text,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: DAY_COLORS[dayId] || "gray",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
          scale: 8
        }
      });

      marker.dayId = dayId;

      const inf = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>Day: ${DAY_LABELS[dayId] || "?"}`
      });

      marker.addListener("click", () => inf.open(map, marker));

      markers.push(marker);

      if (shouldCenter) {
        map.setCenter(pos);
        map.setZoom(15);
      }
    });
  }

  // Called from itinerary.js when user adds a new item
  window.addPinForItineraryItem = function(dayId, text) {
    geocodeAndPlace(text, dayId, true);
  };

  // --------------------------------------------------------------------
  // Filters
  // --------------------------------------------------------------------

  function setupFilters() {
    function apply(dayId) {
      markers.forEach(m => m.setMap(null));

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
        return;
      }

      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });
    }

    const showAll = document.getElementById("mapShowAll");
    const clear = document.getElementById("mapClear");
    const buttons = document.querySelectorAll("[data-day]");

    if (showAll) showAll.onclick = () => apply("all");
    if (clear) clear.onclick = () => apply("all");

    buttons.forEach(btn => {
      btn.onclick = () => apply(btn.dataset.day);
    });
  }

  // --------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------

  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    if (!input || !btn) return;

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      window.addItemToDay("open", text);
      geocodeAndPlace(text, "open", true);
      input.value = "";
    };
  }

})();
