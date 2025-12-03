// map.js — full interactive MyMaps sync

let map;
let kmlLayer;
let markers = {};
let selectedDay = null;

// MyMaps KML URL (replace "layer" param with yours if you add layers)
const KML_URL =
  "https://www.google.com/maps/d/u/0/kml?mid=1k9SguuxO-GBk3bF4j2mr9lpahzS7Nbs";

function initLiveMap() {
  map = new google.maps.Map(document.getElementById("liveMap"), {
    center: { lat: 48.8566, lng: 2.3522 },
    zoom: 12,
    mapTypeControl: false,
  });

  kmlLayer = new google.maps.KmlLayer({
    url: KML_URL,
    suppressInfoWindows: false,
    preserveViewport: false,
    map: map,
  });

  kmlLayer.addListener("defaultviewport_changed", () => {});
}

// Highlight matched pin
function highlightPlace(name) {
  const mk = markers[name];
  if (!mk) return;
  mk.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => mk.setAnimation(null), 1500);
  map.panTo(mk.getPosition());
}

// Show only markers for a given list
function showMarkersForList(names) {
  Object.values(markers).forEach((mk) => mk.setVisible(false));
  names.forEach((n) => markers[n] && markers[n].setVisible(true));
}

// Reset all visibility
function showAllMarkers() {
  Object.values(markers).forEach((mk) => mk.setVisible(true));
}

// External API for itinerary.js
window.MapAPI = {
  highlightPlace,
  showMarkersForList,
  showAllMarkers,
  setSelectedDay: (d) => (selectedDay = d),
};
