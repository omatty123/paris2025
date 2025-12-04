// itinerary.js — unchanged logic, only presentation alignment cleaned

window.ITIN_DATA = {
  "columns": [
    {
      "id": "open",
      "title": "Open Bin",
      "meta": "",
      "items": [
        "Arrive CDG",
        "Walk the Coulée Verte",
        "Drink at Le Train Bleu"
      ]
    },

    {
      "id": "dec3",
      "title": "Dec 3",
      "meta": "Wed",
      "items": [
        "Arrive apartment",
        "Musée d’Orsay",
        "Pont Neuf"
      ]
    },

    {
      "id": "dec4",
      "title": "Dec 4",
      "meta": "Thu",
      "items": [
        "Louvre nineteenth-century rooms",
        "Tuileries Garden"
      ]
    },

    {
      "id": "dec5",
      "title": "Dec 5",
      "meta": "Fri",
      "items": [
        "Train to Rouen",
        "Musée Flaubert",
        "Croisset"
      ]
    },

    {
      "id": "dec6",
      "title": "Dec 6",
      "meta": "Sat",
      "items": []
    },

    {
      "id": "dec7",
      "title": "Dec 7",
      "meta": "Sun",
      "items": []
    }
  ]
};

// STATE + LOCAL STORAGE
const ITIN_LOCAL_KEY = "itinerary-columns-v1";
let itinState = null;

function cloneDefaultItin() {
  return JSON.parse(JSON.stringify(window.ITIN_DATA));
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(ITIN_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToLocal() {
  localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
}

// BUILD CARD
function buildCard(colId, index, text) {
  const card = document.createElement("div");
  card.className = "itinerary-card";
  card.draggable = true;
  card.dataset.colId = colId;
  card.dataset.index = index;

  const span = document.createElement("span");
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "×";
  del.onclick = e => {
    e.stopPropagation();
    removeItem(colId, index);
  };

  card.appendChild(span);
  card.appendChild(del);

  card.addEventListener("dragstart", e => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", JSON.stringify({colId, index}));
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  return card;
}

function wireDropZone(list, targetColId) {
  list.addEventListener("dragover", e => {
    e.preventDefault();
    list.classList.add("drag-over");
  });

  list.addEventListener("dragleave", e => {
    if (e.currentTarget === e.target) {
      list.classList.remove("drag-over");
    }
  });

  list.addEventListener("drop", e => {
    e.preventDefault();
    list.classList.remove("drag-over");

    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    let payload = null;
    try { payload = JSON.parse(raw); } catch {}

    if (payload) moveItem(payload.colId, payload.index, targetColId);
  });
}

// RENDER
function renderItinerary() {
  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";

  const openCol = itinState.columns.find(c => c.id === "open");
  const dayCols = itinState.columns.filter(c => c.id !== "open");

  // Day columns
  dayCols.forEach(col => {
    const wrap = document.createElement("div");
    wrap.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    header.innerHTML = `
      <h3>${col.title}</h3>
      <div class="day-meta">${col.meta}</div>
    `;

    const addBox = document.createElement("div");
    addBox.className = "add-item-container";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-item-input";
    input.placeholder = "Add event…";

    const btn = document.createElement("button");
    btn.className = "add-item-btn";
    btn.textContent = "+";

    function addItem() {
      const v = input.value.trim();
      if (!v) return;
      col.items.push(v);
      input.value = "";
      saveToLocal();
      renderItinerary();
    }

    input.addEventListener("keypress", e => { if (e.key === "Enter") addItem(); });
    btn.onclick = addItem;

    addBox.appendChild(input);
    addBox.appendChild(btn);
    header.appendChild(addBox);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.colId = col.id;

    wireDropZone(list, col.id);

    col.items.forEach((item, idx) => {
      list.appendChild(buildCard(col.id, idx, item));
    });

    wrap.appendChild(header);
    wrap.appendChild(list);
    daysColumn.appendChild(wrap);
  });

  // Open bin
  if (openCol) {
    wireDropZone(openBinList, openCol.id);

    openCol.items.forEach((item, idx) => {
      openBinList.appendChild(buildCard(openCol.id, idx, item));
    });

    const addToBin = () => {
      const v = openBinInput.value.trim();
      if (!v) return;
      openCol.items.push(v);
      openBinInput.value = "";
      saveToLocal();
      renderItinerary();
    };

    document.getElementById("openBinAdd").onclick = addToBin;
    openBinInput.addEventListener("keypress", e => { if (e.key === "Enter") addToBin(); });
  }
}

// MOVE + DELETE
function removeItem(colId, index) {
  const col = itinState.columns.find(c => c.id === colId);
  if (!col) return;
  col.items.splice(index, 1);
  saveToLocal();
  renderItinerary();
}

function moveItem(fromCol, fromIdx, toCol) {
  const f = itinState.columns.find(c => c.id === fromCol);
  const t = itinState.columns.find(c => c.id === toCol);
  if (!f || !t) return;

  const item = f.items.splice(fromIdx, 1)[0];
  t.items.push(item);

  saveToLocal();
  renderItinerary();
}

// INIT
function initItinerary() {
  itinState = loadFromLocal() || cloneDefaultItin();
  renderItinerary();

  document.getElementById("resetBtn").onclick = () => {
    if (confirm("Reset itinerary to defaults?")) {
      itinState = cloneDefaultItin();
      saveToLocal();
      renderItinerary();
    }
  };

  document.getElementById("githubToken").onclick = setGitHubToken;
  document.getElementById("githubSave").onclick = saveItineraryToGitHub;
  document.getElementById("githubLoad").onclick = loadItineraryFromGitHub;
}

document.addEventListener("DOMContentLoaded", initItinerary);
