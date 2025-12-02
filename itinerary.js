// itinerary.js
// Drag and drop itinerary with OPEN BIN on the right, days on the left.
// Local only (saved in this browser via localStorage).

(function () {
  console.log("Itinerary module loaded.");

  const STORAGE_KEY = "paris2025-itinerary-v1";

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");
  const openBinAdd = document.getElementById("openBinAdd");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers not found.");
    return;
  }

  // Default structure, times removed
  const defaultItinerary = {
    "OPEN BIN": [
      "Arrive CDG (Dec 2)",
      "RER B → Denfert Rochereau → Metro 6",
      "Arrive apartment (Dec 2)",
      "Explore Chinatown",
      "Lunch near Tang Frères",
      "Metro to Bastille",
      "Walk the Coulée Verte",
      "Drink at Le Train Bleu",
      "Dinner at Afrik N Fusion",
      "Walk home"
    ],
    "Dec 3": [
      "Sainte Chapelle",
      "Conciergerie",
      "Notre Dame exterior",
      "Pont Neuf and Pont des Arts",
      "Jardin du Luxembourg",
      "Huitrerie Régis",
      "Musée d Orsay",
      "Chez Gladines"
    ],
    "Dec 4": [
      "Louvre nineteenth century rooms",
      "Tuileries Garden",
      "Chez Alain Miam Miam",
      "Walk toward Passy",
      "Maison de Balzac",
      "Walk to Trocadéro",
      "Le Temps des Cerises"
    ],
    "Dec 5": [
      "Metro to Opéra then walk to Gare Saint Lazare",
      "Train to Rouen",
      "Taxi to Cathedral",
      "Gros Horloge",
      "Vegan and Cie",
      "Musée Flaubert",
      "Cimetière Monumental",
      "Croisset",
      "Train back",
      "Brasserie Le Lazare"
    ],
    "Dec 6": [
      "Belleville",
      "Promenade Dora Bruder",
      "Montmartre",
      "Sacré Coeur",
      "Père Lachaise",
      "Pain Vin Fromages"
    ],
    "Dec 7": [
      "Parc Montsouris",
      "Covered passages",
      "Tuileries Christmas Market",
      "Galeries Lafayette",
      "Carrefour Italie 2",
      "Darkoum Cantine Marocaine"
    ]
  };

  let itinerary = loadFromStorage() || clone(defaultItinerary);

  let draggedItem = null;
  let draggedFromDay = null;
  let draggedFromIndex = null;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Failed to load itinerary from storage:", e);
      return null;
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
      console.log("Itinerary saved.");
    } catch (e) {
      console.warn("Failed to save itinerary:", e);
    }
  }

  // Build day column
  function buildDayColumn(dayName, items) {
    const wrapper = document.createElement("div");
    wrapper.className = "day-column";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h3");
    title.textContent = dayName;
    header.appendChild(title);

    wrapper.appendChild(header);

    const list = document.createElement("div");
    list.className = "itinerary-list";
    list.dataset.day = dayName;

    list.addEventListener("dragover", handleDragOver);
    list.addEventListener("drop", handleDrop);
    list.addEventListener("dragleave", handleDragLeave);

    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.draggable = true;
      card.dataset.day = dayName;
      card.dataset.index = String(index);

      const text = document.createElement("span");
      text.className = "card-text";
      text.textContent = item;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "×";

      del.addEventListener("click", (e) => {
        e.stopPropagation();
        itinerary[dayName].splice(index, 1);
        saveToStorage();
        render();
      });

      card.addEventListener("dragstart", (e) => {
        draggedItem = item;
        draggedFromDay = dayName;
        draggedFromIndex = index;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".itinerary-list.drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });

      card.appendChild(text);
      card.appendChild(del);
      list.appendChild(card);
    });

    wrapper.appendChild(list);
    return wrapper;
  }

  function render() {
    daysColumn.innerHTML = "";
    openBinList.innerHTML = "";

    const allKeys = Object.keys(itinerary);
    const openKey = "OPEN BIN";

    const dayKeys = allKeys
      .filter((k) => k !== openKey)
      .sort((a, b) => {
        const da = parseInt(a.replace(/[^0-9]/g, ""), 10) || 0;
        const db = parseInt(b.replace(/[^0-9]/g, ""), 10) || 0;
        return da - db;
      });

    // Left: days
    dayKeys.forEach((dayName) => {
      const col = buildDayColumn(dayName, itinerary[dayName]);
      daysColumn.appendChild(col);
    });

    // Right: OPEN BIN contents into existing openBinList
    const binItems = itinerary[openKey] || [];
    binItems.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.draggable = true;
      card.dataset.day = openKey;
      card.dataset.index = String(index);

      const text = document.createElement("span");
      text.className = "card-text";
      text.textContent = item;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        itinerary[openKey].splice(index, 1);
        saveToStorage();
        render();
      });

      card.addEventListener("dragstart", (e) => {
        draggedItem = item;
        draggedFromDay = openKey;
        draggedFromIndex = index;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document
          .querySelectorAll(".itinerary-list.drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });

      card.appendChild(text);
      card.appendChild(del);
      openBinList.appendChild(card);
    });

    // Make openBinList a drop target too
    openBinList.addEventListener("dragover", handleDragOver);
    openBinList.addEventListener("drop", handleDrop);
    openBinList.addEventListener("dragleave", handleDragLeave);
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

  function handleDrop(e) {
    e.preventDefault();
    const list = e.currentTarget;
    list.classList.remove("drag-over");

    if (!draggedItem || draggedFromDay == null) return;

    const targetDay = list.dataset.day;
    if (!targetDay) return;

    // Remove from source
    const fromArray = itinerary[draggedFromDay];
    if (!fromArray) return;
    const idx = fromArray.indexOf(draggedItem);
    if (idx > -1) {
      fromArray.splice(idx, 1);
    }

    // Add to target
    const targetArray = itinerary[targetDay] || (itinerary[targetDay] = []);
    targetArray.push(draggedItem);

    draggedItem = null;
    draggedFromDay = null;
    draggedFromIndex = null;

    saveToStorage();
    render();
  }

  // Open bin add item
  if (openBinAdd && openBinInput) {
    openBinAdd.addEventListener("click", () => {
      const value = openBinInput.value.trim();
      if (!value) return;
      if (!itinerary["OPEN BIN"]) itinerary["OPEN BIN"] = [];
      itinerary["OPEN BIN"].push(value);
      openBinInput.value = "";
      saveToStorage();
      render();
    });

    openBinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        openBinAdd.click();
      }
    });
  }

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (
        confirm(
          "Reset itinerary to defaults? This will erase your current changes in this browser."
        )
      ) {
        itinerary = clone(defaultItinerary);
        saveToStorage();
        render();
      }
    });
  }

  // Export button
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const dataStr = JSON.stringify(itinerary, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", "paris-itinerary.json");
      link.click();
    });
  }

  // Initial render
  render();
})();
