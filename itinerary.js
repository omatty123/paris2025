// itinerary.js
// Drag-and-drop itinerary with Open Bin and GitHub save/load to itinerary.json in repo root.

(function () {
  const STORAGE_KEY = "paris-itinerary-v1";
  const TOKEN_KEY = "paris2025-github-token";

  const GITHUB_CONFIG = {
    owner: "omatty123",
    repo: "paris2025",
    filePath: "itinerary.json",
    branch: "main",
    token: null
  };

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");
  const openBinAdd = document.getElementById("openBinAdd");
  const resetBtn = document.getElementById("resetBtn");

  const githubTokenBtn = document.getElementById("githubToken");
  const githubSaveBtn = document.getElementById("githubSave");
  const githubLoadBtn = document.getElementById("githubLoad");
  const githubStatus = document.getElementById("githubStatus");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers missing.");
    return;
  }

  // Default data: Day 1 in OPEN BIN, Dec 3–7 filled, Dec 8–9 empty.

  const defaultData = {
    "OPEN BIN": [
      "11h05 Arrive Charles de Gaulle Airport",
      "12h15 RER B to Denfert Rochereau then Metro line 6 to Place d’Italie",
      "13h15 Arrive apartment (7 Avenue Stephen Pichon, Bâtiment B)",
      "Explore Chinatown",
      "Lunch near Tang Frères",
      "Metro to Bastille",
      "Walk the Coulée Verte",
      "Drink at Le Train Bleu",
      "Dinner at Afrik’N’Fusion",
      "Walk home"
    ],
    "Dec 3": [
      "Sainte Chapelle",
      "Conciergerie",
      "Notre Dame exterior",
      "Pont Neuf & Pont des Arts",
      "Jardin du Luxembourg",
      "Huitrerie Regis",
      "Musée d’Orsay",
      "Chez Gladines"
    ],
    "Dec 4": [
      "Louvre (19th c rooms)",
      "Tuileries Garden",
      "Chez Alain Miam Miam",
      "Walk toward Passy",
      "Maison de Balzac",
      "Walk to Trocadéro",
      "Le Temps des Cerises"
    ],
    "Dec 5": [
      "Metro → Opéra → Saint-Lazare",
      "Train to Rouen",
      "Taxi to Cathedral",
      "Gros Horloge",
      "Vegan and Cie",
      "Musée Flaubert",
      "Cimetière Monumental",
      "Croisset",
      "Train back",
      "Dinner at Brasserie Le Lazare"
    ],
    "Dec 6": [
      "Belleville",
      "Promenade Dora Bruder",
      "Montmartre",
      "Sacré-Cœur",
      "Père-Lachaise",
      "Pain Vin Fromages"
    ],
    "Dec 7": [
      "Parc Montsouris",
      "Covered passages",
      "Tuileries Christmas Market",
      "Galeries Lafayette",
      "Carrefour Italie 2",
      "Darkoum Cantine Marocaine"
    ],
    "Dec 8": [],
    "Dec 9": []
  };

  let data = loadLocal() || clone(defaultData);
  let dragged = null; // { day, index, text }

  // ---- Utilities ----

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed["OPEN BIN"]) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setStatus(msg, color) {
    if (!githubStatus) return;
    githubStatus.textContent = msg || "";
    if (color) githubStatus.style.color = color;
  }

  function loadTokenFromStorage() {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) GITHUB_CONFIG.token = t;
    } catch {
      // ignore
    }
  }

  function saveTokenToStorage(token) {
    GITHUB_CONFIG.token = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }

  // ---- Rendering ----

  function render() {
    // Days (left)
    daysColumn.innerHTML = "";

    const dayNames = Object.keys(data)
      .filter((k) => k !== "OPEN BIN")
      .sort((a, b) => {
        const na = parseInt(a.replace(/[^\d]/g, ""), 10) || 0;
        const nb = parseInt(b.replace(/[^\d]/g, ""), 10) || 0;
        return na - nb;
      });

    dayNames.forEach((day) => {
      const dayCol = document.createElement("div");
      dayCol.className = "day-column";

      const header = document.createElement("div");
      header.className = "day-header";

      const title = document.createElement("h3");
      title.textContent = day;
      header.appendChild(title);

      const addWrap = document.createElement("div");
      addWrap.className = "add-item-container";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add event…";
      input.className = "add-item-input";

      const btn = document.createElement("button");
      btn.className = "add-item-btn";
      btn.textContent = "+";

      function addFromInput() {
        const val = input.value.trim();
        if (!val) return;
        data[day].push(val);
        input.value = "";
        saveLocal();
        render();
      }

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") addFromInput();
      });
      btn.addEventListener("click", addFromInput);

      addWrap.appendChild(input);
      addWrap.appendChild(btn);
      header.appendChild(addWrap);
      dayCol.appendChild(header);

      const list = document.createElement("div");
      list.className = "itinerary-list";
      list.dataset.day = day;

      attachDropHandlers(list);

      data[day].forEach((item, index) => {
        const card = buildCard(day, index, item);
        list.appendChild(card);
      });

      dayCol.appendChild(list);
      daysColumn.appendChild(dayCol);
    });

    // Open Bin (right)
    openBinList.innerHTML = "";
    attachDropHandlers(openBinList);

    data["OPEN BIN"].forEach((item, index) => {
      const card = buildCard("OPEN BIN", index, item);
      openBinList.appendChild(card);
    });
  }

  function buildCard(day, index, text) {
    const card = document.createElement("div");
    card.className = "itinerary-card";
    card.draggable = true;
    card.dataset.day = day;
    card.dataset.index = index;

    const span = document.createElement("span");
    span.className = "card-text";
    span.textContent = text;

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "×";

    del.addEventListener("click", (e) => {
      e.stopPropagation();
      data[day].splice(index, 1);
      saveLocal();
      render();
    });

    card.addEventListener("dragstart", () => {
      dragged = { day, index, text };
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      dragged = null;
      document
        .querySelectorAll(".itinerary-list.drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
    });

    card.appendChild(span);
    card.appendChild(del);
    return card;
  }

  function attachDropHandlers(listEl) {
    listEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      listEl.classList.add("drag-over");
    });

    listEl.addEventListener("dragleave", (e) => {
      if (e.target === listEl) {
        listEl.classList.remove("drag-over");
      }
    });

    listEl.addEventListener("drop", (e) => {
      e.preventDefault();
      listEl.classList.remove("drag-over");
      if (!dragged) return;

      const targetDay = listEl.dataset.day;
      if (!targetDay) return;

      const { day: fromDay, index: fromIndex, text } = dragged;

      // Remove from source
      data[fromDay].splice(fromIndex, 1);
      // Add to end of target
      data[targetDay].push(text);

      saveLocal();
      render();
    });
  }

  // ---- Open bin input ----

  if (openBinAdd && openBinInput) {
    function addToOpenBin() {
      const val = openBinInput.value.trim();
      if (!val) return;
      data["OPEN BIN"].push(val);
      openBinInput.value = "";
      saveLocal();
      render();
    }

    openBinAdd.addEventListener("click", addToOpenBin);
    openBinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addToOpenBin();
    });
  }

  // ---- Reset to defaults ----

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (
        confirm(
          "Reset itinerary to the original plan (Day 1 in Open Bin, Dec 3–9 default)?"
        )
      ) {
        data = clone(defaultData);
        saveLocal();
        setStatus("", "");
        render();
      }
    });
  }

  // ---- GitHub integration ----

  loadTokenFromStorage();

  // Set token button
  if (githubTokenBtn) {
    githubTokenBtn.addEventListener("click", () => {
      const current = GITHUB_CONFIG.token || "";
      const token = prompt(
        "Paste a GitHub personal access token (repo scope). This stays in this browser only:",
        current
      );
      if (token && token.trim()) {
        saveTokenToStorage(token.trim());
        setStatus("GitHub token saved in this browser.", "#5c5247");
      }
    });
  }

  async function fetchWithAuth(url, options = {}) {
    if (!GITHUB_CONFIG.token) {
      throw new Error("No GitHub token configured.");
    }
    const headers = options.headers || {};
    headers["Authorization"] = `token ${GITHUB_CONFIG.token}`;
    headers["Accept"] = "application/vnd.github.v3+json";
    return fetch(url, { ...options, headers });
  }

  async function saveToGitHub() {
    try {
      if (!GITHUB_CONFIG.token) {
        const token = prompt(
          "Paste a GitHub personal access token (repo scope). This stays in this browser only:"
        );
        if (!token || !token.trim()) {
          setStatus("GitHub token required to save.", "#b3493c");
          return;
        }
        saveTokenToStorage(token.trim());
      }

      setStatus("Saving to GitHub…", "#7a7267");

      const content = JSON.stringify(data, null, 2);
      const encoded = btoa(unescape(encodeURIComponent(content)));

      // Get existing file SHA if present
      let sha = null;
      try {
        const getRes = await fetchWithAuth(
          `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`
        );
        if (getRes.ok) {
          const json = await getRes.json();
          sha = json.sha;
        }
      } catch (e) {
        console.log("No existing itinerary.json, will create it.");
      }

      const payload = {
        message: `Update itinerary (${new Date().toISOString()})`,
        content: encoded,
        branch: GITHUB_CONFIG.branch
      };
      if (sha) payload.sha = sha;

      const putRes = await fetchWithAuth(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!putRes.ok) {
        const err = await putRes.json().catch(() => ({}));
        throw new Error(err.message || "GitHub save failed");
      }

      setStatus("Saved to GitHub ✓", "#2a7a3b");
      setTimeout(() => setStatus("", ""), 4000);
    } catch (err) {
      console.error(err);
      setStatus("GitHub save error: " + err.message, "#b3493c");
      alert("GitHub save failed: " + err.message);
    }
  }

  async function loadFromGitHub() {
    try {
      if (!GITHUB_CONFIG.token) {
        const token = prompt(
          "Paste a GitHub personal access token (repo scope). This stays in this browser only:"
        );
        if (!token || !token.trim()) {
          setStatus("GitHub token required to load.", "#b3493c");
          return;
        }
        saveTokenToStorage(token.trim());
      }

      setStatus("Loading from GitHub…", "#7a7267");

      const res = await fetchWithAuth(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "GitHub load failed");
      }

      const json = await res.json();
      const decoded = decodeURIComponent(escape(atob(json.content)));
      const parsed = JSON.parse(decoded);

      // basic shape check
      if (!parsed["OPEN BIN"]) {
        throw new Error("GitHub file does not look like an itinerary object.");
      }

      data = parsed;
      saveLocal();
      render();

      setStatus("Loaded from GitHub ✓", "#2a7a3b");
      setTimeout(() => setStatus("", ""), 4000);
    } catch (err) {
      console.error(err);
      setStatus("GitHub load error: " + err.message, "#b3493c");
      alert("GitHub load failed: " + err.message);
    }
  }

  if (githubSaveBtn) {
    githubSaveBtn.addEventListener("click", saveToGitHub);
  }
  if (githubLoadBtn) {
    githubLoadBtn.addEventListener("click", loadFromGitHub);
  }

  // ---- Initial render ----

  render();
})();
