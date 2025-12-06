# Paris December 2025 Travel Planner

A personal travel planning web application for organizing a trip to Paris, December 2-9, 2025.

## Features

- **Interactive Google Maps** - Visual display of daily activities with color-coded pins
- **Drag-and-Drop Itinerary** - Organize activities by day with intuitive drag-and-drop interface
- **Weather Forecast** - 5-day weather forecast for Paris
- **Real-time Paris Time** - Always know what time it is in Paris
- **GitHub Sync** - Save and load your itinerary to/from GitHub for backup and access across devices
- **Responsive Design** - Works on desktop and mobile devices

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omatty123/paris2025.git
   cd paris2025
   ```

2. **Open `index.html` in your browser:**
   ```bash
   # macOS
   open index.html

   # Linux
   xdg-open index.html

   # Windows
   start index.html
   ```

3. **Set up API access:**
   - The app will work immediately with view-only access
   - To save to GitHub, click "Set" and enter a GitHub Personal Access Token (see below)

## API Keys & Configuration

### Google Maps API

**⚠️ SECURITY WARNING:** The Google Maps API key in this repository is exposed in the frontend code. This is acceptable for personal projects with restricted keys, but you should:

1. **Restrict the API key in [Google Cloud Console](https://console.cloud.google.com/):**
   - Go to Credentials → API Keys
   - Add "HTTP referrer" restrictions (e.g., `yourdomain.com/*` or `localhost`)
   - Restrict to "Maps JavaScript API" only
   - Set daily quota limits

2. **For production use:**
   - Use a backend proxy to hide the API key
   - Never commit unrestricted API keys to public repositories

### GitHub Personal Access Token

To enable saving/loading your itinerary:

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Paris 2025 Planner")
4. Select scopes: **`repo`** (Full control of private repositories)
5. Click "Generate token" and copy it
6. In the app, click "Set" and paste your token
7. Token is stored in browser localStorage (see security note below)

**⚠️ SECURITY WARNING:** Tokens stored in localStorage are vulnerable to XSS attacks. For better security:
- Only use this on trusted devices
- Regenerate tokens periodically
- Use fine-grained tokens with minimal permissions when available

## Usage

### Managing Your Itinerary

- **Add items:** Type in the input box for any day and click "+"
- **Move items:** Drag and drop cards between days or to the Open Bin
- **Delete items:** Click the "×" button on any card
- **Reset:** Click "Reset" to restore default itinerary (confirmation required)

### Using the Map

- **Filter by day:** Click day buttons (Dec 3-9) to show only that day's pins
- **Show all:** Click "Show all pins" to display everything
- **Today's view:** Click "Today" to show pins for the current day (if you're in Paris!)
- **Search & Add:** Enter a location, click "Search & Add Pin" to geocode and add a new pin
- **Info windows:** Click any pin to see details

### GitHub Sync

- **Save:** Click "Save" to upload current itinerary to GitHub
- **Load:** Click "Load" to download from GitHub (overwrites local changes)
- **Automatic local save:** Changes are automatically saved to browser localStorage

## File Structure

```
paris2025/
├── index.html                   # Main HTML file
├── app.js                       # Paris time & weather functionality
├── itinerary.js                 # Itinerary management & drag-drop logic
├── map.js                       # Google Maps integration
├── style.css                    # Styling
├── itinerary.json               # Stored itinerary data (synced with GitHub)
├── paris-christmas-markets.jpg  # Background image
├── CODE_REVIEW.md               # Comprehensive code review document
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
├── places.json                  # ⚠️ DEPRECATED - Location data (not used)
├── data/
│   └── itinerary.json           # Alternative itinerary storage (for modules/)
└── modules/                     # Alternative/modular HTML components (legacy)
    ├── itinerary.html
    ├── map.html
    ├── flight-status.html
    ├── flight-weather.html
    ├── itinerary.js
    └── paris-weather.html
```

**Note:** The main application uses files in the root directory. The `modules/` directory contains alternative layouts and components that are not actively used by the main application.

## Browser Support

This application requires a modern browser with ES6+ support:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Not supported:** Internet Explorer

## Technologies Used

- **Vanilla JavaScript** - No frameworks, pure JS
- **Google Maps JavaScript API** - Map and geocoding
- **Open-Meteo API** - Weather forecasts (free, no key required)
- **GitHub API** - Data persistence
- **HTML5 Drag and Drop API** - Itinerary management
- **LocalStorage API** - Client-side data persistence

## Development

This is a static web application with no build process. Simply edit the files and refresh your browser.

### Key Functions

- `app.js`: `updateParisTime()`, `fetchParisWeather()`
- `itinerary.js`: `renderItinerary()`, `moveItem()`, `saveToLocal()`
- `map.js`: `initLiveMap()`, `showDayPins()`, `searchAndAddPin()`

### Making Changes

1. Edit files in your favorite editor
2. Refresh browser to see changes
3. Use browser DevTools for debugging (Console, Network, Elements tabs)

## Troubleshooting

### Map not loading
- Check browser console for API key errors
- Verify API key is enabled for Maps JavaScript API
- Check for network/CORS issues

### GitHub sync not working
- Verify your Personal Access Token has `repo` scope
- Check that token hasn't expired
- Look for error messages in the GitHub status area
- Check browser console for API errors

### Drag and drop not working
- Try a different browser (some browsers have stricter drag-drop security)
- Check browser console for JavaScript errors
- Ensure you're clicking and holding on the card, not the delete button

### Weather not loading
- Open-Meteo API is free and usually reliable
- Check browser console for network errors
- Try refreshing the page

## Privacy & Data

- **Local Storage:** All itinerary data is stored locally in your browser
- **GitHub:** If you enable sync, data is stored in your GitHub repository
- **No Analytics:** This app does not track you or send data anywhere except:
  - Google Maps API (for map tiles and geocoding)
  - Open-Meteo API (for weather data)
  - GitHub API (only if you enable sync)

## License

This is a personal project. Not licensed for public use or redistribution.

## Trip Details

- **Dates:** December 2-9, 2025
- **Route:** Appleton → Detroit → Paris → Detroit → Appleton
- **Home Base:** 7 Avenue Stephen Pichon, Bâtiment B, 13ᵉ arrondissement, Paris

## Acknowledgments

- Weather data from [Open-Meteo](https://open-meteo.com/)
- Maps from [Google Maps](https://maps.google.com/)
- Font: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)
- Icons: [Font Awesome](https://fontawesome.com/)

---

**Have a wonderful trip to Paris! 🇫🇷 🗼**
