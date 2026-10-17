/* Motion do site (GSAP + ScrollTrigger).
   Regras: o HTML nasce visível. O estado inicial só é aplicado aqui, quando o motion roda.
   Com prefers-reduced-motion: reduce, nada roda e tudo fica no estado final.
   O script inline no <head> adiciona html.mo (esconde só o hero até a entrada rodar)
   e remove a classe sozinho se este módulo não carregar. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const root = document.documentElement;
const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function liberarHero() {
  window.__mo = true;
  root.classList.remove('mo');
}

if (reduz) {
  liberarHero();
} else {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.8 });
  window.__mo = true;
  iniciar();
}

/* Durante a animação, tira a transition de CSS (hover etc.) para não brigar com o GSAP. */
const SEM_TRANS = 'm-run';
function limpar(alvos) {
  gsap.utils.toArray(alvos).forEach((el) => {
    el.classList.remove(SEM_TRANS);
    gsap.set(el, { clearProps: 'transform,opacity,visibility' });
  });
}

/* Quebra o texto do título em palavras com máscara, preservando spans internos. */
function quebrarPalavras(el) {
  const palavras = [];
  const walk = (node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const partes = n.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        partes.forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          const w = document.createElement('span');
          w.className = 'm-w';
          const i = document.createElement('span');
          i.className = 'm-wi';
          i.textContent = p;
          w.appendChild(i);
          frag.appendChild(w);
          palavras.push(i);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(el);
  return palavras;
}

function hero() {
  const itens = gsap.utils.toArray('[data-m-hero]');
  if (!itens.length) { liberarHero(); return; }
  const titulo = document.querySelector('[data-m-hero="titulo"]');
  const palavras = titulo ? quebrarPalavras(titulo) : [];
  const telas = gsap.utils.toArray('[data-m-hero="tela"]');
  const resto = itens.filter((el) => el !== titulo && !telas.includes(el));

  gsap.set(palavras, { yPercent: 110 });
  gsap.set(resto, { autoAlpha: 0, y: 24 });
  gsap.set(telas, { autoAlpha: 0, y: 40, scale: 0.96 });
  [...resto, ...telas].forEach((el) => el.classList.add(SEM_TRANS));
  root.classList.remove('mo');

  const ordem = (nome) => resto.filter((el) => el.dataset.mHero === nome);
  const tl = gsap.timeline({ delay: 0.1, onComplete: () => { limpar([...resto, ...telas]); gsap.set(palavras, { clearProps: 'transform' }); } });
  tl.to(ordem('eyebrow'), { autoAlpha: 1, y: 0, duration: 0.6 })
    .to(palavras, { yPercent: 0, duration: 0.9, stagger: 0.045 }, '-=0.35')
    .to(ordem('texto'), { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.6')
    .to(ordem('botoes'), { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.5')
    .to(ordem('nota'), { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.5')
    .to(telas, { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: 0.14 }, 0.35);
}

function contadores() {
  const fmt = new Intl.NumberFormat('pt-BR');
  gsap.utils.toArray('[data-m-count]').forEach((el) => {
    const fim = Number(el.dataset.mCount);
    const pre = el.dataset.prefix || '';
    const suf = el.dataset.suffix || '';
    const final = `${pre}${fmt.format(fim)}${suf}`;
    // Reserva a largura final para o número não empurrar nada (sem CLS).
    el.style.display = 'inline-block';
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    const obj = { v: 0 };
    el.textContent = `${pre}0${suf}`;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: fim,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => { el.textContent = `${pre}${fmt.format(Math.round(obj.v))}${suf}`; },
          onComplete: () => { el.textContent = final; },
        });
      },
    });
  });
}

function parallax() {
  gsap.utils.toArray('[data-m-parallax]').forEach((img) => {
    const forca = Number(img.dataset.mParallax || 8);
    // A escala cobre o deslocamento nos dois sentidos, sem deixar faixa vazia na borda.
    gsap.set(img, { scale: 1 + (2 * forca + 2) / 100, transformOrigin: '50% 50%' });
    gsap.fromTo(img, { yPercent: -forca }, {
      yPercent: forca,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  });
}

function telas() {
  gsap.utils.toArray('[data-m-telas]').forEach((grupo) => {
    const itens = grupo.querySelectorAll('[data-m-tela]');
    if (!itens.length) return;
    itens.forEach((el) => el.classList.add(SEM_TRANS));
    gsap.from(itens, {
      autoAlpha: 0,
      y: 70,
      scale: 0.94,
      transformOrigin: '50% 100%',
      duration: 1,
      stagger: 0.16,
      scrollTrigger: { trigger: grupo, start: 'top 82%', once: true },
      onComplete: () => limpar(itens),
    });
  });
}

function reveals() {
  const alvos = gsap.utils.toArray('[data-m-reveal]');
  if (!alvos.length) return;
  gsap.set(alvos, { autoAlpha: 0, y: 32 });
  alvos.forEach((el) => el.classList.add(SEM_TRANS));
  ScrollTrigger.batch(alvos, {
    start: 'top 94%',
    once: true,
    onEnter: (lote) => gsap.to(lote, {
      autoAlpha: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.09,
      overwrite: true,
      onComplete: () => limpar(lote),
    }),
  });
}

function precos() {
  const sec = document.querySelector('[data-m-preco]');
  if (!sec) return;
  const plano = sec.querySelector('[data-m-plano]');
  const brilho = sec.querySelector('[data-m-brilho]');
  const extras = sec.querySelectorAll('[data-m-extra]');
  const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 72%', once: true } });
  if (plano) {
    plano.classList.add(SEM_TRANS);
    tl.from(plano, { autoAlpha: 0, y: 50, scale: 0.95, duration: 1, onComplete: () => limpar(plano) });
  }
  if (brilho) {
    tl.fromTo(brilho, { xPercent: -120, autoAlpha: 1 }, { xPercent: 260, duration: 1.3, ease: 'power2.inOut' }, '-=0.35')
      .set(brilho, { autoAlpha: 0 });
  }
  if (extras.length) {
    extras.forEach((el) => el.classList.add(SEM_TRANS));
    tl.from(extras, { autoAlpha: 0, x: 40, duration: 0.8, stagger: 0.1, onComplete: () => limpar(extras) }, plano ? 0.25 : 0);
  }
}

function iniciar() {
  hero();
  contadores();
  parallax();
  telas();
  reveals();
  precos();
  // Imagens lazy mudam a altura da página; recalcula os gatilhos quando carregam.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
