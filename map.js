// map.js
// Full Google Maps version. Working pins, working filters, working search.
// Fixes: markers now store dayId, filters work, pins appear reliably.

(function() {
  "use strict";

  let map;
  let markers = [];
  let geocoder;

  const HOME_POSITION = { lat: 48.8287, lng: 2.3559 };

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

  //--------------------------------------------------------------------
  // GOOGLE MAP INIT
  //--------------------------------------------------------------------

  window.initMap = function() {
    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    addHomeMarker();
    renderAllPins();
    setupFilters();
    setupSearch();
  };

  //--------------------------------------------------------------------
  // BASE FUNCTIONS
  //--------------------------------------------------------------------

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

    m.dayId = "home";

    const info = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    m.addListener("click", () => info.open(map, m));
    markers.push(m);
  }

  //--------------------------------------------------------------------
  // RENDER PINS FROM ITINERARY
  //--------------------------------------------------------------------

  function renderAllPins() {
    clearMarkers();
    addHomeMarker();

    const state = window.getItineraryState();
    if (!state || !state.columns) {
      setTimeout(renderAllPins, 300);
      return;
    }

    state.columns.forEach(col => {
      if (col.id === "open") return;

      col.items.forEach(item => {
        geocodeAndPlace(item, col.id, false);
      });
    });
  }

  //--------------------------------------------------------------------
  // GEOCODING + MARKER CREATION
  //--------------------------------------------------------------------

  function geocodeAndPlace(itemText, dayId, centerMap) {
    const query = itemText + " Paris";

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) return;

      const pos = results[0].geometry.location;
      const color = DAY_COLORS[dayId] || "gray";
      const label = DAY_LABELS[dayId] || "Unassigned";

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: itemText,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
          scale: 8
        }
      });

      // FIX: store dayId so filtering works
      marker.dayId = dayId;

      const info = new google.maps.InfoWindow({
        content: `<b>${itemText}</b><br>Day: ${label}`
      });

      marker.addListener("click", () => info.open(map, marker));

      markers.push(marker);

      if (centerMap) {
        map.setCenter(pos);
        map.setZoom(15);
      }
    });
  }

  // Exposed function for itinerary.js
  window.addPinForItineraryItem = function(dayId, text) {
    geocodeAndPlace(text, dayId, true);
  };

  //--------------------------------------------------------------------
  // FILTERS
  //--------------------------------------------------------------------

  function setupFilters() {
    function applyFilter(dayId) {
      markers.forEach(m => m.setMap(null));

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
        return;
      }

      markers
        .filter(m => m.dayId === dayId)
        .forEach(m => m.setMap(map));
    }

    document.getElementById("mapShowAll").onclick = () => applyFilter("all");
    document.getElementById("mapClear").onclick = () => applyFilter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });
  }

  //--------------------------------------------------------------------
  // SEARCH + ADD TO OPEN BIN
  //--------------------------------------------------------------------

  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      window.addItemToDay("open", text);
      geocodeAndPlace(text, "open", true);

      input.value = "";
    };
  }

})();
