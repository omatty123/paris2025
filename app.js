/* --- WEATHER GRID (simple row) --- */
.weather-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-top: 10px;
}

.weather-day {
  background: white;
  border-radius: 14px;
  padding: 10px;
  text-align: center;
  text-decoration: none;
  color: #222;
  box-shadow: 0 2px 6px rgba(0,0,0,0.10);
  transition: transform 0.15s ease;
}

.weather-day:hover {
  transform: translateY(-3px);
}

.weather-emoji {
  font-size: 32px;
  margin-bottom: 6px;
}

.weather-date {
  font-size: 14px;
  font-weight: 600;
}

.weather-temps {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 2px;
}
