// itinerary.js — fully standalone

console.log("Itinerary JS loaded.");

const board = document.getElementById("itinerary-board");

// Default day structure
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

let itinerary = JSON.parse(localStorage.getItem("itinerary-v1")) || defaultDays;

// Render board
function renderBoard() {
  board.innerHTML = "";

  Object.keys(itinerary).forEach(day => {
    const column = document.createElement("div");
    column.className = "itinerary-column";

    const title = document.createElement("h3");
    title.textContent = day;

    const list = document.createElement("div");
    list.className = "itinerary-list";

    itinerary[day].forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "itinerary-card";
      card.textContent = item;

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.textContent = "×";
      del.onclick = () => {
        itinerary[day].splice(idx, 1);
        save();
        renderBoard();
      };

      card.appendChild(del);
      list.appendChild(card);
    });

    column.appendChild(title);
    column.appendChild(list);

    board.appendChild(column);
  });
}

function save() {
  localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
}

renderBoard();
