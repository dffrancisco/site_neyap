import './autopecas.css';

// Numero unico do WhatsApp comercial do Neyap.
const WHATSAPP = '556120994303';
// PENDENTE: webhook n8n do funil Vyzo
const WEBHOOK_URL = '';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// UTMs: guarda da URL em sessionStorage (com try/catch)
function lerUtms() {
  const out = {};
  let salvo = {};
  try { salvo = JSON.parse(sessionStorage.getItem('neyap_utms') || '{}'); } catch (e) { salvo = {}; }
  const q = new URLSearchParams(window.location.search);
  let mudou = false;
  UTM_KEYS.forEach((k) => {
    const v = q.get(k);
    if (v) { salvo[k] = v.slice(0, 200); mudou = true; }
    if (salvo[k]) out[k] = salvo[k];
  });
  if (mudou) { try { sessionStorage.setItem('neyap_utms', JSON.stringify(salvo)); } catch (e) { /* sem storage */ } }
  return out;
}
const utms = lerUtms();

// reveal ao rolar
const alvos = document.querySelectorAll('.ap .dor, .ap .dor-foto, .ap .passos li, .ap .num, .ap .painel, .ap .ins-nums div, .ap .oficial-lista li, .ap .leia-lista li');
if ('IntersectionObserver' in window && !reduz) {
  alvos.forEach((el) => el.classList.add('js-rv'));
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  alvos.forEach((el) => io.observe(el));
}

// contagem dos numeros da prova
const fmt = new Intl.NumberFormat('pt-BR');
function contar(el) {
  const fim = parseInt(el.dataset.count, 10);
  let t0 = null;
  const dur = 1100;
  function passo(t) {
    if (t0 === null) t0 = t;
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = fmt.format(Math.round(fim * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}
const contados = document.querySelectorAll('.ap [data-count]');
if ('IntersectionObserver' in window && !reduz) {
  const io2 = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { contar(e.target); io2.unobserve(e.target); } });
  }, { threshold: 0.6 });
  contados.forEach((el) => { el.textContent = '0'; io2.observe(el); });
}

// abas do Insights
const abas = Array.from(document.querySelectorAll('.ap .aba'));
function abrir(aba) {
  abas.forEach((a) => {
    const on = a === aba;
    a.setAttribute('aria-selected', on ? 'true' : 'false');
    a.tabIndex = on ? 0 : -1;
    document.getElementById(a.getAttribute('aria-controls')).hidden = !on;
  });
}
abas.forEach((a, i) => {
  a.addEventListener('click', () => abrir(a));
  a.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = abas[(i + d + abas.length) % abas.length];
    abrir(n); n.focus();
  });
});

// formulario
const form = document.getElementById('form');
const nomeEl = document.getElementById('nome');
const zap = document.getElementById('zap');

document.querySelectorAll('.ap [data-interesse]').forEach((b) => {
  b.addEventListener('click', () => {
    const v = b.getAttribute('data-interesse');
    form.querySelectorAll('input[name="interesse"]').forEach((r) => { r.checked = r.value === v; });
    setTimeout(() => nomeEl.focus({ preventScroll: true }), reduz ? 0 : 500);
  });
});

zap.addEventListener('input', () => {
  const d = zap.value.replace(/\D/g, '').slice(0, 11);
  let s = d;
  if (d.length > 6) s = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
  else if (d.length > 2) s = '(' + d.slice(0, 2) + ') ' + d.slice(2);
  else if (d.length) s = '(' + d;
  zap.value = s;
});

function erro(campo, mostrar) {
  const el = document.getElementById('e-' + campo.id);
  el.hidden = !mostrar;
  campo.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
  if (mostrar) campo.setAttribute('aria-describedby', el.id); else campo.removeAttribute('aria-describedby');
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const n = nomeEl.value.trim();
  const d = zap.value.replace(/\D/g, '');
  const okNome = n.length >= 2;
  const okZap = d.length >= 10 && d.length <= 11 && parseInt(d.slice(0, 2), 10) >= 11;
  erro(nomeEl, !okNome);
  erro(zap, !okZap);
  if (!okNome) { nomeEl.focus(); return; }
  if (!okZap) { zap.focus(); return; }

  const interesse = form.querySelector('input[name="interesse"]:checked').value;
  let msg = 'Olá, sou ' + n + '. Tenho interesse em: ' + interesse + '. Meu WhatsApp: ' + zap.value + '.';
  const ref = [utms.utm_source, utms.utm_medium, utms.utm_campaign].filter(Boolean).join('/');
  if (ref) msg += '\nref: ' + ref;
  const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

  try { window.neyapTrack?.('Lead', { interesse }); } catch (e) { /* sem rastreio */ }

  if (WEBHOOK_URL) {
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: n, whatsapp: zap.value, interesse, pagina: window.location.href, ...utms }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* nao bloqueia */ }
  }

  form.hidden = true;
  const ok = document.getElementById('ok');
  document.getElementById('ok-link').href = url;
  ok.hidden = false;
  ok.focus();
  window.open(url, '_blank', 'noopener');
});
[nomeEl, zap].forEach((c) => c.addEventListener('input', () => erro(c, false)));
