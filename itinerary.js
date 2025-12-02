// itinerary.js
// Simple drag-and-drop itinerary with Open Bin (Day 1) and Dec 3–9.

(function () {
  const STORAGE_KEY = "paris-itinerary-v1";

  const daysColumn = document.getElementById("daysColumn");
  const openBinList = document.getElementById("openBinList");
  const openBinInput = document.getElementById("openBinInput");
  const openBinAdd = document.getElementById("openBinAdd");
  const resetBtn = document.getElementById("resetBtn");

  if (!daysColumn || !openBinList) {
    console.warn("Itinerary containers missing.");
    return;
  }

  // Default data

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

  let data = load() || structuredClone(defaultData);

  let dragged = null; // { day, index }

  function structuredClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Basic sanity check
      if (!parsed["OPEN BIN"]) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Rendering

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
        save();
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
      save();
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
      const { day: fromDay, index: fromIndex, text } = dragged;

      if (!targetDay) return;

      // Remove from source
      data[fromDay].splice(fromIndex, 1);
      // Add to end of target
      data[targetDay].push(text);

      save();
      render();
    });
  }

  // Open bin input

  if (openBinAdd && openBinInput) {
    function addToOpenBin() {
      const val = openBinInput.value.trim();
      if (!val) return;
      data["OPEN BIN"].push(val);
      openBinInput.value = "";
      save();
      render();
    }

    openBinAdd.addEventListener("click", addToOpenBin);
    openBinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") addToOpenBin();
    });
  }

  // Reset button

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (
        confirm(
          "Reset itinerary to the original plan (Day 1 in Open Bin, Dec 3–9 default)?"
        )
      ) {
        data = structuredClone(defaultData);
        save();
        render();
      }
    });
  }

  // Initial render
  render();
})();
