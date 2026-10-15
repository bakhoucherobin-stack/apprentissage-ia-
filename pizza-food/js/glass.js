/* Reflet du verre : la lumière suit la souris sur la plaque survolée (--gx / --gy). */
(() => {
  'use strict';
  const SEL = '.mode__card, .offer, .card, .panel, .stats-bar, .number, .rcard__inner, .infos__col, .co__panel, .co__sum, .co__sug, .co__addr, .checker form, .zone, .envie, .chip, .catbar a, .cmp__box, .modal__box, .showcase__drop, .star__burst';
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let cur = null, raf = 0, ev = null;
  const paint = () => {
    raf = 0;
    if (!cur || !ev) return;
    const r = cur.getBoundingClientRect();
    cur.style.setProperty('--gx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    cur.style.setProperty('--gy', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    // la bulle des pizzas stars porte son reflet sur le disque (::before)
    if (cur.classList.contains('star__burst')) cur.style.setProperty('--gy', ((ev.clientY - r.top) / r.height * 100 - 10).toFixed(1) + '%');
  };
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest(SEL);
    if (cur && cur !== t) { cur.style.removeProperty('--gx'); cur.style.removeProperty('--gy'); }
    cur = t; ev = e;
    if (cur && !raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
})();
