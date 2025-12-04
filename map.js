let map;
let markers = {};

const HOME = { lat: 48.8335, lng: 2.3571 };

const DAY_PINS = {
  "dec3": [
    { lat: 48.8554, lng: 2.3444, label: "Sainte-Chapelle" },
    { lat: 48.8600, lng: 2.3266, label: "Musée d’Orsay" }
  ],
  "dec4": [
    { lat: 48.8606, lng: 2.3376, label: "Louvre" },
    { lat: 48.8635, lng: 2.3272, label: "Tuileries" }
  ],
  "dec5": [
    { lat: 49.4431, lng: 1.0993, label: "Rouen Cathedral" }
  ],
  "dec6": [],
  "dec7": []
};

function initLiveMap() {
  map = new google.maps.Map(document.getElementById("liveMap"), {
    center: HOME,
    zoom: 14
  });

  new google.maps.Marker({
    position: HOME,
    map,
    title: "Home Base",
    icon: {
      path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: "#7a4f2e",
      fillOpacity: 1,
      strokeColor: "#3a2a1a",
      strokeWeight: 1
    }
  });

  for (const day in DAY_PINS) {
    markers[day] = DAY_PINS[day].map(p =>
      new google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: p.label
      })
    );
  }

  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.onclick = () => filterMarkers(btn.dataset.day);
  });
}

function filterMarkers(day) {
  for (const d in markers) {
    markers[d].forEach(m => m.setMap(null));
  }

  if (day === "all") {
    for (const d in markers) {
      markers[d].forEach(m => m.setMap(map));
    }
  } else {
    markers[day].forEach(m => m.setMap(map));
  }
}
