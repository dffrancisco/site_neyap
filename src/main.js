import './style.css';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------- */
/* Sticky nav                                                              */
/* ---------------------------------------------------------------------- */
const header = document.getElementById('site-header');
const navShell = document.getElementById('nav-shell');

function updateNavOnScroll() {
  const scrolled = window.scrollY > 12;
  navShell.classList.toggle('bg-white/80', scrolled);
  navShell.classList.toggle('backdrop-blur-xl', scrolled);
  navShell.classList.toggle('border-neyap-border', scrolled);
  navShell.classList.toggle('shadow-[0_8px_30px_-15px_rgba(17,24,39,0.15)]', scrolled);
}
updateNavOnScroll();
window.addEventListener('scroll', updateNavOnScroll, { passive: true });

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
/* Scroll reveal                                                           */
/* ---------------------------------------------------------------------- */
const revealTargets = document.querySelectorAll('.reveal, .reveal-scale');

if (prefersReducedMotion) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));
}

/* ---------------------------------------------------------------------- */
/* Animated counters                                                       */
/* ---------------------------------------------------------------------- */
const counters = document.querySelectorAll('.counter');

function animateCounter(el) {
  const target = Number(el.dataset.target);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const duration = 1600;
  const start = performance.now();

  if (prefersReducedMotion) {
    el.textContent = `${prefix}${target}${suffix}`;
    return;
  }

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = `${prefix}${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);
counters.forEach((el) => counterObserver.observe(el));

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
