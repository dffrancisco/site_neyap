import './autopecas.css';

// Webhook n8n do funil 7 "Site Neyap" (workflow LTfK5yyqHxC2HrsD)
const WEBHOOK_URL = 'https://n8n.vyzar.com.br/webhook/neyap-site-lead';
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

function fbIds() {
  const out = {};
  try {
    const ck = (n) => { const m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)')); return m ? decodeURIComponent(m[1]) : ''; };
    const fbp = ck('_fbp');
    let fbc = ck('_fbc');
    if (!fbc && utms.fbclid) fbc = 'fb.1.' + Date.now() + '.' + utms.fbclid;
    if (fbp) out.fbp = fbp;
    if (fbc) out.fbc = fbc;
  } catch (e) { /* sem cookie */ }
  return out;
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

// Botões que levam ao formulário: foco no Nome depois da rolagem.
document.querySelectorAll('.ap a[href="#form"]').forEach((b) => {
  b.addEventListener('click', () => { setTimeout(() => nomeEl.focus({ preventScroll: true }), reduz ? 0 : 500); });
});

zap.addEventListener('input', () => {
  const d = zap.value.replace(/\D/g, '').slice(0, 11);
  let s = d;
  if (d.length > 6) s = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
  else if (d.length > 2) s = '(' + d.slice(0, 2) + ') ' + d.slice(2);
  else if (d.length) s = '(' + d;
  zap.value = s;
});

const lojaEl = document.getElementById('loja');
const cidadeEl = document.getElementById('cidade');

function erro(campo, mostrar) {
  const el = document.getElementById('e-' + campo.id);
  const ajuda = document.getElementById('h-' + campo.id);
  el.hidden = !mostrar;
  campo.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
  const ids = [mostrar ? el.id : '', ajuda ? ajuda.id : ''].filter(Boolean).join(' ');
  if (ids) campo.setAttribute('aria-describedby', ids); else campo.removeAttribute('aria-describedby');
}
erro(lojaEl, false);

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const n = nomeEl.value.trim();
  const loja = lojaEl.value.trim();
  const cidade = cidadeEl.value.trim();
  const d = zap.value.replace(/\D/g, '');
  const okNome = n.length >= 2;
  const okLoja = loja.length >= 2;
  const okCidade = cidade.length >= 2;
  const okZap = d.length >= 10 && d.length <= 11 && parseInt(d.slice(0, 2), 10) >= 11;
  erro(nomeEl, !okNome);
  erro(lojaEl, !okLoja);
  erro(cidadeEl, !okCidade);
  erro(zap, !okZap);
  if (!okNome) { nomeEl.focus(); return; }
  if (!okLoja) { lojaEl.focus(); return; }
  if (!okCidade) { cidadeEl.focus(); return; }
  if (!okZap) { zap.focus(); return; }

  // A LP converte só pelo formulário (Kallebe, 2026-11-04): sem WhatsApp como saída.
  // Por isso o envio espera a resposta do webhook. Se falhar, o visitante vê o erro e tenta de novo.
  const interesse = 'Apresentação (20 min)';
  const botao = document.getElementById('enviar');
  const erroEnvio = document.getElementById('e-envio');
  erroEnvio.hidden = true;
  botao.disabled = true;
  const textoBotao = botao.textContent;
  botao.textContent = 'Enviando...';

  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const limite = ctrl ? setTimeout(() => ctrl.abort(), 15000) : null;
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: n, loja, cidade, whatsapp: zap.value, interesse, pagina: window.location.href, utms, ...fbIds() }),
    signal: ctrl ? ctrl.signal : undefined,
  }).then((r) => {
    if (!r.ok) throw new Error('webhook ' + r.status);
    // O n8n responde 200 com corpo vazio quando o fluxo quebra antes de gravar o lead.
    // Sucesso só com {"ok": true}, que o nó "Responder OK" manda depois do card criado.
    return r.json();
  }).then((j) => {
    if (!j || j.ok !== true) throw new Error('lead nao confirmado');
    try { window.neyapTrack?.('Lead', { interesse }); } catch (e) { /* sem rastreio */ }
    form.hidden = true;
    const ok = document.getElementById('ok');
    document.getElementById('ok-nome').textContent = n.split(' ')[0];
    document.getElementById('ok-zap').textContent = zap.value;
    ok.hidden = false;
    ok.focus();
  }).catch(() => {
    erroEnvio.hidden = false;
  }).finally(() => {
    if (limite) clearTimeout(limite);
    botao.disabled = false;
    botao.textContent = textoBotao;
  });
});
[nomeEl, lojaEl, cidadeEl, zap].forEach((c) => c.addEventListener('input', () => erro(c, false)));

// Tela de sucesso: "O número está errado? Envie de novo" volta ao formulário com o WhatsApp em foco.
document.getElementById('ok-refazer').addEventListener('click', () => {
  document.getElementById('ok').hidden = true;
  form.hidden = false;
  zap.focus();
});
