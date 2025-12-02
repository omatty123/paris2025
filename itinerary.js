// itinerary.js
// Drag & drop itinerary with OPEN BIN on the right + localStorage + optional GitHub sync.

(function () {
  console.log("Itinerary module loaded");

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
    console.warn("Itinerary containers not found.");
    return;
  }

  // ------------------ DEFAULT ITINERARY ------------------

  const defaultDays = {
    "OPEN BIN": [
      "11h05 Arrive Charles de Gaulle Airport",
      "12h15 RER B to Denfert Rochereau then Metro line 6 to Place d'Italie",
      "13h15 Arrive apartment at 7 Avenue Stephen Pichon Bâtiment B",
      "Explore Chinatown",
      "Lunch near Tang Frères",
      "Metro to Bastille",
      "Walk the Coulée Verte",
      "Drink at Le Train Bleu",
      "Dinner at Afrik'N'Fusion",
      "Walk home"
    ],
    "Dec 3": [
      "9h00 Sainte Chapelle",
      "9h45 Conciergerie",
      "10h30 Notre Dame exterior",
      "11h00 Pont Neuf & Pont des Arts",
      "11h30 Jardin du Luxembourg",
      "12h15 Huitrerie Régis",
      "14h00 Musée d'Orsay",
      "19h00 Chez Gladines"
    ],
    "Dec 4": [
      "9h00 Louvre nineteenth-century rooms",
      "11h30 Tuileries Garden",
      "12h15 Chez Alain Miam Miam",
      "13h30 Walk toward Passy",
      "14h30 Maison de Balzac",
      "16h00 Walk to Trocadéro",
      "19h00 Le Temps des Cerises"
    ],
    "Dec 5": [
      "7h00 Metro to Opéra then walk to Gare Saint-Lazare",
      "8h14 Train to Rouen",
      "09h46 Taxi to Cathedral",
      "10h00 Gros Horloge",
      "12h00 Vegan & Cie",
      "13h00 Musée Flaubert",
      "14h00 Cimetière Monumental",
      "14h30 Croisset",
      "18h00 Train back",
      "Dinner at Brasserie Le Lazare"
    ],
    "Dec 6": [
      "9h00 Belleville",
      "10h00 Promenade Dora Bruder",
      "11h30 Montmartre",
      "12h00 Sacré-Cœur",
      "14h00 Père Lachaise",
      "17h00 Pain Vin Fromages"
    ],
    "Dec 7": [
      "9h00 Parc Montsouris",
      "10h15 Covered passages",
      "12h00 Tuileries Christmas Market",
      "14h15 Galeries Lafayette",
      "16h00 Carrefour Italie 2",
      "18h00 Darkoum Cantine Marocaine"
    ],
    "Dec 8": [
      "6h15 Leave apartment",
      "6h30 Metro then RER B to CDG",
      "7h30 Arrive airport",
      "10h30 Flight departs"
    ],
    "Dec 9": [] // left open in case of extension
  };

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  let itinerary =
    JSON.parse(localStorage.getItem("itinerary-v1")) || deepCopy(defaultDays);

  let dragSource = null; // { day, index }

  // ------------------ RENDERING ------------------

  function renderAll() {
    renderDays();
    renderOpenBin();
    saveLocal();
  }

  function renderDays() {
    daysColumn.innerHTML = "";
    const keys = Object.keys(itinerary)
      .filter((k) => k !== "OPEN BIN")
      .sort((a, b) => {
        const na = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
        const nb = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
        return na - nb;
      });

    keys.forEach((dayKey) => {
      const column = document.createElement("div");
      column.className = "day-column";

      const header = document.createElement("div");
      header.className = "day-header";

      const title = document.createElement("h3");
      title.textContent = dayKey;
      header.appendChild(title);

      const addContainer = document.createElement("div");
      addContainer.className = "add-item-container";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Add event…";
      input.className = "add-item-input";

      const addBtn = document.createElement("button");
      addBtn.textContent = "+";
      addBtn.className = "add-item-btn";

      addContainer.appendChild(input);
      addContainer.appendChild(addBtn);
      header.appendChild(addContainer);

      const list = document.createElement("div");
      list.className = "itinerary-list";
      list.dataset.day = dayKey;

      attachListDnD(list);

      (itinerary[dayKey] || []).forEach((item, index) => {
        const card = buildCard(dayKey, index, item);
        list.appendChild(card);
      });

      // Add item handlers
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim()) {
          itinerary[dayKey].push(input.value.trim());
          input.value = "";
          renderAll();
        }
      });

      addBtn.addEventListener("click", () => {
        if (input.value.trim()) {
          itinerary[dayKey].push(input.value.trim());
          input.value = "";
          renderAll();
        }
      });

      column.appendChild(header);
      column.appendChild(list);
      daysColumn.appendChild(column);
    });
  }

  function renderOpenBin() {
    openBinList.innerHTML = "";
    const dayKey = "OPEN BIN";

    attachListDnD(openBinList);

    (itinerary[dayKey] || []).forEach((item, index) => {
      const card = buildCard(dayKey, index, item);
      openBinList.appendChild(card);
    });
  }

  function buildCard(dayKey, index, text) {
    const card = document.createElement("div");
    card.className = "itinerary-card";
    card.draggable = true;
    card.dataset.day = dayKey;
    card.dataset.index = String(index);

    const span = document.createElement("span");
    span.className = "card-text";
    span.textContent = text;

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "×";

    del.addEventListener("click", (e) => {
      e.stopPropagation();
      itinerary[dayKey].splice(index, 1);
      renderAll();
    });

    card.addEventListener("dragstart", (e) => {
      dragSource = { day: dayKey, index };
      card.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
      }
    });

    card.addEventListener("dragend", () => {
      dragSource = null;
      card.classList.remove("dragging");
      document.querySelectorAll(".itinerary-list.drag-over").forEach((el) => {
        el.classList.remove("drag-over");
      });
    });

    card.appendChild(span);
    card.appendChild(del);
    return card;
  }

  function attachListDnD(listEl) {
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
      if (!dragSource) return;

      const targetDay = listEl.dataset.day;
      const { day: sourceDay, index: sourceIndex } = dragSource;

      if (!itinerary[sourceDay] || !itinerary[targetDay]) return;

      const item = itinerary[sourceDay][sourceIndex];
      if (item === undefined) return;

      // Remove from source
      itinerary[sourceDay].splice(sourceIndex, 1);
      // Add to end of target
      itinerary[targetDay].push(item);

      dragSource = null;
      renderAll();
    });
  }

  // ------------------ LOCAL STORAGE ------------------

  function saveLocal() {
    localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
  }

  function resetToDefaults() {
    if (
      confirm(
        "Reset itinerary to defaults? This will erase your current customizations."
      )
    ) {
      itinerary = deepCopy(defaultDays);
      renderAll();
    }
  }

  // ------------------ GITHUB SYNC (manual) ------------------

  const GITHUB_CONFIG = {
    owner: "omatty123",
    repo: "paris2025",
    token: "",
    filePath: "data/itinerary.json",
    branch: "main"
  };

  function loadGithubConfig() {
    const saved = localStorage.getItem("itineraryGithubConfig");
    if (!saved) return;
    try {
      const cfg = JSON.parse(saved);
      Object.assign(GITHUB_CONFIG, cfg);
    } catch (e) {
      console.warn("Bad GitHub config in localStorage");
    }
  }

  function saveGithubConfig() {
    localStorage.setItem(
      "itineraryGithubConfig",
      JSON.stringify(GITHUB_CONFIG)
    );
  }

  function setStatus(msg, color = "#7a7267") {
    if (!githubStatus) return;
    githubStatus.textContent = msg;
    githubStatus.style.color = color;
  }

  function promptToken() {
    const token = prompt(
      "Enter GitHub Personal Access Token (with repo: write):",
      GITHUB_CONFIG.token || ""
    );
    if (token) {
      GITHUB_CONFIG.token = token.trim();
      saveGithubConfig();
      setStatus("GitHub token set.");
    }
  }

  async function saveToGitHub() {
    if (!GITHUB_CONFIG.token) {
      promptToken();
      if (!GITHUB_CONFIG.token) return;
    }

    const { owner, repo, token, filePath, branch } = GITHUB_CONFIG;

    const content = JSON.stringify(itinerary, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    setStatus("Saving to GitHub...", "#555");

    let sha = null;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) {
      console.log("No existing file on GitHub, will create new.");
    }

    const payload = {
      message: `Update itinerary - ${new Date().toISOString()}`,
      content: encodedContent,
      branch
    };
    if (sha) payload.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (res.ok) {
      setStatus("Saved to GitHub.", "#208838");
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus(
        "GitHub save failed: " + (err.message || res.statusText),
        "#b03030"
      );
    }
  }

  async function loadFromGitHub() {
    if (!GITHUB_CONFIG.token) {
      promptToken();
      if (!GITHUB_CONFIG.token) return;
    }

    const { owner, repo, token, filePath, branch } = GITHUB_CONFIG;

    setStatus("Loading from GitHub...", "#555");

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(
        "GitHub load failed: " + (err.message || res.statusText),
        "#b03030"
      );
      return;
    }

    const data = await res.json();
    const decoded = decodeURIComponent(escape(atob(data.content)));
    try {
      const parsed = JSON.parse(decoded);
      itinerary = parsed;
      renderAll();
      setStatus("Loaded from GitHub.", "#208838");
    } catch (e) {
      setStatus("GitHub data is not valid JSON.", "#b03030");
    }
  }

  // ------------------ WIRE UP EVENTS ------------------

  loadGithubConfig();
  renderAll();

  if (resetBtn) {
    resetBtn.addEventListener("click", resetToDefaults);
  }

  if (openBinAdd && openBinInput) {
    openBinAdd.addEventListener("click", () => {
      if (openBinInput.value.trim()) {
        (itinerary["OPEN BIN"] = itinerary["OPEN BIN"] || []).push(
          openBinInput.value.trim()
        );
        openBinInput.value = "";
        renderAll();
      }
    });
    openBinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && openBinInput.value.trim()) {
        (itinerary["OPEN BIN"] = itinerary["OPEN BIN"] || []).push(
          openBinInput.value.trim()
        );
        openBinInput.value = "";
        renderAll();
      }
    });
  }

  if (githubTokenBtn) {
    githubTokenBtn.addEventListener("click", promptToken);
  }
  if (githubSaveBtn) {
    githubSaveBtn.addEventListener("click", saveToGitHub);
  }
  if (githubLoadBtn) {
    githubLoadBtn.addEventListener("click", loadFromGitHub);
  }
})();
