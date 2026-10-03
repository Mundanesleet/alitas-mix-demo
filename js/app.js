/* Las Alitas Mix · lógica de la página (carrusel de salsas, menú, arma tu combo).
   Los datos editables están en config.js. */
(() => {
'use strict';
const { CONFIG, SALSAS, IMG } = window.ALITAS;

/* ============================================================ */
const $ = (s) => document.querySelector(s);
const N = SALSAS.length;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mqMobile = window.matchMedia('(max-width: 720px)');
const money = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const waLink = (text) => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);

/* ---------- Hero ---------- */
const hero = $('#inicio');
const stage = $('#stage');
const giant = $('#giant');
// Índice "virtual": solo sube o baja, nunca vuelve a 0, así el carrusel es un bucle continuo sin saltos.
let v = Math.max(0, SALSAS.findIndex((s) => s.id === CONFIG.salsaInicial));
const cur = () => ((v % N) + N) % N;
let hold = false, heroVisible = true, timer = null;
const autoplay = !reduce;

const slides = SALSAS.map((s) => {
  const el = document.createElement('div');
  el.className = 'slide';
  const bowl = new Image(); bowl.src = IMG.bowl; bowl.alt = ''; bowl.className = 'bowl'; bowl.draggable = false;
  const wings = new Image(); wings.src = IMG[s.id]; wings.alt = 'Alitas con salsa ' + s.nombre; wings.className = 'wings'; wings.draggable = false;
  el.append(bowl, wings);
  stage.append(el);
  return { el, wings, s, pos: null };
});

// Posiciones según la distancia al plato central (-3 … 4). Los de los extremos están ocultos.
const SLOTS = {
  d: {
    '-3': { x: -130, y: 14, s: .2, o: 0, z: 0 }, '-2': { x: -98, y: 14, s: .28, o: 0, z: 0 }, '-1': { x: -70, y: 8, s: .4, o: 0, z: 1 },
    '0': { x: 0, y: 0, s: 1, o: 1, z: 3 },
    '1': { x: 64, y: 10, s: .4, o: 1, z: 2 }, '2': { x: 98, y: 14, s: .28, o: .55, z: 1 }, '3': { x: 130, y: 14, s: .2, o: 0, z: 0 }, '4': { x: 130, y: 14, s: .2, o: 0, z: 0 }
  },
  m: {
    '-3': { x: -150, y: 14, s: .25, o: 0, z: 0 }, '-2': { x: -125, y: 14, s: .3, o: 0, z: 1 }, '-1': { x: -66, y: 12, s: .46, o: 1, z: 2 },
    '0': { x: 0, y: 0, s: 1, o: 1, z: 3 },
    '1': { x: 66, y: 12, s: .46, o: 1, z: 2 }, '2': { x: 125, y: 14, s: .3, o: 0, z: 1 }, '3': { x: 150, y: 14, s: .25, o: 0, z: 0 }, '4': { x: 150, y: 14, s: .25, o: 0, z: 0 }
  }
};

function layout(instant) {
  const set = mqMobile.matches ? SLOTS.m : SLOTS.d;
  const c = cur();
  slides.forEach((sl, i) => {
    const rel = (i - c + N) % N;
    const sg = rel > N / 2 ? rel - N : rel;
    const p = set[String(sg)];
    // Si un plato pasa de un extremo oculto al otro, se reubica sin animación (no se ve).
    const teleport = instant || (sl.pos !== null && Math.abs(sg - sl.pos) > 1);
    if (teleport) sl.el.style.transition = 'none';
    sl.el.style.transform = 'translate(' + p.x + '%,' + p.y + '%) scale(' + p.s + ')';
    sl.el.style.opacity = p.o;
    sl.el.style.zIndex = p.z;
    sl.el.setAttribute('aria-hidden', sg === 0 ? 'false' : 'true');
    if (teleport) { void sl.el.offsetWidth; sl.el.style.transition = ''; }
    sl.pos = sg;
  });
}

function drop(img, late) {
  if (reduce) return;
  img.classList.remove('drop', 'late');
  void img.offsetWidth;
  img.classList.add('drop');
  if (late) img.classList.add('late');
}

// Celular: el nombre viejo y el nuevo se deslizan juntos (uno empuja al otro), al mismo ritmo que los platos.
// La duración y la curva deben coincidir con la transición de .slide en el CSS de celular.
const EASE = 'cubic-bezier(.4, 0, .2, 1)';
const SLIDE_MS = 1400;
let nameIn = null, ghost = null;
function clearName() {
  if (nameIn) { nameIn.cancel(); nameIn = null; }
  if (ghost) { ghost.remove(); ghost = null; }
}
function slideName(d, text) {
  clearName();
  giant.classList.remove('swap');
  // Parte desde donde lo dejó el dedo (si se estaba arrastrando).
  const off = parseFloat((giant.style.transform.match(/-?[\d.]+/) || [0])[0]);
  const fromO = +(giant.style.opacity || 1);
  giant.style.transform = ''; giant.style.opacity = '';
  const w = giant.offsetWidth, dist = hero.clientWidth;
  // Copia del nombre actual, encima del original, que sale de pantalla.
  ghost = giant.cloneNode(true);
  ghost.removeAttribute('id');
  ghost.style.cssText = 'position:absolute;margin:0;left:' + giant.offsetLeft + 'px;top:' + giant.offsetTop + 'px;width:' + w + 'px;height:' + giant.offsetHeight + 'px';
  giant.after(ghost);
  const g = ghost;
  g.animate([
    { transform: 'translateX(' + off + 'px)', opacity: fromO },
    { transform: 'translateX(' + (-d * dist) + 'px)', opacity: 0 }
  ], { duration: SLIDE_MS, easing: EASE, fill: 'forwards' }).onfinish = () => { g.remove(); if (ghost === g) ghost = null; };
  giant.textContent = text;
  nameIn = giant.animate([
    { transform: 'translateX(' + (off + d * dist) + 'px)', opacity: .2 },
    { transform: 'none', opacity: 1 }
  ], { duration: SLIDE_MS, easing: EASE });
}

function paintTexts(animate, d) {
  const s = SALSAS[cur()];
  const text = s.nombre.toUpperCase();
  if (animate && !reduce && mqMobile.matches) slideName(d || 1, text);
  else {
    giant.textContent = text;
    if (animate && !reduce) { giant.classList.remove('swap'); void giant.offsetWidth; giant.classList.add('swap'); }
  }
  hero.style.setProperty('--glow', s.color);
  $('#count').textContent = (cur() + 1) + ' de ' + N;
  $('#sr').textContent = 'Salsa ' + s.nombre;
}

function step(d, user) {
  v += d;
  layout(false);
  paintTexts(true, d);
  drop(slides[cur()].wings, true);
  if (user) restart();
}

function tick() {
  if (autoplay && !hold && heroVisible && !document.hidden) step(1, false);
}
function restart() {
  clearInterval(timer);
  timer = setInterval(tick, CONFIG.carruselMs);
}

$('#prevBtn').addEventListener('click', () => step(-1, true));
$('#nextBtn').addEventListener('click', () => step(1, true));
stage.addEventListener('mouseenter', () => { hold = true; });
stage.addEventListener('mouseleave', () => { hold = false; });
$('#controls').addEventListener('focusin', () => { hold = true; });
$('#controls').addEventListener('focusout', () => { hold = false; });
let sx = null, sy = null, drag = null; // drag: null = sin decidir, true = horizontal, false = vertical
const lerp = (a, b, t) => a + (b - a) * t;

// Celular: mientras el dedo arrastra, los platos se mueven entre su posición y la siguiente, y el nombre lo acompaña.
function dragTo(dx) {
  const set = SLOTS.m;
  const p = Math.max(-1, Math.min(1, dx / (stage.offsetWidth * .66)));
  const t = Math.abs(p), sh = p < 0 ? -1 : 1;
  slides.forEach((sl) => {
    const a = set[String(sl.pos)];
    const b = set[String(Math.max(-3, Math.min(4, sl.pos + sh)))];
    sl.el.style.transform = 'translate(' + lerp(a.x, b.x, t) + '%,' + lerp(a.y, b.y, t) + '%) scale(' + lerp(a.s, b.s, t) + ')';
    sl.el.style.opacity = lerp(a.o, b.o, t);
  });
  giant.style.transform = 'translateX(' + (dx * .6) + 'px)';
  giant.style.opacity = 1 - t * .7;
}
function endDrag(dx) {
  slides.forEach((sl) => { sl.el.style.transition = ''; });
  hold = false;
  if (Math.abs(dx) > 45) { step(dx < 0 ? 1 : -1, true); return; }
  // No alcanzó: todo vuelve a su sitio.
  layout(false);
  const fromT = giant.style.transform, fromO = giant.style.opacity;
  giant.style.transform = ''; giant.style.opacity = '';
  giant.animate([{ transform: fromT, opacity: fromO }, { transform: 'none', opacity: 1 }], { duration: 600, easing: EASE });
  restart();
}

hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; drag = null; }, { passive: true });
hero.addEventListener('touchmove', (e) => {
  if (sx === null || reduce || !mqMobile.matches || drag === false) return;
  const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
  if (drag === null) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag = Math.abs(dx) > Math.abs(dy) * 1.3;
    if (!drag) return;
    hold = true;
    slides.forEach((sl) => { sl.el.style.transition = 'none'; });
    // Si el nombre aún se estaba animando, queda fijo en la salsa actual.
    clearName();
  }
  dragTo(dx);
}, { passive: true });
hero.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = sy = null;
  if (drag) { drag = null; endDrag(dx); return; }
  drag = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1, true);
}, { passive: true });
hero.addEventListener('touchcancel', () => { if (drag) endDrag(0); sx = sy = drag = null; }, { passive: true });
if (mqMobile.addEventListener) mqMobile.addEventListener('change', () => layout(true));

layout(true); paintTexts(false);
if (!reduce) slides[cur()].wings.classList.add('drop', 'late');
restart();

/* ---------- Jueves 2x1 ---------- */
$('#jImg').src = IMG.jueves;
$('#jNote').textContent = CONFIG.jueves.horario;
$('#jCta').href = waLink('Hola, quiero aprovechar el 2x1 del jueves en Las Alitas Mix.');

/* ---------- Menú y precios ---------- */
const MENU = [
  { id: 'm-combos', titulo: 'Combos de alitas', sub: 'Incluyen papas a la francesa y gaseosa personal.', img: IMG.combos, items: CONFIG.combos.map((c) => ({ n: c.n + ' alitas', precio: c.precio })), cta: { t: 'Pedir este combo', href: '#arma' } },
  { id: 'm-familiares', titulo: 'Familiares', sub: 'Para compartir con amigos o familia.', img: IMG.familiares, items: CONFIG.familiares, cta: { t: 'Pedir familiar', wa: 'Hola, quiero pedir un Familiar en Las Alitas Mix.' } },
  { id: 'm-costillitas', titulo: 'Costillitas', sub: 'Con papas a la francesa.', img: IMG.costillitas, items: CONFIG.costillitas, cta: { t: 'Pedir costillitas', wa: 'Hola, quiero pedir costillitas en Las Alitas Mix.' } }
];
$('#mgrid').innerHTML = MENU.map((m) =>
  '<article class="mcard" id="' + m.id + '"><div class="mimg"><img src="' + m.img + '" alt="' + m.titulo + '" loading="lazy">' +
  (m.temp ? '<span class="temp">Imagen temporal</span>' : '') + '</div><div class="mbody"><h3>' + m.titulo + '</h3><p>' + m.sub + '</p><ul class="plist">' +
  m.items.map((it) => '<li><span>' + it.n + '</span><b>' + money(it.precio) + '</b></li>').join('') + '</ul>' +
  '<a class="btn btn-red" ' + (m.cta.href ? 'href="' + m.cta.href + '"' : 'href="' + waLink(m.cta.wa) + '" target="_blank" rel="noopener"') + '>' + m.cta.t + '</a></div></article>'
).join('');
$('#extrasLine').innerHTML = '<strong>Adicionales:</strong> alitas, papas francesa, papita criolla, yuquitas, gaseosa y Hit.';

/* ---------- Arma tu combo ---------- */
const state = {
  combo: Math.max(0, CONFIG.combos.findIndex((c) => c.n === CONFIG.comboPorDefecto)),
  salsas: [CONFIG.salsaInicial],
  extras: {}
};
CONFIG.adicionales.forEach((a) => { state.extras[a.id] = 0; });

const qtyBtns = CONFIG.combos.map((c, i) => {
  const b = document.createElement('button');
  b.className = 'opt'; b.type = 'button';
  b.innerHTML = c.n + ' ALITAS<small>' + money(c.precio) + '</small>';
  b.addEventListener('click', () => { state.combo = i; trimSauces(); update(); });
  $('#optsQty').append(b);
  return b;
});

const chipBtns = SALSAS.map((s) => {
  const b = document.createElement('button');
  b.className = 'chip'; b.type = 'button'; b.style.setProperty('--c', s.color);
  b.innerHTML = '<i></i>' + s.nombre;
  b.addEventListener('click', () => {
    const r = b.getBoundingClientRect();
    const pos = state.salsas.indexOf(s.id);
    if (pos >= 0) { state.salsas.splice(pos, 1); update(false); return; }
    state.salsas.push(s.id);
    trimSauces();
    update(true, r);
  });
  $('#chips').append(b);
  return b;
});

const xRows = CONFIG.adicionales.map((a) => {
  const row = document.createElement('div'); row.className = 'xrow';
  row.innerHTML = '<div><strong>' + a.nombre + '</strong><span>' + money(a.precio) + ' *</span></div>' +
    '<div class="qty"><button type="button" aria-label="Quitar ' + a.nombre + '">−</button><output aria-live="polite">0</output><button type="button" aria-label="Agregar ' + a.nombre + '">+</button></div>';
  const [minus, plus] = row.querySelectorAll('button');
  minus.addEventListener('click', () => { if (state.extras[a.id] > 0) { state.extras[a.id]--; update(false); } });
  plus.addEventListener('click', () => { state.extras[a.id]++; update(false, plus.getBoundingClientRect(), '#F4B700'); });
  $('#extrasRows').append(row);
  return { a, out: row.querySelector('output') };
});

const prev = $('#prev');
const prevBowl = new Image(); prevBowl.src = IMG.bowl; prevBowl.alt = '';
const prevWings = new Image(); prevWings.alt = '';
prev.append(prevBowl, prevWings);
let prevSauce = null;

function maxSauces() { return CONFIG.combos[state.combo].salsas; }
function trimSauces() { while (state.salsas.length > maxSauces()) state.salsas.shift(); }

function fly(fromRect, color) {
  if (reduce || !fromRect) return;
  const to = prev.getBoundingClientRect();
  if (to.bottom < 0 || to.top > window.innerHeight) return;
  const sp = document.createElement('div'); sp.className = 'sprite'; sp.style.background = color;
  document.body.append(sp);
  const x0 = fromRect.left + fromRect.width / 2 - 16, y0 = fromRect.top + fromRect.height / 2 - 16;
  const x1 = to.left + to.width / 2 - 16, y1 = to.top + to.height / 2 - 16;
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 90;
  const a = sp.animate([
    { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)', opacity: 1 },
    { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1.15)', opacity: 1, offset: .5 },
    { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.5)', opacity: .9 }
  ], { duration: 700, easing: 'cubic-bezier(.4,.1,.3,1)' });
  a.onfinish = () => { sp.remove(); prev.classList.remove('pulse'); void prev.offsetWidth; prev.classList.add('pulse'); };
}

function update(animate, fromRect, color) {
  const combo = CONFIG.combos[state.combo];
  qtyBtns.forEach((b, i) => b.setAttribute('aria-pressed', i === state.combo ? 'true' : 'false'));
  chipBtns.forEach((b, i) => b.setAttribute('aria-pressed', state.salsas.indexOf(SALSAS[i].id) >= 0 ? 'true' : 'false'));
  const m = maxSauces();
  $('#sauceHint').textContent = m === 1 ? 'Elige 1 salsa.' : 'Elige hasta ' + m + ' salsas para este combo.';
  xRows.forEach((r) => { r.out.textContent = state.extras[r.a.id]; });

  const nombres = state.salsas.map((id) => SALSAS.find((s) => s.id === id).nombre);
  let total = combo.precio;
  const lines = ['<li><span>Combo ' + combo.n + ' alitas</span><b>' + money(combo.precio) + '</b></li>',
    '<li><span>Salsas: ' + (nombres.length ? nombres.join(' + ') : 'sin elegir') + '</span><b></b></li>'];
  CONFIG.adicionales.forEach((a) => {
    const q = state.extras[a.id];
    if (q > 0) { total += q * a.precio; lines.push('<li><span>' + q + 'x ' + a.nombre + '</span><b>' + money(q * a.precio) + '</b></li>'); }
  });
  $('#lines').innerHTML = lines.join('');
  $('#total').textContent = money(total);

  const last = state.salsas[state.salsas.length - 1] || null;
  if (last !== prevSauce) {
    prevSauce = last;
    if (last) {
      prevWings.src = IMG[last]; prevWings.style.visibility = 'visible';
      $('#sum').style.setProperty('--glow', SALSAS.find((s) => s.id === last).color);
      if (animate !== undefined) { prevWings.classList.remove('drop', 'late'); void prevWings.offsetWidth; if (!reduce) prevWings.classList.add('drop'); }
    } else { prevWings.style.visibility = 'hidden'; }
  }
  if (fromRect) fly(fromRect, color || (last ? SALSAS.find((s) => s.id === last).color : '#F4B700'));

  const lineas = ['Hola, quiero hacer un pedido en Las Alitas Mix Pitalito:',
    '• Combo ' + combo.n + ' alitas — ' + money(combo.precio),
    '• Salsas: ' + (nombres.join(' + ') || 'por definir')];
  CONFIG.adicionales.forEach((a) => { const q = state.extras[a.id]; if (q > 0) lineas.push('• ' + q + 'x ' + a.nombre + ' — ' + money(q * a.precio)); });
  lineas.push('Total estimado: ' + money(total));
  const wa = $('#waBtn');
  wa.href = waLink(lineas.join('\n'));
  wa.setAttribute('aria-disabled', state.salsas.length ? 'false' : 'true');
  if (state.salsas.length) $('#warn').textContent = '';
}
$('#waBtn').addEventListener('click', (e) => {
  if (!state.salsas.length) { e.preventDefault(); $('#warn').textContent = 'Elige al menos una salsa para enviar tu pedido.'; }
});
update();
setTimeout(() => { prevWings.classList.remove('drop', 'late'); }, 0);

/* ---------- Pie de página y botón flotante ---------- */
$('#fDir').textContent = CONFIG.direccion;
$('#fHor').textContent = CONFIG.horarios;
$('#fIg').href = CONFIG.instagram;
$('#fab').href = waLink('Hola, quiero hacer un pedido en Las Alitas Mix Pitalito.');

/* ---------- Menú móvil ---------- */
const burger = $('#burger'), panel = $('#mpanel');
function setMenu(open) {
  panel.hidden = !open;
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  $('#burgerIcon').setAttribute('d', open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16');
}
burger.addEventListener('click', () => setMenu(panel.hidden));
panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ---------- Observadores: pausar fuera de pantalla y mostrar el botón flotante ---------- */
let heroIn = true, armaIn = false;
const fabUpdate = () => document.body.classList.toggle('fab-on', !heroIn && !armaIn);
if ('IntersectionObserver' in window) {
  new IntersectionObserver((e) => { heroIn = e[0].isIntersecting; heroVisible = heroIn; fabUpdate(); }, { threshold: .15 }).observe(hero);
  new IntersectionObserver((e) => { armaIn = e[0].isIntersecting; fabUpdate(); }, { threshold: .1 }).observe($('#arma'));
}
})();
