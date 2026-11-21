// Synthetic self-check for asl-core.js. Run: node tests/synthetic.test.js
//
// Builds idealised hands for every letter (right and left hand, with noise and small
// rotations), runs them through the rules and reports what gets recognised.
// It checks the geometry code and the rules against each other. It says nothing about
// accuracy on real people: that needs recordings of real signers.
'use strict';
const C = require('../asl-core.js');

/* ---------- idealised right hand, in cm ----------
   Hand space: X towards the index side, Y from wrist to fingers, Z out of the palm. */
const MCP = { i: [3.0, 8.5, 0], m: [1.0, 9.0, 0], r: [-1.0, 8.5, 0], p: [-2.8, 7.5, 0] };
const SEG = { i: [4.0, 2.5, 2.0], m: [4.5, 2.8, 2.2], r: [4.2, 2.6, 2.1], p: [3.3, 2.0, 1.8] };
const TOG = { i: 2, m: 0, r: -2, p: -5 };
const SPR = { i: 12, m: 0, r: -12, p: -22 };
const FLEX = {
  EXT: [5, 5, 5], CURL: [85, 100, 60], HOOK: [10, 95, 65], CURVE: [35, 45, 30],
  OCURVE: [45, 60, 40], ECURL: [30, 100, 70], DCURVE: [55, 75, 45], FLATO: [60, 30, 20],
};
const WRIST = [0, 0, 0];
const CMC = [2.5, 2.0, 1.0];

function chain(k, flex, abdDeg) {
  const a = (abdDeg * Math.PI) / 180;
  const pts = [MCP[k]];
  let th = 0;
  let cur = MCP[k];
  for (let j = 0; j < 3; j++) {
    th += (flex[j] * Math.PI) / 180;
    const d = [Math.sin(a) * Math.cos(th), Math.cos(a) * Math.cos(th), Math.sin(th)];
    cur = [cur[0] + d[0] * SEG[k][j], cur[1] + d[1] * SEG[k][j], cur[2] + d[2] * SEG[k][j]];
    pts.push(cur);
  }
  return pts; // knuckle, middle joint, tip joint, tip
}

// Thumb presets: [MCP, IP, TIP]
function thumb(name, ch) {
  switch (name) {
    case 'OUT': return [[4.8, 3.6, 1.0], [7.5, 4.0, 0.8], [9.8, 4.3, 0.6]];
    case 'SIDE': return [[4.0, 4.0, 1.2], [4.3, 6.0, 1.4], [4.1, 7.8, 1.5]];
    case 'ACROSS': return [[3.5, 3.5, 1.5], [2.0, 4.5, 2.2], [0.0, 5.0, 2.2]];
    // thumb lying across the front of the curled fingers: about a finger and a thumb thickness in front of their joints
    case 'FRONT': return [[4.0, 4.5, 2.0], [2.6, 6.6, 5.0], [0.6, 7.4, 6.0]];
    case 'E': return [[3.8, 4.2, 1.8], [2.3, 5.8, 2.8], [0.5, 6.6, 2.9]];
    case 'T': return [[4.0, 4.5, 1.8], [3.4, 6.6, 2.6], [2.1, 8.5, 3.0]];
    case 'N': return [[4.0, 4.3, 1.8], [2.6, 6.2, 2.4], [0.2, 7.6, 2.6]];
    case 'M': return [[4.0, 4.2, 1.8], [2.2, 6.0, 2.4], [-1.6, 7.2, 2.6]];
    case 'HOLD': return [[3.8, 4.3, 1.8], [1.8, 5.8, 3.0], [-0.5, 6.8, 3.2]];
    case 'G': return [[4.5, 5.2, 1.0], [4.8, 8.0, 1.0], [4.8, 10.5, 1.0]];
    case 'K': return [[4.0, 5.0, 1.0], [3.2, 9.0, 1.3], [2.0, 12.0, 1.2]];
    case 'C': return [[4.3, 3.8, 2.0], [4.5, 5.0, 4.5], [3.8, 6.5, 6.0]];
    default: { // 'TOUCH:<finger>' - thumb tip meets that fingertip
      const tip = ch[name.split(':')[1]][3];
      const T = [tip[0] + 0.3, tip[1] - 0.4, tip[2] + 0.3];
      return [[4.2, 4.0, 1.5], [T[0] + 1.0, T[1] - 1.8, T[2] - 0.8], T];
    }
  }
}

const fistF = { i: 'CURL', m: 'CURL', r: 'CURL', p: 'CURL' };
const POSES = {
  A: { f: fistF, t: 'SIDE' },
  B: { f: { i: 'EXT', m: 'EXT', r: 'EXT', p: 'EXT' }, t: 'ACROSS' },
  C: { f: { i: 'CURVE', m: 'CURVE', r: 'CURVE', p: 'CURVE' }, t: 'C', rotY: 70 },
  D: { f: { i: 'EXT', m: 'DCURVE', r: 'DCURVE', p: 'DCURVE' }, t: 'TOUCH:m' },
  E: { f: { i: 'ECURL', m: 'ECURL', r: 'ECURL', p: 'ECURL' }, t: 'E' },
  F: { f: { i: 'OCURVE', m: 'EXT', r: 'EXT', p: 'EXT' }, t: 'TOUCH:i', abd: SPR },
  G: { f: { i: 'EXT', m: 'CURL', r: 'CURL', p: 'CURL' }, t: 'G', rotZ: -90 },
  H: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'HOLD', rotZ: -90 },
  I: { f: { i: 'CURL', m: 'CURL', r: 'CURL', p: 'EXT' }, t: 'FRONT' },
  J: { f: { i: 'CURL', m: 'CURL', r: 'CURL', p: 'EXT' }, t: 'FRONT' },
  K: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'K', abd: SPR },
  L: { f: { i: 'EXT', m: 'CURL', r: 'CURL', p: 'CURL' }, t: 'OUT' },
  M: { f: fistF, t: 'M' },
  N: { f: fistF, t: 'N' },
  O: { f: { i: 'OCURVE', m: 'OCURVE', r: 'OCURVE', p: 'OCURVE' }, t: 'TOUCH:i' },
  P: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'K', abd: SPR, rotZ: 180 },
  Q: { f: { i: 'EXT', m: 'CURL', r: 'CURL', p: 'CURL' }, t: 'G', rotZ: 180 },
  R: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'HOLD', abd: { i: -4, m: 14, r: -2, p: -5 } },
  S: { f: fistF, t: 'FRONT' },
  T: { f: fistF, t: 'T' },
  U: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'HOLD' },
  V: { f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'HOLD', abd: SPR },
  W: { f: { i: 'EXT', m: 'EXT', r: 'EXT', p: 'CURL' }, t: 'TOUCH:p', abd: SPR },
  X: { f: { i: 'HOOK', m: 'CURL', r: 'CURL', p: 'CURL' }, t: 'FRONT' },
  Y: { f: { i: 'CURL', m: 'CURL', r: 'CURL', p: 'EXT' }, t: 'OUT', abd: { i: 2, m: 0, r: -2, p: -25 } },
  Z: { f: { i: 'EXT', m: 'CURL', r: 'CURL', p: 'CURL' }, t: 'FRONT' },
};

function handPoints(pose) {
  const abd = pose.abd || TOG;
  const ch = {};
  for (const k of ['i', 'm', 'r', 'p']) ch[k] = chain(k, FLEX[pose.f[k]], abd[k]);
  const th = thumb(pose.t, ch);
  const pts = new Array(21);
  pts[0] = WRIST;
  pts[1] = CMC;
  pts[2] = th[0];
  pts[3] = th[1];
  pts[4] = th[2];
  const base = { i: 5, m: 9, r: 13, p: 17 };
  for (const k of Object.keys(ch)) for (let j = 0; j < 4; j++) pts[base[k] + j] = ch[k][j];
  return pts;
}

/* ---------- camera ---------- */
function rot(p, axis, deg) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const [x, y, z] = p;
  if (axis === 'x') return [x, y * c - z * s, y * s + z * c];
  if (axis === 'y') return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rnd) {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// Right hand with the palm to the camera; "left" mirrors it into a left hand.
function toSample(pts, o) {
  let P = pts.map((p) => [p[0] - 0.5, p[1] - 4.5, p[2]]);
  if (o.rotY) P = P.map((p) => rot(p, 'y', o.rotY));
  if (o.tiltX) P = P.map((p) => rot(p, 'x', o.tiltX));
  if (o.rotZ) P = P.map((p) => rot(p, 'z', o.rotZ));
  if (o.left) P = P.map((p) => [-p[0], p[1], p[2]]);
  if (o.noise) P = P.map((p) => p.map((v) => v + gauss(o.rnd) * o.noise));
  const cam = P.map(([x, y, z]) => [x, -y, -z]); // camera: x right, y down, z away from the camera
  return {
    world: cam.map(([x, y, z]) => ({ x: x / 100, y: y / 100, z: z / 100 })),
    image: cam.map(([x, y, z]) => ({ x: 0.5 + x / 50, y: 0.5 + y / 50, z: z / 50 })),
  };
}

module.exports = { POSES, handPoints, toSample };
if (require.main === module) runTests();

function runTests() {
const W = 1000;
const H = 1000;
const calibSign = {};
for (const left of [false, true]) {
  const s = toSample(handPoints(POSES.B), { left });
  calibSign[left] = Math.sign(C.computeFeatures(s.world, s.image, W, H).orient.facingRaw) || 1;
}
function analysePose(pose, o) {
  const s = toSample(handPoints(pose), Object.assign({}, o, {
    rotY: (pose.rotY || 0) + (o.rotY || 0),
    rotZ: (pose.rotZ || 0) + (o.rotZ || 0),
  }));
  const f = C.computeFeatures(s.world, s.image, W, H);
  const facing = f.orient.facingRaw * calibSign[!!o.left];
  return { f, all: C.evaluateAll(f, { facing }), image: s.image, facing };
}
const analyse = (id, o) => analysePose(POSES[id], o);
const motionFor = (id) => (C.BY_ID[id].motion ? { [id]: true } : {});
const fmt = (x) => x.toFixed(2);

let failures = 0;
const ids = C.LETTERS.map((L) => L.id);

/* ---------- 1. canonical poses ---------- */
console.log('1. Canonical poses (score / accepted / best letter)');
for (const id of ids) {
  const row = [id.padEnd(2)];
  for (const left of [false, true]) {
    const { all } = analyse(id, { left });
    const j = C.judge(id, all, motionFor(id));
    const top = C.rank(all, motionFor(id))[0].id;
    const good = j.ok && (top === id || top === C.BY_ID[id].twin);
    if (!good) failures++;
    row.push(`${left ? 'L' : 'R'} ${fmt(j.score)} ${j.ok ? 'ok ' : 'NO '} top=${top}${good ? '' : '  <-- ' + C.hintsFor(all[id], 'en', 2).map((h) => h.text).join(' | ')}`);
  }
  console.log('  ' + row.join('   '));
}

/* ---------- 2. robustness ---------- */
console.log('\n2. Robustness: 40 noisy samples per hand (noise 2.5 mm, rotations up to 12 deg)');
const rnd = mulberry32(42);
const weak = [];
for (const id of ids) {
  let acc = 0;
  let n = 0;
  for (const left of [false, true]) {
    for (let k = 0; k < 40; k++) {
      const o = { left, rnd, noise: 0.25, rotZ: (rnd() * 2 - 1) * 12, rotY: (rnd() * 2 - 1) * 12, tiltX: (rnd() * 2 - 1) * 10 };
      const { all } = analyse(id, o);
      if (C.judge(id, all, motionFor(id)).ok) acc++;
      n++;
    }
  }
  const rate = acc / n;
  if (rate < 0.9) weak.push(`${id} ${(rate * 100).toFixed(0)}%`);
  process.stdout.write(`  ${id} ${(rate * 100).toFixed(0).padStart(3)}%${ids.indexOf(id) % 9 === 8 ? '\n' : ''}`);
}
console.log('\n  below 90%: ' + (weak.join(', ') || 'none'));

/* ---------- 3. false accepts ---------- */
console.log('\n3. False accepts: canonical pose of X accepted as target Y');
const fa = [];
for (const x of ids) {
  for (const left of [false, true]) {
    const { all } = analyse(x, { left });
    for (const y of ids) {
      if (y === x || C.BY_ID[y].twin === x || C.BY_ID[x].twin === y) continue;
      if (C.judge(y, all, motionFor(y)).ok) fa.push(`${x}->${y}${left ? ' (L)' : ''}`);
    }
  }
}
failures += fa.length;
console.log('  ' + (fa.join(', ') || 'none'));

/* ---------- 4. motion ---------- */
console.log('\n4. Motion letters');
function makeTrail(pts, step) {
  const s = 150;
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < n; j++) dense.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  dense.push(pts[pts.length - 1]);
  const r = mulberry32(7);
  const trail = dense.map((p, i) => ({ t: i * 33, x: 300 + p[0] * s + (r() - 0.5) * 3, y: 200 + p[1] * s + (r() - 0.5) * 3, s, ok: true }));
  return { trail, now: (dense.length - 1) * 33 };
}
const mirror = (pts) => pts.map(([x, y]) => [-x, y]);
const J = [[0, 0], [0, 0.5], [0, 1.0], [-0.12, 1.15], [-0.28, 1.2], [-0.42, 1.12], [-0.5, 0.98]];
const Z = [[0, 0], [1.2, 0], [0, 1.0], [1.2, 1.0]];
const cases = [
  ['J', J, 0.06, 'J', true], ['J mirrored', mirror(J), 0.06, 'J', true],
  ['Z', Z, 0.1, 'Z', true], ['Z mirrored', mirror(Z), 0.1, 'Z', true],
  ['straight down', [[0, 0], [0, 1.3]], 0.06, 'J', false],
  ['diagonal', [[0, 0], [1, 1]], 0.06, 'J', false],
  ['Z path', Z, 0.1, 'J', false],
  ['J path', J, 0.06, 'Z', false],
  ['side shake', [[0, 0], [1, 0], [0, 0], [1, 0], [0, 0]], 0.1, 'Z', false],
  ['still', [[0, 0], [0.02, 0.01], [0, 0.02], [0.01, 0]], 0.005, 'J', false],
  ['still', [[0, 0], [0.02, 0.01], [0, 0.02], [0.01, 0]], 0.005, 'Z', false],
];
for (const [name, pts, step, det, expect] of cases) {
  const { trail, now } = makeTrail(pts, step);
  const got = det === 'J' ? C.detectJ(trail, now) : C.detectZ(trail, now);
  const good = got === expect;
  if (!good) failures++;
  console.log(`  ${good ? 'ok ' : 'BAD'} detect${det}(${name}) = ${got}`);
}

/* ---------- 5. hints ---------- */
console.log('\n5. Hints when the wrong letter is shown');
const pairs = [['S', 'A'], ['A', 'S'], ['U', 'V'], ['V', 'K'], ['E', 'S'], ['C', 'O'], ['L', 'G'], ['I', 'Y'], ['M', 'N'], ['B', 'C']];
for (const [shown, target] of pairs) {
  const { all } = analyse(shown, {});
  const uk = C.hintsFor(all[target], 'uk', 1)[0];
  const en = C.hintsFor(all[target], 'en', 1)[0];
  console.log(`  show ${shown}, target ${target}: ${uk ? uk.text : '-'} / ${en ? en.text : '-'}`);
}

/* ---------- 6. handshapes of word signs ---------- */
console.log('\n6. Handshapes for word signs (own score R/L; other shapes that also pass)');
const SHAPE_POSES = {
  ILY: [{ f: { i: 'EXT', m: 'CURL', r: 'CURL', p: 'EXT' }, t: 'OUT', abd: { i: 6, m: 0, r: -2, p: -20 } }, 'ILY'],
  FIVE: [{ f: { i: 'EXT', m: 'EXT', r: 'EXT', p: 'EXT' }, t: 'OUT', abd: SPR }, 'FIVE'],
  FLAT: [{ f: { i: 'EXT', m: 'EXT', r: 'EXT', p: 'EXT' }, t: 'SIDE' }, 'FLAT'],
  FIST: [POSES.S, 'FIST'],
  ONE: [POSES.Z, 'ONE'],
  W: [POSES.W, 'W'],
  FLATO: [{ f: { i: 'FLATO', m: 'FLATO', r: 'FLATO', p: 'FLATO' }, t: 'TOUCH:i' }, 'FLATO'],
  C: [POSES.C, 'C'],
  NO_OPEN: [{ f: { i: 'EXT', m: 'EXT', r: 'CURL', p: 'CURL' }, t: 'G' }, 'NO'],
  NO_CLOSED: [{ f: { i: 'DCURVE', m: 'DCURVE', r: 'CURL', p: 'CURL' }, t: 'TOUCH:m' }, 'NO'],
  Y: [POSES.Y, 'Y'],
};
const mustNot = { FIVE: ['FLAT'], FLAT: ['FIVE'], ILY: ['FIVE', 'ONE', 'Y'], W: ['FIVE'], C: ['FLATO'], FLATO: ['C'], ONE: ['ILY', 'NO'], FIST: ['ONE', 'Y'], Y: ['ILY', 'FIST'] };
for (const name of Object.keys(SHAPE_POSES)) {
  const [pose, shape] = SHAPE_POSES[name];
  const row = [name.padEnd(9)];
  for (const left of [false, true]) {
    const a = analysePose(pose, { left });
    const { rec } = C.signFrame(a.f, a.image, W, H, null, { facing: a.facing }, 0);
    const own = rec.scores[shape];
    const also = Object.keys(rec.scores).filter((k) => k !== shape && rec.scores[k] >= C.SIGN_OK);
    const bad = own < C.SIGN_OK || also.some((k) => (mustNot[shape] || []).includes(k));
    if (bad) failures++;
    row.push(`${left ? 'L' : 'R'} ${fmt(own)}${also.length ? ' also ' + also.join(',') : ''}${bad ? '  <-- BAD' : ''}`);
  }
  console.log('  ' + row.join('   '));
}

/* ---------- 7. word-sign detectors ---------- */
console.log('\n7. Word-sign detectors on synthetic recordings');
const Z0 = { d: 40, chin: [200, 260], mouth: [200, 232], forehead: [200, 160] };
const PT = (o) => Object.assign({ thumbTip: [400, 400], indexTip: [400, 400], tips: [400, 400], fingertips: [400, 400], knuckle: [200, 300] }, o);
const rec = (t, o) => Object.assign({ t, scores: {}, zones: Z0, palm: 100, dIM: 1, imExt: false, curl: 40, pts: PT({}) }, o);
const series = (ms, fn) => { const out = []; for (let t = 0; t <= ms; t += 33) out.push(fn(t)); return out; };
const wave = (t, hz, a) => a * Math.sin(2 * Math.PI * hz * (t / 1000));
const tap = (t) => Math.floor(t / 200) % 2 === 0; // touching half of the time
const near = (p, dy) => [p[0] + 4, p[1] + (dy || 0)];
const away = (touchMs, p, dx, dy) => (t) => (t < touchMs ? near(p) : [p[0] + dx * Math.min(1, (t - touchMs) / 400), p[1] + dy * Math.min(1, (t - touchMs) / 400)]);
const S7 = [
  ['ILY held', 'ILY', series(800, (t) => rec(t, { scores: { ILY: 0.95 } })), true],
  ['ILY weak shape', 'ILY', series(800, (t) => rec(t, { scores: { ILY: 0.5 } })), false],
  ['MOM thumb taps chin', 'MOM', series(1100, (t) => rec(t, { scores: { FIVE: 0.9 }, pts: PT({ thumbTip: tap(t) ? near(Z0.chin) : [300, 300] }) })), true],
  ['MOM thumb at forehead', 'MOM', series(1100, (t) => rec(t, { scores: { FIVE: 0.9 }, pts: PT({ thumbTip: near(Z0.forehead) }) })), false],
  ['DAD thumb at forehead', 'DAD', series(1100, (t) => rec(t, { scores: { FIVE: 0.9 }, pts: PT({ thumbTip: near(Z0.forehead) }) })), true],
  ['MOM without a face', 'MOM', series(1100, (t) => rec(t, { zones: null, scores: { FIVE: 0.9 } })), false],
  ['WATER index at chin', 'WATER', series(1100, (t) => rec(t, { scores: { W: 0.9 }, pts: PT({ indexTip: near(Z0.chin) }) })), true],
  ['EAT fingertips at mouth', 'EAT', series(1100, (t) => rec(t, { scores: { FLATO: 0.9 }, pts: PT({ tips: near(Z0.mouth) }) })), true],
  ['DRINK C at chin', 'DRINK', series(1100, (t) => rec(t, { scores: { C: 0.9 }, pts: PT({ thumbTip: near(Z0.chin) }) })), true],
  ['YES fist nods', 'YES', series(1600, (t) => rec(t, { scores: { FIST: 0.9 }, pts: PT({ knuckle: [200, 300 + wave(t, 2.5, 25)] }) })), true],
  ['YES fist still', 'YES', series(1600, (t) => rec(t, { scores: { FIST: 0.9 } })), false],
  ['YES open hand nods', 'YES', series(1600, (t) => rec(t, { scores: { FIST: 0.3 }, pts: PT({ knuckle: [200, 300 + wave(t, 2.5, 25)] }) })), false],
  ['WHERE index wags', 'WHERE', series(1600, (t) => rec(t, { scores: { ONE: 0.9 }, pts: PT({ indexTip: [200 + wave(t, 2.5, 30), 200] }) })), true],
  ['MILK squeezes', 'MILK', series(1600, (t) => rec(t, { curl: 67 + wave(t, 2, 28) })), true],
  ['MILK hand still', 'MILK', series(1600, (t) => rec(t, { curl: 67 })), false],
  ['NO fingers snap', 'NO', series(900, (t) => rec(t, { scores: { NO: 0.9 }, dIM: t < 400 ? 0.7 : 0.2, imExt: t < 400 })), true],
  ['NO fingers stay open', 'NO', series(900, (t) => rec(t, { scores: { NO: 0.9 }, dIM: 0.7, imExt: true })), false],
  ['THANK YOU chin, then forward', 'THANKYOU', series(900, (t) => rec(t, { scores: { FLAT: 0.9 }, pts: PT({ fingertips: away(300, Z0.chin, 0, 100)(t) }) })), true],
  ['THANK YOU stays at chin', 'THANKYOU', series(900, (t) => rec(t, { scores: { FLAT: 0.9 }, pts: PT({ fingertips: near(Z0.chin) }) })), false],
  ['THANK YOU no touch', 'THANKYOU', series(900, (t) => rec(t, { scores: { FLAT: 0.9 }, pts: PT({ fingertips: [200, 400 + t / 5] }) })), false],
  ['HELLO forehead, then out', 'HELLO', series(900, (t) => rec(t, { scores: { FLAT: 0.9 }, pts: PT({ indexTip: away(300, Z0.forehead, 110, 0)(t) }) })), true],
];
for (const [name, id, hist, expect] of S7) {
  const r = C.detectSign(C.SIGN_BY_ID[id], hist, hist[hist.length - 1].t);
  const good = r.ok === expect;
  if (!good) failures++;
  console.log(`  ${good ? 'ok ' : 'BAD'} ${name}: ${r.ok}${r.need ? ' (needs ' + r.need + ')' : ''}`);
}
if (C.countSwings([0, 1, 0, 1, 0], 0.5) !== 4) { failures++; console.log('  BAD countSwings'); }

/* ---------- 8. two-handed signs ---------- */
console.log('\n8. Two-handed signs on synthetic recordings');
const HP = (o) => Object.assign({ tips: [0, 0], center: [0, 0], wrist: [0, 0], knuckle: [0, 0], thumbTip: [0, 0], indexTip: [0, 0], fingertips: [0, 0] }, o);
const hand = (scores, pts, extra) => Object.assign({ scores: Object.assign({ FLATO: 0, FIST: 0, FLAT: 0, FIVE: 0, Y: 0 }, scores), pts: HP(pts), palm: 100, facing: 0.8, ang: 90 }, extra || {});
const rec2 = (t, hands) => ({ t, zones: Z0, hands, scores: hands[0].scores, pts: hands[0].pts, palm: 100 });
const lift = (t) => Math.min(1, t / 600) * 80;
const S8 = [
  ['MORE fingertips tap', 'MORE', series(1100, (t) => rec2(t, [hand({ FLATO: 0.9 }, { tips: [200, 300] }), hand({ FLATO: 0.9 }, { tips: [tap(t) ? 230 : 330, 300] })])), true],
  ['MORE hands apart', 'MORE', series(1100, (t) => rec2(t, [hand({ FLATO: 0.9 }, { tips: [200, 300] }), hand({ FLATO: 0.9 }, { tips: [400, 300] })])), false],
  ['MORE with one hand', 'MORE', series(1100, (t) => rec2(t, [hand({ FLATO: 0.9 }, { tips: [200, 300] })])), false],
  ['LOVE fists crossed on chest', 'LOVE', series(900, (t) => rec2(t, [hand({ FIST: 0.9 }, { center: [160, 400] }, { ang: 180 }), hand({ FIST: 0.9 }, { center: [240, 400] }, { ang: 0 })])), true],
  ['LOVE fists not crossed', 'LOVE', series(900, (t) => rec2(t, [hand({ FIST: 0.9 }, { center: [160, 400] }, { ang: 0 }), hand({ FIST: 0.9 }, { center: [240, 400] }, { ang: 180 })])), false],
  ['LOVE fists at face height', 'LOVE', series(900, (t) => rec2(t, [hand({ FIST: 0.9 }, { center: [160, 230] }, { ang: 180 }), hand({ FIST: 0.9 }, { center: [240, 230] }, { ang: 0 })])), false],
  ['BABY cradle rocks', 'BABY', series(1600, (t) => rec2(t, [hand({ FLAT: 0.9 }, { center: [150 + wave(t, 2, 40), 420] }, { ang: 0 }), hand({ FLAT: 0.9 }, { center: [260 + wave(t, 2, 40), 440] }, { ang: 180 })])), true],
  ['BABY cradle still', 'BABY', series(1600, (t) => rec2(t, [hand({ FLAT: 0.9 }, { center: [150, 420] }, { ang: 0 }), hand({ FLAT: 0.9 }, { center: [260, 440] }, { ang: 180 })])), false],
  ['HELP fist lifted on palm', 'HELP', series(1000, (t) => rec2(t, [hand({ FIST: 0.9, FLAT: 0.1 }, { wrist: [200, 380 - lift(t)], knuckle: [200, 330 - lift(t)] }), hand({ FLAT: 0.9, FIST: 0.1 }, { center: [200, 400 - lift(t)] })])), true],
  ['HELP fist on palm, no lift', 'HELP', series(1000, (t) => rec2(t, [hand({ FIST: 0.9, FLAT: 0.1 }, { wrist: [200, 380], knuckle: [200, 330] }), hand({ FLAT: 0.9, FIST: 0.1 }, { center: [200, 400] })])), false],
  ['HELP fist away from palm', 'HELP', series(1000, (t) => rec2(t, [hand({ FIST: 0.9, FLAT: 0.1 }, { wrist: [400, 380 - lift(t)], knuckle: [400, 330 - lift(t)] }), hand({ FLAT: 0.9, FIST: 0.1 }, { center: [200, 400] })])), false],
  ['PLAY Y hands twist', 'PLAY', series(1600, (t) => rec2(t, [hand({ Y: 0.9 }, { center: [150, 400] }, { facing: 0.5 + wave(t, 2.5, 0.4) }), hand({ Y: 0.9 }, { center: [260, 400] }, { facing: -0.5 - wave(t, 2.5, 0.4) })])), true],
  ['PLAY Y hands still', 'PLAY', series(1600, (t) => rec2(t, [hand({ Y: 0.9 }, { center: [150, 400] }), hand({ Y: 0.9 }, { center: [260, 400] })])), false],
];
for (const [name, id, hist, expect] of S8) {
  const r = C.detectSign(C.SIGN_BY_ID[id], hist, hist[hist.length - 1].t);
  const good = r.ok === expect;
  if (!good) failures++;
  console.log(`  ${good ? 'ok ' : 'BAD'} ${name}: ${r.ok}${r.need ? ' (needs ' + r.need + ')' : ''}`);
}
for (const p of C.PHRASES) for (const s of p.signs) if (!C.SIGN_BY_ID[s]) { failures++; console.log('  BAD phrase ' + p.id + ' uses unknown sign ' + s); }
for (const s of C.SIGNS) for (const lang of ['uk', 'en']) if (!C.SIGN_TEXT[lang][s.id]) { failures++; console.log(`  BAD no ${lang} text for ${s.id}`); }

console.log(`\n${failures ? 'FAILED: ' + failures + ' problem(s)' : 'All synthetic checks passed'}`);
process.exitCode = failures ? 1 : 0;
}
