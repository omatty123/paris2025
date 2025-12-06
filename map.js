// map.js
// COMPLETE GOOGLE MAPS VERSION
// Matches index.html which loads Google Maps + uses initLiveMap callback

(function() {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let homeMarker;

  const HOME = {
    label: "Home base",
    coords: { lat: 48.8287, lng: 2.3559 }
  };

  // Colors for pin labels
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

  // --------------------------------------------------------
  // INIT (called by Google Maps callback)
  // --------------------------------------------------------

  window.initLiveMap = function() {
    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 12,
      mapTypeControl: false,
    });

    geocoder = new google.maps.Geocoder();

    addHomePin();
    waitForItineraryThenRenderPins();

    setupFilterButtons();
    setupSearchBox();
  };

  // --------------------------------------------------------
  // HOME PIN
  // --------------------------------------------------------

  function addHomePin() {
    homeMarker = new google.maps.Marker({
      position: HOME.coords,
      map,
      title: HOME.label
    });

    markers.push({
      day: "home",
      label: HOME.label,
      marker: homeMarker
    });
  }

  // --------------------------------------------------------
  // LOAD ITINERARY AND PINS
  // --------------------------------------------------------

  function waitForItineraryThenRenderPins() {
    if (!window.getItineraryState) {
      setTimeout(waitForItineraryThenRenderPins, 200);
      return;
    }
    renderAllPins();
  }

  function clearPins() {
    markers.forEach(m => m.marker.setMap(null));
    markers = [];
    addHomePin();
  }

  function renderAllPins() {
    clearPins();

    const state = window.getItineraryState();
    if (!state) return;

    let delay = 0;

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => {
        delay += 120; // avoid geocoding throttle
        setTimeout(() => geocodeAndAddPin(item, col.id, false), delay);
      });
    });
  }

  // --------------------------------------------------------
  // GEOCODING AND PIN CREATION
  // --------------------------------------------------------

  function geocodeAndAddPin(query, dayId, centerMap) {
    const address = `${query}, Paris`;

    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results[0]) {
        console.warn("Geocode failed:", query, status);
        return;
      }

      const loc = results[0].geometry.location;

      const marker = new google.maps.Marker({
        map,
        position: loc,
        title: query,
        label: {
          text: DAY_LABELS[dayId] || "?",
          color: "white",
          fontSize: "10px"
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: DAY_COLORS[dayId] || "gray",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2
        }
      });

      const info = new google.maps.InfoWindow({
        content: `<b>${query}</b><br>${DAY_LABELS[dayId]}`
      });

      marker.addListener("click", () => info.open({ anchor: marker, map }));

      markers.push({
        day: dayId,
        label: query,
        marker
      });

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  // Called by itinerary.js
  window.addPinForItineraryItem = function(dayId, text) {
    geocodeAndAddPin(text, dayId, true);
  };

  // --------------------------------------------------------
  // FILTER SYSTEM
  // --------------------------------------------------------

  function setupFilterButtons() {
    const showAll = document.getElementById("mapShowAll");
    const clear = document.getElementById("mapClear");
    const dayBtns = [...document.querySelectorAll("[data-day]")];

    function applyFilter(dayId) {
      markers.forEach(m => {
        if (dayId === "all" || m.day === dayId || m.day === "home") {
          m.marker.setMap(map);
        } else {
          m.marker.setMap(null);
        }
      });
    }

    if (showAll) showAll.onclick = () => applyFilter("all");
    if (clear) clear.onclick = () => applyFilter("all");

    dayBtns.forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });
  }

  // --------------------------------------------------------
  // SEARCH BOX
  // --------------------------------------------------------

  function setupSearchBox() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    if (!input || !btn) return;

    btn.onclick = () => {
      const q = input.value.trim();
      if (!q) return;

      window.addItemToDay("open", q);
      geocodeAndAddPin(q, "open", true);
      input.value = "";
    };
  }

})();
