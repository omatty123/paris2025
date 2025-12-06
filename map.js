// map.js
// Google Maps with:
// - Home Base star marker
// - All geocoding anchored to France
// - Fit bounds for visible markers
// - Today filter using Paris time

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let bounds;

  // Home Base coordinates
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  // Classic pin icons
  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/brown-dot.png",
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",
    // star for home
    home: "http://maps.google.com/mapfiles/kml/shapes/star.png"
  };

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

  function getTodayDayId() {
    const parisDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const mapDates = {
      "2025-12-03": "dec3",
      "2025-12-04": "dec4",
      "2025-12-05": "dec5",
      "2025-12-06": "dec6",
      "2025-12-07": "dec7",
      "2025-12-08": "dec8",
      "2025-12-09": "dec9"
    };

    return mapDates[parisDate] || null;
  }

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
    map.fitBounds(bounds);
  }

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

  function geocodeAndMark(text, dayId, centerMap) {
    // Option A: always keep results inside France
    const query = `${text}, France`;

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || !results.length) {
        console.log("Geocode failed:", text, status);
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
      bounds.extend(loc);

      if (centerMap) {
        map.setCenter(loc);
        map.setZoom(15);
      }

      map.fitBounds(bounds);
    });
  }

  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  function setupFilters() {
    function applyFilter(dayId) {
      const visible = [];
      const newBounds = new google.maps.LatLngBounds();

      markers.forEach(m => {
        m.setMap(null);
      });

      markers.forEach(m => {
        if (
          dayId === "all" ||
          m.dayId === dayId ||
          m.dayId === "home"
        ) {
          m.setMap(map);
          visible.push(m);
          newBounds.extend(m.getPosition());
        }
      });

      if (visible.length > 0) {
        map.fitBounds(newBounds);
      }
    }

    const showAllBtn = document.getElementById("mapShowAll");
    if (showAllBtn) showAllBtn.onclick = () => applyFilter("all");

    const clearBtn = document.getElementById("mapClear");
    if (clearBtn) clearBtn.onclick = () => applyFilter("all");

    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });

    const todayBtn = document.getElementById("mapToday");
    if (todayBtn) {
      todayBtn.onclick = () => {
        const todayId = getTodayDayId();
        if (todayId) {
          applyFilter(todayId);
        } else {
          applyFilter("all");
        }
      };
    }
  }

  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    if (!input || !btn) return;

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      window.addItemToDay("open", text);
      geocodeAndMark(text, "open", true);
      input.value = "";
    };
  }
})();
