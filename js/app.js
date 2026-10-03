/* Las Alitas Mix · lógica de la página (carrusel de salsas, menú, arma tu combo).
   Los datos editables están en config.js. */
(() => {
'use strict';
const { CONFIG, SALSAS, IMG } = window.ALITAS;

/* ============================================================ */
const $ = (s) => document.querySelector(s);
const N = SALSAS.length;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const money = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const waLink = (text) => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(text);

/* ---------- Inicio: anillo 3D de platos con los nombres en un cilindro 3D ----------
   Cada salsa se queda al frente CONFIG.carruselMs y luego el anillo gira (CONFIG.giroMs) hasta la siguiente. */
const hero = $('#inicio');
const stage = $('#stage');
const giant = $('#giant');
const mqMobile = window.matchMedia('(max-width: 720px)');
const easeInOut = (k) => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const wrap = (x) => ((x % N) + N) % N;
const rel = (i, p) => { let r = wrap(i - p); if (r > N / 2) r -= N; return r; }; // distancia al frente, en (-N/2, N/2]
// Posición del anillo: el plato al frente es round(pos). En reposo es un número entero.
let pos = Math.max(0, SALSAS.findIndex((s) => s.id === CONFIG.salsaInicial));
let idle = 0, hold = false, heroVisible = true, dragging = false, tween = null, front = null;

const slides = SALSAS.map((s, i) => {
  const el = document.createElement('div');
  el.className = 'slide';
  const bowl = new Image(); bowl.src = IMG.bowl; bowl.alt = ''; bowl.className = 'bowl'; bowl.draggable = false;
  const wings = new Image(); wings.src = IMG[s.id]; wings.alt = 'Alitas con salsa ' + s.nombre; wings.className = 'wings'; wings.draggable = false;
  el.append(bowl, wings);
  stage.append(el);
  // Los platos que vienen llegando (a la derecha) y el del frente empiezan vacíos: al cargar caen sus alitas.
  const r = rel(i, pos);
  const filled = reduce || (r < -.75 && r > -N * 3 / 8);
  if (!filled) wings.classList.add('empty');
  return { el, wings, s, filled };
});

// Nombres: uno por salsa, en un cilindro. Un texto oculto con el nombre más largo le da el tamaño al contenedor.
giant.textContent = '';
const sizer = document.createElement('span');
sizer.className = 'gsizer';
sizer.textContent = SALSAS.reduce((a, s) => (s.nombre.length > a.length ? s.nombre : a), '').toUpperCase();
giant.append(sizer);
const names = SALSAS.map((s) => {
  const el = document.createElement('span');
  el.className = 'gname';
  el.textContent = s.nombre.toUpperCase();
  giant.append(el);
  return el;
});
let radius = 0;
const measure = () => { radius = giant.offsetWidth * .5; };
measure();
window.addEventListener('resize', measure);

function drop(img, late) {
  if (reduce) return;
  img.classList.remove('drop', 'late');
  void img.offsetWidth;
  img.classList.add('drop');
  if (late) img.classList.add('late');
}

function render() {
  const mobile = mqMobile.matches;
  slides.forEach((sl, i) => {
    const r = rel(i, pos);
    const th = r * 2 * Math.PI / N;
    const t = (Math.cos(th) + 1) / 2;                  // 1 al frente, 0 atrás
    // En computador los laterales van más pequeños y más arriba (más lejos), para dejar libre el texto de abajo a la izquierda.
    const x = Math.sin(th) * 92, y = mobile ? (1 - t) * 14 : -(1 - t) * 178;
    const sc = .22 + .78 * Math.pow(t, mobile ? 9 : 14);
    sl.el.style.transform = 'translate(' + x.toFixed(2) + '%,' + y.toFixed(2) + '%) scale(' + sc.toFixed(4) + ')';
    // Computador y tablet: 3 platos (el del centro y uno pequeño a cada lado).
    // Celular: solo el del centro; en el giro, el que sale se desvanece y el siguiente aparece al entrar.
    const o = mobile ? (1 - Math.abs(r)) / .3 : (1.6 - Math.abs(r)) / .6;
    sl.el.style.opacity = Math.min(1, Math.max(0, o)).toFixed(3);
    sl.el.style.zIndex = Math.round(t * 10);
    if (reduce) return;
    // Al pasar por detrás el plato queda vacío; cuando se acerca al frente, caen las alitas (aterrizan al llegar).
    if (Math.abs(r) > N * 3 / 8 && sl.filled) { sl.filled = false; sl.wings.classList.remove('drop', 'late'); sl.wings.classList.add('empty'); }
    if (Math.abs(r) <= .75 && !sl.filled) { sl.filled = true; sl.wings.classList.remove('empty'); drop(sl.wings, true); }
  });

  // El nombre gira junto con el anillo.
  names.forEach((el, i) => {
    const a = rel(i, pos) * 90;
    if (Math.abs(a) >= 90) { el.style.visibility = 'hidden'; return; }
    el.style.visibility = '';
    el.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + a.toFixed(2) + 'deg) translateZ(' + radius + 'px)';
    el.style.opacity = Math.pow(Math.cos(a * Math.PI / 180), .8).toFixed(3);
  });

  const c = wrap(Math.round(pos));
  if (c !== front) {
    front = c;
    const s = SALSAS[c];
    hero.style.setProperty('--glow', s.color);
    $('#count').textContent = (c + 1) + ' de ' + N;
    $('#sr').textContent = 'Salsa ' + s.nombre;
    slides.forEach((sl, i) => sl.el.setAttribute('aria-hidden', i === c ? 'false' : 'true'));
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(64, now - last); last = now;
  if (tween) {
    const k = Math.min(1, (now - tween.t0) / tween.ms);
    pos = tween.from + (tween.to - tween.from) * tween.ease(k);
    if (k === 1) { tween = null; idle = 0; }
  } else if (!dragging && !reduce && !hold && heroVisible && !document.hidden) {
    // Pausa con la salsa al frente; al cumplirse, gira a la siguiente.
    idle += dt;
    if (idle >= CONFIG.carruselMs) go(1);
  }
  if (heroVisible) render();
  requestAnimationFrame(frame);
}

// Gira el anillo d platos (o hasta la posición exacta 'to' al soltar el dedo).
function go(d, to, ms, ease) {
  idle = 0;
  if (to === undefined) to = (tween ? tween.to : Math.round(pos)) + d;
  if (reduce) { pos = to; tween = null; render(); return; }
  tween = { from: pos, to, t0: performance.now(), ms: ms || CONFIG.giroMs, ease: ease || easeInOut };
}
$('#prevBtn').addEventListener('click', () => go(-1));
$('#nextBtn').addEventListener('click', () => go(1));
stage.addEventListener('mouseenter', () => { hold = true; });
stage.addEventListener('mouseleave', () => { hold = false; });
$('#controls').addEventListener('focusin', () => { hold = true; });
$('#controls').addEventListener('focusout', () => { hold = false; });

// Dedo: el anillo sigue el arrastre y, al soltar, termina el giro hasta el plato más cercano (con impulso).
let sx = null, sy = null, drag = null, p0 = 0, lp = 0, lt = 0, vel = 0;
const spacing = () => stage.offsetWidth * .65;          // distancia en pantalla entre un plato y el siguiente
hero.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; drag = null; }, { passive: true });
hero.addEventListener('touchmove', (e) => {
  if (sx === null || drag === false) return;
  const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
  if (drag === null) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    drag = Math.abs(dx) > Math.abs(dy) * 1.3;
    if (!drag || reduce) return;
    dragging = true; tween = null; p0 = pos; lp = pos; lt = performance.now(); vel = 0;
  }
  if (reduce) return;
  pos = p0 - dx / spacing();
  const now = performance.now();
  if (now > lt) { vel = vel * .5 + ((pos - lp) / (now - lt)) * .5; lp = pos; lt = now; }
}, { passive: true });
function endTouch(e) {
  if (sx === null) return;
  const dx = e && e.changedTouches.length ? e.changedTouches[0].clientX - sx : 0;
  sx = sy = null;
  if (drag && reduce && Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
  if (dragging) {
    dragging = false;
    let to = Math.round(pos + vel * 250);
    const r0 = Math.round(p0);
    if (to === r0 && Math.abs(dx) > 45) to = r0 + (dx < 0 ? 1 : -1);
    go(0, to, 700, easeOut);
  }
  drag = null;
}
hero.addEventListener('touchend', endTouch, { passive: true });
hero.addEventListener('touchcancel', endTouch, { passive: true });

render();
requestAnimationFrame(frame);

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
