/* Modal "Agendar demonstração": funciona em todas as páginas (botões com data-demo-open). */
const WHATSAPP = '556120994303';
// PENDENTE: webhook n8n do funil Vyzo
const WEBHOOK_URL = '';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
const SEGMENTOS = ['Autopeças', 'Lojas e varejo', 'Distribuidora ou atacado', 'Empresa de serviço', 'Outro'];

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

const campo = 'mt-1.5 w-full rounded-xl border border-neyap-border bg-white px-4 py-3 text-[15px] text-neyap-ink outline-none transition focus:border-neyap-brand focus:ring-2 focus:ring-neyap-brand/20';
const rotulo = 'block text-[13.5px] font-semibold text-neyap-ink';
const erroCls = 'mt-1 text-[13px] text-red-700';

const root = document.createElement('div');
root.id = 'demo-modal';
root.hidden = true;
root.className = 'fixed inset-0 z-[70] flex items-end justify-center bg-neyap-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-4';
root.innerHTML = `
  <div role="dialog" aria-modal="true" aria-labelledby="demo-titulo" class="relative max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-[20px] border border-neyap-border bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:rounded-[20px] sm:p-8">
    <button type="button" data-demo-close aria-label="Fechar" class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-neyap-border text-neyap-ink transition hover:bg-neyap-surface">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <form id="demo-form" novalidate>
      <h2 id="demo-titulo" class="pr-10 text-[24px] font-extrabold leading-tight text-neyap-ink">Agendar demonstração</h2>
      <p class="mt-2 text-[14.5px] leading-relaxed text-neyap-muted">Conte quem é você e falamos pelo WhatsApp para combinar o horário.</p>
      <div class="mt-5">
        <label for="demo-nome" class="${rotulo}">Nome</label>
        <input id="demo-nome" name="nome" type="text" autocomplete="name" required class="${campo}">
        <p id="demo-e-nome" class="${erroCls}" hidden>Digite seu nome.</p>
      </div>
      <div class="mt-4">
        <label for="demo-zap" class="${rotulo}">WhatsApp</label>
        <input id="demo-zap" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="(DDD) 99999-9999" required class="${campo}">
        <p id="demo-e-zap" class="${erroCls}" hidden>Digite um WhatsApp com DDD.</p>
      </div>
      <div class="mt-4">
        <label for="demo-empresa" class="${rotulo}">Empresa <span class="font-normal text-neyap-muted">(opcional)</span></label>
        <input id="demo-empresa" name="empresa" type="text" autocomplete="organization" class="${campo}">
      </div>
      <div class="mt-4">
        <label for="demo-segmento" class="${rotulo}">Segmento</label>
        <select id="demo-segmento" name="segmento" class="${campo}">${SEGMENTOS.map((s) => `<option value="${s}">${s}</option>`).join('')}</select>
      </div>
      <button type="submit" class="btn-primary mt-6 w-full">Agendar demonstração</button>
      <p class="mt-3 text-[12.5px] leading-relaxed text-neyap-muted">Ao enviar, você concorda com a nossa <a href="/privacidade/" class="underline hover:text-neyap-brand-deep">Política de Privacidade</a>. Usamos seus dados só para falar com você sobre o Neyap.</p>
    </form>
    <div id="demo-ok" hidden tabindex="-1" class="outline-none">
      <h2 class="pr-10 text-[24px] font-extrabold leading-tight text-neyap-ink">Recebemos seu pedido</h2>
      <p class="mt-3 text-[15px] leading-relaxed text-neyap-body">Abrimos o WhatsApp com a sua mensagem. Se ele não abriu, toque no botão abaixo.</p>
      <a id="demo-ok-link" href="#" target="_blank" rel="noopener" class="btn-primary mt-6 w-full">Abrir o WhatsApp</a>
    </div>
  </div>`;
document.body.appendChild(root);

const dialog = root.firstElementChild;
const form = root.querySelector('#demo-form');
const ok = root.querySelector('#demo-ok');
const nomeEl = root.querySelector('#demo-nome');
const zapEl = root.querySelector('#demo-zap');
const empresaEl = root.querySelector('#demo-empresa');
const segEl = root.querySelector('#demo-segmento');
let ultimoBotao = null;

function focaveis() {
  return Array.from(dialog.querySelectorAll('button, a[href], input, select, [tabindex="0"]')).filter((el) => !el.closest('[hidden]'));
}
function abrir(botao) {
  ultimoBotao = botao;
  form.hidden = false;
  ok.hidden = true;
  root.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  nomeEl.focus();
}
function fechar() {
  if (root.hidden) return;
  root.hidden = true;
  document.documentElement.style.overflow = '';
  if (ultimoBotao && document.contains(ultimoBotao) && ultimoBotao.offsetParent !== null) ultimoBotao.focus();
  else document.getElementById('menu-toggle')?.focus();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-demo-open]');
  if (!b) return;
  e.preventDefault();
  // fecha o menu mobile, se aberto
  const painel = document.getElementById('mobile-panel');
  if (painel && painel.classList.contains('flex')) document.getElementById('menu-toggle')?.click();
  abrir(b.offsetParent !== null ? b : document.getElementById('menu-toggle'));
});
root.addEventListener('click', (e) => {
  if (e.target === root || e.target.closest('[data-demo-close]')) fechar();
});
document.addEventListener('keydown', (e) => {
  if (root.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); fechar(); return; }
  if (e.key === 'Tab') {
    const f = focaveis();
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

zapEl.addEventListener('input', () => {
  const d = zapEl.value.replace(/\D/g, '').slice(0, 11);
  let s = d;
  if (d.length > 6) s = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
  else if (d.length > 2) s = '(' + d.slice(0, 2) + ') ' + d.slice(2);
  else if (d.length) s = '(' + d;
  zapEl.value = s;
});

function erro(el, id, mostrar) {
  const msg = root.querySelector('#' + id);
  msg.hidden = !mostrar;
  el.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
  if (mostrar) el.setAttribute('aria-describedby', id); else el.removeAttribute('aria-describedby');
}
nomeEl.addEventListener('input', () => erro(nomeEl, 'demo-e-nome', false));
zapEl.addEventListener('input', () => erro(zapEl, 'demo-e-zap', false));

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const nome = nomeEl.value.trim();
  const d = zapEl.value.replace(/\D/g, '');
  const okNome = nome.length >= 2;
  const okZap = d.length >= 10 && d.length <= 11 && parseInt(d.slice(0, 2), 10) >= 11;
  erro(nomeEl, 'demo-e-nome', !okNome);
  erro(zapEl, 'demo-e-zap', !okZap);
  if (!okNome) { nomeEl.focus(); return; }
  if (!okZap) { zapEl.focus(); return; }

  const empresa = empresaEl.value.trim();
  const segmento = segEl.value;
  let msg = 'Olá, quero agendar uma demonstração do Neyap. Nome: ' + nome + '. Empresa: ' + (empresa || 'não informada') + '. Segmento: ' + segmento + '.';
  const ref = [utms.utm_source, utms.utm_medium, utms.utm_campaign].filter(Boolean).join('/');
  if (ref) msg += '\nref: ' + ref;
  const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

  try { window.neyapTrack?.('Lead', { interesse: 'demonstracao', segmento }); } catch (e) { /* sem rastreio */ }

  if (WEBHOOK_URL) {
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp: zapEl.value, empresa, segmento, interesse: 'demonstracao', pagina: window.location.href, ...utms }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* nao bloqueia */ }
  }

  form.hidden = true;
  root.querySelector('#demo-ok-link').href = url;
  ok.hidden = false;
  ok.focus();
  window.open(url, '_blank', 'noopener');
});
