// Repo config
const GITHUB_OWNER = "omatty123";
const GITHUB_REPO = "paris2025";
const GITHUB_BRANCH = "main"; // change to "master" if your repo uses master
const GITHUB_FILE_PATH = "data/itinerary.json";

const STORAGE_TOKEN_KEY = "paris25_github_token";
const STORAGE_LOCAL_BACKUP = "paris25_itinerary_backup";

const SAVE_STATUS_EL = document.getElementById("saveStatus");
const BOARD_EL = document.getElementById("itineraryBoard");
const OPEN_BIN_EL = document.getElementById("openBinColumn");

// Fixed day order for the vertical stack
const DAY_ORDER = ["dec3", "dec4", "dec5", "dec6", "dec7", "dec8", "dec9"];

// Hard default (also used if GitHub is unavailable and no local backup)
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
      id: "dec8",
      title: "Day 6",
      meta: "Mon Dec 8",
      items: []
    },
    {
      id: "dec9",
      title: "Day 7",
      meta: "Tue Dec 9",
      items: []
    }
  ]
};

let boardState = null;
let currentSha = null;
let dragging = null;

// Utilities

function cloneBoard(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function setStatus(text) {
  if (SAVE_STATUS_EL) SAVE_STATUS_EL.textContent = text;
}

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

// GitHub helpers

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

  if (!res.ok) throw new Error("GitHub fetch failed " + res.status);

  const data = await res.json();
  currentSha = data.sha;

  const decoded = atob(data.content.replace(/\n/g, ""));
  const parsed = JSON.parse(decoded);

  boardState = parsed;
  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));

  setStatus("Loaded from GitHub");
}

async function saveItineraryToGitHub() {
  if (!boardState) return;

  // Always keep local backup
  localStorage.setItem(STORAGE_LOCAL_BACKUP, JSON.stringify(boardState));

  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (!token) {
    setStatus("Local only (no GitHub key)");
    return;
  }

  if (!currentSha) {
    try {
      await fetchItineraryFromGitHub();
    } catch (e) {
      // ignore, we still have boardState
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
    setStatus("GitHub save failed " + res.status);
    return;
  }

  const data = await res.json();
  if (data && data.content && data.content.sha) {
    currentSha = data.content.sha;
  }

  setStatus("Saved to GitHub");
}

// Token button

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

// Rendering

function renderBoard() {
  if (!BOARD_EL || !OPEN_BIN_EL || !boardState) return;

  BOARD_EL.innerHTML = "";
  OPEN_BIN_EL.innerHTML = "";

  const openCol = boardState.columns.find((c) => c.id === "open");
  const dayColumns = boardState.columns.filter((c) => c.id !== "open");

  // Sort days in fixed order for the vertical stack
  const sortedDays = DAY_ORDER.map((id) =>
    dayColumns.find((c) => c.id === id)
  ).filter(Boolean);

  // Left: all days stacked
  sortedDays.forEach((col) => {
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
    BOARD_EL.appendChild(colEl);
  });

  // Right: Open bin column
  if (openCol) {
    const bodyEl = OPEN_BIN_EL;
    bodyEl.dataset.columnId = openCol.id;

    bodyEl.addEventListener("dragover", handleDragOver);
    bodyEl.addEventListener("dragleave", handleDragLeave);
    bodyEl.addEventListener("drop", handleDrop);

    openCol.items.forEach((itemText, itemIndex) => {
      const itemEl = document.createElement("div");
      itemEl.className = "itinerary-item";
      itemEl.textContent = itemText;
      itemEl.draggable = true;
      itemEl.dataset.columnId = openCol.id;
      itemEl.dataset.index = String(itemIndex);

      itemEl.addEventListener("dragstart", handleDragStart);

      const delBtn = document.createElement("button");
      delBtn.className = "itinerary-item-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCol.items.splice(itemIndex, 1);
        saveItineraryToGitHub();
        renderBoard();
      });

      itemEl.appendChild(delBtn);
      bodyEl.appendChild(itemEl);
    });

    const addOpenItemBtn = document.createElement("button");
    addOpenItemBtn.className = "itinerary-add-item";
    addOpenItemBtn.textContent = "+ add item";
    addOpenItemBtn.addEventListener("click", () => {
      const text = prompt("New item for Open bin:");
      if (text && text.trim()) {
        openCol.items.push(text.trim());
        saveItineraryToGitHub();
        renderBoard();
      }
    });
    bodyEl.appendChild(addOpenItemBtn);
  }
}

// Drag handlers

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

// Init board

async function initBoard() {
  setStatus("Loading from GitHub…");
  try {
    await fetchItineraryFromGitHub();
    renderBoard();
  } catch (e) {
    console.error(e);
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

// WEATHER

function parisWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if ([51, 53, 55].includes(code)) return "🌦️";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌡️";
}

async function loadParisWeather() {
  const container = document.getElementById("paris-weather-days");
  if (!container) return;

  const base =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=48.8566&longitude=2.3522" +
    "&daily=weathercode,temperature_2m_max,temperature_2m_min" +
    "&timezone=Europe%2FParis";

  let data;
  try {
    const res = await fetch(base, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    const proxy =
      "https://cors-proxy.api.exponential-hub.workers.dev/?" +
      encodeURIComponent(base);
    const res = await fetch(proxy);
    data = await res.json();
  }

  if (!data || !data.daily) {
    container.innerHTML = "<p>Weather unavailable.</p>";
    return;
  }

  container.innerHTML = "";

  const days = data.daily.time;
  const codes = data.daily.weathercode;
  const tmax = data.daily.temperature_2m_max;
  const tmin = data.daily.temperature_2m_min;

  const limit = Math.min(6, days.length); // today + next five

  for (let i = 0; i < limit; i++) {
    const d = new Date(days[i]);
    const pretty = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    const icon = parisWeatherIcon(codes[i]);
    const hi = Math.round(tmax[i]);
    const lo = Math.round(tmin[i]);

    const link =
      "https://www.meteofrance.com/previsions-meteo-france/paris-75000?day=" +
      d.toISOString().slice(0, 10);

    const card = document.createElement("div");
    card.className = "weather-day";
    card.innerHTML = `
      <a href="${link}" target="_blank">
        <div class="weather-emoji">${icon}</div>
        <div class="weather-date">${pretty}</div>
        <div class="weather-temps">${hi}° / ${lo}°C</div>
      </a>
    `;
    container.appendChild(card);
  }
}

loadParisWeather();
