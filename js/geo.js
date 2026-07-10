/* ============================================================
   geo.js — localisation réelle via Open-Meteo (gratuit, sans clé)
   Récupère ensoleillement moyen et pluviométrie annuelle réels.
   ============================================================ */
const Geo = (() => {

  const iso = d => d.toISOString().slice(0,10);

  // moyenne d'ensoleillement (kWh/m²/j) + pluie annuelle (mm) sur ~1 an d'archives
  async function fetchClimate(lat, lon){
    const end = new Date(Date.now() - 7*864e5);        // archives fiables jusqu'à ~5-7 j
    const start = new Date(end.getTime() - 364*864e5);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}`
      + `&start_date=${iso(start)}&end_date=${iso(end)}`
      + `&daily=shortwave_radiation_sum,precipitation_sum&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('archive ' + r.status);
    const j = await r.json();
    const rad = (j.daily && j.daily.shortwave_radiation_sum || []).filter(v => v != null);
    const pr  = (j.daily && j.daily.precipitation_sum || []).filter(v => v != null);
    if (!rad.length && !pr.length) throw new Error('no data');
    const sun = rad.length ? +(((rad.reduce((a,b)=>a+b,0)/rad.length)) / 3.6).toFixed(1) : null; // MJ→kWh
    const rainfall = pr.length ? Math.round(pr.reduce((a,b)=>a+b,0) * (365/pr.length)) : null;   // mm/an
    return { sun, rainfall };
  }

  // recherche d'une commune -> coordonnées
  async function searchCity(name){
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=fr&format=json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('geocoding ' + r.status);
    const j = await r.json();
    return (j.results || []).map(x => ({
      lat:x.latitude, lon:x.longitude,
      place:[x.name, x.admin1, x.country_code].filter(Boolean).join(', ')
    }));
  }

  // position GPS de l'appareil
  function locate(){
    return new Promise((res, rej) => {
      if (!navigator.geolocation) return rej(new Error('Géolocalisation indisponible'));
      navigator.geolocation.getCurrentPosition(
        p => res({ lat:p.coords.latitude, lon:p.coords.longitude }),
        () => rej(new Error('Position refusée')),
        { timeout:10000, maximumAge:600000 }
      );
    });
  }

  // enregistre un lieu + ses données climat
  async function setLocation(lat, lon, place){
    const clim = await fetchClimate(lat, lon);
    Store.data.geo = { lat, lon, place: place || `Ma position`, sun:clim.sun, rainfall:clim.rainfall, at:Date.now() };
    Store.save();
    return Store.data.geo;
  }

  function clear(){ Store.data.geo = null; Store.save(); }
  function get(){ return Store.data.geo || null; }

  return { fetchClimate, searchCity, locate, setLocation, clear, get };
})();
