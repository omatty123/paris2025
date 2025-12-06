// map.js
// Stable Google Maps version using classic google.maps.Marker.
// Full day color coding. No forced Paris. Rouen works.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // HOME BASE — correct coordinates
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

    // ★ REAL STAR ICON
    home: "https://maps.google.com/mapfiles/kml/shapes/star.png"
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

  // Google callback
  window.initGoogleMap = function () {
    console.log("Google Maps initializing");

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
    const state = window.getItineraryState && window.getItineraryState();
    if (!state || !state.columns) {
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(state);
  }

  // Clear markers
  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
  }

  // Add HOME marker
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

  // FIT MAP TO ALL MARKERS
  function fitMapToMarkers() {
    if (!markers.length) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(m => bounds.extend(m.getPosition()));

    map.fitBounds(bounds);
  }

  // Render all pins
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => {
        geocodeAndMark(item, col.id, false);
      });
    });

    // Ensure home + all items are visible
    setTimeout(fitMapToMarkers, 600);
  }

  // Geocode + place marker
  function geocodeAndMark(text, dayId, center) {
    const query = text;

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results?.length) {
        console.log("Geocode failed:", text);
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

      if (center) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  // Exposed for itinerary.js
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // Filters
  function setupFilters() {
    function filter(dayId) {
      markers.forEach(m => m.setMap(null));

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
        setTimeout(fitMapToMarkers, 300);
        return;
      }

      markers.forEach(m => {
        if (m.dayId === dayId) m.setMap(map);
      });

      setTimeout(fitMapToMarkers, 300);
    }

    document.getElementById("mapShowAll").onclick = () => filter("all");
    document.getElementById("mapClear").onclick = () => filter("all");

    // TODAY BUTTON SUPPORT
    const todayBtn = document.getElementById("mapToday");
    if (todayBtn) {
      todayBtn.onclick = () => {
        const pk = new Date().toLocaleString("en-CA", { timeZone: "Europe/Paris" }).split(" ")[0];
        const day = pk.slice(5); // MM-DD
        const mapDay = {
          "12-03": "dec3",
          "12-04": "dec4",
          "12-05": "dec5",
          "12-06": "dec6",
          "12-07": "dec7",
          "12-08": "dec8",
          "12-09": "dec9"
        }[day];

        if (mapDay) filter(mapDay);
      };
    }

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => filter(btn.dataset.day);
    });
  }

  // Search box
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
