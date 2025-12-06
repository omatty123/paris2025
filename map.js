// map.js
// COMPLETE WORKING LEAFLET MAP WITH RELIABLE PIN RENDERING
// Fully rewritten for stability and guaranteed pin display

(function() {
  "use strict";

  let map;
  let markerLayer;
  let markers = [];

  // Home address coordinates (Paris 13)
  const HOME = {
    label: "Home base",
    coords: [48.8287, 2.3559]
  };

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

  // Day labels
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

  // ---------------------------------------------------------
  // ICONS
  // ---------------------------------------------------------

  function makeIcon(color) {
    return L.divIcon({
      className: "pin-icon",
      html: `
        <div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  // ---------------------------------------------------------
  // MAP INITIALIZATION
  // ---------------------------------------------------------

  function initMap() {
    if (map) return;

    try {
      map = L.map("liveMap").setView([48.8566, 2.3522], 12);
    } catch (err) {
      console.error("Leaflet failed to initialize:", err);
      return;
    }

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    addHomePin();
    safeRenderPins();

    setupFilters();
    setupSearch();
  }

  function safeInit() {
    if (!window.L) {
      console.warn("Leaflet not loaded yet, retrying");
      setTimeout(safeInit, 250);
      return;
    }
    initMap();
  }

  // ---------------------------------------------------------
  // MARKER MANAGEMENT
  // ---------------------------------------------------------

  function clearMarkers() {
    markerLayer.clearLayers();
    markers = [];
  }

  function addHomePin() {
    const marker = L.marker(HOME.coords)
      .bindPopup("<b>Home Base</b><br>7 Avenue Stephen Pichon");

    markerLayer.addLayer(marker);

    markers.push({
      label: HOME.label,
      day: "home",
      coords: HOME.coords,
      marker
    });
  }

  // Ensures itinerary is present before rendering
  function safeRenderPins() {
    if (!window.getItineraryState) {
      console.warn("Itinerary not ready, retrying map pin load");
      setTimeout(safeRenderPins, 300);
      return;
    }
    renderAllPins();
  }

  function renderAllPins() {
    const state = window.getItineraryState();
    if (!state) {
      setTimeout(renderAllPins, 300);
      return;
    }

    clearMarkers();
    addHomePin();

    let delay = 0;

    state.columns.forEach(col => {
      if (col.id === "open") return;

      col.items.forEach(item => {
        delay += 120;  // sequential geocoding avoids Nominatim throttling
        setTimeout(() => {
          geocodeAndPin(item, col.id, false);
        }, delay);
      });
    });
  }

  // Reliable geocode function
  function geocodeAndPin(query, dayId, center) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " Paris")}`, {
      headers: { "Accept-Language": "en" }
    })
      .then(r => r.json())
      .then(data => {
        if (!data || data.length === 0) {
          console.warn("No geocode match for:", query);
          return;
        }

        const p = data[0];
        const lat = +p.lat;
        const lon = +p.lon;

        const icon = makeIcon(DAY_COLORS[dayId] || "gray");
        const label = DAY_LABELS[dayId] || "Unassigned";

        const marker = L.marker([lat, lon], { icon }).bindPopup(`
          <b>${query}</b><br>${label}
        `);

        markerLayer.addLayer(marker);

        markers.push({
          day: dayId,
          label: query,
          coords: [lat, lon],
          marker
        });

        if (center) map.setView([lat, lon], 15);
      })
      .catch(err => {
        console.error("Geocode error for:", query, err);
      });
  }

  // Called by itinerary.js when adding an item
  window.addPinForItineraryItem = function(dayId, itemText) {
    geocodeAndPin(itemText, dayId, true);
  };

  // ---------------------------------------------------------
  // FILTER BUTTONS
  // ---------------------------------------------------------

  function setupFilters() {
    const showAll = document.getElementById("mapShowAll");
    const clear = document.getElementById("mapClear");
    const dayButtons = [...document.querySelectorAll("[data-day]")];

    function applyFilter(dayId) {
      markers.forEach(obj => {
        if (dayId === "all" || obj.day === dayId) {
          markerLayer.addLayer(obj.marker);
        } else {
          markerLayer.removeLayer(obj.marker);
        }
      });
    }

    if (showAll) showAll.onclick = () => applyFilter("all");
    if (clear) clear.onclick = () => applyFilter("all");

    dayButtons.forEach(btn => {
      btn.onclick = () => applyFilter(btn.dataset.day);
    });
  }

  // ---------------------------------------------------------
  // SEARCH BOX
  // ---------------------------------------------------------

  function setupSearch() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");

    if (!input || !btn) return;

    btn.onclick = () => {
      const query = input.value.trim();
      if (!query) return;

      window.addItemToDay("open", query);
      geocodeAndPin(query, "open", true);

      input.value = "";
    };
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", safeInit);
  } else {
    safeInit();
  }

})();
