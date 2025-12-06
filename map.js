// map.js
// Stable Google Maps version using classic google.maps.Marker.
// Full day color coding. Conditional Paris vs Rouen geocoding.
// Auto fit to all visible pins. Today filter restored.

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];
  let globalBounds = null;
  let currentFilter = "all";

  // HOME BASE - correct coordinates
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
    // Home as a star icon
    home: "http://maps.google.com/mapfiles/ms/icons/ylw-stars.png"
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

  // Day ids to dates (mirror of itinerary.js DAY_DATES)
  const DAY_DATES = {
    dec3: "2025-12-03",
    dec4: "2025-12-04",
    dec5: "2025-12-05",
    dec6: "2025-12-06",
    dec7: "2025-12-07",
    dec8: "2025-12-08",
    dec9: "2025-12-09"
  };

  // Get today's date in Paris timezone as YYYY-MM-DD
  function getTodayParisDateStr() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(new Date());
  }

  function getTodayDayId() {
    const todayStr = getTodayParisDateStr();
    for (const [id, dateStr] of Object.entries(DAY_DATES)) {
      if (dateStr === todayStr) return id;
    }
    return null;
  }

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

    // Start with fresh bounds
    globalBounds = new google.maps.LatLngBounds();

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
    globalBounds = new google.maps.LatLngBounds();
  }

  // Extend bounds and optionally refit map
  function extendBoundsAndRefit(position) {
    if (!globalBounds) {
      globalBounds = new google.maps.LatLngBounds();
    }
    globalBounds.extend(position);

    // Refit only when showing all, or when current filter matches new marker's day
    refitToVisibleMarkers();
  }

  function refitToVisibleMarkers() {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasVisible = false;

    markers.forEach(m => {
      if (m.getMap()) {
        bounds.extend(m.getPosition());
        hasVisible = true;
      }
    });

    if (!hasVisible) return;

    map.fitBounds(bounds, { padding: 80 });
  }

  // Add marker helper
  function addMarker(position, title, dayId, infoHtml) {
    const marker = new google.maps.Marker({
      position,
      map,
      title,
      icon: DAY_ICONS[dayId] || DAY_ICONS.open
    });

    marker.dayId = dayId;

    if (infoHtml) {
      const inf = new google.maps.InfoWindow({
        content: infoHtml
      });
      marker.addListener("click", () => inf.open(map, marker));
    }

    markers.push(marker);
    extendBoundsAndRefit(position);

    return marker;
  }

  // Add HOME marker
  function addHomeMarker() {
    const infoHtml = "<b>Home Base</b><br>7 Avenue Stephen Pichon";
    addMarker(HOME_POSITION, "Home Base", "home", infoHtml);
  }

  // Render all pins
  function renderAllPins(state) {
    clearMarkers();
    addHomeMarker();

    currentFilter = "all";

    state.columns.forEach(col => {
      if (col.id === "open") return;
      col.items.forEach(item => {
        geocodeAndMark(item, col.id, false);
      });
    });

    // Final refit after queue kicked off
    setTimeout(refitToVisibleMarkers, 1000);
  }

  // Geocode + place marker with conditional city hints
  function geocodeAndMark(text, dayId, center) {
    if (!geocoder) return;

    let query = text;

    // Conditional hints to improve reliability
    // Rouen day
    if (dayId === "dec5") {
      query = text + ", Rouen, France";
    }
    // Paris days
    else if (
      dayId === "dec3" ||
      dayId === "dec4" ||
      dayId === "dec6" ||
      dayId === "dec7" ||
      dayId === "dec8" ||
      dayId === "dec9"
    ) {
      query = text + ", Paris, France";
    }
    // Open bin or unknown day: raw text only

    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== "OK" || !results || !results.length) {
        console.log("Geocode failed:", text, "status:", status);
        return;
      }

      const loc = results[0].geometry.location;
      const infoHtml = `<b>${text}</b><br>${DAY_LABELS[dayId] || ""}`;

      const marker = addMarker(loc, text, dayId, infoHtml);

      if (center) {
        map.setCenter(loc);
        map.setZoom(15);
      }

      // If currently filtering by a different day, hide this marker
      if (currentFilter !== "all" && currentFilter !== dayId && marker) {
        marker.setMap(null);
      }
    });
  }

  // Exposed for itinerary.js
  window.addPinForItineraryItem = function (dayId, text) {
    geocodeAndMark(text, dayId, true);
  };

  // Filters
  function setupFilters() {
    function applyFilter(dayId) {
      currentFilter = dayId;

      if (dayId === "all") {
        markers.forEach(m => m.setMap(map));
      } else {
        markers.forEach(m => {
          if (m.dayId === dayId || m.dayId === "home") {
            m.setMap(map);
          } else {
            m.setMap(null);
          }
        });
      }

      refitToVisibleMarkers();
    }

    const showAllBtn = document.getElementById("mapShowAll");
    if (showAllBtn) {
      showAllBtn.onclick = () => applyFilter("all");
    }

    const clearBtn = document.getElementById("mapClear");
    if (clearBtn) {
      clearBtn.onclick = () => applyFilter("all");
    }

    // Restore Today button if present
    const todayBtn = document.getElementById("mapToday");
    if (todayBtn) {
      todayBtn.onclick = () => {
        const todayId = getTodayDayId();
        if (todayId) {
          applyFilter(todayId);
        } else {
          // If no matching day, just show all
          applyFilter("all");
        }
      };
    }

    // Day buttons with data-day
    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });
  }

  // Search box
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
