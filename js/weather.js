/* ==========================================
   WEATHER.JS — City-based season & weather
   No API key — uses Open-Meteo (free, no auth)
   ========================================== */

const CITY_COORDS = {
  'Mumbai':     { lat: 19.076, lon: 72.877 },
  'Delhi':      { lat: 28.613, lon: 77.209 },
  'Bengaluru':  { lat: 12.972, lon: 77.594 },
  'Hyderabad':  { lat: 17.385, lon: 78.487 },
  'Chennai':    { lat: 13.083, lon: 80.270 },
  'Kolkata':    { lat: 22.572, lon: 88.363 },
  'Pune':       { lat: 18.520, lon: 73.856 },
  'Ahmedabad':  { lat: 23.023, lon: 72.572 },
  'Jaipur':     { lat: 26.912, lon: 75.787 },
  'Chandigarh': { lat: 30.733, lon: 76.779 },
  'Kochi':      { lat:  9.939, lon: 76.270 },
  'Guwahati':   { lat: 26.144, lon: 91.736 },
  'Surat':      { lat: 21.170, lon: 72.831 },
  'Lucknow':    { lat: 26.847, lon: 80.947 },
  'Nagpur':     { lat: 21.146, lon: 79.089 },
  'New York':   { lat: 40.713, lon: -74.006 },
  'London':     { lat: 51.508, lon: -0.128 },
  'Paris':      { lat: 48.857, lon:  2.352 },
  'Tokyo':      { lat: 35.690, lon: 139.692 },
  'Dubai':      { lat: 25.204, lon:  55.270 },
  'Singapore':  { lat:  1.352, lon: 103.820 },
  'Sydney':     { lat:-33.868, lon: 151.209 },
  'Toronto':    { lat: 43.651, lon: -79.383 },
  'Berlin':     { lat: 52.520, lon:  13.405 },
  'Milan':      { lat: 45.465, lon:   9.188 },
  'Barcelona':  { lat: 41.385, lon:   2.173 },
  'Hong Kong':  { lat: 22.320, lon: 114.170 },
  'Seoul':      { lat: 37.566, lon: 126.978 },
  'Bangkok':    { lat: 13.756, lon: 100.502 },
};

// WMO weather code → description + emoji
const WMO_CODES = {
  0:'Clear sky ☀️', 1:'Mainly clear 🌤️', 2:'Partly cloudy ⛅', 3:'Overcast ☁️',
  45:'Foggy 🌫️', 48:'Icy fog 🌫️',
  51:'Light drizzle 🌦️', 53:'Drizzle 🌦️', 55:'Heavy drizzle 🌧️',
  61:'Light rain 🌧️', 63:'Rain 🌧️', 65:'Heavy rain 🌧️',
  71:'Light snow 🌨️', 73:'Snow 🌨️', 75:'Heavy snow ❄️',
  80:'Rain showers 🌦️', 81:'Showers 🌧️', 82:'Violent showers ⛈️',
  95:'Thunderstorm ⛈️', 96:'Thunderstorm ⛈️', 99:'Thunderstorm ⛈️',
};

let _weatherCache = {};

async function fetchWeather(city) {
  if (_weatherCache[city] && Date.now() - _weatherCache[city].ts < 30 * 60 * 1000) {
    return _weatherCache[city].data;
  }

  const coords = CITY_COORDS[city];
  if (!coords) return _fallbackWeather(city);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto&forecast_days=1`;
    const res  = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    const cur  = json.current;

    const data = {
      temp:        Math.round(cur.temperature_2m),
      unit:        '°C',
      code:        cur.weathercode,
      description: WMO_CODES[cur.weathercode] || 'Unknown',
      wind:        Math.round(cur.windspeed_10m),
      advice:      _outfitAdvice(cur.temperature_2m, cur.weathercode),
      city
    };

    _weatherCache[city] = { data, ts: Date.now() };
    return data;
  } catch {
    return _fallbackWeather(city);
  }
}

function _fallbackWeather(city) {
  // Use season estimate based on month + city climate
  const month   = new Date().getMonth(); // 0-11
  const climate = (typeof CITY_CLIMATE !== 'undefined' && CITY_CLIMATE[city]) || 'temperate';
  let temp = _estimateTemp(month, climate);
  return {
    temp, unit: '°C', code: -1,
    description: _seasonDesc(month, climate),
    wind: 0,
    advice: _outfitAdvice(temp, 0),
    city, offline: true
  };
}

function _estimateTemp(month, climate) {
  const base = { tropical:30, desert:35, 'semi-arid':28, temperate:22, continental:18, oceanic:15, subtropical:27, mediterranean:20 }[climate] || 22;
  // Simple seasonal swing
  const swing = Math.cos((month - 6) * Math.PI / 6) * 8;
  return Math.round(base - swing);
}

function _seasonDesc(month, climate) {
  if (climate === 'tropical' || climate === 'desert') {
    return month >= 6 && month <= 9 ? 'Monsoon season 🌧️' : 'Hot & sunny ☀️';
  }
  const seasons = ['Winter ❄️','Winter ❄️','Spring 🌸','Spring 🌸','Summer ☀️','Summer ☀️','Summer ☀️','Monsoon 🌧️','Monsoon 🌧️','Autumn 🍂','Autumn 🍂','Winter ❄️'];
  return seasons[month];
}

function _outfitAdvice(temp, code) {
  const isRainy = [51,53,55,61,63,65,80,81,82,95,96,99].includes(code);
  let advice = [];
  if (temp >= 35)       advice.push('Extremely hot — wear light linen or cotton, minimal layers');
  else if (temp >= 28)  advice.push('Hot day — breathable fabrics, light colors recommended');
  else if (temp >= 20)  advice.push('Warm & comfortable — most outfits work well');
  else if (temp >= 12)  advice.push('Cool — add a light jacket or layer');
  else if (temp >= 5)   advice.push('Cold — wear a coat and warm layers');
  else                  advice.push('Very cold — heavy outerwear essential');
  if (isRainy)          advice.push('Rain expected — waterproof layer and covered footwear recommended');
  return advice;
}

function getTempCategory(temp) {
  if (temp >= 32) return 'hot';
  if (temp >= 22) return 'warm';
  if (temp >= 14) return 'cool';
  return 'cold';
}
