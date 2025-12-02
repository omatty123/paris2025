// ===============================
// CONFIG
// ===============================

// GitHub config (for saving itinerary.json)
const GITHUB_OWNER = "omatty123";
const GITHUB_REPO = "paris2025";
const GITHUB_BRANCH = "main";
const GITHUB_FILE_PATH = "data/itinerary.json";

const STORAGE_TOKEN_KEY = "paris25_github_token";
const STORAGE_LOCAL_BACKUP = "paris25_itinerary_backup";

// DOM references
const SAVE_STATUS_EL = document.getElementById("saveStatus");
const BOARD_EL = document.getElementById("itineraryBoard");
const OPEN_BIN_EL = document.getElementById("openBinColumn");
const GITHUB_BTN = document.getElementById("githubModeBtn");

// Fixed order of day columns in the left stack
const DAY_ORDER = ["dec3", "dec4", "dec5", "dec6", "dec7", "dec8", "dec9"];

// Trip dates for weather
const TRIP_START = "2025-12-03";
const TRIP_END = "2025-12-08";

// If GitHub fails AND no backup, use this default
const INITIAL_BOARD = {
  "columns": [
    {
      "id": "open",
      "title": "Open bin",
      "meta": "Unassigned items",
      "items": [
        "Arrive CDG",
        "RER B → Denfert Rochereau → Metro 6",
        "Arrive apartment",
        "Explore Chinatown",
        "Lunch near Tang Frères",
        "Metro to Bastille",
        "Walk the Coulée Verte",
        "Drink at Le Train Bleu",
        "Dinner at Afrik'N'Fusion",
        "Walk home"
      ]
    },
    {
      "id": "dec3",
      "title": "Day 1",
      "meta": "Wed Dec 3",
      "items": [
        "Sainte Chapelle",
        "Conciergerie",
        "Notre Dame exterior",
        "Pont Neuf and Pont des Arts",
        "Jardin du Luxembourg",
        "Huitrerie Regis",
        "Musée d'Orsay",
        "Chez Gladines"
      ]
    },
    {
      "id": "dec4",
      "title": "Day 2",
      "meta": "Thu Dec 4",
      "items": [
        "Louvre nineteenth century rooms",
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
        "Montmartre and Sacré Coeur",
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

// ===============================
// STATE
// ===============================

let boardState = null;
let currentSha = null;
let dragging = null;

// ===============================
// UTIL
// ===============================

function setStatus(text) {
  if (SAVE_STATUS_EL) SAVE_STATUS_EL.textContent = text;
}

// ===============================
// PARIS CLOCK
// ===============================

function updateParisTime() {
  const el = document.getElementById("parisTime");
  if (!el) return;
  try {
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Paris"
    }).format(new Date());
    el.textContent = "Paris time: " + time;
  } catch {
    el.textContent = "Paris time: --:--";
  }
}

// ===============================
// GITHUB LOAD / SAVE
// ===============================

async function fetchItineraryFromGitHub() {
  const url =
    "https://api.github.com/repos/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/contents/" +
    GITHUB_FILE_PATH +
    "?ref=" +
    GITHUB_BRANCH;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!res.ok) throw new Error("GitHub fetch failed: " + res.status);

  const data = await res.json();
  currentSha = data.sha;

  const decoded = atob(data.content.replace(/\n/g, ""));
  boardState = JSON.parse(decoded);

  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));
  setStatus("Loaded from GitHub");
}

async function saveItineraryToGitHub() {
  if (!boardState) return;

  // Always keep a local backup
  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));

  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (!token) {
    setStatus("Local only (no GitHub key)");
    return;
  }

  if (!currentSha) {
    try {
      await fetchItineraryFromGitHub();
    } catch {
      // ignore; we still save with no sha
    }
  }

  const url =
    "https://api.github.com/repos/" +
    GITHUB_OWNER +
    "/" +
    GITHUB_REPO +
    "/contents/" +
    GITHUB_FILE_PATH;

  const contentString = JSON.stringify(boardState, null, 2);
  const encoded = btoa(contentString);

  const body = {
    message: "Update Paris itinerary via web board",
    content: encoded,
    branch: GITHUB_BRANCH
  };
  if (currentSha) body.sha = currentSha;

  setStatus("Saving to GitHub…");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    setStatus("GitHub save failed: " + res.status);
    return;
  }

  const data = await res.json();
  if (data && data.content && data.content.sha) {
    currentSha = data.content.sha;
  }

  setStatus("Saved to GitHub");
}

// ===============================
// GITHUB TOKEN BUTTON
// ===============================

if (GITHUB_BTN) {
  GITHUB_BTN.addEventListener("click", () => {
    const existing = localStorage.getItem(STORAGE_TOKEN_KEY);
    const msg = existing
      ? "Paste GitHub personal access token (leave blank to keep current):"
      : "Paste GitHub personal access token:";

    const input = prompt(msg, "");
    if (input === null) return;

    const trimmed = input.trim();
    if (!trimmed) {
      if (!existing) {
        setStatus("No GitHub key set (read only)");
      } else {
        setStatus("GitHub key unchanged");
      }
      return;
    }

    localStorage.setItem(STORAGE_TOKEN_KEY, trimmed);
    alert("GitHub key saved in this browser only.");
    setStatus("GitHub key set; saving enabled");
  });
}

// ===============================
// RENDER BOARD
// ===============================

function renderBoard() {
  if (!BOARD_EL || !OPEN_BIN_EL || !boardState) return;

  BOARD_EL.innerHTML = "";
  OPEN_BIN_EL.innerHTML = "";

  const openCol = boardState.columns.find(c => c.id === "open");
  const dayColumns = boardState.columns.filter(c => c.id !== "open");

  const sortedDays = DAY_ORDER
    .map(id => dayColumns.find(c => c.id === id))
    .filter(Boolean);

  // LEFT: days stacked
  sortedDays.forEach(col => {
    const colEl = document.createElement("div");
    colEl.className = "itinerary-column";
    colEl.dataset.columnId = col.id;

    const headerEl = document.createElement("div");
    headerEl.className = "itinerary-column-header";

    const titleWrap = document.createElement("div");
    const titleEl = document.createElement("h3");
    titleEl.className = "itinerary-column-title";
    titleEl.textContent = col.title;
    titleWrap.appendChild(titleEl);

    if (col.meta) {
      const metaEl = document.createElement("p");
      metaEl.className = "itinerary-column-meta";
      metaEl.textContent = col.meta;
      titleWrap.appendChild(metaEl);
    }

    const addBtn = document.createElement("button");
    addBtn.className = "itinerary-add-item";
    addBtn.textContent = "+ add item";
    addBtn.addEventListener("click", () => {
      const text = prompt("New item for " + col.title + ":");
      if (text && text.trim()) {
        col.items.push(text.trim());
        saveItineraryToGitHub();
        renderBoard();
      }
    });

    headerEl.appendChild(titleWrap);
    headerEl.appendChild(addBtn);

    const bodyEl = document.createElement("div");
    bodyEl.className = "itinerary-column-body";
    bodyEl.dataset.columnId = col.id;

    bodyEl.addEventListener("dragover", handleDragOver);
    bodyEl.addEventListener("dragleave", handleDragLeave);
    bodyEl.addEventListener("drop", handleDrop);

    col.items.forEach((text, index) => {
      const itemEl = document.createElement("div");
      itemEl.className = "itinerary-item";
      itemEl.textContent = text;
      itemEl.draggable = true;
      itemEl.dataset.columnId = col.id;
      itemEl.dataset.index = String(index);
      itemEl.addEventListener("dragstart", handleDragStart);

      const delBtn = document.createElement("button");
      delBtn.className = "itinerary-item-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", e => {
        e.stopPropagation();
        col.items.splice(index, 1);
        saveItineraryToGitHub();
        renderBoard();
      });

      itemEl.appendChild(delBtn);
      bodyEl.appendChild(itemEl);
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(bodyEl);
    BOARD_EL.appendChild(colEl);
  });

  // RIGHT: open bin
  if (openCol) {
    const bodyEl = OPEN_BIN_EL;
    bodyEl.dataset.columnId = openCol.id;

    bodyEl.addEventListener("dragover", handleDragOver);
    bodyEl.addEventListener("dragleave", handleDragLeave);
    bodyEl.addEventListener("drop", handleDrop);

    openCol.items.forEach((text, index) => {
      const itemEl = document.createElement("div");
      itemEl.className = "itinerary-item";
      itemEl.textContent = text;
      itemEl.draggable = true;
      itemEl.dataset.columnId = openCol.id;
      itemEl.dataset.index = String(index);
      itemEl.addEventListener("dragstart", handleDragStart);

      const delBtn = document.createElement("button");
      delBtn.className = "itinerary-item-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", e => {
        e.stopPropagation();
        openCol.items.splice(index, 1);
        saveItineraryToGitHub();
        renderBoard();
      });

      itemEl.appendChild(delBtn);
      bodyEl.appendChild(itemEl);
    });

    const addBtn = document.createElement("button");
    addBtn.className = "itinerary-add-item";
    addBtn.textContent = "+ add item";
    addBtn.addEventListener("click", () => {
      const text = prompt("New item for Open bin:");
      if (text && text.trim()) {
        openCol.items.push(text.trim());
        saveItineraryToGitHub();
        renderBoard();
      }
    });
    bodyEl.appendChild(addBtn);
  }
}

// ===============================
// DRAG & DROP
// ===============================

function handleDragStart(e) {
  const target = e.currentTarget;
  dragging = {
    fromColumnId: target.dataset.columnId,
    fromIndex: parseInt(target.dataset.index, 10)
  };
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault();
  const body = e.currentTarget;
  body.classList.add("drag-over");
  e.dataTransfer.dropEffect = "move";
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  const body = e.currentTarget;
  body.classList.remove("drag-over");

  if (!dragging) return;

  const toColumnId = body.dataset.columnId;
  const { fromColumnId, fromIndex } = dragging;
  dragging = null;

  if (!fromColumnId || !toColumnId) return;

  const fromCol = boardState.columns.find(c => c.id === fromColumnId);
  const toCol = boardState.columns.find(c => c.id === toColumnId);
  if (!fromCol || !toCol) return;

  const movedArr = fromCol.items.splice(fromIndex, 1);
  if (!movedArr.length) return;
  const moved = movedArr[0];

  toCol.items.push(moved);

  saveItineraryToGitHub();
  renderBoard();
}

// ===============================
// INIT BOARD
// ===============================

async function initBoard() {
  setStatus("Loading itinerary…");
  try {
    await fetchItineraryFromGitHub();
  } catch (err) {
    console.error(err);
    const backup = localStorage.getItem(STORAGE_LOCAL_BACKUP);
    if (backup) {
      boardState = JSON.parse(backup);
      setStatus("Loaded local backup (GitHub failed)");
    } else {
      boardState = JSON.parse(JSON.stringify(INITIAL_BOARD));
      setStatus("Using built-in default (GitHub failed)");
    }
  }
  renderBoard();
}

// ===============================
// MODULE LOADER
// ===============================

async function loadModules() {
  const modules = document.querySelectorAll('[data-module]');
  
  for (const moduleEl of modules) {
    const modulePath = moduleEl.getAttribute('data-module');
    if (!modulePath) continue;
    
    try {
      const response = await fetch(modulePath);
      if (response.ok) {
        const html = await response.text();
        moduleEl.innerHTML = html;
        
        // Execute any scripts in the loaded module
        const scripts = moduleEl.querySelectorAll('script');
        scripts.forEach(oldScript => {
          const newScript = document.createElement('script');
          Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode.replaceChild(newScript, oldScript);
        });
        
        console.log('✓ Loaded module:', modulePath);
      } else {
        console.error('Failed to load module:', modulePath, response.status);
      }
    } catch (error) {
      console.error('Error loading module:', modulePath, error);
    }
  }
}

// ===============================
// BOOTSTRAP
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  updateParisTime();
  setInterval(updateParisTime, 30000);

  // Load all modules first
  await loadModules();
  
  // Then initialize itinerary board
  initBoard();
});
