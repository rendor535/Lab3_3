
document.addEventListener('DOMContentLoaded', () => {
  // ELEMENTY
  const btnRandom      = document.getElementById('btnRandom');
  const ratingEl       = document.getElementById('rating');
  const statusEl       = document.getElementById('status');
  const randomWrap     = document.getElementById('randomWrap');

  const form           = document.getElementById('searchForm');
  const btnSearch      = document.getElementById('btnSearch');
  const queryEl        = document.getElementById('query');
  const limitEl        = document.getElementById('limit');
  const searchStatusEl = document.getElementById('searchStatus');
  const gridEl         = document.getElementById('grid');

  if (!btnRandom || !ratingEl || !statusEl || !randomWrap) {
    console.error('Brak wymaganych elementów DOM: btnRandom, rating, status, randomWrap.');
    return;
  }

  // STAN
  const searchState = {
    q: '',
    limit: 12,
    rating: 'g',
    lang: 'en'
  };

  // LISTENERY
  btnRandom.addEventListener('click', fetchRandomGifViaProxy);

  if (form && btnSearch && queryEl && limitEl && gridEl && searchStatusEl) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      triggerSearch(true);
    });
  }

  async function fetchRandomGifViaProxy() {
    const rating = ratingEl.value || 'g';

    setStatus(statusEl, 'Losuję GIF…');
    setDisabled(btnRandom, true);

    try {

      const url = new URL('http://localhost:3000/giphy/random');
      url.searchParams.set('rating', rating);

      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const t = await res.json();
          if (t?.message || t?.error) msg += `: ${t.message || t.error}`;
        } catch {}
        setStatus(statusEl, msg, 'error');
        randomWrap.innerHTML = `<div class="placeholder">Błąd pobierania.</div>`;
        return;
      }

      const json = await res.json();
      const data = json?.data;
      const src  = data?.images?.original?.url;
      
      randomWrap.innerHTML = '';

      if (!src) {
        randomWrap.innerHTML = `<div class="placeholder">Brak obrazu w odpowiedzi.</div>`;
        setStatus(statusEl, 'Brak obrazu.', 'warn');
        return;
      }

      const card = document.createElement('div');
      card.className = 'random-card';

      const img = document.createElement('img');
      img.src = src;
      img.alt = data?.title || 'random';
      img.loading = 'lazy';

      const meta = document.createElement('div');
      meta.className = 'card meta';
      meta.innerHTML = `
        <div class="title">${escapeHtml(data?.title || '—')}</div>
        <div class="user">${escapeHtml(data?.username || data?.source_tld || '')}</div>
      `;

      card.appendChild(img);
      card.appendChild(meta);
      randomWrap.appendChild(card);

      setStatus(statusEl, 'OK.', 'ok');
    } catch (err) {
      console.error(err);
      setStatus(statusEl, 'Błąd sieci lub proxy.', 'error');
      randomWrap.innerHTML = `<div class="placeholder">Błąd pobierania.</div>`;
    } finally {
      setDisabled(btnRandom, false);
    }
  }

  // WYSZUKIWARKA PRZEZ PROXY (BEZ API KEY)
  async function triggerSearch() {
    let q = (queryEl.value || '').trim();
    const limitVal = clamp(parseInt(limitEl.value, 10) || 12, 1, 50);
    const rating = ratingEl.value || 'g';

    if (!q) return setStatus(searchStatusEl, 'Wpisz frazę.', 'warn');

    q = decodeURIComponent(encodeURIComponent(q));

    searchState.q = q;
    searchState.limit = limitVal;
    searchState.rating = rating;

    await doSearch();
  }

  async function doSearch() {
    setDisabled(btnSearch, true);
    setStatus(searchStatusEl, `Szukam „${searchState.q}”… (limit=${searchState.limit}, offset=${searchState.offset})`);

    try {
      const url = new URL('http://localhost:3000/giphy/search');
      url.searchParams.set('q',        searchState.q);
      url.searchParams.set('limit',    String(searchState.limit));
      url.searchParams.set('rating',   searchState.rating);
      url.searchParams.set('lang',     searchState.lang);

      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const t = await res.json();
          if (t?.message || t?.error) msg += `: ${t.message || t.error}`;
        } catch {}
        setStatus(searchStatusEl, msg, 'error');
        return;
      }

      const json = await res.json();

      const items = Array.isArray(json?.data) ? json.data : [];

      renderGrid(gridEl, items);


      setStatus(
        searchStatusEl,
        items.length ? `OK. Wyników: ${fmt(items.length)}.` : 'Brak wyników.',
        items.length ? 'ok' : 'warn'
      );
    } catch (e) {
      console.error(e);
      setStatus(searchStatusEl, 'Błąd podczas wyszukiwania.', 'error');
    } finally {
      setDisabled(btnSearch, false);
    }
  }
});

/* HELPERS */
function setStatus(el, msg, level) {
  el.textContent = msg || '';
  el.className = 'status' + (level ? ' ' + level : '');
}
function setDisabled(el, v){ if (el) el.disabled = v; }
function clamp(n, min, max){ return Math.min(max, Math.max(min, n)); }
function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

function fmt(n){ return new Intl.NumberFormat('pl-PL').format(n); }
function renderGrid(container, items){
  container.innerHTML = '';
  if (!items.length) return;
  const frag = document.createDocumentFragment();
  items.forEach(it => {
    const src = it?.images?.fixed_width?.url || it?.images?.original?.url;
    const card = document.createElement('div');
    card.className = 'grid-card';
    card.innerHTML = `
      <img src="${src || ''}" alt="${escapeHtml(it?.title || 'gif')}" loading="lazy">
      <div class="meta">
        <div class="title">${escapeHtml(it?.title || '—')}</div>
        <div class="user">${escapeHtml(it?.username || it?.source_tld || '')}</div>
      </div>`;
    frag.appendChild(card);
  });
  container.appendChild(frag);
}