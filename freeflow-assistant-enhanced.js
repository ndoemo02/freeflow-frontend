// freeflow-assistant.js
// ----------------------------------------------------------
// Mowa → szukanie → krótka odpowiedź + TTS + WYNIKI UI
// ----------------------------------------------------------

const $  = (s) => document.querySelector(s);
const app        = $('#app');
const transcript = $('#transcript');
const micBtn     = $('#micBtn');
const logoBtn    = $('#logoBtn');
const dot        = $('#dot');
const banner     = $('#banner');
const tileFood   = $('#tileFood');
const tileTaxi   = $('#tileTaxi');
const tileHotel  = $('#tileHotel');

const GMAPS_PROXY = (document.querySelector('meta[name="gmaps-proxy"]')?.content || '/api/places').trim();
const GPT_PROXY   = (document.querySelector('meta[name="gpt-proxy"]')?.content   || '/api/gpt').trim();
const TTS_PROXY   = '/api/tts';

// ---------- UI helpers ----------
function showBanner(msg, type = 'info') {
  banner.textContent = msg;
  banner.classList.remove('hidden');
  banner.style.background = type === 'err'
    ? 'rgba(255,72,72,.15)'
    : type === 'warn'
    ? 'rgba(255,203,72,.15)'
    : 'rgba(72,179,255,.12)';
  banner.style.color = type === 'err' ? '#ffd1d1' : type === 'warn' ? '#ffe6a3' : '#dff1ff';
}
function hideBanner() { banner.classList.add('hidden'); banner.textContent=''; }

function setGhostText(msg){ transcript.classList.add('ghost'); transcript.textContent = msg; }
function setFinalText(msg){ transcript.classList.remove('ghost'); transcript.textContent = msg; }
function setListening(on){
  document.body.classList.toggle('listening', !!on);
  dot.style.boxShadow = on ? '0 0 18px #86e2ff' : '0 0 0 #0000';
}

// ---------- NOWE: UI do wyświetlania wyników ----------
function createResultsContainer() {
  let resultsContainer = document.getElementById('resultsContainer');
  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'resultsContainer';
    resultsContainer.style.cssText = `
      margin: 20px auto;
      max-width: min(92vw, 720px);
      display: none;
    `;
    // Wstaw po bannerze
    banner.parentNode.insertBefore(resultsContainer, banner.nextSibling);
  }
  return resultsContainer;
}

function renderResults(results, searchInfo = '') {
  console.log('🎯 RENDEROWANIE WYNIKÓW:', results.length, 'miejsc');
  
  const container = createResultsContainer();
  container.innerHTML = '';
  container.style.display = 'block';

  // Header z informacją o wyszukiwaniu
  if (searchInfo) {
    const header = document.createElement('div');
    header.style.cssText = `
      color: #c7c9d1;
      font-size: 14px;
      margin-bottom: 16px;
      text-align: center;
    `;
    header.textContent = searchInfo;
    container.appendChild(header);
  }

  // Wyniki
  results.forEach((result, index) => {
    const resultCard = document.createElement('div');
    resultCard.style.cssText = `
      background: rgba(20,20,22,.55);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 20px;
      padding: 18px 20px;
      margin-bottom: 12px;
      backdrop-filter: blur(18px);
      box-shadow: 0 12px 50px rgba(0,0,0,.35);
    `;

    resultCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h3 style="color: #f6f7fb; font-size: 18px; font-weight: 700; margin: 0; flex: 1;">
          ${result.name}
        </h3>
        <div style="display: flex; align-items: center; gap: 4px; color: #ffa500;">
          <span style="font-size: 16px;">⭐</span>
          <span style="font-weight: 700; font-size: 16px;">${result.rating}</span>
          <span style="color: #c7c9d1; font-size: 14px;">(${result.votes})</span>
        </div>
      </div>
      <p style="color: #c7c9d1; margin: 0; font-size: 14px; line-height: 1.4;">
        📍 ${result.address}
      </p>
    `;

    container.appendChild(resultCard);
  });

  // Przycisk "Ukryj wyniki"
  const hideButton = document.createElement('button');
  hideButton.textContent = 'Ukryj wyniki';
  hideButton.style.cssText = `
    background: rgba(255,143,67,.18);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 14px;
    color: #f6f7fb;
    padding: 12px 20px;
    font-size: 14px;
    cursor: pointer;
    margin: 16px auto 0;
    display: block;
  `;
  hideButton.onclick = () => {
    container.style.display = 'none';
  };
  container.appendChild(hideButton);
}

function hideResults() {
  const container = document.getElementById('resultsContainer');
  if (container) {
    container.style.display = 'none';
  }
}

// ---------- Geo ----------
async function getPositionOrNull(timeoutMs = 6000) {
  if (!('geolocation' in navigator)) {
    showBanner('Twoja przeglądarka nie obsługuje lokalizacji.', 'warn');
    return null;
  }
  const p = () => new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos)=>resolve(pos.coords),
      (err)=>reject(err),
      { enableHighAccuracy:true, timeout:timeoutMs, maximumAge:25000 }
    );
  });
  try { const c = await p(); hideBanner(); return c; }
  catch(e){
    const map={1:'Brak zgody na lokalizację.',2:'Lokalizacja niedostępna.',3:'Przekroczono czas oczekiwania.'};
    showBanner(`${map[e.code] ?? 'Błąd lokalizacji.'} — szukam po tekście.`, 'warn');
    return null;
  }
}

// ---------- NLP (rozszerzona obsługa polskich nazw miejscowości + LOGI) ----------
function extractQuery(text){
  console.log('🔍 EXTRACT QUERY START dla:', text);
  const t = (text||'').trim();

  // Kategoria
  const catRe = /(pizzeria|pizze|pizza|restauracja|restauracje|kebab|sushi|hotel|nocleg|taxi)/i;
  const mCat = t.match(catRe);
  if(!mCat) {
    console.log('❌ EXTRACT QUERY: Nie znaleziono kategorii');
    return null;
  }

  const base = (mCat[1]||'').toLowerCase();
  const category =
    /restaurac/.test(base) ? 'restauracje' :
    /pizz/.test(base)      ? 'pizzeria'    :
    /(hotel|nocleg)/.test(base) ? 'hotel'  :
    /taxi/.test(base)      ? 'taxi'        : base;

  console.log('📂 KATEGORIA wykryta:', base, '→', category);

  // Miasto po przyimku (w|we|na), 1–3 wyrazy z wielkiej litery
  const locRe = /\b(w|we|na)\s+([A-ZĄĆĘŁŃÓŚŹŻ][\w\-''ąćęłńóśźż]+(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\w\-''ąćęłńóśźż]+){0,2})\b/iu;
  const mLoc = t.match(locRe);

  let cityRaw = mLoc ? mLoc[2].trim() : null;
  const city = cityRaw ? toNominative(cityRaw) : null;

  if (cityRaw) {
    console.log('🏙️ MIASTO wykryte:', cityRaw, '→', city);
  } else {
    console.log('🚫 MIASTO: nie wykryto w tekście');
  }

  const result = { category, cityRaw, city };
  console.log('✅ EXTRACT QUERY RESULT:', result);
  return result;
}

function toNominative(name){
  console.log('🔄 Konwersja na mianownik:', name);
  const parts = name.split(/\s+/);
  const norm = parts.map(p => deinflectToken(p)).join(' ');
  console.log('🔄 Po konwersji:', norm);
  return norm;
}

// heurystyka „miejscownik → mianownik" dla popularnych końcówek
function deinflectToken(w){
  const src = w;
  // często nie odmieniać:
  if(/^(Zdrój|Wlkp\.?|Śląskie|Małopolskie|Pomorskie|Kujawsko-Pomorskie)$/iu.test(src)) return src;

  const rules = [
    [/([b-df-hj-np-tv-ząćęłńóśźż])u$/iu, '$1'],       // Gdańsku → Gdańsk
    [/awie$/iu, 'awa'],                               // Warszawie → Warszawa
    [/owie$/iu, 'owo'],                               // Władysławowie → Władysławowo
    [/kowie$/iu, 'ków'],                              // Krakowie → Kraków
    [/ach$/iu, 'y'],                                  // Piekarach → Piekary
    [/skich$/iu, 'skie'],                             // Śląskich → Śląskie
    [/olu$/iu, 'ole'],                                // Opolu → Opole
    [/dzi$/iu, 'dź'],                                 // Łodzi → Łódź
    [/owie$/iu, 'ów'],                                // Rzeszowie → Rzeszów
  ];
  let out = src;
  for (const [re, rep] of rules){
    if (re.test(out)){ 
      out = out.replace(re, rep); 
      console.log(`🔧 Zastosowano regułę: ${src} → ${out}`);
      break; 
    }
  }
  return out;
}

// ---------- API helpers ----------
async function callPlaces(params){
  console.log('🌐 WYWOŁANIE API z parametrami:', params);
  const sp=new URLSearchParams();
  if(params.query) sp.set('query', params.query);
  if(params.lat)   sp.set('lat', params.lat);
  if(params.lng)   sp.set('lng', params.lng);
  if(params.radius)sp.set('radius', params.radius);
  if(params.rankby)sp.set('rankby', params.rankby);
  if(params.keyword)sp.set('keyword', params.keyword);
  if(params.n)     sp.set('n', params.n);
  sp.set('language', params.language || 'pl');
  
  const url = `${GMAPS_PROXY}?${sp.toString()}`;
  console.log('🔗 URL zapytania:', url);
  
  const res=await fetch(url,{method:'GET'});
  if(!res.ok) throw new Error(`Places HTTP ${res.status}`);
  const data = await res.json();
  
  console.log('📥 Odpowiedź API:', data);
  return data;
}

async function callGPTSummary(userText, results){
  // Jeżeli backend GPT jest w trybie „echo", nie używamy odpowiedzi do UI, tylko TTS i tak ją przykryje.
  try{
    const prompt =
      `Odpowiedz jednym krótkim zdaniem po polsku (max 25 słów), bez cytowania użytkownika i bez wstępów. `+
      `Użyj danych: ${results.map(r=>`${r.name} (${r.rating}★)`).join('; ')}. `+
      `Zakończ: "Skorzystaj z aplikacji FreeFlow, aby zamówić szybko i wygodnie!"`;
    const res=await fetch(GPT_PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    if(!res.ok) throw new Error('GPT HTTP '+res.status);
    const j=await res.json();
    const raw=(j.reply||'').trim();
    return raw.replace(/^echo:\s*/i,'').replace(/^użytkownik.*?:/i,'').trim();
  }catch{ return ''; }
}

async function speakTTS(text, voice='alloy'){
  if(!text) return;
  try{
    const res=await fetch(TTS_PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,voice})});
    if(!res.ok) throw new Error('TTS HTTP '+res.status);
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    audio.play();
  }catch(e){
    // Fallback: Web Speech API (może kaleczyć przecinki)
    try{
      const u=new SpeechSynthesisUtterance(text);
      u.lang='pl-PL';
      speechSynthesis.speak(u);
    }catch{}
  }
}

// ---------- Główna ścieżka (ZAKTUALIZOWANA LOGIKA + WYNIKI UI) ----------
async function handleUserQuery(userText){
  try{
    console.log('🚀 HANDLE USER QUERY START:', userText);
    setFinalText(userText);
    hideResults(); // Ukryj poprzednie wyniki

    const q = extractQuery(userText);
    console.log('🔍 Wynik extractQuery:', q);
    
    const needsGPS = (!q || !q.city);
    console.log('🗺️ Czy potrzebuję GPS?', needsGPS, '(brak query lub brak city)');
    
    const coords = needsGPS ? await getPositionOrNull(6000) : null;
    if (coords) {
      console.log('📍 Otrzymane współrzędne GPS:', coords.latitude, coords.longitude);
    }

    const params = { language:'pl', n:2 };
    let searchMethod = '';

    if (q && q.city){
      // wyszukiwanie tekstowe po mieście (bez GPS)
      params.query = `${q.category} w ${q.city}`;
      searchMethod = `TEXT SEARCH: ${params.query}`;
      console.log('🎯 WYBRANO TEXT SEARCH dla miasta:', q.city);
    } else if (coords){
      params.lat    = coords.latitude.toFixed(6);
      params.lng    = coords.longitude.toFixed(6);
      params.radius = 5000;
      if(q) params.keyword = q.category;
