// itinerary.js
// FULL REPLACEMENT FILE — COMPLETE — WITH SORTABLEJS + GITHUB SYNC + RENDERING

// ---------------------------------------------------------------------------
// 0. LOAD SORTABLEJS (auto-inject if not present)
// ---------------------------------------------------------------------------
(function ensureSortable() {
  if (!window.Sortable) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.3/Sortable.min.js";
    document.head.appendChild(s);
  }
})();


// ---------------------------------------------------------------------------
// 1. DEFAULT ITINERARY DATA
// ---------------------------------------------------------------------------
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


// ---------------------------------------------------------------------------
// 2. STATE + HELPERS
// ---------------------------------------------------------------------------
const ITIN_LOCAL_KEY = "itinerary-columns-v1";
let itinState = null;

const clone = (x) => JSON.parse(JSON.stringify(x));

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
  try {
    localStorage.setItem(ITIN_LOCAL_KEY, JSON.stringify(itinState));
  } catch {}
}


// ---------------------------------------------------------------------------
// 3. CARD CREATION + DELETION
// ---------------------------------------------------------------------------
function createCard(text) {
  const card = document.createElement("div");
  card.className = "itinerary-card";

  const span = document.createElement("span");
  span.className = "card-text";
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "×";
  del.onclick = () => deleteItem(text);

  card.appendChild(span);
  card.appendChild(del);
  return card;
}

function deleteItem(text) {
  for (const col of itinState.columns) {
    const idx = col.items.indexOf(text);
    if (idx !== -1) {
      col.items.splice(idx, 1);
      saveToLocal();
      renderItinerary();
      return;
    }
  }
}


// ---------------------------------------------------------------------------
// 4. RENDER ITINERARY
// ---------------------------------------------------------------------------
function renderItinerary() {
  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");

  daysColumn.innerHTML = "";
  openBinList.innerHTML = "";

  const open = itinState.columns.find((c) => c.id === "open");
  const days = itinState.columns.filter((c) => c.id !== "open");

  // ---- days ----
  days.forEach((col) => {
    const wrapper = document.createElement("div");
    wrapper.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    header.innerHTML = `
      <div>
        <h3>${col.title}</h3>
        <div class="day-meta">${col.meta}</div>
      </div>
    `;

    // add form
    const addWrap = document.createElement("div");
    addWrap.className = "add-item-container";

    const input = document.createElement("input");
    input.className = "add-item-input";
    input.placeholder = "Add event…";

    const btn = document.createElement("button");
    btn.className = "add-item-btn";
    btn.textContent = "+";

    const add = () => {
      const v = input.value.trim();
      if (!v) return;
      col.items.push(v);
      input.value = "";
      saveToLocal();
      renderItinerary();
    };

    input.onkeypress = (e) => {
      if (e.key === "Enter") add();
    };
    btn.onclick = add;

    addWrap.appendChild(input);
    addWrap.appendChild(btn);

    header.appendChild(addWrap);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.col = col.id;

    col.items.forEach((item) => list.appendChild(createCard(item)));

    wrapper.appendChild(header);
    wrapper.appendChild(list);
    daysColumn.appendChild(wrapper);
  });

  // ---- open bin ----
  open.items.forEach((item) => {
    openBinList.appendChild(createCard(item));
  });

  setupSortables();
}


// ---------------------------------------------------------------------------
// 5. SORTABLEJS — REAL DRAG & DROP
// ---------------------------------------------------------------------------
function setupSortables() {
  const lists = document.querySelectorAll(".itinerary-list");

  lists.forEach((list) => {
    Sortable.create(list, {
      group: "itin",
      animation: 150,
      ghostClass: "drag-ghost",
      onSort: rebuildState
    });
  });
}

function rebuildState() {
  const newState = { columns: [] };

  // open bin
  const openItems = [];
  document.querySelectorAll("#openBinList .card-text").forEach((el) =>
    openItems.push(el.textContent.trim())
  );

  newState.columns.push({
    id: "open",
    title: "Open bin",
    meta: "Unassigned items",
    items: openItems
  });

  // days
  const old = itinState.columns.filter((c) => c.id !== "open");
  const rendered = document.querySelectorAll("#daysColumn .day-column");

  rendered.forEach((colEl, i) => {
    const src = old[i];
    const items = [];
    colEl.querySelectorAll(".card-text").forEach((el) =>
      items.push(el.textContent.trim())
    );

    newState.columns.push({
      id: src.id,
      title: src.title,
      meta: src.meta,
      items
    });
  });

  itinState = newState;
  saveToLocal();
}


// ---------------------------------------------------------------------------
// 6. RESET
// ---------------------------------------------------------------------------
function resetItinerary() {
  if (!confirm("Reset itinerary to defaults?")) return;
  itinState = clone(window.ITIN_DATA);
  saveToLocal();
  renderItinerary();
}


// ---------------------------------------------------------------------------
// 7. GITHUB SYNC — FULL ORIGINAL BLOCK INCLUDED
// ---------------------------------------------------------------------------

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
  const t = prompt(
    "GitHub personal access token (with repo scope):",
    GITHUB.token || ""
  );
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
      status.textContent = "✓ Loaded from GitHub";
      status.style.color = "#2f7d32";
    }
  } catch (e) {
    console.error(e);
    if (status) {
      status.textContent = "GitHub load failed: " + e.message;
      status.style.color = "#b3261e";
    }
  }
}


// ---------------------------------------------------------------------------
// 8. INIT
// ---------------------------------------------------------------------------
function initItinerary() {
  itinState = loadFromLocal() || clone(window.ITIN_DATA);
  loadGitHubToken();

  document.getElementById("resetBtn").onclick = resetItinerary;
  document.getElementById("githubToken").onclick = setGitHubToken;
  document.getElementById("githubSave").onclick = saveItineraryToGitHub;
  document.getElementById("githubLoad").onclick = loadItineraryFromGitHub;

  renderItinerary();
}

document.addEventListener("DOMContentLoaded", initItinerary);
