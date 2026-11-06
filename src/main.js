import './style.css';
import './motion.js';
import './demo-form.js';

/* ---------------------------------------------------------------------- */
/* Sticky nav                                                              */
/* ---------------------------------------------------------------------- */
const header = document.getElementById('site-header');
const navShell = document.getElementById('nav-shell');

function updateNavOnScroll() {
  const scrolled = window.scrollY > 12;
  navShell.classList.toggle('border-neyap-border', scrolled);
  navShell.classList.toggle('border-white/60', !scrolled);
}
updateNavOnScroll();
window.addEventListener('scroll', updateNavOnScroll, { passive: true });

/* ---------------------------------------------------------------------- */
/* Botão flutuante de WhatsApp: aparece depois de rolar além do hero       */
/* ---------------------------------------------------------------------- */
const waFloat = document.querySelector('[data-wa-float]');
if (waFloat) {
  const hero = document.querySelector('main section, section');
  const limite = () => Math.max(600, hero ? hero.offsetHeight : 0);
  const atualizaFloat = () => {
    const show = window.scrollY > limite();
    waFloat.classList.toggle('opacity-0', !show);
    waFloat.classList.toggle('translate-y-4', !show);
    waFloat.classList.toggle('invisible', !show);
    waFloat.classList.toggle('pointer-events-none', !show);
  };
  atualizaFloat();
  window.addEventListener('scroll', atualizaFloat, { passive: true });
}

/* ---------------------------------------------------------------------- */
/* Mobile menu                                                             */
/* ---------------------------------------------------------------------- */
const menuToggle = document.getElementById('menu-toggle');
const mobilePanel = document.getElementById('mobile-panel');
const menuIconOpen = document.getElementById('menu-icon-open');
const menuIconClose = document.getElementById('menu-icon-close');

menuToggle?.addEventListener('click', () => {
  const isOpen = mobilePanel.classList.toggle('flex');
  mobilePanel.classList.toggle('hidden');
  menuIconOpen.classList.toggle('hidden');
  menuIconClose.classList.toggle('hidden');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

mobilePanel?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobilePanel.classList.add('hidden');
    mobilePanel.classList.remove('flex');
    menuIconOpen.classList.remove('hidden');
    menuIconClose.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------------------------------------------------------------------- */
/* FAQ accordion                                                           */
/* ---------------------------------------------------------------------- */
document.querySelectorAll('.faq-trigger').forEach((trigger) => {
  const panel = trigger.nextElementSibling;

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';

    document.querySelectorAll('.faq-trigger').forEach((otherTrigger) => {
      if (otherTrigger === trigger) return;
      otherTrigger.setAttribute('aria-expanded', 'false');
      otherTrigger.nextElementSibling.classList.remove('is-open');
    });

    trigger.setAttribute('aria-expanded', String(!isOpen));
    panel.classList.toggle('is-open', !isOpen);
  });
});

/* ---------------------------------------------------------------------- */
/* Perfil tabs                                                             */
/* ---------------------------------------------------------------------- */
const tabTriggers = document.querySelectorAll('.tab-trigger');
const tabPanels = document.querySelectorAll('.tab-panel');

tabTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const target = trigger.dataset.tab;

    tabTriggers.forEach((t) => {
      t.classList.toggle('is-active', t === trigger);
      t.setAttribute('aria-selected', String(t === trigger));
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.panel === target);
    });
  });
});

/* ---------------------------------------------------------------------- */
/* Footer year                                                             */
/* ---------------------------------------------------------------------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* ---- Medição com consentimento (LGPD) ------------------------------------
   Google Ads: tag AW-18524104629 desde 2026-10-19. Rótulo de conversão vazio
   = evento não enviado ao Google. Sem ID preenchido, nada é carregado.
   GA4: GA4_ID desde 2026-11-06, mesmo gtag.js e mesmo consentimento. */
const META_PIXEL_ID = '2172709736997376';
const GOOGLE_TAG_ID = 'AW-18524104629';
// GA4 do site Neyap (ID de medição G-...). Vazio = GA4 não carrega.
const GA4_ID = 'G-3R888MF5W9';
// Rótulo de cada ação de conversão do Google Ads, ex.: 'AW-18524104629/abcDEF123'
// Lead: ação 7889834389 "NEYAP Lead formulario autopecas" (2026-11-04). Contact fica vazio de propósito:
// a conversão é só o formulário (Kallebe, 2026-11-04), clique no WhatsApp não conta.
const GOOGLE_CONVERSIONS = { Lead: 'AW-18524104629/ceeqCJWjlbIdELXP_YBF', Contact: '' };

const CONSENT_KEY = 'neyap-consent';
const readConsent = () => { try { return localStorage.getItem(CONSENT_KEY); } catch { return null; } };
const saveConsent = (v) => { try { localStorage.setItem(CONSENT_KEY, v); } catch { /* sem storage */ } };

function loadTrackers() {
  if (META_PIXEL_ID && !window.fbq) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  const googleIds = [GOOGLE_TAG_ID, GA4_ID].filter(Boolean);
  if (googleIds.length && !window.gtag) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    googleIds.forEach((id) => window.gtag('config', id));
  }
  enviarSecoes();
}

// Chamado pelas páginas no envio de formulário: window.neyapTrack('Lead', {...})
window.neyapTrack = (evento, dados = {}) => {
  if (readConsent() !== 'sim') return;
  if (window.fbq) window.fbq('track', evento, dados);
  const sendTo = GOOGLE_CONVERSIONS[evento];
  if (window.gtag && sendTo) window.gtag('event', 'conversion', { send_to: sendTo });
  // GA4: generate_lead (evento recomendado) no formulário, contact_whatsapp no clique no WhatsApp.
  const ga4Evento = { Lead: 'generate_lead', Contact: 'contact_whatsapp' }[evento];
  if (window.gtag && GA4_ID && ga4Evento) window.gtag('event', ga4Evento, { ...dados, send_to: GA4_ID });
};

// Contact: clique em qualquer link de WhatsApp (delegação, cobre links gerados por JS)
document.addEventListener('click', (e) => {
  const a = e.target?.closest?.('a[href]');
  if (!a) return;
  const h = a.getAttribute('href') || '';
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)(\/|\?|$)/i.test(h)) {
    try { window.neyapTrack?.('Contact'); } catch { /* sem rastreio */ }
  }
}, true);

// Seções vistas (2026-11-06): evento secao_vista no GA4 quando o topo da seção passa da metade da tela.
// Fica só na memória até o aceite. Com o aceite, envia as seções já vistas e as próximas.
const secoesVistas = [];
const secoesEnviadas = new Set();
function enviarSecoes() {
  if (!window.gtag || !GA4_ID || readConsent() !== 'sim') return;
  secoesVistas.forEach((s) => {
    if (secoesEnviadas.has(s.id)) return;
    secoesEnviadas.add(s.id);
    window.gtag('event', 'secao_vista', { secao: s.id, secao_ordem: s.ordem, send_to: GA4_ID });
  });
}
const secoesPagina = Array.from(document.querySelectorAll('main section[id]'));
if (GA4_ID && secoesPagina.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      secoesVistas.push({ id: e.target.id, ordem: secoesPagina.indexOf(e.target) + 1 });
    });
    enviarSecoes();
  }, { rootMargin: '0px 0px -50% 0px' });
  secoesPagina.forEach((s) => io.observe(s));
}

if (META_PIXEL_ID || GOOGLE_TAG_ID || GA4_ID) {
  const c = readConsent();
  if (c === 'sim') loadTrackers();
  else if (c !== 'nao') {
    const bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    // Banner baixo (revisão de conversão 2026-11-04): no celular ele não pode cobrir o botão do topo.
    // 2026-11-06: "Aceitar todos" e "Só os essenciais" (= recusar), do mesmo tamanho, como pede o guia de
    // cookies da ANPD (recusa fácil de ver no primeiro aviso). Texto com o motivo e aviso um pouco mais visível.
    // 2026-11-06: "Aceitar todos" maior que "Só os essenciais" (decisão do Kallebe, ressalva da ANPD registrada).
    // Cor e borda aqui; tamanho e posição em src/style.css (.ck-*), por altura de tela, sem cobrir o botão do topo.
    bar.className = 'ck-bar rounded-2xl border-2 border-neyap-brand/40 bg-white text-neyap-body shadow-2xl';
    bar.innerHTML = '<span class="ck-texto"><strong class="ck-titulo text-neyap-ink">Cookies e privacidade</strong>Usamos cookies para saber quais anúncios funcionam e melhorar o site. Não vendemos seus dados. <a href="/privacidade/" class="underline">Saiba mais</a>.</span>'
      + '<span class="ck-botoes"><button data-c="sim" class="ck-sim rounded-full bg-neyap-brand text-white shadow-md">Aceitar todos</button>'
      + '<button data-c="nao" class="ck-nao rounded-full border border-neyap-border text-neyap-ink">Só os essenciais</button></span>';
    bar.addEventListener('click', (e) => {
      const v = e.target?.dataset?.c;
      if (!v) return;
      saveConsent(v);
      bar.remove();
      if (v === 'sim') loadTrackers();
    });
    document.body.appendChild(bar);
  }
}
