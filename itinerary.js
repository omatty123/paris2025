// itinerary.js
// FULL SINGLE-FILE VERSION: data + rendering + drag/drop + GitHub sync

// ----- 1) Default data with your exact tokens -----
window.ITIN_DATA = {
  "columns": [
    {
      "id": "open",
      "title": "Open Bin",
      "meta": "",
      "items": [
        "Conciergerie",
        "Sainte-Chapelle",
        "Jardin du Luxembourg",
        "Chez Gladines",
        "Huitrerie Régis",
        "Chez Alain Miam Miam",
        "Lunch near Tang Frères",
        "RER B → Denfert Rochereau → Metro 6",
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
      "title": "Dec 3",
      "meta": "Wed Dec 3",
      "items": [
        "Arrive apartment",
        "Musée d’Orsay",
        "Pont Neuf",
        "Notre-Dame exterior"
      ]
    },

    {
      "id": "dec4",
      "title": "Dec 4",
      "meta": "Thu Dec 4",
      "items": [
        "La Halte Paris 13",
        "Nationale",
        "Louvre nineteenth-century rooms",
        "Tuileries Garden",
        "Walk toward Passy",
        "Maison de Balzac",
        "Walk to Trocadéro",
        "Le Temps des Cerises"
      ]
    },

    {
      "id": "dec5",
      "title": "Dec 5",
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
      "title": "Dec 6",
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
      "title": "Dec 7",
      "meta": "Sun Dec 7",
      "items": [
        "Parc Montsouris",
        "Covered passages",
        "Tuileries Christmas Market",
        "Galeries Lafayette",
        "Carrefour Italie 2",
        "Darkoum Cantine Marocaine",
        "Meet Person"
      ]
    },

    {
      "id": "dec8",
      "title": "Dec 8",
      "meta": "Mon Dec 8",
      "items": []
    },

    {
      "id": "dec9",
      "title": "Dec 9",
      "meta": "Tue Dec 9",
      "items": []
    }
  ]
};

// Map of correct labels for migration of old saves
const DAY_LABELS = {
  open: { title: "Open Bin", meta: "" },
  dec3: { title: "Dec 3", meta: "Wed Dec 3" },
  dec4: { title: "Dec 4", meta: "Thu Dec 4" },
  dec5: { title: "Dec 5", meta: "Fri Dec 5" },
  dec6: { title: "Dec 6", meta: "Sat Dec 6" },
  dec7: { title: "Dec 7", meta: "Sun Dec 7" },
  dec8: { title: "Dec 8", meta: "Mon Dec 8" },
  dec9: { title: "Dec 9", meta: "Tue Dec 9" }
};

// Normalize titles for any loaded state so "Day 1" vanishes everywhere
function normalizeTitles(state) {
  if (!state || !state.columns) return;
  state.columns.forEach(col => {
    const fix = DAY_LABELS[col.id];
    if (fix) {
      col.title = fix.title;
      col.meta = fix.meta;
    }
  });
}

// ----- 2) State + helpers -----

const ITIN_LOCAL_KEY = "itinerary-columns-v1";
let itinState = null;

// Deep clone default
function cloneDefaultItin() {
  return JSON.parse(JSON.stringify(window.ITIN_DATA));
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(ITIN_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse local itinerary, using defaults:", e);
    return null;
  }
}

function saveToLocal() {
  try {
    localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
    console.log("✓ Itinerary saved locally");
  } catch (e) {
    console.error("Local save failed:", e);
  }
}

// ----- 3) Rendering -----

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

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers not found in DOM");
    return;
  }

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";

  // Find open bin column
  const openCol = itinState.columns.find((c) => c.id === "open");
  const dayCols = itinState.columns.filter((c) => c.id !== "open");

  // Render day columns (stacked vertically)
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

    wireDropZone(list, col.id);

    col.items.forEach((itemText, idx) => {
      const card = buildCard(col.id, idx, itemText);
      list.appendChild(card);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(list);
    daysColumn.appendChild(wrapper);
  });

  // Render Open Bin items
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
      if (openBinAddBtn) {
        openBinAddBtn.onclick = addToOpenBin;
      }
    }
  }
}

// ----- 4) Item operations -----

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

// ----- 5) Reset -----

function resetItinerary() {
  if (!confirm("Reset itinerary to defaults? This will erase your changes.")) {
    return;
  }
  itinState = cloneDefaultItin();
  normalizeTitles(itinState);
  saveToLocal();
  renderItinerary();
}

// ----- 6) GitHub sync (simple) -----

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
    normalizeTitles(itinState);
    saveToLocal();
    renderItinerary();

    if (status) {
      status.textContent = "✓ Loaded from GitHub";
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

// ----- 7) Wire buttons + init -----

function initItinerary() {
  itinState = loadFromLocal() || cloneDefaultItin();
  normalizeTitles(itinState);
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
