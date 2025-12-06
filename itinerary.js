// itinerary.js
// FIXED VERSION with improved drag and drop and past days at bottom

(function() {
'use strict';

// ----- 1) Constants and Config -----
const MAX_ITEM_LENGTH = 200;
const ITIN_LOCAL_KEY = "itinerary-columns-v1";

// ----- 2) Default data -----
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
        "Dinner at Afrik'N'Fusion",
        "Walk home",
        "Arrive CDG"
      ]
    },
    {
      "id": "dec3",
      "title": "Wed Dec 3",
      "meta": "",
      "items": [
        "Arrive apartment",
        "Musée d'Orsay",
        "Pont Neuf",
        "Notre-Dame exterior"
      ]
    },
    {
      "id": "dec4",
      "title": "Thu Dec 4",
      "meta": "",
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
      "title": "Fri Dec 5",
      "meta": "",
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
      "title": "Sat Dec 6",
      "meta": "",
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
      "title": "Sun Dec 7",
      "meta": "",
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
      "title": "Mon Dec 8",
      "meta": "",
      "items": []
    },
    {
      "id": "dec9",
      "title": "Tue Dec 9",
      "meta": "",
      "items": []
    }
  ]
};

// Map day IDs to actual dates
const DAY_DATES = {
  dec3: "2025-12-03",
  dec4: "2025-12-04",
  dec5: "2025-12-05",
  dec6: "2025-12-06",
  dec7: "2025-12-07",
  dec8: "2025-12-08",
  dec9: "2025-12-09"
};

// Map of correct labels and photo links
const DAY_LABELS = {
  open: { title: "Open Bin" },
  dec3: {
    title: "Wed Dec 3",
    photoUrl: "https://www.amazon.com/photos/shared/ePLmduWLQXGeruQEcrnDjg.wz42P01vnEpGuxrHB5VChn"
  },
  dec4: {
    title: "Thu Dec 4",
    photoUrl: "https://www.amazon.com/photos/shared/tQm07DL3RKeav08LMOu2gg.qQAWz56zAlUSg03OgxvA7U"
  },
  dec5: {
    title: "Fri Dec 5",
    photoUrl: "https://www.amazon.com/photos/shared/GqMnmVE5Q_2mVoqie28YjA.o9PKGuPBVooDvT44cVqi8_"
  },
  dec6: {
    title: "Sat Dec 6",
    photoUrl: "https://www.amazon.com/photos/shared/AFv_6YLlQBWfBk6aCsXBKQ.dxE90tpxqyu5MFWkWrCQp4"
  },
  dec7: { title: "Sun Dec 7" },
  dec8: { title: "Mon Dec 8" },
  dec9: { title: "Tue Dec 9" }
};

function normalizeTitles(state) {
  if (!state || !state.columns) return;
  state.columns.forEach(col => {
    const fix = DAY_LABELS[col.id];
    if (fix) {
      col.title = fix.title;
      col.meta = "";
    }
  });
}

// Get today's date in Paris timezone as YYYY-MM-DD
function getTodayParis() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

// Sort day columns: today and future first, then past days
function sortDayColumns(dayCols) {
  const todayStr = getTodayParis();
  const future = [];
  const past = [];

  dayCols.forEach(col => {
    const dateStr = DAY_DATES[col.id];
    if (!dateStr) {
      future.push(col);
    } else if (dateStr >= todayStr) {
      future.push(col);
    } else {
      past.push(col);
    }
  });

  future.sort((a, b) => (DAY_DATES[a.id] || "").localeCompare(DAY_DATES[b.id] || ""));
  past.sort((a, b) => (DAY_DATES[a.id] || "").localeCompare(DAY_DATES[b.id] || ""));
  return [...future, ...past];
}

// Input validation and sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  let sanitized = input.trim();
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/\0/g, '');
  return sanitized;
}

function validateItemText(text) {
  const sanitized = sanitizeInput(text);

  if (!sanitized) {
    return { valid: false, error: 'Item cannot be empty', sanitized: '' };
  }

  if (sanitized.length > MAX_ITEM_LENGTH) {
    return {
      valid: false,
      error: `Item is too long (max ${MAX_ITEM_LENGTH} characters)`,
      sanitized: sanitized.substring(0, MAX_ITEM_LENGTH)
    };
  }

  return { valid: true, error: null, sanitized };
}

// ----- 3) State and helpers -----
let itinState = null;
let draggedElement = null;

function cloneDefaultItin() {
  return JSON.parse(JSON.stringify(window.ITIN_DATA));
}

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(ITIN_LOCAL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse local itinerary:", e);
    return null;
  }
}

function saveToLocal() {
  try {
    localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
    console.log("Saved locally");
  } catch (e) {
    console.error("Local save failed:", e);
  }
}

// ----- 4) Rendering with drag and drop -----

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

  card.addEventListener("dragstart", (e) => {
    draggedElement = card;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ colId, index: itemIndex }));
    e.dataTransfer.setData("application/json", JSON.stringify({ colId, index: itemIndex }));
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    draggedElement = null;
    document.querySelectorAll(".itinerary-list.drag-over").forEach((el) => {
      el.classList.remove("drag-over");
    });
  });

  return card;
}

function wireDropZone(listEl, targetColId) {
  function getDragAfterElement(listEl, y) {
    const draggableElements = [...listEl.querySelectorAll('.itinerary-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  listEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    listEl.classList.add("drag-over");

    const afterElement = getDragAfterElement(listEl, e.clientY);
    const draggable = document.querySelector('.dragging');

    if (afterElement == null) {
      listEl.appendChild(draggable);
    } else {
      listEl.insertBefore(draggable, afterElement);
    }
  });

  listEl.addEventListener("dragenter", (e) => {
    e.preventDefault();
    e.stopPropagation();
    listEl.classList.add("drag-over");
  });

  listEl.addEventListener("dragleave", (e) => {
    e.stopPropagation();
    if (e.currentTarget === listEl && !listEl.contains(e.relatedTarget)) {
      listEl.classList.remove("drag-over");
    }
  });

  listEl.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    listEl.classList.remove("drag-over");

    let raw = e.dataTransfer.getData("text/plain");
    if (!raw) {
      raw = e.dataTransfer.getData("application/json");
    }
    if (!raw) {
      console.error("No drag data found");
      return;
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse drag data:", err);
      return;
    }

    const afterElement = getDragAfterElement(listEl, e.clientY);
    let toIndex = null;

    if (afterElement) {
      const cards = [...listEl.querySelectorAll('.itinerary-card:not(.dragging)')];
      toIndex = cards.indexOf(afterElement);
    } else {
      const cards = [...listEl.querySelectorAll('.itinerary-card:not(.dragging)')];
      toIndex = cards.length;
    }

    moveItem(payload.colId, payload.index, targetColId, toIndex);
  });
}

function renderItinerary() {
  if (!itinState || !itinState.columns) return;

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers not found");
    return;
  }

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";

  const openCol = itinState.columns.find((c) => c.id === "open");
  const dayCols = itinState.columns.filter((c) => c.id !== "open");
  const sortedDayCols = sortDayColumns(dayCols);
  const todayStr = getTodayParis();

  sortedDayCols.forEach((col) => {
    const wrapper = document.createElement("div");
    wrapper.className = "day-column";

    const dateStr = DAY_DATES[col.id];
    if (dateStr && dateStr < todayStr) {
      wrapper.classList.add("past-day");
    }

    const header = document.createElement("div");
    header.className = "day-header";

    const titleContainer = document.createElement("div");
    titleContainer.className = "day-title-container";

    const title = document.createElement("h3");
    title.textContent = col.title;
    titleContainer.appendChild(title);

    const dayLabel = DAY_LABELS[col.id];
    if (dayLabel && dayLabel.photoUrl) {
      const photoLink = document.createElement("a");
      photoLink.href = dayLabel.photoUrl;
      photoLink.target = "_blank";
      photoLink.className = "day-photo-link";
      photoLink.innerHTML = '<i class="fas fa-camera"></i>';
      photoLink.title = "View photos";
      titleContainer.appendChild(photoLink);
    }

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

      const validation = validateItemText(v);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      col.items.push(validation.sanitized);
      input.value = "";

      if (col.id !== "open" && typeof window.addPinForItineraryItem === "function") {
        window.addPinForItineraryItem(col.id, validation.sanitized);
      }

      saveToLocal();
      renderItinerary();
    }

    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addItemFromInput();
    });
    btn.addEventListener("click", addItemFromInput);

    addContainer.appendChild(input);
    addContainer.appendChild(btn);
    header.appendChild(titleContainer);
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

        const validation = validateItemText(v);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }

        openCol.items.push(validation.sanitized);
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

// ----- 5) Item operations -----

function removeItem(colId, index) {
  const col = itinState.columns.find((c) => c.id === colId);
  if (!col) return;
  const idx = Number(index);
  if (Number.isNaN(idx) || idx < 0 || idx >= col.items.length) return;
  col.items.splice(idx, 1);
  saveToLocal();
  renderItinerary();
}

function moveItem(fromColId, fromIndex, toColId, toIndex = null) {
  const fromCol = itinState.columns.find((c) => c.id === fromColId);
  const toCol = itinState.columns.find((c) => c.id === toColId);
  if (!fromCol || !toCol) {
    console.error("Column not found:", fromColId, toColId);
    return;
  }

  const idx = Number(fromIndex);
  if (Number.isNaN(idx) || idx < 0 || idx >= fromCol.items.length) {
    console.error("Invalid index:", idx);
    return;
  }

  const [item] = fromCol.items.splice(idx, 1);

  if (toIndex !== null && toIndex >= 0 && toIndex <= toCol.items.length) {
    toCol.items.splice(toIndex, 0, item);
  } else {
    toCol.items.push(item);
  }

  saveToLocal();
  renderItinerary();
}

// ----- 6) Reset -----

window.addItemToDay = function(dayId, itemText) {
  const col = itinState.columns.find((c) => c.id === dayId);
  if (!col) {
    alert("Invalid day: " + dayId);
    return;
  }

  const validation = validateItemText(itemText);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  col.items.push(validation.sanitized);
  saveToLocal();
  renderItinerary();
};

function resetItinerary() {
  if (!confirm("Reset itinerary to defaults? This will erase your changes.")) {
    return;
  }
  itinState = cloneDefaultItin();
  normalizeTitles(itinState);
  saveToLocal();
  renderItinerary();
}

// ----- 7) GitHub sync -----

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
  } catch (error) {
    console.error('Failed to load GitHub token from localStorage:', error);
  }
}

function setGitHubToken() {
  const t = prompt("GitHub personal access token (with repo scope):", GITHUB.token || "");
  if (!t) return;
  GITHUB.token = t.trim();
  try {
    localStorage.setItem("itinerary-github-token", GITHUB.token);
    const status = document.getElementById("githubStatus");
    if (status) {
      status.textContent = "GitHub token saved locally.";
      status.style.color = "#2f7d32";
    }
  } catch (error) {
    console.error('Failed to save GitHub token to localStorage:', error);
    alert('Failed to save token: ' + error.message);
  }
}

async function githubGetSHA() {
  const timestamp = Date.now();
  const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}?ref=${GITHUB.branch}&_=${timestamp}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB.token}`,
      Accept: "application/vnd.github.v3+json"
    },
    cache: 'no-store'
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("GitHub GET failed: " + res.status);
  const json = await res.json();
  return json.sha || null;
}

async function saveItineraryToGitHub(forceSave = false) {
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
    const url = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/contents/${GITHUB.path}`;
    const sha = await githubGetSHA();
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
      if (!forceSave && j.message && j.message.includes("does not match")) {
        if (status) {
          status.textContent = "Conflict detected, retrying...";
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        return saveItineraryToGitHub(true);
      }
      throw new Error(j.message || `GitHub PUT failed: ${res.status}`);
    }

    if (status) {
      status.textContent = forceSave ? "Saved to GitHub (retried)" : "Saved to GitHub";
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

// Expose for map.js
window.getItineraryState = function() {
  return itinState;
};

window.removeItemFromDay = function(dayId, itemText) {
  const col = itinState.columns.find((c) => c.id === dayId);
  if (!col) {
    console.warn('Column not found:', dayId);
    return false;
  }

  const index = col.items.indexOf(itemText);
  if (index === -1) {
    console.warn('Item not found in column:', itemText);
    return false;
  }

  col.items.splice(index, 1);
  saveToLocal();
  renderItinerary();
  console.log('Removed item from itinerary:', itemText);
  return true;
};

// ----- 8) Init -----

function initItinerary() {
  console.log("Initializing itinerary...");
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
  console.log("Itinerary initialized");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initItinerary);
} else {
  initItinerary();
}

})(); // End of IIFE
