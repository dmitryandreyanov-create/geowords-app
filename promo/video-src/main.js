// GeoWords promo — every frame is a pure function of t (seconds).
const W = 1080, H = 1920, SY0 = 860, MW = 1080, MH = 540, S = 2, M = 12;
const CX = 520; // text axis (shifted left for Reels right-side UI)
const COL = {
  cream: '#F6EEDC', paper: '#FFFBF1', ocean: '#4FB9B4', oceanPole: '#8ED4CF',
  land: '#A9D08E', landEdge: '#6FA563', ice: '#F1F5EE', coral: '#F0654F',
  ink: '#1E3A4C', gold: '#F6C64E', hl: '#FFE38A', teal: '#2E9E9A'
};
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const eout = u => 1 - Math.pow(1 - u, 3);
const pop = u => u <= 0 ? 0 : 1 - Math.exp(-u * 8) * Math.cos(u * 13);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const proj = (lon, lat) => [(lon + 165) * 3, (90 - lat) * 3];
// in/out visibility: returns {a, k} alpha and pop-scale
function vis(t, tin, tout, fo = 0.3) {
  const a = seg(t, tin, tin + 0.22) * (1 - seg(t, tout, tout + fo));
  return { a, k: pop(t - tin), out: seg(t, tout, tout + fo) };
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

// ---------- offscreen map sheets ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const SW = (MW + 2 * M) * S, SH = (MH + 2 * M) * S;
function landPath() {
  const p = new Path2D();
  for (const off of [-1080, 0, 1080]) for (const poly of LAND) for (const ring of poly) {
    ring.forEach(([lon, lat], i) => { const [x, y] = proj(lon, lat); i ? p.lineTo(x + off, y) : p.moveTo(x + off, y); });
    p.closePath();
  }
  return p;
}
function polyPath(pts) { const p = new Path2D(); pts.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? p.lineTo(x, y) : p.moveTo(x, y); }); p.closePath(); return p; }
let LP, sheet, grid, hlSA, hlAF, noise;
const AFRICA = [[-20, 36], [-5.6, 35.95], [0, 37], [9.5, 37.6], [11.5, 37.2], [12, 35.5], [20, 33.5], [28, 32], [32.3, 31.6], [32.6, 29.9], [43.4, 12.6], [52, 12.2], [65, -5], [60, -40], [-20, -40]];
const SAMER = [[-90, 5], [-77.4, 7.0], [-77.0, 9.0], [-70, 13], [-55, 12], [-30, 0], [-30, -60], [-90, -60]];

function buildNoise() {
  noise = mk(512, 512); const c = noise.getContext('2d'); const im = c.createImageData(512, 512); const r = rng(7);
  for (let i = 0; i < im.data.length; i += 4) { const v = 225 + r() * 30; im.data[i] = v; im.data[i + 1] = v - 3; im.data[i + 2] = v - 8; im.data[i + 3] = 255; }
  c.putImageData(im, 0, 0);
}
function buildSheets() {
  LP = landPath();
  sheet = mk(SW, SH); let c = sheet.getContext('2d');
  c.fillStyle = COL.paper; c.fillRect(0, 0, SW, SH);
  c.save(); c.scale(S, S); c.translate(M, M);
  c.beginPath(); c.rect(0, 0, MW, MH); c.clip();
  const og = c.createLinearGradient(0, 0, 0, MH);
  og.addColorStop(0, COL.oceanPole); og.addColorStop(.2, COL.ocean); og.addColorStop(.8, COL.ocean); og.addColorStop(1, COL.oceanPole);
  c.fillStyle = og; c.fillRect(0, 0, MW, MH);
  // soft wave hatching
  c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1.2;
  for (let y = 8; y < MH; y += 14) { c.beginPath(); for (let x = 0; x <= MW; x += 6) { const yy = y + Math.sin(x * 0.05 + y) * 1.6; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); }
  c.save(); c.translate(1.6, 2.6); c.fillStyle = 'rgba(20,70,75,0.32)'; c.fill(LP, 'evenodd'); c.restore();
  const lg = c.createLinearGradient(0, 0, 0, MH);
  lg.addColorStop(0, COL.ice); lg.addColorStop(.11, COL.ice); lg.addColorStop(.2, COL.land); lg.addColorStop(.78, COL.land); lg.addColorStop(.86, COL.ice); lg.addColorStop(1, COL.ice);
  c.fillStyle = lg; c.fill(LP, 'evenodd');
  c.strokeStyle = COL.landEdge; c.lineWidth = 0.7; c.stroke(LP);
  c.restore();
  // paper grain
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35;
  c.fillStyle = c.createPattern(noise, 'repeat'); c.fillRect(0, 0, SW, SH);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';

  // game-field grid
  grid = mk(SW, SH); c = grid.getContext('2d');
  c.save(); c.scale(S, S); c.translate(M, M);
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.1; c.setLineDash([5, 6]);
  for (let lon = -150; lon <= 180; lon += 30) { const [x] = proj(lon, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, MH); c.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const [, y] = proj(0, lat); c.beginPath(); c.moveTo(0, y); c.lineTo(MW, y); c.stroke(); }
  c.setLineDash([]); c.strokeStyle = COL.ink; c.globalAlpha = .55; c.lineWidth = 2.5; c.strokeRect(-4, -4, MW + 8, MH + 8);
  c.restore();

  const hl = reg => {
    const k = mk(SW, SH), g = k.getContext('2d');
    g.scale(S, S); g.translate(M, M); g.clip(polyPath(reg));
    g.fillStyle = COL.hl; g.fill(LP, 'evenodd');
    g.strokeStyle = COL.coral; g.lineWidth = 2.2; g.stroke(LP);
    return k;
  };
  hlSA = hl(SAMER); hlAF = hl(AFRICA);
}

// ---------- scene data ----------
const TOK = [
  { L: 'O', ll: [-12, -18] }, { L: 'C', ll: [68, -8] }, { L: 'E', ll: [-140, 0] },
  { L: 'A', ll: [75, 84] }, { L: 'N', ll: [40, -60] },
  { L: 'R', ll: [-100, 45] }, { L: 'L', ll: [95, 47] }, { L: 'T', ll: [134, -25] }
].map(o => ({ ...o, p: proj(...o.ll) }));
const APPEAR = [0.95, 1.0, 1.05, 1.1, 1.15, 0.98, 1.08, 1.12]; // token pop times
const SLOT_Y = 1330, SLOT_R = 54, SLOT_DX = 138;
const slotX = i => CX + (i - 2) * SLOT_DX;
const PICKS = [
  { i: 0, glow: [140, 9.5], ell: [72, 105], tap: 10.5, ap: 0.6, fly: 11.2, dur: 0.75 },
  { i: 1, glow: [150, 15.0], ell: [80, 85], tap: 15.7, ap: 0.6, fly: 16.4, dur: 0.75 },
  { i: 2, glow: [0, 19.2], ell: [62, 70], tap: 19.35, ap: 0.3, fly: 19.75, dur: 0.5 },
  { i: 3, glow: [0, 20.15], ell: [130, 34], tap: 20.3, ap: 0.3, fly: 20.7, dur: 0.5 },
  { i: 4, glow: [0, 21.1], ell: [170, 28], tap: 21.25, ap: 0.3, fly: 21.65, dur: 0.5 },
];
const DONE = 22.15;
const MOVES = [
  [2.3, 3.0, [540, 270, 1.03]], [3.0, 3.9, [540, 270, 0.95]], [3.9, 7.4, [540, 270, 0.98]],
  [7.6, 9.2, [470, 300, 1.8]], [13.6, 15.0, [650, 290, 1.7]],
  [19.0, 19.35, [348, 270, 1.5]], [20.0, 20.35, [720, 150, 1.5]], [20.95, 21.3, [615, 380, 1.5]],
  [22.2, 23.1, [540, 270, 0.95]], [24.0, 25.6, [540, 255, 0.8]]
];
function camAt(t) {
  let s = [540, 270, 0.95];
  for (const [a, b, tg] of MOVES) {
    if (t >= b) { s = tg; continue; }
    if (t > a) { const u = eio(seg(t, a, b)); s = s.map((v, k) => lerp(v, tg[k], u)); }
    break;
  }
  let [cx, cy, z] = s;
  if (z > 1) { const lo = 540 / z - M, hi = MW - 540 / z + M; cx = clamp(cx, lo, hi); }
  return { cx, cy, z };
}
const toScr = (cam, x, y) => [(x - cam.cx) * cam.z + 540, (y - cam.cy) * cam.z + SY0];
const tokR = z => 30 * Math.sqrt(z / 0.95);

// ---------- drawing ----------
function drawToken(x, y, r, L, o = {}) {
  const k = o.k ?? 1, a = o.a ?? 1; if (a <= 0 || k <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,58,76,0.28)'; ctx.beginPath(); ctx.ellipse(0, r * 0.2, r * 1.02, r * 0.98, 0, 0, 7); ctx.fill();
  ctx.fillStyle = o.sel ? COL.coral : COL.paper; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.lineWidth = r * 0.13; ctx.strokeStyle = o.sel ? '#fff' : COL.coral; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, 7); ctx.stroke();
  ctx.fillStyle = o.sel ? '#fff' : COL.ink; ctx.font = `900 ${r * 1.0}px Unb`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(L, 0, r * 0.06);
  ctx.restore();
}
function sheetRect(cam) { const [x, y] = toScr(cam, -M, -M); return [x, y, (MW + 2 * M) * cam.z, (MH + 2 * M) * cam.z]; }
function drawSheetShadow(x, y, w, h, a) {
  ctx.save(); ctx.globalAlpha = a; ctx.shadowColor = 'rgba(40,50,40,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = COL.paper; ctx.fillRect(x, y, w, h); ctx.restore();
}
// folded sheet: pv vertical unfold 0..1, ph horizontal (accordion of 4) 0..1
function drawFolded(cam, pv, ph, sc) {
  const [X, Y, Wd, Ht] = sheetRect(cam);
  const ccx = X + Wd / 2, ccy = Y + Ht / 2;
  ctx.save(); ctx.translate(ccx, ccy); ctx.scale(sc, sc); ctx.translate(-ccx, -ccy);
  const th = (1 - ph) * Math.PI / 2 * 0.86, cw = Wd / 4, w = cw * Math.cos(th);
  const x0 = ccx - 2 * w, mid = ccy, hh = Ht / 2;
  const tv = (1 - pv) * Math.PI, cvv = Math.cos(tv);
  const botH = hh, topH = Math.max(hh * cvv, 0);
  const totTop = cvv >= 0 ? mid - topH : mid;
  drawSheetShadow(x0, totTop, 4 * w, mid + botH - totTop, 1);
  for (let i = 0; i < 4; i++) {
    const dx = x0 + i * w, sx = (SW / 4) * i, sw = SW / 4;
    ctx.drawImage(sheet, sx, SH / 2, sw, SH / 2, dx, mid, w, botH);
    if (cvv >= 0) ctx.drawImage(sheet, sx, 0, sw, SH / 2, dx, mid - topH, w, topH);
    const sh = Math.sin(th);
    ctx.fillStyle = i % 2 ? `rgba(20,40,40,${0.35 * sh})` : `rgba(255,255,255,${0.15 * sh})`;
    ctx.fillRect(dx, cvv >= 0 ? mid - topH : mid, w, botH + (cvv >= 0 ? topH : 0));
    if (cvv >= 0 && pv < 1) { ctx.fillStyle = `rgba(20,40,40,${0.3 * (1 - cvv)})`; ctx.fillRect(dx, mid - topH, w, topH); }
  }
  if (cvv < 0) { // back of top flap lying over the bottom
    const fh = hh * -cvv; ctx.fillStyle = '#F3EAD6'; ctx.fillRect(x0, mid, 4 * w, fh);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x0, mid + fh - 4, 4 * w, 4);
    for (let i = 1; i < 4; i++) { ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(x0 + i * w - 1, mid, 2, fh); }
  }
  ctx.restore();
}
function ellipseGlow(cam, mx, my, rx, ry, a, t) {
  if (a <= 0) return;
  const [x, y] = toScr(cam, mx, my); const z = cam.z;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(1, ry / rx);
  const R = rx * z, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,255,240,0.75)'); g.addColorStop(.7, 'rgba(255,255,240,0.35)'); g.addColorStop(1, 'rgba(255,255,240,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = COL.coral; ctx.lineWidth = 4.5; ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 50;
  ctx.beginPath(); ctx.ellipse(x, y, rx * z * 0.92, ry * z * 0.92, 0, 0, 7); ctx.stroke(); ctx.restore();
}
function fitSize(lines, font, size, maxW) {
  ctx.font = font.replace('$', size); const w = Math.max(...lines.map(l => ctx.measureText(l).width));
  return w > maxW ? size * maxW / w : size;
}
function drawLines(lines, y, font, size, colors, v, lh = 1.18, stagger = 0.1, t0 = 0, t = 0) {
  size = fitSize(lines, font, size, 840);
  lines.forEach((ln, j) => {
    const k = pop(t - t0 - j * stagger), a = v.a * seg(t, t0 + j * stagger, t0 + j * stagger + 0.2);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(CX, y + j * size * lh - (1 - k) * 30 - v.out * 20);
    ctx.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
    ctx.font = font.replace('$', size); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = colors[j] || colors[0]; ctx.fillText(ln, 0, 0); ctx.restore();
  });
}
function title(t, lines, tin, tout, accent = 1) {
  const v = vis(t, tin, tout); if (v.a <= 0) return;
  drawLines(lines, 345, '700 $px Unb', 72, accent === 1 ? [COL.ink, COL.coral] : [COL.ink, COL.ink], v, 1.25, 0.12, tin, t);
}
function clueCard(t, lines, tin, tout) {
  const v = vis(t, tin, tout); if (v.a <= 0) return;
  const k = pop(t - tin), y = 250 - (1 - k) * 60 - v.out * 30, h = 210;
  ctx.save(); ctx.globalAlpha = v.a;
  ctx.shadowColor = 'rgba(30,58,76,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = COL.paper; rr(ctx, 70, y, 860, h, 30); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = COL.coral; rr(ctx, 70, y, 22, h, [30, 0, 0, 30]); ctx.fill();
  // compass pin
  ctx.translate(150, y + h / 2); ctx.fillStyle = COL.ocean; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(8, 0); ctx.lineTo(0, 22); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = COL.coral; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = v.a;
  const size = fitSize(lines, '900 $px Nun', 60, 700); ctx.font = `900 ${size}px Nun`; ctx.fillStyle = COL.ink; ctx.textBaseline = 'middle';
  const lh = size * 1.15, y0 = y + h / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((l, j) => ctx.fillText(l, 205, y0 + j * lh + 3)); ctx.restore();
}
function tapIndicator(t, x, y, tap, ap) {
  const u = seg(t, tap, tap + ap); if (t < tap || t > tap + ap + 0.6) return;
  const e = eout(u), px = lerp(x + 150, x, e), py = lerp(y + 210, y, e);
  const press = t >= tap + ap ? Math.sin(seg(t, tap + ap, tap + ap + 0.18) * Math.PI) : 0;
  const a = seg(t, tap, tap + 0.15) * (1 - seg(t, tap + ap + 0.3, tap + ap + 0.6));
  if (t > tap + ap) { const rp = seg(t, tap + ap, tap + ap + 0.5); ctx.save(); ctx.globalAlpha = (1 - rp) * 0.9; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 36 + rp * 70, 0, 7); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = a; ctx.translate(px, py); ctx.scale(1 - 0.18 * press, 1 - 0.18 * press);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(0, 0, 38, 0, 7); ctx.fill();
  ctx.strokeStyle = COL.ink; ctx.globalAlpha = a * 0.8; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 38, 0, 7); ctx.stroke();
  ctx.restore();
}
function drawSlots(t) {
  const fadeOut = 1 - seg(t, 24.1, 24.6);
  for (let i = 0; i < 5; i++) {
    const k = pop(t - 4.6 - i * 0.09), a = seg(t, 4.6 + i * 0.09, 4.8 + i * 0.09) * fadeOut; if (a <= 0) continue;
    const x = slotX(i);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, SLOT_Y); ctx.scale(k, k);
    ctx.fillStyle = 'rgba(30,58,76,0.12)'; ctx.beginPath(); ctx.arc(0, 6, SLOT_R + 6, 0, 7); ctx.fill();
    ctx.fillStyle = COL.paper; ctx.beginPath(); ctx.arc(0, 0, SLOT_R + 6, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(30,58,76,0.45)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(0, 0, SLOT_R - 4, 0, 7); ctx.stroke();
    ctx.restore();
  }
  PICKS.forEach((p, j) => {
    const land = p.fly + p.dur; if (t < land) return;
    const k = 1 + 0.18 * Math.exp(-(t - land) * 7) * Math.sin((t - land) * 22);
    const cel = t > DONE ? pop(t - DONE - j * 0.07) : 0;
    const sel = t > DONE + j * 0.07;
    drawToken(slotX(p.i), SLOT_Y - Math.sin(clamp((t - DONE - j * 0.07) / 0.35) * Math.PI) * 26, SLOT_R, TOK[p.i].L, { k: k * (1 + 0.0 * cel), a: fadeOut, sel });
  });
  const ov = vis(t, DONE + 0.25, 24.1, 0.5);
  if (ov.a > 0) { ctx.save(); ctx.globalAlpha = ov.a; ctx.font = '900 58px Nun'; ctx.textAlign = 'center'; ctx.fillStyle = COL.ink; ctx.fillText('Океан', CX, SLOT_Y + 118 - (1 - ov.k) * 20); ctx.restore(); }
}
function confetti(t) {
  const t0 = DONE + 0.05, dt = t - t0; if (dt < 0 || dt > 2.6) return;
  const r = rng(42), cols = [COL.coral, COL.gold, COL.ocean, '#8CC56F', '#F49AB0'];
  for (let i = 0; i < 46; i++) {
    const sx = CX + (r() - .5) * 600, vx = (r() - .5) * 900, vy = -900 - r() * 700, rot0 = r() * 6, vr = (r() - .5) * 14, w = 14 + r() * 12, h = 8 + r() * 8, c = cols[i % 5], ph = r() * 6;
    const drag = 1 - Math.exp(-2.2 * dt);
    const x = sx + vx * drag / 2.2 + Math.sin(dt * 5 + ph) * 18, y = SLOT_Y - 20 + vy * drag / 2.2 + 520 * dt * dt * 0.9;
    const a = 1 - seg(dt, 1.8, 2.5);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot0 + vr * dt); ctx.scale(1, Math.cos(dt * 9 + ph));
    ctx.fillStyle = c; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  }
}
function wave(t, X, Y, Wd, Ht) {
  const dt = t - DONE; if (dt < 0 || dt > 1.4) return;
  const R = 80 + dt * 1300, [ox, oy] = [CX, SLOT_Y];
  ctx.save(); ctx.beginPath(); ctx.rect(X, Y, Wd, Ht); ctx.clip();
  const g = ctx.createRadialGradient(ox, oy, Math.max(0, R - 110), ox, oy, R);
  const a = 0.45 * (1 - dt / 1.4);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.6, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(X, Y, Wd, Ht); ctx.restore();
}
function finale(t) {
  if (t < 24.4) return;
  const word = 'ГЕОВОРДЫ', size = fitSize([word], '900 $px Unb', 140, 820);
  ctx.save(); ctx.font = `900 ${size}px Unb`; ctx.textBaseline = 'alphabetic';
  const total = ctx.measureText(word).width; let x = CX - total / 2;
  [...word].forEach((ch, i) => {
    const w = ctx.measureText(ch).width, t0 = 24.6 + i * 0.06, k = pop(t - t0), a = seg(t, t0, t0 + 0.15);
    if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.translate(x + w / 2, 760 - (1 - k) * 50); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(30,58,76,0.15)'; ctx.textAlign = 'center'; ctx.fillText(ch, 4, 7); ctx.fillStyle = i % 2 ? COL.teal : COL.coral; ctx.fillText(ch, 0, 0); ctx.restore(); }
    x += w;
  });
  ctx.restore();
  const v = t0 => ({ a: seg(t, t0, t0 + 0.25), out: 0 });
  drawLines(['GeoWords'], 865, '700 $px Unb', 64, [COL.ink], v(25.3), 1, 0, 25.3, t);
  drawLines(['География складывается в игру'], 1000, '900 $px Nun', 54, [COL.ink], v(25.8), 1, 0, 25.8, t);
  const a = seg(t, 26.3, 26.6);
  if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = COL.coral; rr(ctx, CX - 60, 1072, 120, 8, 4); ctx.fill(); ctx.restore(); }
  drawLines(['Let’s Craft History'], 1180, '700 $px Unb', 48, [COL.teal], v(26.4), 1, 0, 26.4, t);
  drawLines(['Следите за проектом:', '@lets_craft_history'], 1275, '800 $px Nun', 52, [COL.ink, COL.coral], v(26.8), 1.25, 0.1, 26.8, t);
}

// ---------- frame ----------
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COL.cream; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(noise, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  const cam = camAt(t);
  const [X, Y, Wd, Ht] = sheetRect(cam);
  const mapA = 1 - 0.87 * seg(t, 24.0, 25.2);

  ctx.save(); ctx.globalAlpha = mapA;
  if (t < 1.25) {
    const pin = seg(t, 0, 0.35), sc = 0.55 + 0.45 * pop(t * 1.0) * 1;
    ctx.globalAlpha = pin;
    drawFolded(cam, eio(seg(t, 0.25, 0.65)), eout(seg(t, 0.55, 1.2)), Math.min(sc, 1.08));
  } else {
    drawSheetShadow(X, Y, Wd, Ht, 1);
    ctx.drawImage(sheet, X, Y, Wd, Ht);
    const ga = seg(t, 3.0, 3.8);
    if (ga > 0) { ctx.globalAlpha = mapA * ga; ctx.drawImage(grid, X, Y, Wd, Ht); ctx.globalAlpha = mapA; }
    // continent highlights
    const hSA = seg(t, 7.9, 8.4) * (1 - 0.6 * seg(t, 9.5, 9.9)) * (1 - seg(t, 11.6, 12.1));
    const hAF = Math.max(hSA, seg(t, 14.3, 14.8) * (1 - 0.6 * seg(t, 15.0, 15.4)) * (1 - seg(t, 16.6, 17.1)));
    if (hSA > 0) { ctx.globalAlpha = mapA * hSA; ctx.drawImage(hlSA, X, Y, Wd, Ht); }
    if (hAF > 0) { ctx.globalAlpha = mapA * hAF; ctx.drawImage(hlAF, X, Y, Wd, Ht); }
    ctx.globalAlpha = mapA;
    // ocean glows
    PICKS.forEach(p => {
      const [mx, my] = TOK[p.i].p, g0 = p.glow[1];
      const a = seg(t, g0, g0 + 0.3) * (1 - seg(t, p.fly + 0.1, p.fly + 0.5));
      ellipseGlow(cam, mx, my, p.ell[0], p.ell[1], a * mapA, t);
    });
    wave(t, X, Y, Wd, Ht);
  }
  ctx.restore();

  // tokens on the map
  const r = tokR(cam.z);
  TOK.forEach((o, i) => {
    const pk = PICKS.find(p => p.i === i);
    if (pk && t >= pk.fly) return;
    const [x, y] = toScr(cam, ...o.p);
    let k = pop(t - APPEAR[i]), sel = false;
    if (pk && t >= pk.tap + pk.ap) { sel = true; k *= 1 - 0.12 * Math.sin(seg(t, pk.tap + pk.ap, pk.tap + pk.ap + 0.18) * Math.PI); }
    drawToken(x, y, r, o.L, { k, a: seg(t, APPEAR[i], APPEAR[i] + 0.1) * mapA, sel });
  });

  // bands that keep the zoomed map inside a clean window
  const ta = clamp((cam.z - 1.05) / 0.3);
  if (ta > 0) { const g = ctx.createLinearGradient(0, 470, 0, 560); g.addColorStop(0, COL.cream); g.addColorStop(1, 'rgba(246,238,220,0)'); ctx.save(); ctx.globalAlpha = ta; ctx.fillStyle = COL.cream; ctx.fillRect(0, 0, W, 470); ctx.fillStyle = g; ctx.fillRect(0, 470, W, 90); ctx.restore(); }
  { const g = ctx.createLinearGradient(0, 1180, 0, 1250); g.addColorStop(0, 'rgba(246,238,220,0)'); g.addColorStop(1, COL.cream); ctx.fillStyle = g; ctx.fillRect(0, 1180, W, 70); ctx.fillStyle = COL.cream; ctx.fillRect(0, 1250, W, H - 1250); }

  // taps
  PICKS.forEach(p => { const [x, y] = toScr(cam, ...TOK[p.i].p); tapIndicator(t, x, y, p.tap, p.ap); });

  drawSlots(t);

  // flying tokens
  PICKS.forEach(p => {
    if (t < p.fly || t >= p.fly + p.dur) return;
    const c0 = camAt(p.fly), [x0, y0] = toScr(c0, ...TOK[p.i].p), x1 = slotX(p.i), y1 = SLOT_Y;
    const u = eio(seg(t, p.fly, p.fly + p.dur)), cx = (x0 + x1) / 2 + 60, cy = Math.min(y0, y1) - 160;
    const x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1;
    drawToken(x, y, lerp(tokR(c0.z), SLOT_R, u), TOK[p.i].L, { k: 1 + 0.25 * Math.sin(u * Math.PI), sel: true });
  });
  confetti(t);

  title(t, ['А если карта', 'прячет слово?'], 1.25, 2.85);
  title(t, ['Читай подсказки.', 'Ищи буквы.'], 3.7, 6.7);
  clueCard(t, ['Между Южной Америкой', 'и Африкой'], 7.0, 12.4);
  clueCard(t, ['К востоку от Африки'], 13.0, 17.3);
  title(t, ['Каждая подсказка —', 'шаг к ответу'], 17.5, 18.8);
  title(t, ['Собери слово.', 'Открой мир.'], 22.7, 24.0);
  finale(t);
}

window.ready = (async () => {
  await Promise.all(['500 20px Unb', '700 20px Unb', '900 20px Unb', '800 20px Nun', '900 20px Nun'].map(f => document.fonts.load(f, 'ГеоWords')));
  buildNoise(); buildSheets(); render(0); return true;
})();
window.render = render;
