// map.js
// Full Google Maps version. Stable. Pins load. Filters work. No iframe errors.

(function() {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // Home
  const HOME_POSITION = { lat: 48.8287, lng: 2.3559 };

  // Pin colors
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

  // Text labels
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

  // Google callback
  window.initMap = function() {
    console.log("Google Map starting");

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    geocoder = new google.maps.Geocoder();

    addHomeMarker();
    renderPinsWhenReady();
    setupFilters();
    setupSearch();

    console.log("Google Map ready");
  };

  function addHomeMarker() {
    const m = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      title: "Home Base"
    });

    const info = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    m.addListener("click", () => info.open(map, m));

    m.dayId = "home";
    markers.push(m);
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  function renderPinsWhenReady() {
    const state = window.getItineraryState();
    if (!state) {
      console.log("Itinerary not ready, retrying pins");
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(state);
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

  function geocodeAndPlace(text, dayId, center) {
    const query = text + " Paris";

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) {
        console.warn("Geocode failed for", text, status);
        return;
      }

      const pos = results[0].geometry.location;

      const m = new google.maps.Marker({
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

      m.dayId = dayId;

      const info = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>Day: ${DAY_LABELS[dayId] || "Unassigned"}`
      });

      m.addListener("click", () => info.open(map, m));

      markers.push(m);

      if (center) {
        map.setCenter(pos);
        map.setZoom(15);
      }
    });
  }

  window.addPinForItineraryItem = function(dayId, text) {
    geocodeAndPlace(text, dayId, true);
  };

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
    const dayBtns = document.querySelectorAll("[data-day]");

    if (showAll) showAll.onclick = () => apply("all");
    if (clear) clear.onclick = () => apply("all");

    dayBtns.forEach(btn => {
      const id = btn.dataset.day;
      btn.onclick = () => apply(id);
    });
  }

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
