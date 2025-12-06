// map.js
// Full Google Maps version. No Leaflet. No iframe errors.

(function() {
  "use strict";

  let map;
  let markers = [];
  let geocoder;

  // Home address
  const HOME_POSITION = { lat: 48.8287, lng: 2.3559 };

  // Day colors
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

  // Label for popup
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

  // Main init called by Google Maps script
  window.initMap = function() {
    console.log("Google Map initializing");

    geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById("liveMap"), {
      center: { lat: 48.8566, lng: 2.3522 },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false
    });

    addHomeMarker();
    renderAllItineraryPins();
    setupFilters();
    setupSearch();

    console.log("Google Map ready");
  };

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

    const info = new google.maps.InfoWindow({
      content: "<b>Home Base</b><br>7 Avenue Stephen Pichon"
    });

    m.addListener("click", () => info.open(map, m));
    markers.push(m);
  }

  function renderAllItineraryPins() {
    clearMarkers();
    addHomeMarker();

    const state = window.getItineraryState();
    if (!state) {
      console.log("Itinerary not ready, retrying");
      setTimeout(renderAllItineraryPins, 300);
      return;
    }

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(text => {
        geocodeAndPlace(text, col.id, false);
      });
    });
  }

  function geocodeAndPlace(placeText, dayId, center) {
    const query = placeText + " Paris";

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || results.length === 0) return;

      const pos = results[0].geometry.location;
      const color = DAY_COLORS[dayId] || "gray";
      const label = DAY_LABELS[dayId] || "Unassigned";

      const m = new google.maps.Marker({
        position: pos,
        map,
        title: placeText,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
          scale: 8
        }
      });

      const info = new google.maps.InfoWindow({
        content: `<b>${placeText}</b><br>Day: ${label}`
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
    function apply(day) {
      markers.forEach(m => m.setMap(null));

      if (day === "all") {
        markers.forEach(m => m.setMap(map));
        return;
      }

      const label = DAY_LABELS[day];

      const filtered = markers.filter(m => {
        const title = m.getTitle();
        return title && label && m.dayId === day;
      });

      filtered.forEach(m => m.setMap(map));
    }

    const showAll = document.getElementById("mapShowAll");
    const clear = document.getElementById("mapClear");
    const dayBtns = document.querySelectorAll("[data-day]");

    if (showAll) showAll.onclick = () => apply("all");
    if (clear) clear.onclick = () => apply("all");

    dayBtns.forEach(btn => {
      btn.onclick = () => apply(btn.dataset.day);
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
