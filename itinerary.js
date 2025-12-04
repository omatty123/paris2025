// itinerary.js
// Data, rendering, drag and drop, and GitHub sync
// Drives the map via MapAPI so each item becomes a pin

// 1) Default data

window.ITIN_DATA = {
  columns: [
    {
      id: "open",
      title: "Open bin",
      meta: "Unassigned items",
      items: [
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
      id: "dec3",
      title: "Dec 3",
      meta: "Wednesday",
      items: [
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
      id: "dec4",
      title: "Dec 4",
      meta: "Thursday",
      items: [
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
      id: "dec5",
      title: "Dec 5",
      meta: "Friday",
      items: [
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
      id: "dec6",
      title: "Dec 6",
      meta: "Saturday",
      items: [
        "Belleville",
        "Promenade Dora Bruder",
        "Montmartre and Sacré-Cœur",
        "Père Lachaise",
        "Pain Vin Fromages"
      ]
    },

    {
      id: "dec7",
      title: "Dec 7",
      meta: "Sunday",
      items: [
        "Parc Montsouris",
        "Covered passages",
        "Tuileries Christmas Market",
        "Galeries Lafayette",
        "Carrefour Italie 2",
        "Darkoum Cantine Marocaine"
      ]
    },

    {
      id: "dec8",
      title: "Dec 8",
      meta: "Monday",
      items: []
    },

    {
      id: "dec9",
      title: "Dec 9",
      meta: "Tuesday",
      items: []
    }
  ]
};

// 2) State and helpers

const ITIN_LOCAL_KEY = "itinerary-columns-v1";
let itinState = null;

function cloneDefaultItin() {
  return JSON.parse(JSON.stringify(window.ITIN_DATA));
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(ITIN_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.columns) return null;
    return parsed;
  } catch (e) {
    console.warn("Failed to parse local itinerary, using defaults:", e);
    return null;
  }
}

function saveToLocal() {
  try {
    localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
    console.log("Itinerary saved locally");
  } catch (e) {
    console.error("Local save failed:", e);
  }
}

// 3) Rendering

function buildCard(text, colId, index) {
  const card = document.createElement("div");
  card.className = "itinerary-card";

  const span = document.createElement("span");
  span.className = "card-text";
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "×";

  del.addEventListener("click", (e) => {
    e.stopPropagation();
    removeItem(colId, index);
  });

  card.appendChild(span);
  card.appendChild(del);

  card.addEventListener("click", () => {
    if (window.MapAPI && typeof window.MapAPI.highlightPlace === "function") {
      window.MapAPI.highlightPlace(text);
    }
  });

  return card;
}

function setupSortable(listEl) {
  if (!listEl) return;

  new Sortable(listEl, {
    group: "itinerary",
    animation: 150,
    ghostClass: "dragging",
    onEnd(evt) {
      const fromColId = evt.from.dataset.colId;
      const toColId = evt.to.dataset.colId;
      const fromIndex = evt.oldIndex;
      const toIndex = evt.newIndex;

      if (!fromColId || !toColId) return;
      moveItemBetweenColumns(fromColId, fromIndex, toColId, toIndex);
    }
  });
}

function renderItinerary() {
  if (!itinState || !itinState.columns) return;

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers not found in DOM");
    return;
  }

  if (window.MapAPI && typeof window.MapAPI.resetPlaces === "function") {
    window.MapAPI.resetPlaces();
  }

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";

  const openCol = itinState.columns.find((c) => c.id === "open");
  const dayCols = itinState.columns.filter((c) => c.id !== "open");

  const dayMap = {};

  // Render day columns
  dayCols.forEach((col) => {
    const wrapper = document.createElement("div");
    wrapper.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("div");
    title.innerHTML = `<h3>${col.title}</h3><div class="day-meta">${col.meta}</div>`;

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

    header.appendChild(title);
    header.appendChild(addContainer);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.colId = col.id;

    col.items.forEach((itemText, idx) => {
      const card = buildCard(itemText, col.id, idx);
      list.appendChild(card);

      if (window.MapAPI && typeof window.MapAPI.addPlace === "function") {
        window.MapAPI.addPlace(col.id, itemText);
      }
    });

    dayMap[col.id] = [...col.items];

    wrapper.appendChild(header);
    wrapper.appendChild(list);
    daysColumn.appendChild(wrapper);

    setupSortable(list);
  });

  // Render Open Bin
  if (openCol) {
    openBinList.dataset.colId = openCol.id;

    openCol.items.forEach((itemText, idx) => {
      const card = buildCard(itemText, openCol.id, idx);
      openBinList.appendChild(card);

      if (window.MapAPI && typeof window.MapAPI.addPlace === "function") {
        window.MapAPI.addPlace(openCol.id, itemText);
      }
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
      if (openBinAddBtn) {
        openBinAddBtn.onclick = addToOpenBin;
      }
    }

    setupSortable(openBinList);
    dayMap[openCol.id] = [...openCol.items];
  }

  window.DayColumnMap = dayMap;
}

// 4) Item operations

function removeItem(colId, index) {
  const col = itinState.columns.find((c) => c.id === colId);
  if (!col) return;
  const idx = Number(index);
  if (Number.isNaN(idx) || idx < 0 || idx >= col.items.length) return;
  col.items.splice(idx, 1);
  saveToLocal();
  renderItinerary();
}

function moveItemBetweenColumns(fromColId, fromIndex, toColId, toIndex) {
  const fromCol = itinState.columns.find((c) => c.id === fromColId);
  const toCol = itinState.columns.find((c) => c.id === toColId);
  if (!fromCol || !toCol) return;

  const fromIdx = Number(fromIndex);
  const toIdx = Number(toIndex);

  if (
    Number.isNaN(fromIdx) ||
    fromIdx < 0 ||
    fromIdx >= fromCol.items.length
  ) {
    return;
  }

  const [item] = fromCol.items.splice(fromIdx, 1);
  if (!item) return;

  const safeToIdx =
    Number.isNaN(toIdx) || toIdx < 0 || toIdx > toCol.items.length
      ? toCol.items.length
      : toIdx;

  toCol.items.splice(safeToIdx, 0, item);

  saveToLocal();
  renderItinerary();
}

// 5) Reset

function resetItinerary() {
  if (!confirm("Reset itinerary to defaults? This will erase your changes.")) {
    return;
  }
  itinState = cloneDefaultItin();
  saveToLocal();
  renderItinerary();
}

// 6) GitHub sync

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
  } catch (e) {
    console.warn("No GitHub token in localStorage");
  }
}

function setGitHubToken() {
  const t = prompt(
    "GitHub personal access token (with repo scope):",
    GITHUB.token || ""
  );
  if (!t) return;
  GITHUB.token = t.trim();
  try {
    localStorage.setItem("itinerary-github-token", GITHUB.token);
  } catch (e) {
    console.warn("Failed to save GitHub token locally", e);
  }
  const status = document.getElementById("githubStatus");
  if (status) {
    status.textContent = "GitHub token saved locally.";
    status.style.color = "#7a7267";
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

async function githubPutItinerary(sha) {
  const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}`;
  const content = btoa(
    unescape(encodeURIComponent(JSON.stringify(itinState, null, 2)))
  );

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
    const msg = j.message || `GitHub PUT failed: ${res.status}`;
    throw new Error(msg);
  }
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
    let sha = await githubGetSHA();

    try {
      await githubPutItinerary(sha);
    } catch (inner) {
      const msg = inner && inner.message ? inner.message : "";
      if (msg.includes("does not match") || msg.includes("sha does not match")) {
        // Repo changed since we fetched SHA, refetch and retry once
        const freshSha = await githubGetSHA();
        await githubPutItinerary(freshSha);
      } else {
        throw inner;
      }
    }

    if (status) {
      status.textContent = "Saved to GitHub";
      status.style.color = "#2f7d32";
    }
  } catch (e) {
    console.error(e);
    if (status) {
      status.textContent = "GitHub save failed: " + e.message;
      status.style.color = "#b3261e";
    } else {
      alert("GitHub save failed: " + e.message);
    }
  }
}

async function loadItineraryFromGitHub() {
  if (!GITHUB.token) {
    setGitHubToken();
    if (!GITHUB.token) return;
  }

  const status = document.getElementById("githubStatus");
  if (status) {
    status.textContent = "Loading from GitHub…";
    status.style.color = "#7a7267";
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}?ref=${GITHUB.branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB.token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || `GitHub GET failed: ${res.status}`);
    }
    const json = await res.json();
    const decoded = decodeURIComponent(escape(atob(json.content)));
    const parsed = JSON.parse(decoded);

    itinState = parsed;
    saveToLocal();
    renderItinerary();

    if (status) {
      status.textContent = "Loaded from GitHub";
      status.style.color = "#2f7d32";
    }
  } catch (e) {
    console.error(e);
    if (status) {
      status.textContent = "GitHub load failed: " + e.message;
      status.style.color = "#b3261e";
    } else {
      alert("GitHub load failed: " + e.message);
    }
  }
}

// 7) Init

function initItinerary() {
  itinState = loadFromLocal() || cloneDefaultItin();
  loadGitHubToken();

  const resetBtn = document.getElementById("resetBtn");
  const tokenBtn = document.getElementById("githubToken");
  const saveBtn = document.getElementById("githubSave");
  const loadBtn = document.getElementById("githubLoad");

  if (resetBtn) resetBtn.addEventListener("click", resetItinerary);
  if (tokenBtn) tokenBtn.addEventListener("click", setGitHubToken);
  if (saveBtn) saveBtn.addEventListener("click", saveItineraryToGitHub);
  if (loadBtn) loadBtn.addEventListener("click", loadItineraryFromGitHub);

  renderItinerary();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initItinerary);
} else {
  initItinerary();
}
