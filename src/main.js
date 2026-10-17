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
   PENDENTE: preencher os IDs quando a conta de anúncios da Vyzo existir.
   Sem ID preenchido, nada é carregado e o banner não aparece. */
const META_PIXEL_ID = '';
const GOOGLE_TAG_ID = ''; // ex.: AW-XXXXXXXXX ou G-XXXXXXX
const GOOGLE_LEAD_SEND_TO = ''; // ex.: AW-XXXXXXXXX/rotulo

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
  if (GOOGLE_TAG_ID && !window.gtag) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GOOGLE_TAG_ID);
  }
}

// Chamado pelas páginas no envio de formulário: window.neyapTrack('Lead', {...})
window.neyapTrack = (evento, dados = {}) => {
  if (readConsent() !== 'sim') return;
  if (window.fbq) window.fbq('track', evento, dados);
  if (window.gtag && GOOGLE_LEAD_SEND_TO && evento === 'Lead') window.gtag('event', 'conversion', { send_to: GOOGLE_LEAD_SEND_TO });
};

if (META_PIXEL_ID || GOOGLE_TAG_ID) {
  const c = readConsent();
  if (c === 'sim') loadTrackers();
  else if (c !== 'nao') {
    const bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookies');
    bar.className = 'fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-neyap-border bg-white p-4 text-[14px] text-neyap-body shadow-xl';
    bar.innerHTML = 'Usamos cookies do Meta e do Google para medir nossos anúncios. <a href="/privacidade/" class="underline">Saiba mais</a>.'
      + '<div class="mt-3 flex gap-2"><button data-c="sim" class="rounded-full bg-neyap-brand px-4 py-2 font-semibold text-white">Aceitar</button>'
      + '<button data-c="nao" class="rounded-full border border-neyap-border px-4 py-2">Recusar</button></div>';
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
