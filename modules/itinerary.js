// =============================
//      ITINERARY BOARD LOGIC
// =============================

const STORAGE_KEY = "paris_itinerary_board_v1";

const boardEl = document.getElementById("itinerary-board");
const addDayBtn = document.getElementById("add-day-btn");
const resetBtn = document.getElementById("reset-itinerary-btn");

// Helper
function card(text) {
  return { id: "c" + Math.random().toString(36).slice(2), text };
}

function col(label, iso, cards) {
  return { id: "col" + Math.random().toString(36).slice(2), label, iso, cards };
}

function iso(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function nextISO(isoStr) {
  const [y, m, d] = isoStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

// Initial state
function initialState() {
  return {
    cols: [
      col("OPEN BIN", "0000-00-00", [
        card("Arrive CDG (Dec 2)"),
        card("RER B → Denfert Rochereau → Metro 6"),
        card("Arrive apartment (Dec 2)"),
        card("Explore Chinatown"),
        card("Lunch near Tang Freres"),
        card("Metro to Bastille"),
        card("Walk the Coulee Verte"),
        card("Drink at Le Train Bleu"),
        card("Dinner at Afrik N Fusion"),
        card("Walk home")
      ]),

      col("Dec 3", "2025-12-03", [
        card("Sainte Chapelle"),
        card("Conciergerie"),
        card("Notre Dame exterior"),
        card("Pont Neuf & Pont des Arts"),
        card("Jardin du Luxembourg"),
        card("Huitrerie Regis"),
        card("Musee d'Orsay"),
        card("Chez Gladines")
      ]),

      col("Dec 4", "2025-12-04", [
        card("Louvre (19th c rooms)"),
        card("Tuileries Garden"),
        card("Chez Alain Miam Miam"),
        card("Walk toward Passy"),
        card("Maison de Balzac"),
        card("Walk to Trocadero"),
        card("Le Temps des Cerises")
      ]),

      col("Dec 5", "2025-12-05", [
        card("Metro → Opera → Saint Lazare"),
        card("Train to Rouen"),
        card("Taxi to Cathedral"),
        card("Gros Horloge"),
        card("Vegan & Cie"),
        card("Musee Flaubert"),
        card("Cimetiere Monumental"),
        card("Croisset"),
        card("Train back"),
        card("Dinner at Brasserie Le Lazare")
      ]),

      col("Dec 6", "2025-12-06", [
        card("Belleville"),
        card("Promenade Dora Bruder"),
        card("Montmartre"),
        card("Sacre Coeur"),
        card("Pere Lachaise"),
        card("Pain Vin Fromages")
      ]),

      col("Dec 7", "2025-12-07", [
        card("Parc Montsouris"),
        card("Covered passages"),
        card("Tuileries Christmas Market"),
        card("Galeries Lafayette"),
        card("Carrefour Italie 2"),
        card("Darkoum Cantine Marocaine")
      ]),

      col("Dec 8", "2025-12-08", []),
      col("Dec 9", "2025-12-09", []),

      col("LAST DAY", "9999-99-99", [
        card("Leave apartment"),
        card("Metro → RER B to CDG"),
        card("Arrive airport"),
        card("Flight departs 10:30")
      ])
    ]
  };
}

// Load/save
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : initialState();
}

function save(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

let state = load();

function render() {
  boardEl.innerHTML = "";

  state.cols.forEach(colObj => {
    const colDiv = document.createElement("div");
    colDiv.className = "itinerary-col";

    // header
    const h = document.createElement("div");
    h.className = "itinerary-col-header";
    h.innerHTML = `
      <span>${colObj.label}</span>
      <button class="add-item-btn" data-col="${colObj.id}">+</button>
    `;
    colDiv.appendChild(h);

    // card list
    const list = document.createElement("div");
    list.className = "itinerary-card-list";
    list.dataset.col = colObj.id;

    list.addEventListener("dragover", e => {
      e.preventDefault();
      list.classList.add("drag-over");
    });

    list.addEventListener("dragleave", () => list.classList.remove("drag-over"));

    list.addEventListener("drop", e => {
      list.classList.remove("drag-over");
      const cardId = e.dataTransfer.getData("text");
      moveCard(cardId, colObj.id);
    });

    // cards
    colObj.cards.forEach(cd => {
      const el = document.createElement("div");
      el.className = "itinerary-card";
      el.draggable = true;
      el.dataset.card = cd.id;
      el.innerHTML = `
        <span>${cd.text}</span>
        <button class="del-btn">x</button>
      `;

      el.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text", cd.id);
      });

      el.querySelector(".del-btn").onclick = () => {
        colObj.cards = colObj.cards.filter(x => x.id !== cd.id);
        save(state);
        render();
      };

      list.appendChild(el);
    });

    colDiv.appendChild(list);
    boardEl.appendChild(colDiv);
  });

  // item add buttons
  document.querySelectorAll(".add-item-btn").forEach(btn => {
    btn.onclick = () => {
      const colId = btn.dataset.col;
      const txt = prompt("New item:");
      if (!txt) return;
      const colObj = state.cols.find(c => c.id === colId);
      colObj.cards.push(card(txt));
      save(state);
      render();
    };
  });
}

// move card
function moveCard(cardId, targetColId) {
  let sourceCol = null;
  let cardObj = null;

  for (const c of state.cols) {
    const f = c.cards.find(x => x.id === cardId);
    if (f) {
      sourceCol = c;
      cardObj = f;
      break;
    }
  }

  if (!cardObj) return;

  sourceCol.cards = sourceCol.cards.filter(x => x.id !== cardId);
  const target = state.cols.find(c => c.id === targetColId);
  target.cards.push(cardObj);

  save(state);
  render();
}

// Add day
addDayBtn.onclick = () => {
  // find last actual date column
  const dateCols = state.cols.filter(c => c.iso !== "0000-00-00" && c.iso !== "9999-99-99");
  const last = dateCols.map(c => c.iso).sort().pop();
  const next = nextISO(last);

  // force month name to stay "Dec"
  const dayNum = Number(next.split("-")[2]);
  const label = "Dec " + dayNum;

  state.cols.push(col(label, next, []));
  save(state);
  render();
};

// Reset
resetBtn.onclick = () => {
  if (!confirm("Reset itinerary?")) return;
  state = initialState();
  save(state);
  render();
};

// Initial render
render();
