// itinerary.js
// Enhanced itinerary with Open Bin on the right and days stacked on the left.

(function () {
  console.log("Itinerary module loaded.");

  const daysContainer = document.getElementById("itinerary-days");
  const openBinContainer = document.getElementById("itinerary-open-bin");

  if (!daysContainer || !openBinContainer) {
    console.warn("Itinerary containers not found in DOM.");
  }

  // Default structure
  const defaultDays = {
    "OPEN BIN": [
      "Arrive CDG (Dec 2)",
      "RER B → Denfert Rochereau → Metro 6",
      "Arrive apartment (Dec 2)",
      "Explore Chinatown",
      "Lunch near Tang Freres",
      "Metro to Bastille",
      "Walk the Coulee Verte",
      "Drink at Le Train Bleu",
      "Dinner at Afrik'N'Fusion",
      "Walk home"
    ],
    "Dec 3": [
      "Sainte Chapelle",
      "Conciergerie",
      "Notre Dame exterior",
      "Pont Neuf & Pont des Arts",
      "Jardin du Luxembourg",
      "Huitrerie Regis",
      "Musee d'Orsay",
      "Chez Gladines"
    ],
    "Dec 4": [
      "Louvre (19th c rooms)",
      "Tuileries Garden",
      "Chez Alain Miam Miam",
      "Walk toward Passy",
      "Maison de Balzac",
      "Walk to Trocadero",
      "Le Temps des Cerises"
    ],
    "Dec 5": [
      "Metro → Opera → Saint Lazare",
      "Train to Rouen",
      "Taxi to Cathedral",
      "Gros Horloge",
      "Vegan & Cie",
      "Musee Flaubert",
      "Cimetière Monumental",
      "Croisset",
      "Train back",
      "Brasserie Le Lazare"
    ]
  };

  let itinerary =
    JSON.parse(localStorage.getItem("itinerary-v1")) ||
    JSON.parse(JSON.stringify(defaultDays));

  let draggedItem = null;
  let sourceDay = null;

  // Render a single column (day or OPEN BIN)
  function buildColumn(day) {
    const column = document.createElement("div");
    column.className = "itinerary-column";
    column.dataset.day = day;

    const header = document.createElement("div");
    header.className = "column-header";

    const title = document.createElement("h3");
    title.textContent = day;
    header.appendChild(title);

    // Add input for new items
    const addContainer = document.createElement("div");
    addContainer.className = "add-item-container";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add event...";
    input.className = "add-item-input";

    input.onkeypress = (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        itinerary[day].push(input.value.trim());
        input.value = "";
        save();
        renderBoard();
      }
    };

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.className = "add-item-btn";
    addBtn.onclick = () => {
      if (input.value.trim()) {
        itinerary[day].push(input.value.trim());
        input.value = "";
        save();
        renderBoard();
      }
    };

    addContainer.appendChild(input);
    addContainer.appendChild(addBtn);
    header.appendChild(addContainer);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.day = day;

    // Make list a drop target
    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", (e) =>
      handleDrop(e, day, itinerary[day].length)
    );
    list.addEventListener("dragleave", handleDragLeave);

    itinerary[day].forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.draggable = true;
      card.dataset.day = day;
      card.dataset.index = idx;

      const text = document.createElement("span");
      text.textContent = item;
      text.className = "card-text";

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "×";
      del.onclick = (e) => {
        e.stopPropagation();
        itinerary[day].splice(idx, 1);
        save();
        renderBoard();
      };

      // Drag events
      card.addEventListener("dragstart", (e) => {
        draggedItem = item;
        sourceDay = day;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".drag-over").forEach((el) => {
          el.classList.remove("drag-over");
        });
      });

      card.appendChild(text);
      card.appendChild(del);
      list.appendChild(card);
    });

    column.appendChild(header);
    column.appendChild(list);
    return column;
  }

  // Render board: days left, OPEN BIN right
  function renderBoard() {
    if (!daysContainer || !openBinContainer) return;

    daysContainer.innerHTML = "";
    openBinContainer.innerHTML = "";

    const allKeys = Object.keys(itinerary);
    const openBinKey = "OPEN BIN";

    const dayKeys = allKeys
      .filter((k) => k !== openBinKey)
      .sort((a, b) => {
        // Try to keep chronological order for labels like "Dec 3"
        const da = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
        const db = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
        return da - db;
      });

    // Render regular days stacked
    dayKeys.forEach((day) => {
      const column = buildColumn(day);
      daysContainer.appendChild(column);
    });

    // Render Open Bin on the right
    if (itinerary[openBinKey]) {
      const binColumn = buildColumn(openBinKey);
      openBinContainer.appendChild(binColumn);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(e) {
    if (e.currentTarget === e.target) {
      e.currentTarget.classList.remove("drag-over");
    }
  }

  function handleDrop(e, targetDay, targetIndex) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedItem || !sourceDay) return;

    const sourceIndex = itinerary[sourceDay].indexOf(draggedItem);
    if (sourceIndex > -1) {
      itinerary[sourceDay].splice(sourceIndex, 1);
    }

    itinerary[targetDay].splice(targetIndex, 0, draggedItem);

    draggedItem = null;
    sourceDay = null;
    save();
    renderBoard();
  }

  // Persist locally and optionally to GitHub
  function save() {
    localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
    console.log("Itinerary saved to localStorage.");

    if (GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo) {
      clearTimeout(window.githubSaveTimeout);
      window.githubSaveTimeout = setTimeout(() => {
        saveToGitHub();
      }, 5000);
    }
  }

  // Add new day
  function addNewDay() {
    const dayName = prompt(
      "Enter day name (for example, 'Dec 6' or 'Backup ideas'):"
    );
    if (dayName && dayName.trim()) {
      const name = dayName.trim();
      if (itinerary[name]) {
        alert("A day with this name already exists.");
        return;
      }
      itinerary[name] = [];
      save();
      renderBoard();
    }
  }

  // GitHub configuration
  const GITHUB_CONFIG = {
    owner: "",
    repo: "",
    token: "",
    filePath: "data/itinerary.json",
    branch: "main"
  };

  function loadGitHubConfig() {
    const saved = localStorage.getItem("github-config");
    if (saved) {
      const config = JSON.parse(saved);
      GITHUB_CONFIG.owner = config.owner;
      GITHUB_CONFIG.repo = config.repo;
      GITHUB_CONFIG.token = config.token;
      GITHUB_CONFIG.filePath = config.filePath || "data/itinerary.json";
      GITHUB_CONFIG.branch = config.branch || "main";
    }
  }

  function setupGitHub() {
    const owner = prompt(
      "GitHub username:",
      GITHUB_CONFIG.owner || "omatty123"
    );
    const repo = prompt(
      "Repository name:",
      GITHUB_CONFIG.repo || "paris2025"
    );
    const token = prompt(
      "Personal access token (repo scope):",
      GITHUB_CONFIG.token || ""
    );
    const filePath = prompt(
      "File path to save (for example, data/itinerary.json):",
      GITHUB_CONFIG.filePath || "data/itinerary.json"
    );
    const branch = prompt(
      "Branch (main or gh-pages):",
      GITHUB_CONFIG.branch || "main"
    );

    if (owner && repo && token) {
      GITHUB_CONFIG.owner = owner;
      GITHUB_CONFIG.repo = repo;
      GITHUB_CONFIG.token = token;
      GITHUB_CONFIG.filePath = filePath;
      GITHUB_CONFIG.branch = branch;

      localStorage.setItem("github-config", JSON.stringify(GITHUB_CONFIG));
      alert("GitHub integration configured.");
      return true;
    }
    return false;
  }

  async function saveToGitHub() {
    if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
      if (!setupGitHub()) return;
    }

    try {
      const statusEl = document.getElementById("github-status");
      if (statusEl) {
        statusEl.textContent = "Saving to GitHub...";
        statusEl.style.color = "#555";
      }

      const content = JSON.stringify(itinerary, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`,
          {
            headers: {
              Authorization: `token ${GITHUB_CONFIG.token}`,
              Accept: "application/vnd.github.v3+json"
            }
          }
        );

        if (getResponse.ok) {
          const data = await getResponse.json();
          sha = data.sha;
        }
      } catch (e) {
        console.log("File does not exist yet, will create a new one.");
      }

      const payload = {
        message: `Update itinerary - ${new Date().toISOString()}`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      };
      if (sha) payload.sha = sha;

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${GITHUB_CONFIG.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (response.ok) {
        console.log("Saved to GitHub successfully.");
        if (statusEl) {
          statusEl.textContent = "Saved to GitHub.";
          statusEl.style.color = "#28a745";
          setTimeout(() => {
            statusEl.textContent = "";
          }, 3000);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save to GitHub.");
      }
    } catch (error) {
      console.error("GitHub save error:", error);
      alert(
        `Failed to save to GitHub: ${error.message}\nCheck token permissions and repo settings.`
      );
    }
  }

  async function loadFromGitHub() {
    if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
      alert("GitHub not configured yet. Use GitHub setup first.");
      if (!setupGitHub()) return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`,
        {
          headers: {
            Authorization: `token ${GITHUB_CONFIG.token}`,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        itinerary = JSON.parse(content);
        localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
        renderBoard();
        alert("Loaded itinerary from GitHub.");
      } else {
        console.log("No itinerary file found on GitHub.");
        alert("No itinerary file found on GitHub at that path.");
      }
    } catch (error) {
      console.error("GitHub load error:", error);
      alert(`Failed to load from GitHub: ${error.message}`);
    }
  }

  function exportItinerary() {
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "paris-itinerary.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    console.log("Itinerary exported.");
  }

  function resetToDefaults() {
    if (
      confirm(
        "Reset itinerary to defaults? This will erase your current customizations."
      )
    ) {
      itinerary = JSON.parse(JSON.stringify(defaultDays));
      save();
      renderBoard();
      console.log("Itinerary reset to defaults.");
    }
  }

  // Expose controls
  window.itineraryApp = {
    addNewDay,
    exportItinerary,
    resetToDefaults,
    save,
    saveToGitHub,
    loadFromGitHub,
    setupGitHub,
    getData: () => itinerary,
    setData: (data) => {
      itinerary = data;
      save();
      renderBoard();
    }
  };

  // Startup
  loadGitHubConfig();
  renderBoard();

  if (GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo) {
    loadFromGitHub().catch((err) => {
      console.log("Using local itinerary data:", err.message);
    });
  }

  setInterval(() => {
    console.log("Itinerary data persisted.");
  }, 60000);
})();
