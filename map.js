// map.js
// COMPLETE RESTORED LEAFLET VERSION

(function() {
  'use strict';

  let map = null;
  let markers = [];
  let markerLayer = null;

  // Color coding by day
  const DAY_COLORS = {
    dec3: "red",
    dec4: "blue",
    dec5: "green",
    dec6: "purple",
    dec7: "orange",
    dec8: "brown",
    dec9: "black"
  };

  // Day ID to readable label
  const DAY_LABELS = {
    dec3: "Dec 3",
    dec4: "Dec 4",
    dec5: "Dec 5",
    dec6: "Dec 6",
    dec7: "Dec 7",
    dec8: "Dec 8",
    dec9: "Dec 9"
  };

  // Home base
  const HOME_COORDS = [48.8287, 2.3559]; // 7 Avenue Stephen Pichon

  // Create a Leaflet icon for each color
  function makeIcon(color) {
    return L.divIcon({
      className: "custom-pin",
      html: `
        <div style="
          background: ${color};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  const defaultIcon = makeIcon("gray");

  function initMap() {
    map = L.map("liveMap").setView([48.8566, 2.3522], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    addHomePin();
    renderAllPins();
    setupFilterButtons();
    setupSearchBox();
  }

  function clearMarkers() {
    markerLayer.clearLayers();
    markers = [];
  }

  function addHomePin() {
    const marker = L.marker(HOME_COORDS, {
      title: "Home Base"
    }).bindPopup("<b>Home Base</b><br>7 Avenue Stephen Pichon");
    marker.addTo(markerLayer);
    markers.push({
      day: "home",
      label: "Home base",
      coords: HOME_COORDS,
      marker
    });
  }

  function renderAllPins() {
    clearMarkers();
    addHomePin();

    const state = window.getItineraryState();
    if (!state) return;

    state.columns.forEach(col => {
      if (col.id === "open") return;
      const dayId = col.id;

      col.items.forEach(item => {
        geocodeAndAddMarker(item, dayId, false);
      });
    });
  }

  function geocodeAndAddMarker(query, dayId, centerMap) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + " Paris")}`;

    fetch(url, {
      headers: { "Accept-Language": "en" }
    })
      .then(res => res.json())
      .then(data => {
        if (!data || data.length === 0) return;

        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        const color = DAY_COLORS[dayId] || "gray";
        const icon = makeIcon(color);
        const dayLabel = DAY_LABELS[dayId] || "Unassigned";

        const marker = L.marker([lat, lon], {
          icon,
          title: query
        }).bindPopup(`
          <b>${query}</b><br>
          Day: ${dayLabel}
        `);

        marker.addTo(markerLayer);

        markers.push({
          day: dayId,
          label: query,
          coords: [lat, lon],
          marker
        });

        if (centerMap) {
          map.setView([lat, lon], 15);
        }
      })
      .catch(err => {
        console.error("Geocode error:", err);
      });
  }

  window.addPinForItineraryItem = function(dayId, itemText) {
    geocodeAndAddMarker(itemText, dayId, false);
  };

  function setupFilterButtons() {
    const showAll = document.getElementById("mapShowAll");
    const clearBtn = document.getElementById("mapClear");

    const dayButtons = Array.from(document.querySelectorAll("[data-day]"));

    function applyFilter(dayId) {
      markers.forEach(obj => {
        if (dayId === "all") {
          obj.marker.addTo(markerLayer);
        } else if (obj.day === dayId) {
          obj.marker.addTo(markerLayer);
        } else {
          markerLayer.removeLayer(obj.marker);
        }
      });
    }

    if (showAll) {
      showAll.onclick = () => applyFilter("all");
    }

    if (clearBtn) {
      clearBtn.onclick = () => applyFilter("all");
    }

    dayButtons.forEach(btn => {
      const day = btn.dataset.day;
      btn.onclick = () => applyFilter(day);
    });
  }

  function setupSearchBox() {
    const input = document.getElementById("mapSearchInput");
    const btn = document.getElementById("mapSearchBtn");
    const day = "open";

    if (!input || !btn) return;

    btn.onclick = () => {
      const query = input.value.trim();
      if (!query) return;

      window.addItemToDay(day, query);
      geocodeAndAddMarker(query, day, true);
      input.value = "";
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMap);
  } else {
    initMap();
  }

})();
