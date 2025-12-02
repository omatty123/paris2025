// itinerary.js
// Days stacked on the left, Open Bin on the right, drag and drop.
// Local storage plus optional GitHub sync.

(function () {
  console.log("Itinerary module loaded.");

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const resetBtn = document.getElementById("resetBtn");
  const githubTokenBtn = document.getElementById("githubToken");
  const githubSaveBtn = document.getElementById("githubSave");
  const githubLoadBtn = document.getElementById("githubLoad");
  const githubStatus = document.getElementById("githubStatus");
  const openBinInput = document.getElementById("openBinInput");
  const openBinAdd = document.getElementById("openBinAdd");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers not found in DOM.");
  }

  // Default structure with full day labels
  const defaultData = {
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
    "Wednesday 03 December": [
      "Sainte Chapelle",
      "Conciergerie",
      "Notre Dame exterior",
      "Pont Neuf and Pont des Arts",
      "Jardin du Luxembourg",
      "Huitrerie Regis",
      "Musee d'Orsay",
      "Chez Gladines"
    ],
    "Thursday 04 December": [
      "Louvre (nineteenth century rooms)",
      "Tuileries Garden",
      "Chez Alain Miam Miam",
      "Walk toward Passy",
      "Maison de Balzac",
      "Walk to Trocadero",
      "Le Temps des Cerises"
    ],
    "Friday 05 December": [
      "Metro to Opera then walk to Gare Saint Lazare",
      "Train to Rouen",
      "Taxi to Cathedral",
      "Gros Horloge",
      "Vegan and Cie",
      "Musee Flaubert",
      "Cimetière Monumental",
      "Croisset",
      "Train back",
      "Dinner at Brasserie Le Lazare"
    ],
    "Saturday 06 December": [
      "Belleville",
      "Promenade Dora Bruder",
      "Montmartre",
      "Sacre Coeur",
      "Pere Lachaise",
      "Pain Vin Fromages"
    ],
    "Sunday 07 December": [
      "Parc Montsouris",
      "Covered passages",
      "Tuileries Christmas Market",
      "Galeries Lafayette",
      "Carrefour Italie 2",
      "Darkoum Cantine Marocaine"
    ],
    "Monday 08 December": [],
    "Tuesday 09 December": []
  };

  // Order for rendering days
  const orderedDays = [
    "Wednesday 03 December",
    "Thursday 04 December",
    "Friday 05 December",
    "Saturday 06 December",
    "Sunday 07 December",
    "Monday 08 December",
    "Tuesday 09 December"
  ];

  let itinerary =
    JSON.parse(localStorage.getItem("itinerary-v2")) ||
    JSON.parse(JSON.stringify(defaultData));

  let draggedItem = null;
  let draggedSourceDay = null;

  /* Rendering */

  function buildDayColumn(dayName) {
    const column = document.createElement("div");
    column.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h3");
    title.className = "day-date-label";
    title.textContent = dayName;

    const addContainer = document.createElement("div");
    addContainer.className = "add-item-container";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "add-item-input";
    input.placeholder = "Add event…";

    const addBtn = document.createElement("button");
    addBtn.className = "add-item-btn";
    addBtn.textContent = "+";

    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && input.value.trim()) {
        itinerary[dayName].push(input.value.trim());
        input.value = "";
        saveItinerary();
        renderAll();
      }
    });

    addBtn.addEventListener("click", function () {
      if (input.value.trim()) {
        itinerary[dayName].push(input.value.trim());
        input.value = "";
        saveItinerary();
        renderAll();
      }
    });

    addContainer.appendChild(input);
    addContainer.appendChild(addBtn);

    header.appendChild(title);
    header.appendChild(addContainer);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.day = dayName;

    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("dragleave", handleDragLeave);
    list.addEventListener("drop", function (e) {
      handleDrop(e, dayName);
    });

    const items = itinerary[dayName] || [];
    items.forEach(function (item, index) {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.draggable = true;
      card.dataset.day = dayName;
      card.dataset.index = String(index);

      const textSpan = document.createElement("span");
      textSpan.className = "card-text";
      textSpan.textContent = item;

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        itinerary[dayName].splice(index, 1);
        saveItinerary();
        renderAll();
      });

      card.addEventListener("dragstart", function (e) {
        draggedItem = item;
        draggedSourceDay = dayName;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", function () {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".itinerary-list.drag-over")
          .forEach(function (el) {
            el.classList.remove("drag-over");
          });
      });

      card.appendChild(textSpan);
      card.appendChild(delBtn);
      list.appendChild(card);
    });

    column.appendChild(header);
    column.appendChild(list);
    return column;
  }

  function renderDays() {
    if (!daysColumn) return;
    daysColumn.innerHTML = "";

    orderedDays.forEach(function (dayName) {
      if (!itinerary[dayName]) {
        itinerary[dayName] = [];
      }
      const col = buildDayColumn(dayName);
      daysColumn.appendChild(col);
    });
  }

  function renderOpenBin() {
    if (!openBinList) return;

    const binItems = itinerary["OPEN BIN"] || [];
    openBinList.innerHTML = "";

    openBinList.addEventListener("dragover", handleDragOver);
    openBinList.addEventListener("dragleave", handleDragLeave);
    openBinList.addEventListener("drop", function (e) {
      handleDrop(e, "OPEN BIN");
    });

    binItems.forEach(function (item, index) {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.draggable = true;
      card.dataset.day = "OPEN BIN";
      card.dataset.index = String(index);

      const textSpan = document.createElement("span");
      textSpan.className = "card-text";
      textSpan.textContent = item;

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        itinerary["OPEN BIN"].splice(index, 1);
        saveItinerary();
        renderAll();
      });

      card.addEventListener("dragstart", function (e) {
        draggedItem = item;
        draggedSourceDay = "OPEN BIN";
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", function () {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".itinerary-list.drag-over")
          .forEach(function (el) {
            el.classList.remove("drag-over");
          });
      });

      card.appendChild(textSpan);
      card.appendChild(delBtn);
      openBinList.appendChild(card);
    });
  }

  function renderAll() {
    renderDays();
    renderOpenBin();
  }

  /* Drag and drop handlers */

  function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  }

  function handleDragLeave(e) {
    if (e.currentTarget === e.target) {
      e.currentTarget.classList.remove("drag-over");
    }
  }

  function handleDrop(e, targetDay) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedItem || !draggedSourceDay) return;

    const srcList = itinerary[draggedSourceDay] || [];
    const index = srcList.indexOf(draggedItem);
    if (index > -1) {
      srcList.splice(index, 1);
    }

    if (!itinerary[targetDay]) {
      itinerary[targetDay] = [];
    }
    itinerary[targetDay].push(draggedItem);

    draggedItem = null;
    draggedSourceDay = null;

    saveItinerary();
    renderAll();
  }

  /* Persistence */

  function saveItinerary() {
    localStorage.setItem("itinerary-v2", JSON.stringify(itinerary));
    console.log("Itinerary saved locally.");
  }

  function resetToDefaults() {
    if (confirm("Reset itinerary to defaults? This will erase your changes.")) {
      itinerary = JSON.parse(JSON.stringify(defaultData));
      saveItinerary();
      renderAll();
    }
  }

  /* GitHub sync (simple version) */

  const GITHUB_CONFIG = {
    owner: "omatty123",
    repo: "paris2025",
    path: "data/itinerary.json",
    branch: "main"
  };

  function getGitHubToken() {
    return localStorage.getItem("github-token") || "";
  }

  function setGitHubToken(token) {
    if (token) {
      localStorage.setItem("github-token", token);
    }
  }

  async function saveToGitHub() {
    const token = getGitHubToken();
    if (!token) {
      alert("No GitHub token set yet.");
      return;
    }

    if (githubStatus) {
      githubStatus.textContent = "Saving to GitHub…";
      githubStatus.style.color = "#7a7267";
    }

    const content = JSON.stringify(itinerary, null, 2);
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    let sha = null;
    try {
      const getRes = await fetch(
        "https://api.github.com/repos/" +
          GITHUB_CONFIG.owner +
          "/" +
          GITHUB_CONFIG.repo +
          "/contents/" +
          GITHUB_CONFIG.path +
          "?ref=" +
          GITHUB_CONFIG.branch,
        {
          headers: {
            Authorization: "token " + token,
            Accept: "application/vnd.github.v3+json"
          }
        }
      );

      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch (e) {
      console.log("File may not exist yet; creating fresh.");
    }

    const payload = {
      message: "Update itinerary " + new Date().toISOString(),
      content: encodedContent,
      branch: GITHUB_CONFIG.branch
    };
    if (sha) payload.sha = sha;

    const putRes = await fetch(
      "https://api.github.com/repos/" +
        GITHUB_CONFIG.owner +
        "/" +
        GITHUB_CONFIG.repo +
        "/contents/" +
        GITHUB_CONFIG.path,
      {
        method: "PUT",
        headers: {
          Authorization: "token " + token,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (putRes.ok) {
      console.log("Saved itinerary to GitHub.");
      if (githubStatus) {
        githubStatus.textContent = "Saved to GitHub.";
        githubStatus.style.color = "#22863a";
      }
    } else {
      const err = await putRes.json();
      console.error(err);
      if (githubStatus) {
        githubStatus.textContent = "GitHub save failed.";
        githubStatus.style.color = "#b31d28";
      }
      alert("GitHub save failed: " + (err.message || putRes.status));
    }
  }

  async function loadFromGitHub() {
    const token = getGitHubToken();
    if (!token) {
      alert("No GitHub token set yet.");
      return;
    }

    if (githubStatus) {
      githubStatus.textContent = "Loading from GitHub…";
      githubStatus.style.color = "#7a7267";
    }

    const res = await fetch(
      "https://api.github.com/repos/" +
        GITHUB_CONFIG.owner +
        "/" +
        GITHUB_CONFIG.repo +
        "/contents/" +
        GITHUB_CONFIG.path +
        "?ref=" +
        GITHUB_CONFIG.branch,
      {
        headers: {
          Authorization: "token " + token,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(err);
      if (githubStatus) {
        githubStatus.textContent = "GitHub load failed.";
        githubStatus.style.color = "#b31d28";
      }
      alert("GitHub load failed: " + (err.message || res.status));
      return;
    }

    const data = await res.json();
    const decoded = decodeURIComponent(escape(atob(data.content)));
    itinerary = JSON.parse(decoded);
    localStorage.setItem("itinerary-v2", JSON.stringify(itinerary));
    renderAll();

    if (githubStatus) {
      githubStatus.textContent = "Loaded from GitHub.";
      githubStatus.style.color = "#22863a";
    }
  }

  /* Wire up controls */

  if (resetBtn) {
    resetBtn.addEventListener("click", resetToDefaults);
  }

  if (githubTokenBtn) {
    githubTokenBtn.addEventListener("click", function () {
      const current = getGitHubToken();
      const token = prompt("Enter GitHub personal access token (repo scope):", current);
      if (token !== null) {
        setGitHubToken(token.trim());
        alert("GitHub token saved locally.");
      }
    });
  }

  if (githubSaveBtn) {
    githubSaveBtn.addEventListener("click", function () {
      saveToGitHub().catch(function (e) {
        console.error(e);
      });
    });
  }

  if (githubLoadBtn) {
    githubLoadBtn.addEventListener("click", function () {
      loadFromGitHub().catch(function (e) {
        console.error(e);
      });
    });
  }

  if (openBinAdd && openBinInput) {
    openBinAdd.addEventListener("click", function () {
      const val = openBinInput.value.trim();
      if (!val) return;
      itinerary["OPEN BIN"].push(val);
      openBinInput.value = "";
      saveItinerary();
      renderOpenBin();
    });

    openBinInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const val = openBinInput.value.trim();
        if (!val) return;
        itinerary["OPEN BIN"].push(val);
        openBinInput.value = "";
        saveItinerary();
        renderOpenBin();
      }
    });
  }

  // Initial render
  renderAll();

  // Simple heartbeat
  setInterval(function () {
    console.log("Itinerary data persisted.");
  }, 60000);

  // Expose minimal API if needed in console
  window.itineraryApp = {
    resetToDefaults,
    saveToGitHub,
    loadFromGitHub,
    getData: function () {
      return itinerary;
    }
  };
})();
