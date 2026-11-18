/* LP /gestao-de-trafego/ (2026-11-18, fase 2 do plano de venda de gestão de tráfego).
   1. Extrato do hero: contagem dos números e barras de motivo ao entrar na tela.
   2. Manifesto: palavras acendem conforme a rolagem.
   3. Formulário inline de proposta.
   Com prefers-reduced-motion: reduce, tudo nasce no estado final. */
const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- 1. Extrato -------------------------------------------------------- */
const extrato = document.querySelector('[data-extrato]');
if (extrato && !reduz && 'IntersectionObserver' in window) {
  const nums = extrato.querySelectorAll('[data-conta]');
  extrato.classList.add('extrato-pronto');
  nums.forEach((el) => { el.textContent = '0'; });
  const io = new IntersectionObserver((ents) => {
    if (!ents.some((e) => e.isIntersecting)) return;
    io.disconnect();
    extrato.classList.add('extrato-ativo');
    nums.forEach((el, i) => {
      const fim = Number(el.dataset.conta);
      const dur = 1100;
      const atraso = 180 * i;
      let t0 = null;
      const passo = (t) => {
        if (t0 === null) t0 = t + atraso;
        const p = Math.min(1, Math.max(0, (t - t0) / dur));
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(fim * e).toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }, { threshold: 0.35 });
  io.observe(extrato);
}

/* ---- 2. Manifesto ------------------------------------------------------ */
const manifesto = document.querySelector('[data-manifesto]');
if (manifesto && !reduz && 'IntersectionObserver' in window) {
  const palavras = manifesto.textContent.trim().split(/\s+/);
  manifesto.setAttribute('aria-label', manifesto.textContent.trim());
  manifesto.innerHTML = palavras.map((p) => `<span class="mp" aria-hidden="true">${p}</span>`).join(' ');
  manifesto.classList.add('manifesto-vivo');
  const spans = manifesto.querySelectorAll('.mp');
  let visivel = false;
  let pedido = false;
  const atualizar = () => {
    pedido = false;
    const r = manifesto.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 quando o topo da frase entra a 85% da tela, 1 quando o fim passa de 45%
    const ini = vh * 0.85;
    const fim = vh * 0.45;
    const p = Math.min(1, Math.max(0, (ini - r.top) / (ini - fim + r.height)));
    const n = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle('on', i < n));
  };
  const pedir = () => { if (visivel && !pedido) { pedido = true; requestAnimationFrame(atualizar); } };
  new IntersectionObserver((ents) => { visivel = ents[0].isIntersecting; pedir(); }).observe(manifesto);
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir, { passive: true });
}

/* ---- 3. Formulário ----------------------------------------------------- */
const WHATSAPP = '556120994303';
// Mesmo webhook do site. O n8n separa pelo campo interesse = 'gestao-trafego'.
// PENDENTE (fase 2, passo 3): testar de ponta a ponta no n8n e no funil 7 antes de publicar.
const WEBHOOK_URL = 'https://n8n.vyzar.com.br/webhook/neyap-site-lead';
// Fora de neyap.com.br (prévia local), o envio é simulado: nada vai para o n8n nem para o CRM.
const ENVIO_REAL = /(^|\.)neyap\.com\.br$/.test(window.location.hostname);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

function lerUtms() {
  const out = {};
  let salvo = {};
  try { salvo = JSON.parse(sessionStorage.getItem('neyap_utms') || '{}'); } catch (e) { salvo = {}; }
  const q = new URLSearchParams(window.location.search);
  let mudou = false;
  UTM_KEYS.forEach((k) => {
    const v = q.get(k);
    if (v && !salvo[k]) { salvo[k] = v.slice(0, 200); mudou = true; }
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

const form = document.getElementById('trafego-form');
if (form) {
  const ok = document.getElementById('tf-ok');
  const falha = document.getElementById('tf-falha');
  const zap = document.getElementById('tf-zap');
  const campos = {
    nome: [document.getElementById('tf-nome'), 'tf-e-nome', (v) => v.length >= 2],
    whatsapp: [zap, 'tf-e-zap', (v) => { const d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 11 && parseInt(d.slice(0, 2), 10) >= 11; }],
    empresa: [document.getElementById('tf-empresa'), 'tf-e-empresa', (v) => v.length >= 2],
    cidade: [document.getElementById('tf-cidade'), 'tf-e-cidade', (v) => v.length >= 2],
    segmento: [document.getElementById('tf-segmento'), 'tf-e-segmento', (v) => v.length >= 2],
  };
  let origem = 'direto';

  // Todo CTA rola até o formulário, guarda de onde veio e marca o plano, se veio de um cartão de preço.
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-proposta]');
    if (!b) return;
    e.preventDefault();
    origem = b.dataset.placement || origem;
    if (b.dataset.plano) {
      const r = form.querySelector(`input[name="plano"][value="${b.dataset.plano}"]`);
      if (r) r.checked = true;
    }
    document.getElementById('proposta').scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => campos.nome[0].focus({ preventScroll: true }), reduz ? 0 : 600);
  });

  zap.addEventListener('input', () => {
    const d = zap.value.replace(/\D/g, '').slice(0, 11);
    let s = d;
    if (d.length > 6) s = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4);
    else if (d.length > 2) s = '(' + d.slice(0, 2) + ') ' + d.slice(2);
    else if (d.length) s = '(' + d;
    zap.value = s;
  });

  const erro = (el, id, mostrar) => {
    document.getElementById(id).hidden = !mostrar;
    el.setAttribute('aria-invalid', mostrar ? 'true' : 'false');
    if (mostrar) el.setAttribute('aria-describedby', id); else el.removeAttribute('aria-describedby');
  };
  Object.values(campos).forEach(([el, id]) => el.addEventListener('input', () => erro(el, id, false)));

  const linkWhats = (d) => {
    const msg = `Olá, quero uma proposta de gestão de tráfego. Nome: ${d.nome}. Empresa: ${d.empresa}, ${d.cidade}. Vende: ${d.segmento}. Plano: ${d.plano}. Anuncia hoje: ${d.anuncia}.`;
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  };

  const sucesso = (d) => {
    form.hidden = true;
    document.getElementById('tf-ok-nome').textContent = d.nome.split(' ')[0];
    document.getElementById('tf-ok-link').href = linkWhats(d);
    ok.hidden = false;
    ok.focus();
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    falha.hidden = true;
    let primeiroErro = null;
    for (const [el, id, valido] of Object.values(campos)) {
      const bad = !valido(el.value.trim());
      erro(el, id, bad);
      if (bad && !primeiroErro) primeiroErro = el;
    }
    if (primeiroErro) { primeiroErro.focus(); return; }
    if (form.site.value) return; // honeypot

    const v = (n) => campos[n][0].value.trim();
    const marcado = (n) => (form.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
    const digitos = zap.value.replace(/\D/g, '');
    const d = {
      nome: v('nome'), whatsapp: zap.value, whatsapp_e164: '+55' + digitos,
      empresa: v('empresa'), cidade: v('cidade'), segmento: v('segmento'),
      plano: marcado('plano'), anuncia: marcado('anuncia'),
    };
    const payload = {
      ...d, interesse: 'gestao-trafego', origem_cta: origem,
      pagina: window.location.href, referrer: document.referrer || '', utms, ...fbIds(),
    };

    // Conversão própria (LeadTrafego, ação 7907945504 no Google Ads). Dispara só quando o n8n responde {"ok": true},
    // a mesma regra da /autopecas/. Não usa 'Lead', que é a conversão da campanha de CRM.

    if (!ENVIO_REAL) {
      console.info('[prévia] envio simulado, nada saiu do navegador:', payload);
      sucesso(d);
      return;
    }

    const botao = form.querySelector('button[type="submit"]');
    // O n8n leva perto de 3 s (cria contato e card antes de responder). O botão avisa que está enviando.
    const textoBotao = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Enviando...';
    botao.setAttribute('aria-busy', 'true');
    const ctrl = new AbortController();
    const tempo = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: ctrl.signal, keepalive: true,
      });
      if (!r.ok) throw new Error('status ' + r.status);
      const resp = await r.json().catch(() => ({}));
      if (resp && resp.ok === true) {
        try { window.neyapTrack?.('LeadTrafego', { interesse: 'gestao-trafego', plano: d.plano }); } catch (e) { /* sem rastreio */ }
      }
      sucesso(d);
    } catch (e) {
      // Os campos ficam preenchidos. O lead pode mandar os mesmos dados pelo WhatsApp.
      falha.innerHTML = `Não conseguimos enviar agora. <a class="underline font-semibold" target="_blank" rel="noopener" href="${linkWhats(d)}">Mande pelo WhatsApp</a> com os dados já preenchidos.`;
      falha.hidden = false;
    } finally {
      clearTimeout(tempo);
      botao.disabled = false;
      botao.textContent = textoBotao;
      botao.removeAttribute('aria-busy');
    }
  });
}
