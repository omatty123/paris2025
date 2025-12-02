// itinerary.js — enhanced with drag & drop, modular version
(function() {
  console.log("Itinerary module loaded.");
  
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
  
  let itinerary = JSON.parse(localStorage.getItem("itinerary-v1")) || JSON.parse(JSON.stringify(defaultDays));
  let draggedItem = null;
  let sourceDay = null;
  
  // Render board
  function renderBoard() {
    if (!board) return;
    board.innerHTML = "";
    
    Object.keys(itinerary).forEach(day => {
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
      list.addEventListener("drop", (e) => handleDrop(e, day, itinerary[day].length));
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
        
        card.addEventListener("dragend", (e) => {
          card.classList.remove("dragging");
          document.querySelectorAll(".drag-over").forEach(el => {
            el.classList.remove("drag-over");
          });
        });
        
        card.appendChild(text);
        card.appendChild(del);
        list.appendChild(card);
      });
      
      column.appendChild(header);
      column.appendChild(list);
      board.appendChild(column);
    });
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
    
    // Remove from source
    const sourceIndex = itinerary[sourceDay].indexOf(draggedItem);
    if (sourceIndex > -1) {
      itinerary[sourceDay].splice(sourceIndex, 1);
    }
    
    // Add to target
    itinerary[targetDay].splice(targetIndex, 0, draggedItem);
    
    draggedItem = null;
    sourceDay = null;
    save();
    renderBoard();
  }
  
  function save() {
    localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
    console.log("✓ Itinerary saved to localStorage");
    
    // Auto-save to GitHub if configured
    if (GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo) {
      // Debounce GitHub saves to avoid too many commits
      clearTimeout(window.githubSaveTimeout);
      window.githubSaveTimeout = setTimeout(() => {
        saveToGitHub();
      }, 5000); // Wait 5 seconds after last change
    }
  }
  
  // Add new day column
  function addNewDay() {
    const dayName = prompt("Enter day name (e.g., 'Dec 6' or 'BACKUP IDEAS'):");
    if (dayName && dayName.trim()) {
      const name = dayName.trim();
      if (itinerary[name]) {
        alert("A day with this name already exists!");
        return;
      }
      itinerary[name] = [];
      save();
      renderBoard();
    }
  }
  
  // GitHub configuration
  const GITHUB_CONFIG = {
    owner: '', // Your GitHub username
    repo: '', // Your repository name
    token: '', // Your GitHub personal access token
    filePath: 'data/itinerary.json', // Where to save in your repo
    branch: 'main' // or 'gh-pages' depending on your setup
  };
  
  // Load GitHub config from localStorage or prompt user
  function loadGitHubConfig() {
    const saved = localStorage.getItem('github-config');
    if (saved) {
      const config = JSON.parse(saved);
      GITHUB_CONFIG.owner = config.owner;
      GITHUB_CONFIG.repo = config.repo;
      GITHUB_CONFIG.token = config.token;
      GITHUB_CONFIG.filePath = config.filePath || 'data/itinerary.json';
      GITHUB_CONFIG.branch = config.branch || 'main';
    }
  }
  
  // Setup GitHub integration
  function setupGitHub() {
    const owner = prompt("Enter your GitHub username:", GITHUB_CONFIG.owner);
    const repo = prompt("Enter your repository name:", GITHUB_CONFIG.repo);
    const token = prompt("Enter your GitHub personal access token (with repo permissions):", GITHUB_CONFIG.token);
    const filePath = prompt("Enter file path to save (e.g., data/itinerary.json):", GITHUB_CONFIG.filePath || 'data/itinerary.json');
    const branch = prompt("Enter branch name (e.g., main or gh-pages):", GITHUB_CONFIG.branch || 'main');
    
    if (owner && repo && token) {
      GITHUB_CONFIG.owner = owner;
      GITHUB_CONFIG.repo = repo;
      GITHUB_CONFIG.token = token;
      GITHUB_CONFIG.filePath = filePath;
      GITHUB_CONFIG.branch = branch;
      
      localStorage.setItem('github-config', JSON.stringify(GITHUB_CONFIG));
      alert("✓ GitHub integration configured!");
      return true;
    }
    return false;
  }
  
  // Save to GitHub
  async function saveToGitHub() {
    if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
      if (!setupGitHub()) {
        return;
      }
    }
    
    try {
      const statusEl = document.getElementById('github-status');
      if (statusEl) statusEl.textContent = "Saving to GitHub...";
      
      const content = JSON.stringify(itinerary, null, 2);
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      
      // Get current file SHA (if exists)
      let sha = null;
      try {
        const getResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`,
          {
            headers: {
              'Authorization': `token ${GITHUB_CONFIG.token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        if (getResponse.ok) {
          const data = await getResponse.json();
          sha = data.sha;
        }
      } catch (e) {
        console.log("File doesn't exist yet, will create new");
      }
      
      // Create or update file
      const payload = {
        message: `Update itinerary - ${new Date().toISOString()}`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      };
      
      if (sha) {
        payload.sha = sha;
      }
      
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (response.ok) {
        console.log("✓ Saved to GitHub successfully");
        if (statusEl) {
          statusEl.textContent = "✓ Saved to GitHub";
          statusEl.style.color = "#28a745";
          setTimeout(() => {
            statusEl.textContent = "";
          }, 3000);
        }
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save to GitHub");
      }
    } catch (error) {
      console.error("GitHub save error:", error);
      alert(`Failed to save to GitHub: ${error.message}\n\nCheck your token permissions and repo settings.`);
      return false;
    }
  }
  
  // Load from GitHub
  async function loadFromGitHub() {
    if (!GITHUB_CONFIG.owner || !GITHUB_CONFIG.repo || !GITHUB_CONFIG.token) {
      alert("GitHub not configured. Set it up first!");
      setupGitHub();
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const content = decodeURIComponent(escape(atob(data.content)));
        itinerary = JSON.parse(content);
        localStorage.setItem("itinerary-v1", JSON.stringify(itinerary));
        renderBoard();
        console.log("✓ Loaded from GitHub");
        alert("✓ Loaded itinerary from GitHub!");
      } else {
        console.log("No itinerary file found on GitHub");
      }
    } catch (error) {
      console.error("GitHub load error:", error);
      alert(`Failed to load from GitHub: ${error.message}`);
    }
  }
  
  // Export/download function (local backup)
  function exportItinerary() {
    const dataStr = JSON.stringify(itinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'paris-itinerary.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log("✓ Itinerary exported");
  }
  
  // Reset to defaults
  function resetToDefaults() {
    if (confirm("Reset itinerary to defaults? This will erase all your changes.")) {
      itinerary = JSON.parse(JSON.stringify(defaultDays));
      save();
      renderBoard();
      console.log("✓ Reset to defaults");
    }
  }
  
  // Make functions available globally via namespace
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
  
  // Load GitHub config on startup
  loadGitHubConfig();
  
  // Initial render
  renderBoard();
  
  // Try to load from GitHub on startup if configured
  if (GITHUB_CONFIG.token && GITHUB_CONFIG.owner && GITHUB_CONFIG.repo) {
    loadFromGitHub().catch(err => {
      console.log("Using local data:", err.message);
    });
  }
  
  // Auto-save reminder
  setInterval(() => {
    console.log("Itinerary: data persisted");
  }, 60000); // Every minute
  
})();
