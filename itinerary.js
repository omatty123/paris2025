// itinerary.js
// Default data, rendering, drag and drop, GitHub sync, and map hooks

window.ITIN_DATA = {
  "columns": [
    {
      "id": "open",
      "title": "Open bin",
      "meta": "Unassigned items",
      "items": [
        "RER B → Denfert Rochereau → Metro 6",
        "Arrive apartment",
        "Explore Chinatown",
        "Metro to Bastille",
        "Walk the Coulée Verte",
        "Drink at Le Train Bleu",
        "Dinner at Afrik’N’Fusion",
        "Walk home",
        "Arrive CDG"
      ]
    },
    {
      "id": "dec3",
      "title": "Day 1",
      "meta": "Wed Dec 3",
      "items": [
        "Sainte-Chapelle",
        "Conciergerie",
        "Notre-Dame exterior",
        "Pont Neuf and Pont des Arts",
        "Jardin du Luxembourg",
        "Huitrerie Régis",
        "Musée d’Orsay",
        "Chez Gladines",
        "Lunch near Tang Frères"
      ]
    },
    {
      "id": "dec4",
      "title": "Day 2",
      "meta": "Thu Dec 4",
      "items": [
        "Louvre nineteenth-century rooms",
        "Tuileries Garden",
        "Chez Alain Miam Miam",
        "Walk toward Passy",
        "Maison de Balzac",
        "Walk to Trocadéro",
        "Le Temps des Cerises"
      ]
    },
    {
      "id": "dec5",
      "title": "Day 3",
      "meta": "Fri Dec 5",
      "items": [
        "Metro to Opéra then walk to Gare Saint-Lazare",
        "Train to Rouen",
        "Taxi to Cathedral and Gros Horloge",
        "Lunch at Vegan & Cie",
        "Musée Flaubert",
        "Cimetière Monumental",
        "Croisset",
        "Train back",
        "Dinner at Brasserie Le Lazare"
      ]
    },
    {
      "id": "dec6",
      "title": "Day 4",
      "meta": "Sat Dec 6",
      "items": [
        "Belleville",
        "Promenade Dora Bruder",
        "Montmartre and Sacré-Cœur",
        "Père Lachaise",
        "Pain Vin Fromages"
      ]
    },
    {
      "id": "dec7",
      "title": "Day 5",
      "meta": "Sun Dec 7",
      "items": [
        "Parc Montsouris",
        "Covered passages",
        "Tuileries Christmas Market",
        "Galeries Lafayette",
        "Carrefour Italie 2",
        "Darkoum Cantine Marocaine"
      ]
    },
    {
      "id": "dec8",
      "title": "Day 6",
      "meta": "Mon Dec 8",
      "items": []
    },
    {
      "id": "dec9",
      "title": "Day 7",
      "meta": "Tue Dec 9",
      "items": []
    }
  ]
};

const ITIN_LOCAL_KEY = "itinerary-columns-v1";
let itinState = null;

// This global map lets the map system know which names belong to each day
window.DayColumnMap = {};

// Helpers

function cloneDefaultItin() {
  return JSON.parse(JSON.stringify(window.ITIN_DATA));
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(ITIN_LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToLocal() {
  try {
    localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
  } catch {}
}

// Rendering

function buildCard(colId, itemIndex, text) {
  const card = document.createElement("div");
  card.className = "itinerary-card";
  card.draggable = true;
  card.dataset.colId = colId;
  card.dataset.index = String(itemIndex);

  const span = document.createElement("span");
  span.className = "card-text";
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "×";
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    removeItem(colId, itemIndex);
  });

  card.appendChild(span);
  card.appendChild(del);

  // Drag events
  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ colId, index: itemIndex })
    );
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    document
      .querySelectorAll(".itinerary-list.drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  });

  // Map hover and click
  card.addEventListener("mouseenter", () => {
    if (window.MapAPI && window.MapAPI.highlightPlace) {
      window.MapAPI.highlightPlace(text);
    }
  });

  card.addEventListener("click", () => {
    if (window.MapAPI && window.MapAPI.focusPlace) {
      window.MapAPI.focusPlace(text);
    }
  });

  return card;
}

function wireDropZone(listEl, targetColId) {
  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    listEl.classList.add("drag-over");
  });

  listEl.addEventListener("dragleave", (e) => {
    if (e.currentTarget === e.target) {
      listEl.classList.remove("drag-over");
    }
  });

  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    listEl.classList.remove("drag-over");

    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    moveItem(payload.colId, payload.index, targetColId);
  });
}

function renderItinerary() {
  if (!itinState || !itinState.columns) return;

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");

  if (!daysColumn || !openBinList) return;

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";
  window.DayColumnMap = {};

  const openCol = itinState.columns.find((c) => c.id === "open");
  const dayCols = itinState.columns.filter((c) => c.id !== "open");

  // Render day columns
  dayCols.forEach((col) => {
    const wrapper = document.createElement("div");
    wrapper.className = "day-column";
    wrapper.dataset.dayId = col.id;

    const header = document.createElement("div");
    header.className = "day-header";

    const titleBlock = document.createElement("div");
    titleBlock.innerHTML = `<h3>${col.title}</h3><div class="day-meta">${col.meta}</div>`;

    const addContainer = document.createElement("div");
    addContainer.className = "add-item-container";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-item-input";
    input.placeholder = "Add event…";

    const btn = document.createElement("button");
    btn.className = "add-item-btn";
    btn.textContent = "+";

    function addItemFromInput() {
      const v = input.value.trim();
      if (!v) return;
      col.items.push(v);
      input.value = "";
      saveToLocal();
      renderItinerary();
    }

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addItemFromInput();
    });
    btn.addEventListener("click", addItemFromInput);

    addContainer.appendChild(input);
    addContainer.appendChild(btn);

    header.appendChild(titleBlock);
    header.appendChild(addContainer);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.colId = col.id;

    wireDropZone(list, col.id);

    const namesForDay = [];

    col.items.forEach((itemText, idx) => {
      namesForDay.push(itemText);
      const card = buildCard(col.id, idx, itemText);
      list.appendChild(card);
    });

    // store mapping for this day
    window.DayColumnMap[col.id] = namesForDay;

    // clicking the header sets the selected day and filters markers
    header.addEventListener("click", () => {
      if (window.MapAPI && window.MapAPI.setSelectedDayId) {
        window.MapAPI.setSelectedDayId(col.id);
      }
      if (window.MapAPI && window.MapAPI.showMarkersForList) {
        window.MapAPI.showMarkersForList(window.DayColumnMap[col.id] || []);
      }
    });

    wrapper.appendChild(header);
    wrapper.appendChild(list);
    daysColumn.appendChild(wrapper);
  });

  // Render Open Bin
  if (openCol) {
    wireDropZone(openBinList, openCol.id);

    openCol.items.forEach((itemText, idx) => {
      const card = buildCard(openCol.id, idx, itemText);
      openBinList.appendChild(card);
    });

    if (openBinInput) {
      const openBinAddBtn = document.getElementById("openBinAdd");

      function addToOpenBin() {
        const v = openBinInput.value.trim();
        if (!v) return;
        openCol.items.push(v);
        openBinInput.value = "";
        saveToLocal();
        renderItinerary();
      }

      openBinInput.onkeypress = (e) => {
        if (e.key === "Enter") addToOpenBin();
      };
      if (openBinAddBtn) openBinAddBtn.onclick = addToOpenBin;
    }
  }
}

// Item operations

function removeItem(colId, index) {
  const col = itinState.columns.find((c) => c.id === colId);
  if (!col) return;
  const idx = Number(index);
  if (Number.isNaN(idx) || idx < 0 || idx >= col.items.length) return;

  col.items.splice(idx, 1);
  saveToLocal();
  renderItinerary();
}

function moveItem(fromColId, fromIndex, toColId) {
  const fromCol = itinState.columns.find((c) => c.id === fromColId);
  const toCol = itinState.columns.find((c) => c.id === toColId);
  if (!fromCol || !toCol) return;

  const idx = Number(fromIndex);
  if (Number.isNaN(idx) || idx < 0 || idx >= fromCol.items.length) return;

  const [item] = fromCol.items.splice(idx, 1);
  toCol.items.push(item);

  saveToLocal();
  renderItinerary();
}

// Reset

function resetItinerary() {
  if (!confirm("Reset itinerary to defaults? This will erase your changes.")) return;
  itinState = cloneDefaultItin();
  saveToLocal();
  renderItinerary();
}

// GitHub sync

const GITHUB = {
  owner: "omatty123",
  repo: "paris2025",
  path: "itinerary.json",
  branch: "main",
  token: ""
};

function loadGitHubToken() {
  try {
    const t = localStorage.getItem("itinerary-github-token");
    if (t) GITHUB.token = t;
  } catch {}
}

function setGitHubToken() {
  const t = prompt("GitHub personal access token (with repo scope):", GITHUB.token || "");
  if (!t) return;
  GITHUB.token = t.trim();
  try {
    localStorage.setItem("itinerary-github-token", GITHUB.token);
  } catch {}
  const status = document.getElementById("githubStatus");
  if (status) {
    status.textContent = "GitHub token saved locally.";
  }
}

async function githubGetSHA() {
  const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}?ref=${GITHUB.branch}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB.token}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("GitHub GET failed: " + res.status);
  const json = await res.json();
  return json.sha || null;
}

async function saveItineraryToGitHub() {
  if (!GITHUB.token) {
    setGitHubToken();
    if (!GITHUB.token) return;
  }

  const status = document.getElementById("githubStatus");
  if (status) {
    status.textContent = "Saving to GitHub…";
    status.style.color = "#7a7267";
  }

  try {
    const sha = await githubGetSHA();
    const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}`;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(itinState, null, 2))));

    const body = {
      message: `Update itinerary - ${new Date().toISOString()}`,
      content,
      branch: GITHUB.branch
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || `GitHub PUT failed: ${res.status}`);
    }

    if (status) {
      status.textContent = "✓ Saved to GitHub";
      status.style.color = "#2f7d32";
    }
  } catch (e) {
    console.error(e);
    const status = document.getElementById("githubStatus");
    if (status) {
      status.textContent = "GitHub save failed: " + e.message;
      status.style.color = "#b3261e";
    }
  }
}

async function autoLoadFromGitHub() {
  if (!GITHUB.token) return null;

  try {
    const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}?ref=${GITHUB.branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) return null;

    const json = await res.json();
    const decoded = decodeURIComponent(escape(atob(json.content)));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("GitHub auto load failed:", e);
    return null;
  }
}

// Init

async function initItinerary() {
  loadGitHubToken();

  let loaded = await autoLoadFromGitHub();
  if (!loaded) loaded = loadFromLocal();
  if (!loaded) loaded = cloneDefaultItin();

  itinState = loaded;
  saveToLocal();
  renderItinerary();

  const resetBtn = document.getElementById("resetBtn");
  const tokenBtn = document.getElementById("githubToken");
  const saveBtn = document.getElementById("githubSave");
  const loadBtn = document.getElementById("githubLoad");

  if (resetBtn) resetBtn.addEventListener("click", resetItinerary);
  if (tokenBtn) tokenBtn.addEventListener("click", setGitHubToken);
  if (saveBtn) saveBtn.addEventListener("click", saveItineraryToGitHub);
  if (loadBtn) {
    loadBtn.addEventListener("click", async () => {
      const data = await autoLoadFromGitHub();
      if (data) {
        itinState = data;
        saveToLocal();
        renderItinerary();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initItinerary);
