/* Modal "Ver demonstração": funciona em todas as páginas (botões com data-demo-open).
   2026-11-17 (home v3): pede a quantidade de vendedores no lugar do segmento e não abre mais o WhatsApp sozinho.
   A equipe chama o lead no mesmo dia. VIDEO_URL e INSIGHTS_DEMO_URL vazios = blocos escondidos na tela de sucesso. */
const WHATSAPP = '556120994303';
// PENDENTE: webhook n8n do funil Vyzo
const WEBHOOK_URL = 'https://n8n.vyzar.com.br/webhook/neyap-site-lead';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
const VENDEDORES = ['1 a 3', '4 a 8', '9 ou mais'];
// Vídeo de 2 min do sistema (embed do YouTube, ex.: https://www.youtube-nocookie.com/embed/ID). Vazio = sem vídeo.
const VIDEO_URL = '';
// Insights de exemplo, só leitura e sem login. Vazio = sem botão.
const INSIGHTS_DEMO_URL = '';

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
      <h2 id="demo-titulo" class="pr-10 text-[24px] font-extrabold leading-tight text-neyap-ink">Ver demonstração</h2>
      <p class="mt-2 text-[14.5px] leading-relaxed text-neyap-muted">A equipe mostra o Neyap e o Insights com uma loja de exemplo. Chamamos você no WhatsApp no mesmo dia útil.</p>
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
      <fieldset class="mt-4">
        <legend class="${rotulo}">Quantos vendedores atendem no WhatsApp?</legend>
        <div class="mt-2 grid grid-cols-3 gap-2">${VENDEDORES.map((v, i) => `<label class="demo-chip"><input type="radio" name="vendedores" value="${v}"${i === 0 ? ' checked' : ''}><span>${v}</span></label>`).join('')}</div>
      </fieldset>
      <button type="submit" class="btn-primary mt-6 w-full">Quero ver a demonstração</button>
      <p class="mt-3 text-[12.5px] leading-relaxed text-neyap-muted">Ao enviar, você concorda com a nossa <a href="/privacidade/" class="underline hover:text-neyap-brand-deep">Política de Privacidade</a>. Usamos seus dados só para falar com você sobre o Neyap.</p>
    </form>
    <div id="demo-ok" hidden tabindex="-1" class="outline-none">
      <h2 class="pr-10 text-[24px] font-extrabold leading-tight text-neyap-ink">Recebemos seu pedido</h2>
      <p class="mt-3 text-[15px] leading-relaxed text-neyap-body">A equipe chama você no WhatsApp no mesmo dia útil, em horário comercial, para mostrar o Neyap.</p>
      ${VIDEO_URL ? `<div class="mt-5 aspect-video overflow-hidden rounded-xl bg-neyap-ink"><iframe src="${VIDEO_URL}" title="Demonstração do Neyap em 2 minutos" class="h-full w-full" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>` : ''}
      ${INSIGHTS_DEMO_URL ? `<a href="${INSIGHTS_DEMO_URL}" target="_blank" rel="noopener" class="btn-primary mt-5 w-full">Abrir o Insights de exemplo</a>` : ''}
      <p class="mt-6 text-[14px] text-neyap-muted">Prefere falar agora?</p>
      <a id="demo-ok-link" href="#" target="_blank" rel="noopener" class="btn-ghost mt-2 w-full">Abrir o WhatsApp</a>
    </div>
  </div>`;
document.body.appendChild(root);

const dialog = root.firstElementChild;
const form = root.querySelector('#demo-form');
const ok = root.querySelector('#demo-ok');
const nomeEl = root.querySelector('#demo-nome');
const zapEl = root.querySelector('#demo-zap');
const empresaEl = root.querySelector('#demo-empresa');
let ultimoBotao = null;

function focaveis() {
  return Array.from(dialog.querySelectorAll('button, a[href], input, select, iframe, [tabindex="0"]')).filter((el) => !el.closest('[hidden]'));
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
  const vendedores = (form.querySelector('input[name="vendedores"]:checked') || {}).value || '';
  let msg = 'Olá, quero ver a demonstração do Neyap. Nome: ' + nome + '. Empresa: ' + (empresa || 'não informada') + '. Vendedores: ' + vendedores + '.';
  const ref = [utms.utm_source, utms.utm_medium, utms.utm_campaign].filter(Boolean).join('/');
  if (ref) msg += '\nref: ' + ref;
  const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

  try { window.neyapTrack?.('Lead', { interesse: 'demonstracao', vendedores }); } catch (e) { /* sem rastreio */ }

  if (WEBHOOK_URL) {
    try {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, whatsapp: zapEl.value, empresa, vendedores, segmento: 'Vendedores: ' + vendedores, interesse: 'demonstracao', pagina: window.location.href, utms, ...fbIds() }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) { /* nao bloqueia */ }
  }

  form.hidden = true;
  root.querySelector('#demo-ok-link').href = url;
  ok.hidden = false;
  ok.focus();
});
