// Basic config
const GITHUB_OWNER = "omatty123";
const GITHUB_REPO = "paris2025";
// Change this to "master" if your default branch is master, not main
const GITHUB_BRANCH = "main";
const GITHUB_FILE_PATH = "data/itinerary.json";

const STORAGE_TOKEN_KEY = "paris25_github_token";
const STORAGE_LOCAL_BACKUP = "paris25_itinerary_backup";

const SAVE_STATUS_EL = document.getElementById("saveStatus");

// Paris time
function updateParisTime() {
  const span = document.getElementById("parisTime");
  if (!span) return;
  const now = new Date().toLocaleTimeString("en-US", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit"
  });
  span.textContent = "Paris time: " + now;
}
setInterval(updateParisTime, 30000);
updateParisTime();

// Initial local default as hard backup
const INITIAL_BOARD = {
  columns: [
    {
      id: "open",
      title: "Open bin",
      meta: "Unassigned items",
      items: [
        "Arrive CDG",
        "RER B → Denfert Rochereau → Metro 6",
        "Arrive apartment",
        "Explore Chinatown",
        "Lunch near Tang Frères",
        "Metro to Bastille",
        "Walk the Coulée Verte",
        "Drink at Le Train Bleu",
        "Dinner at Afrik’N’Fusion",
        "Walk home"
      ]
    },
    {
      id: "dec3",
      title: "Day 1",
      meta: "Wed Dec 3",
      items: [
        "Sainte Chapelle",
        "Conciergerie",
        "Notre Dame exterior",
        "Pont Neuf and Pont des Arts",
        "Jardin du Luxembourg",
        "Huitrerie Regis",
        "Musée d’Orsay",
        "Chez Gladines"
      ]
    },
    {
      id: "dec4",
      title: "Day 2",
      meta: "Thu Dec 4",
      items: [
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
      id: "dec5",
      title: "Day 3",
      meta: "Fri Dec 5",
      items: [
        "Metro to Opéra then walk to Gare Saint Lazare",
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
      title: "Day 4",
      meta: "Sat Dec 6",
      items: [
        "Belleville",
        "Promenade Dora Bruder",
        "Montmartre and Sacré Coeur",
        "Père Lachaise",
        "Pain Vin Fromages"
      ]
    },
    {
      id: "dec7",
      title: "Day 5",
      meta: "Sun Dec 7",
      items: [
        "Parc Montsouris",
        "Covered passages",
        "Tuileries Christmas market",
        "Galeries Lafayette",
        "Carrefour Italie 2",
        "Darkoum Cantine Marocaine"
      ]
    },
    {
      id: "last",
      title: "Last day",
      meta: "Open end",
      items: []
    }
  ]
};

let boardState = null;
let currentSha = null;
let isSaving = false;

// Utility
function cloneBoard(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setStatus(text) {
  if (SAVE_STATUS_EL) SAVE_STATUS_EL.textContent = text;
}

// GitHub API helpers

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
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!res.ok) {
    throw new Error("GitHub fetch failed with status " + res.status);
  }

  const data = await res.json();
  currentSha = data.sha;

  const decoded = atob(data.content.replace(/\n/g, ""));
  const parsed = JSON.parse(decoded);

  boardState = parsed;
  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));

  setStatus("Loaded from GitHub");
}

async function saveItineraryToGitHub() {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);

  if (!boardState) return;

  // Always maintain a local backup
  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));

  if (!token) {
    setStatus("Local only (no GitHub key)");
    return;
  }

  if (!currentSha) {
    // If we do not have a sha yet, fetch metadata once
    try {
      await fetchItineraryFromGitHub();
    } catch (e) {
      // If this fails, we still have local backup
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

  if (currentSha) {
    body.sha = currentSha;
  }

  isSaving = true;
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

  isSaving = false;

  if (!res.ok) {
    setStatus("GitHub save failed " + res.status);
    return;
  }

  const data = await res.json();
  if (data && data.content && data.content.sha) {
    currentSha = data.content.sha;
  }

  setStatus("Saved to GitHub");
}

// Token management

const githubModeBtn = document.getElementById("githubModeBtn");

if (githubModeBtn) {
  githubModeBtn.addEventListener("click", () => {
    const existing = localStorage.getItem(STORAGE_TOKEN_KEY);
    const promptText = existing
      ? "Paste GitHub personal access token (leave blank to keep current):"
      : "Paste GitHub personal access token:";

    const input = prompt(promptText, "");
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
    alert("GitHub edit key saved only in this browser.");
    setStatus("GitHub key set, saving enabled");
  });
}

// Board rendering and interactions

const boardEl = document.getElementById("itineraryBoard");

function renderBoard() {
  if (!boardEl || !boardState) return;

  boardEl.innerHTML = "";

  boardState.columns.forEach((col, colIndex) => {
    const colEl = document.createElement("div");
    colEl.className = "itinerary-column";
    colEl.dataset.columnId = col.id;

    const headerEl = document.createElement("div");
    headerEl.className = "itinerary-column-header";

    const titleWrap = document.createElement("div");

    const titleEl = document.createElement("h3");
    titleEl.className = "itinerary-column-title";
    titleEl.textContent = col.title;

    const metaEl = document.createElement("p");
    metaEl.className = "itinerary-column-meta";
    metaEl.textContent = col.meta || "";

    titleWrap.appendChild(titleEl);
    if (col.meta) titleWrap.appendChild(metaEl);

    const addItemBtn = document.createElement("button");
    addItemBtn.className = "itinerary-add-item";
    addItemBtn.textContent = "+ add item";
    addItemBtn.addEventListener("click", () => {
      const text = prompt("New item for " + col.title + ":");
      if (text && text.trim()) {
        col.items.push(text.trim());
        saveItineraryToGitHub();
        renderBoard();
      }
    });

    headerEl.appendChild(titleWrap);
    headerEl.appendChild(addItemBtn);

    const bodyEl = document.createElement("div");
    bodyEl.className = "itinerary-column-body";
    bodyEl.dataset.columnId = col.id;

    bodyEl.addEventListener("dragover", handleDragOver);
    bodyEl.addEventListener("dragleave", handleDragLeave);
    bodyEl.addEventListener("drop", handleDrop);

    col.items.forEach((itemText, itemIndex) => {
      const itemEl = document.createElement("div");
      itemEl.className = "itinerary-item";
      itemEl.textContent = itemText;
      itemEl.draggable = true;
      itemEl.dataset.columnId = col.id;
      itemEl.dataset.index = String(itemIndex);

      itemEl.addEventListener("dragstart", handleDragStart);

      const delBtn = document.createElement("button");
      delBtn.className = "itinerary-item-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        col.items.splice(itemIndex, 1);
        saveItineraryToGitHub();
        renderBoard();
      });

      itemEl.appendChild(delBtn);
      bodyEl.appendChild(itemEl);
    });

    colEl.appendChild(headerEl);
    colEl.appendChild(bodyEl);
    boardEl.appendChild(colEl);
  });
}

let dragging = null; // { fromColumnId, fromIndex }

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
  const body = e.currentTarget;
  body.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  const body = e.currentTarget;
  body.classList.remove("drag-over");

  if (!dragging) return;

  const toColumnId = body.dataset.columnId;
  const { fromColumnId, fromIndex } = dragging;

  if (!fromColumnId || !toColumnId) return;

  const fromCol = boardState.columns.find((c) => c.id === fromColumnId);
  const toCol = boardState.columns.find((c) => c.id === toColumnId);
  if (!fromCol || !toCol) return;

  const movedArray = fromCol.items.splice(fromIndex, 1);
  if (!movedArray.length) return;

  const moved = movedArray[0];
  toCol.items.push(moved);

  dragging = null;
  saveItineraryToGitHub();
  renderBoard();
}

// Buttons for add day and reset

const addDayBtn = document.getElementById("addDayBtn");
const resetBtn = document.getElementById("resetItineraryBtn");

if (addDayBtn) {
  addDayBtn.addEventListener("click", () => {
    const name = prompt("New day title (for example Dec 8 or Last day):");
    if (!name || !name.trim()) return;
    const id = "day_" + Date.now();
    boardState.columns.push({
      id,
      title: name.trim(),
      meta: "",
      items: []
    });
    saveItineraryToGitHub();
    renderBoard();
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset itinerary to the built in default and overwrite GitHub file?")) return;
    boardState = cloneBoard(INITIAL_BOARD);
    saveItineraryToGitHub();
    renderBoard();
  });
}

// Init

async function initBoard() {
  setStatus("Loading from GitHub…");
  try {
    await fetchItineraryFromGitHub();
    renderBoard();
  } catch (e) {
    console.error(e);
    // Try local backup
    const backup = localStorage.getItem(STORAGE_LOCAL_BACKUP);
    if (backup) {
      boardState = JSON.parse(backup);
      setStatus("Loaded local backup (GitHub fetch failed)");
    } else {
      boardState = cloneBoard(INITIAL_BOARD);
      setStatus("Using built in default (GitHub fetch failed)");
    }
    renderBoard();
  }
}

initBoard();
