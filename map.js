// map.js
(function() {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // Home base
  const HOME_POSITION = { lat: 48.8287, lng: 2.3559 };

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

  // Google callback
  window.initGoogleMap = function() {
    console.log("Google Maps initializing");

    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    addHomeMarker();
    waitForItineraryThenRender();
    setupFilters();
    setupSearch();
  };

  function waitForItineraryThenRender() {
    const state = window.getItineraryState && window.getItineraryState();
    if (!state || !state.columns) {
      setTimeout(waitForItineraryThenRender, 250);
      return;
    }
    renderAllPins(state);
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  function addHomeMarker() {
    const marker = new google.maps.Marker({
      position: HOME_POSITION,
      map,
      title: "Home Base"
    });

    const inf = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    marker.addListener("click", () => inf.open(map, marker));
    marker.dayId = "home";
    markers.push(marker);
  }

  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => geocodeAndPlace(item, col.id, false));
    });
  }

  // NO MORE " + Paris"
  function geocodeAndPlace(text, dayId, centerMap) {
    geocoder.geocode({ address: text }, (results, status) => {
      if (status !== "OK" || !results || !results.length) {
        console.log("Geocode failed for:", text);
        return;
      }

      const loc = results[0].geometry.location;

      // Standard teardrop marker via Google Maps default icon
      const marker = new google.maps.Marker({
        position: loc,
        map,
        title: text,
        icon: {
          url: `http://maps.google.com/mapfiles/ms/icons/${DAY_COLORS[dayId] || "gray"}-dot.png`
        }
      });

      marker.dayId = dayId;

      const inf = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>${DAY_LABELS[dayId] || ""}`
      });

      marker.addListener("click", () => inf.open(map, marker));

      markers.push(marker);

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  // For itinerary.js
  window.addPinForItineraryItem = function(dayId, text) {
    geocodeAndPlace(text, dayId, true);
  };

  // Filters
  function setupFilters() {
    const showAll = document.getElementById("mapShowAll");
    const clear = document.getElementById("mapClear");
    const btns = document.querySelectorAll("[data-day]");

    if (showAll) showAll.onclick = () => markers.forEach(m => m.setMap(map));
    if (clear) clear.onclick = () => markers.forEach(m => m.setMap(map));

    btns.forEach(btn => {
      btn.onclick = () => {
        const day = btn.dataset.day;
        markers.forEach(m => m.setMap(null));
        markers.forEach(m => {
          if (m.dayId === day) m.setMap(map);
        });
      };
    });
  }

  // Search
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
