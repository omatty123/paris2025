// map.js
// France only geocoding
// - Dec 5 -> Rouen, France
// - All other days + Open Bin -> Paris, France
// Home base star always visible
// Today button uses real Paris date:
//   - If today is Dec 3–9, 2025 -> show that day's pins + home
//   - Otherwise -> show only home base

(function () {
  "use strict";

  let map;
  let geocoder;
  let markers = [];

  // For initial fit after all geocodes
  let pinsToLoad = 0;
  let pinsLoaded = 0;

  // Home base coordinates (locked)
  const HOME_POSITION = { lat: 48.833469, lng: 2.359747 };

  const DAY_ICONS = {
    dec3: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
    dec4: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    dec5: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
    dec6: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    dec7: "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    dec8: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png", // Changed from brown to yellow for testing
    dec9: "http://maps.google.com/mapfiles/ms/icons/black-dot.png",
    open: "http://maps.google.com/mapfiles/ms/icons/grey-dot.png",

    // Star for home base
    home: "https://maps.google.com/mapfiles/kml/shapes/star.png"
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

  // Normalize any incoming day id so little inconsistencies cannot break pins
  function normalizeDayId(raw) {
    if (!raw) return "";
    return String(raw).trim().toLowerCase();
  }

  // Google Maps init callback
  window.initGoogleMap = function () {
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

  // Wait until itinerary.js has set up state
  function renderPinsWhenReady() {
    const s = window.getItineraryState && window.getItineraryState();
    if (!s || !s.columns) {
      setTimeout(renderPinsWhenReady, 300);
      return;
    }
    renderAllPins(s);
    
    // After rendering all pins, apply "today" filter as default view
    setTimeout(() => {
      applyTodayFilter();
    }, 1000); // Give geocoding time to complete
  }

  function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
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
  }

  // Render all itinerary pins at startup
  function renderAllPins(state) {
    console.log("=== renderAllPins called ===");
    console.log("Current state:", state);
    
    clearMarkers();
    addHomeMarker();

    pinsLoaded = 0;
    pinsToLoad = 0;

    state.columns.forEach(col => {
      const colId = normalizeDayId(col.id);
      console.log(`Processing column ${colId} with ${col.items.length} items:`, col.items);
      
      col.items.forEach(item => {
        if (shouldSkipItem(item)) {
          console.log(`Skipping item: ${item}`);
          return;
        }
        console.log(`Will geocode: ${item} for day ${colId}`);
        pinsToLoad++;
        geocodeAndMark(item, colId, false);
      });
    });

    console.log(`Total pins to load: ${pinsToLoad}`);

    if (pinsToLoad === 0) {
      // Only home base
      fitAllPins();
    }
  }
  
  // Debounce timer for refresh
  let refreshTimer = null;
  
  // Expose function to refresh all pins (called when itinerary changes)
  window.refreshMapPins = function() {
    console.log("=== refreshMapPins called (will debounce) ===");
    
    // Clear any pending refresh
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    
    // Wait 500ms before actually refreshing to batch multiple changes
    refreshTimer = setTimeout(() => {
      console.log("=== Actually refreshing pins now ===");
      const state = window.getItineraryState && window.getItineraryState();
      if (state) {
        renderAllPins(state);
      }
      refreshTimer = null;
    }, 500);
  };

  // Items that should not create pins
  function shouldSkipItem(text) {
    if (!text) return true;
    const lower = text.toLowerCase();

    // Do not pin walking home
    if (lower.includes("walk home")) return true;

    return false;
  }

  // Force everything into France
  function getForcedQuery(text, dayId) {
    if (dayId === "dec5") {
      // Rouen day
      return text + ", Rouen, France";
    }
    // Everything else including Open Bin is Paris
    return text + ", Paris, France";
  }

  // Geocode and create marker
  function geocodeAndMark(text, rawDayId, center) {
    if (!text || !text.trim()) return;

    const dayId = normalizeDayId(rawDayId) || "open";
    const forcedQuery = getForcedQuery(text, dayId);

    console.log(`[GEOCODE START] "${text}" → dayId: ${dayId}, query: "${forcedQuery}"`);

    geocoder.geocode({ address: forcedQuery }, (results, status) => {
      if (status !== "OK" || !results || !results.length) {
        console.error(`[GEOCODE FAIL] "${text}" - Status: ${status}`);
        pinsLoaded++;
        if (pinsLoaded === pinsToLoad) {
          fitAllPins();
        }
        return;
      }

      const loc = results[0].geometry.location;
      console.log(`[GEOCODE SUCCESS] "${text}" → lat: ${loc.lat()}, lng: ${loc.lng()}`);

      const marker = new google.maps.Marker({
        position: loc,
        map,
        title: text,
        icon: DAY_ICONS[dayId] || DAY_ICONS.open
      });

      marker.dayId = dayId;
      console.log(`[MARKER CREATED] "${text}" with dayId: ${dayId}, icon: ${DAY_ICONS[dayId]}`);

      const inf = new google.maps.InfoWindow({
        content: `<b>${text}</b><br>${DAY_LABELS[dayId] || ""}`
      });

      marker.addListener("click", () => inf.open(map, marker));

      markers.push(marker);
      console.log(`[MARKER ADDED] Total markers now: ${markers.length}`);

      pinsLoaded++;
      console.log(`[PROGRESS] ${pinsLoaded}/${pinsToLoad} pins loaded`);
      if (pinsLoaded === pinsToLoad) {
        console.log("[ALL PINS LOADED] Fitting bounds...");
        fitAllPins();
      }

      if (center) {
        map.setCenter(loc);
        map.setZoom(15);
      }
    });
  }

  // Legacy function - kept for backwards compatibility
  // For itinerary.js to add a pin when a new item is created
  window.addPinForItineraryItem = function (dayId, text) {
    console.log("=== addPinForItineraryItem called (legacy) ===");
    window.refreshMapPins();
  };

  // Show only home base on map
  function showOnlyHome() {
    markers.forEach(m => m.setMap(null));
    markers.forEach(m => {
      if (m.dayId === "home") m.setMap(map);
    });
    fitAllPins();
  }

  // Fit map to all visible markers
  function fitAllPins() {
    const visible = markers.filter(m => m.getMap());
    console.log(`[FIT] Fitting ${visible.length} visible markers`);
    
    if (!visible.length) return;

    if (visible.length === 1) {
      // Just one marker (probably home base), center on it
      console.log(`[FIT] Single marker, centering on it`);
      map.setCenter(visible[0].getPosition());
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    visible.forEach(m => {
      bounds.extend(m.getPosition());
      console.log(`[FIT] Including marker: ${m.title} at ${m.getPosition().lat()}, ${m.getPosition().lng()}`);
    });
    
    // Add padding so the view is wider and shows all markers comfortably
    map.fitBounds(bounds, {
      padding: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      }
    });
    
    // Don't constrain zoom - let it show the full area from Paris to Rouen
    console.log(`[FIT] Bounds fitted with padding`);
  }

  // Apply filter for a specific day
  function applyFilter(rawDayId) {
    const dayId = normalizeDayId(rawDayId);
    console.log(`[FILTER] Applying filter for: "${rawDayId}" (normalized: "${dayId}")`);
    console.log(`[FILTER] Total markers available: ${markers.length}`);
    
    // Log all marker dayIds
    markers.forEach(m => console.log(`  - Marker dayId: ${m.dayId}, title: ${m.title}`));

    if (dayId === "all" || dayId === "") {
      // Show everything including home
      console.log("[FILTER] Showing all markers");
      markers.forEach(m => m.setMap(map));
      fitAllPins();
      return;
    }

    // Day specific filter, always include home
    console.log(`[FILTER] Filtering for dayId: ${dayId} + home`);
    let shownCount = 0;
    markers.forEach(m => m.setMap(null));
    markers.forEach(m => {
      if (m.dayId === "home" || m.dayId === dayId) {
        m.setMap(map);
        shownCount++;
        console.log(`  ✓ Showing: ${m.title} (${m.dayId})`);
      } else {
        console.log(`  ✗ Hiding: ${m.title} (${m.dayId})`);
      }
    });
    console.log(`[FILTER] Showing ${shownCount} markers`);
    fitAllPins();
  }

  // Apply today's filter (show only today's pins + home base)
  function applyTodayFilter() {
    const parisToday = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const DAY_MAP = {
      "2025-12-03": "dec3",
      "2025-12-04": "dec4",
      "2025-12-05": "dec5",
      "2025-12-06": "dec6",
      "2025-12-07": "dec7",
      "2025-12-08": "dec8",
      "2025-12-09": "dec9"
    };

    const dayId = DAY_MAP[parisToday];

    // Outside trip dates, show only home base
    if (!dayId) {
      showOnlyHome();
      return;
    }

    applyFilter(dayId);
  }

  // Filters including Today
  function setupFilters() {

    const showAllBtn = document.getElementById("mapShowAll");
    const clearBtn = document.getElementById("mapClear");
    const todayBtn = document.getElementById("mapToday");

    if (showAllBtn) {
      showAllBtn.onclick = () => applyFilter("all");
    }

    if (clearBtn) {
      clearBtn.onclick = () => applyFilter("all");
    }

    // Day buttons dec3 to dec9
    document.querySelectorAll("[data-day]").forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });

    // Today button, real Paris date mapped to trip dates
    if (todayBtn) {
      todayBtn.onclick = () => applyTodayFilter();
    }
  }

  // Search box, add to Open Bin as Paris locations
  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    if (!input || !btn) return;

    btn.onclick = () => {
      const text = input.value.trim();
      if (!text) return;

      if (typeof window.addItemToDay === "function") {
        window.addItemToDay("open", text);
      }
      
      // Increment counter and geocode
      pinsToLoad++;
      geocodeAndMark(text, "open", true);
      input.value = "";
    };
  }
})();
