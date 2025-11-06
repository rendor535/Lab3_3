document.addEventListener('DOMContentLoaded', () => {
  const btnRandom  = document.getElementById('btnRandom');
  const ratingEl   = document.getElementById('rating');
  const statusEl   = document.getElementById('status');
  const randomWrap = document.getElementById('randomWrap');

  if (!btnRandom || !ratingEl || !statusEl || !randomWrap) {
    console.error('Brak wymaganych elementów DOM: btnRandom, rating, status, randomWrap.');
    return;
  }

  btnRandom.addEventListener('click', fetchRandomGifViaProxy);

  async function fetchRandomGifViaProxy() {
    const rating = ratingEl.value || 'g';

    setStatus(statusEl, 'Losuję GIF…');
    setDisabled(btnRandom, true);

    try {
      // Proxy ma klucz GIPHY po swojej stronie
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
      const data = json?.data; // /random zwraca pojedynczy obiekt
      const src  = data?.images?.original?.url; // właściwy adres GIF-a

      // czyścimy kontener przed nowym obrazkiem
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
});

/* helpers */
function setStatus(el, msg, level) {
  el.textContent = msg || '';
  el.className = 'status' + (level ? ' ' + level : '');
}
function setDisabled(el, v){ if (el) el.disabled = v; }
function escapeHtml(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
