/*
 * ASL fingerspelling core: hand features, letter rules, scoring, hints and motion (J, Z).
 * Pure logic without DOM. Browser: window.ASLCore. Node: module.exports.
 *
 * Input is one hand from MediaPipe Hand Landmarker:
 *   world  - 21 world landmarks {x, y, z} in metres (3D shape of the hand)
 *   image  - 21 normalized image landmarks {x, y, z} of the raw (unmirrored) camera frame
 *
 * Every letter is a list of constraints on interpretable features (finger states, thumb
 * position, finger gaps, direction, palm side). The same constraints produce the score and
 * the corrective hint, so "what is wrong" always matches "why it was not accepted".
 * Thresholds are starting values from an idealised hand model and need tuning on real people.
 */
(function (root) {
  'use strict';

  const VERSION = '0.1.0';

  /* ---------- vector helpers ---------- */
  const DEG = 180 / Math.PI;
  const toV = (p) => [p.x, p.y, p.z || 0];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = (a) => Math.hypot(a[0], a[1], a[2]);
  const unit = (a) => { const l = len(a) || 1e-9; return [a[0] / l, a[1] / l, a[2] / l]; };
  const angleBetween = (a, b) => {
    const c = dot(a, b) / ((len(a) * len(b)) || 1e-9);
    return Math.acos(Math.max(-1, Math.min(1, c))) * DEG;
  };
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const median = (a) => {
    if (!a.length) return 0;
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  /* ---------- hand model ---------- */
  const FINGERS = { i: [5, 6, 7, 8], m: [9, 10, 11, 12], r: [13, 14, 15, 16], p: [17, 18, 19, 20] };
  const FKEYS = ['i', 'm', 'r', 'p'];

  // Finger state prototypes: flexion in degrees at [knuckle (MCP), middle joint (PIP), tip joint (DIP)].
  const STATES = {
    EXT: [5, 8, 6],       // straight
    CURVE: [35, 45, 30],  // arc, as in C
    CURL: [80, 100, 55],  // folded into the palm, as in a fist
    HOOK: [12, 95, 60],   // knuckle straight, finger bent, as in X
    BENT: [80, 10, 8],    // bent at the knuckle only
  };
  const STATE_W = [1, 1, 0.6];
  function stateDist(fd, s) {
    const q = STATES[s];
    return Math.sqrt(
      STATE_W[0] * (fd.mcp - q[0]) ** 2 + STATE_W[1] * (fd.pip - q[1]) ** 2 + STATE_W[2] * (fd.dip - q[2]) ** 2
    );
  }
  function classifyFinger(fd) {
    let best = 'EXT';
    let bd = Infinity;
    for (const s in STATES) {
      const d = stateDist(fd, s);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }

  /* ---------- features ---------- */
  function computeFeatures(world, image, W, H) {
    W = W || 1;
    H = H || 1;
    const P = world.map(toV);
    const palmLen = len(sub(P[9], P[0])) || 1e-6;
    const up = unit(sub(P[9], P[0]));
    const across = sub(P[5], P[17]);
    const lat = unit(sub(across, mul(up, dot(across, up))));
    const nrm = unit(cross(up, lat)); // palm normal; its sign depends on left/right hand
    const kn = sub(P[17], P[5]);
    const kn2 = dot(kn, kn) || 1e-9;
    const latPos = (q) => dot(sub(q, P[5]), kn) / kn2; // 0 = index knuckle, 1 = pinky knuckle, <0 = outside index
    const height = (q) => dot(sub(q, P[0]), up) / palmLen; // 0 = wrist, about 1 = knuckles
    const dist = (a, b) => len(sub(P[a], P[b])) / palmLen;

    const fingers = {};
    for (const k of FKEYS) {
      const [m, p, d, t] = FINGERS[k];
      const prox = sub(P[p], P[m]);
      const mid = sub(P[d], P[p]);
      const tip = sub(P[t], P[d]);
      const fd = {
        // knuckle flexion = angle between the first bone and the palm plane (independent of spreading)
        mcp: Math.asin(Math.min(1, Math.abs(dot(unit(prox), nrm)))) * DEG,
        pip: angleBetween(prox, mid),
        dip: angleBetween(mid, tip),
        tipH: height(P[t]),
        tipLat: latPos(P[t]),
      };
      fd.state = classifyFinger(fd);
      fingers[k] = fd;
    }
    const tipsH = mean(FKEYS.map((k) => fingers[k].tipH));
    // How far the index middle joint sticks up above its neighbours: about 0 in a fist, about 0.4 in X.
    const pipHi = height(P[6]);
    const idxRaise = pipHi - (height(P[10]) + height(P[14])) / 2;

    // Palm side: curled index and middle fingers bulge towards it. Reliable only for fist letters.
    const pipMid = mul(add(P[6], P[10]), 0.5);
    const mcpMid = mul(add(P[5], P[9]), 0.5);
    const bulge = dot(sub(pipMid, mcpMid), nrm);
    const palmar = bulge >= 0 ? nrm : mul(nrm, -1);

    const thumb = {
      lat: latPos(P[4]),
      h: height(P[4]),
      bend: angleBetween(sub(P[2], P[1]), sub(P[3], P[2])) + angleBetween(sub(P[3], P[2]), sub(P[4], P[3])),
      spread: angleBetween(sub(P[4], P[2]), sub(P[5], P[0])), // away from the index bone
      par: angleBetween(sub(P[4], P[2]), sub(P[8], P[5])), // 0 = parallel to the index finger
      dIT: dist(4, 8), dMT: dist(4, 12), dRT: dist(4, 16), dPT: dist(4, 20),
      dIP: dist(4, 6), dMP: dist(4, 10),
      front: dot(sub(P[4], pipMid), palmar) / palmLen, // >0: thumb in front of curled fingers
      above: 0,
    };
    thumb.above = thumb.h - tipsH; // >0: thumb tip higher than the fingertips
    const gaps = { im: dist(8, 12), mr: dist(12, 16), rp: dist(16, 20) };
    const crossIM = fingers.m.tipLat - fingers.i.tipLat; // about 0.3 normally, <=0 when crossed

    // 2D orientation in the raw camera frame (y grows downwards).
    const px = (i) => [image[i].x * W, image[i].y * H];
    const w2 = px(0);
    const m2 = px(9);
    const d2 = [m2[0] - w2[0], m2[1] - w2[1]];
    const nd = Math.hypot(d2[0], d2[1]) || 1e-9;
    const ang = (a, b) => {
      const A = px(a);
      const B = px(b);
      return Math.atan2(-(B[1] - A[1]), B[0] - A[0]) * DEG;
    };
    const orient = {
      hand: Math.atan2(-d2[1], d2[0]) * DEG, // 90 = fingers up, -90 = down, 0/180 = sideways
      i: ang(5, 8),
      m: ang(9, 12),
      facingRaw: nrm[2], // palm normal towards the camera axis; sign fixed by calibration
    };
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const q of image) {
      if (q.x < minX) minX = q.x;
      if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y;
      if (q.y > maxY) maxY = q.y;
    }
    const quality = {
      inFrame: minX > 0.01 && maxX < 0.99 && minY > 0.01 && maxY < 0.99,
      size: nd / Math.min(W, H),
    };

    const v = {
      't.lat': thumb.lat, 't.h': thumb.h, 't.bend': thumb.bend, 't.spread': thumb.spread, 't.par': thumb.par,
      't.dIT': thumb.dIT, 't.dMT': thumb.dMT, 't.dRT': thumb.dRT, 't.dPT': thumb.dPT,
      't.dIP': thumb.dIP, 't.dMP': thumb.dMP, 't.front': thumb.front, 't.above': thumb.above,
      'gap.im': gaps.im, 'gap.mr': gaps.mr, 'gap.rp': gaps.rp, 'cross.im': crossIM, tipsH,
      'tipH.i': fingers.i.tipH, 'tipH.m': fingers.m.tipH, 'tipH.r': fingers.r.tipH, 'tipH.p': fingers.p.tipH,
      'pipH.i': pipHi, idxRaise,
    };
    return { fingers, thumb, gaps, crossIM, tipsH, idxRaise, orient, quality, palmPx: nd, v };
  }

  /* ---------- letter rules ---------- */
  const fing = (k, allowed, w = 1) => ({ type: 'finger', k, allowed, w });
  // range: value should lie in [lo, hi]; "low"/"high" name the hint for values below/above
  const rng = (feat, lo, hi, soft, w, low, high) => ({ type: 'range', feat, lo, hi, soft, w, low, high });
  const dir = (target, w = 0.8) => ({ type: 'dir', target, w });
  const fdir = (k, target, w = 1) => ({ type: 'fdir', k, target, w });
  const palm = (target, w = 0.4) => ({ type: 'palm', target, w });
  const CL = ['CURL', 'HOOK'];
  const CV = ['CURVE', 'HOOK', 'CURL'];
  const EX = ['EXT'];
  const fist = () => [fing('i', CL), fing('m', CL), fing('r', CL), fing('p', CL)];
  const idxDown = (w) => rng('idxRaise', -9, 0.18, 0.08, w, null, 'idxDown');

  const LETTERS = [
    { id: 'A', c: [...fist(), idxDown(0.8),
      rng('t.lat', -0.75, -0.06, 0.1, 1.5, 'thumbCloser', 'thumbSideA'),
      rng('t.h', 0.4, 1.4, 0.2, 0.6, 'thumbUp', 'thumbDown'),
      rng('t.spread', 0, 50, 15, 0.6, null, 'thumbCloser'),
      dir('up'), palm('front', 0.5)] },
    { id: 'B', c: [fing('i', EX), fing('m', EX), fing('r', EX), fing('p', EX),
      rng('gap.im', 0, 0.36, 0.12, 0.6, null, 'together'),
      rng('gap.mr', 0, 0.36, 0.12, 0.5, null, 'together'),
      rng('gap.rp', 0, 0.4, 0.12, 0.4, null, 'together'),
      rng('t.lat', 0.05, 1.2, 0.12, 1.3, 'thumbAcrossB', null),
      rng('t.h', -9, 1.0, 0.2, 0.6, null, 'thumbLowerB'),
      dir('up'), palm('front', 0.6)] },
    { id: 'C', c: [fing('i', ['CURVE']), fing('m', ['CURVE']), fing('r', ['CURVE']), fing('p', ['CURVE', 'HOOK']),
      rng('t.dIT', 0.33, 1.5, 0.15, 1.2, 'cOpen', 'cClose'),
      rng('t.lat', -0.9, 0.4, 0.15, 0.5, null, 'thumbOppC'),
      palm('side', 0.5)] },
    { id: 'D', c: [fing('i', EX, 1.3), fing('m', CV), fing('r', CV), fing('p', CV),
      rng('t.dMT', 0, 0.42, 0.15, 1.2, null, 'touchMid'),
      dir('up'), palm('front')] },
    { id: 'E', c: [...fist(),
      rng('tipsH', 0.72, 1.12, 0.12, 0.9, 'tipsUpE', 'tipsDownE'),
      rng('t.above', -9, -0.04, 0.08, 1.3, null, 'thumbUnderTips'),
      rng('t.lat', 0.1, 1.05, 0.15, 0.6, 'thumbAcrossE', null),
      dir('up', 0.6), palm('front', 0.5)] },
    { id: 'F', c: [fing('i', CV, 1.1), fing('m', EX), fing('r', EX), fing('p', EX),
      rng('t.dIT', 0, 0.38, 0.15, 1.5, null, 'touchIdx'),
      rng('gap.mr', 0.25, 9, 0.1, 0.3, 'spread3', null),
      dir('up', 0.6), palm('front')] },
    { id: 'G', c: [fing('i', EX, 1.2), fing('m', CL), fing('r', CL), fing('p', CL),
      fdir('i', 'side', 1.3),
      rng('t.par', 0, 40, 15, 0.8, null, 'thumbParallel'),
      rng('t.bend', 0, 70, 20, 0.4, null, 'thumbStraight')] },
    { id: 'H', c: [fing('i', EX), fing('m', EX, 1.1), fing('r', CL), fing('p', CL),
      rng('gap.im', 0, 0.38, 0.12, 0.8, null, 'togetherIM'),
      fdir('i', 'side', 1.3), fdir('m', 'side', 0.6)] },
    { id: 'I', c: [fing('i', CL), fing('m', CL), fing('r', CL), fing('p', EX, 1.4),
      rng('t.lat', -0.05, 1.3, 0.15, 1.0, 'thumbOverI', null),
      idxDown(0.4), dir('up', 0.7), palm('front')] },
    { id: 'J', motion: 'J', track: 20, twin: 'I', c: [fing('i', CL), fing('m', CL), fing('r', CL), fing('p', EX, 1.4),
      rng('t.lat', -0.05, 1.3, 0.15, 0.8, 'thumbOverI', null)] },
    { id: 'K', c: [fing('i', EX), fing('m', EX, 1.1), fing('r', CL), fing('p', CL),
      rng('gap.im', 0.38, 9, 0.1, 0.8, 'spreadIM', null),
      rng('t.h', 0.95, 9, 0.15, 1.2, 'thumbUpK', null),
      rng('t.dMP', 0, 0.55, 0.15, 1.0, null, 'thumbToMid'),
      dir('up', 1.0), palm('front')] },
    { id: 'L', c: [fing('i', EX, 1.2), fing('m', CL), fing('r', CL), fing('p', CL),
      rng('t.lat', -9, -0.35, 0.15, 1.2, null, 'thumbOutL'),
      rng('t.spread', 45, 180, 15, 0.8, 'thumbOutL', null),
      rng('t.bend', 0, 70, 20, 0.4, null, 'thumbStraight'),
      fdir('i', 'up', 1.0), palm('front', 0.5)] },
    { id: 'M', c: [...fist(), idxDown(0.4),
      rng('t.lat', 0.6, 1.2, 0.1, 1.5, 'thumbM', 'thumbM'),
      rng('t.front', -9, 0.02, 0.08, 1.0, null, 'thumbUnder'),
      dir('up', 0.6), palm('front')] },
    { id: 'N', c: [...fist(), idxDown(0.4),
      rng('t.lat', 0.3, 0.6, 0.1, 1.5, 'thumbN', 'thumbN'),
      rng('t.front', -9, 0.02, 0.08, 1.0, null, 'thumbUnder'),
      dir('up', 0.6), palm('front')] },
    { id: 'O', c: [fing('i', ['CURVE', 'HOOK']), fing('m', ['CURVE', 'HOOK']), fing('r', ['CURVE', 'HOOK']), fing('p', CV),
      rng('t.dIT', 0, 0.4, 0.15, 1.3, null, 'touchO'),
      rng('t.dMT', 0, 0.5, 0.15, 0.8, null, 'touchO'),
      rng('tipsH', 0.95, 9, 0.12, 0.8, 'tipsUpO', null),
      rng('t.above', -0.12, 9, 0.08, 0.5, 'touchO', null)] },
    { id: 'P', c: [fing('i', EX), fing('m', ['EXT', 'CURVE']), fing('r', CL), fing('p', CL),
      rng('t.dMP', 0, 0.6, 0.15, 0.8, null, 'thumbToMid'),
      rng('gap.im', 0.25, 9, 0.1, 0.4, 'spreadIM', null),
      dir('down', 1.3), fdir('m', 'down', 0.8)] },
    { id: 'Q', c: [fing('i', EX, 1.2), fing('m', CL), fing('r', CL), fing('p', CL),
      fdir('i', 'down', 1.4),
      rng('t.par', 0, 45, 15, 0.6, null, 'thumbParallel'),
      rng('t.bend', 0, 70, 20, 0.3, null, 'thumbStraight')] },
    { id: 'R', c: [fing('i', EX), fing('m', EX, 1.1), fing('r', CL), fing('p', CL),
      rng('cross.im', -9, 0.12, 0.08, 1.5, null, 'crossIM'),
      dir('up'), palm('front')] },
    { id: 'S', c: [...fist(), idxDown(0.4),
      rng('t.lat', 0.12, 0.8, 0.12, 1.0, 'thumbAcrossS', 'thumbAcrossS'),
      rng('t.front', 0.04, 9, 0.08, 1.2, 'thumbFrontS', null),
      rng('t.above', 0.02, 9, 0.08, 1.0, 'thumbFrontS', null),
      rng('tipsH', -9, 0.95, 0.12, 0.6, null, 'tighterFist'),
      dir('up', 0.6), palm('front')] },
    { id: 'T', c: [...fist(),
      rng('t.lat', 0.02, 0.35, 0.08, 1.5, 'thumbT', 'thumbT'),
      rng('t.h', 0.75, 1.35, 0.15, 0.7, 'thumbT', 'thumbT'),
      rng('t.front', -9, 0.08, 0.06, 0.4, null, 'thumbUnderIdx'),
      dir('up', 0.6), palm('front')] },
    { id: 'U', c: [fing('i', EX), fing('m', EX, 1.1), fing('r', CL), fing('p', CL),
      rng('gap.im', 0, 0.36, 0.1, 1.0, null, 'togetherIM'),
      rng('cross.im', 0.12, 9, 0.08, 0.8, 'uncross', null),
      rng('t.lat', 0.05, 1.3, 0.15, 0.4, 'thumbHold', null),
      dir('up', 1.0), palm('front')] },
    { id: 'V', c: [fing('i', EX), fing('m', EX, 1.1), fing('r', CL), fing('p', CL),
      rng('gap.im', 0.42, 9, 0.1, 1.2, 'spreadIM', null),
      rng('t.h', -9, 0.95, 0.15, 0.8, null, 'thumbDownV'),
      rng('t.lat', 0.05, 1.3, 0.15, 0.4, 'thumbHold', null),
      dir('up'), palm('front')] },
    { id: 'W', c: [fing('i', EX), fing('m', EX), fing('r', EX, 1.1), fing('p', ['CURL', 'HOOK', 'CURVE']),
      rng('gap.im', 0.36, 9, 0.1, 0.6, 'spreadW', null),
      rng('gap.mr', 0.36, 9, 0.1, 0.6, 'spreadW', null),
      rng('t.dPT', 0, 0.55, 0.15, 0.8, null, 'thumbPinky'),
      dir('up'), palm('front')] },
    { id: 'X', c: [fing('i', ['HOOK'], 1.5), fing('m', CL), fing('r', CL), fing('p', CL),
      rng('idxRaise', 0.22, 9, 0.08, 1.2, 'idxUpX', null),
      dir('up', 0.4)] },
    { id: 'Y', c: [fing('i', CL), fing('m', CL), fing('r', CL), fing('p', EX, 1.3),
      rng('t.lat', -9, -0.3, 0.15, 1.3, null, 'thumbOut'),
      rng('t.spread', 40, 180, 15, 0.6, 'thumbOut', null),
      dir('up', 0.3), palm('front', 0.3)] },
    { id: 'Z', motion: 'Z', track: 8, twin: 'D', c: [fing('i', EX, 1.3), fing('m', CL), fing('r', CL), fing('p', CL),
      rng('t.lat', -0.1, 9, 0.15, 0.5, 'thumbHoldMid', null)] },
  ];
  const BY_ID = {};
  for (const L of LETTERS) BY_ID[L.id] = L;

  // Learning order: similar handshapes sit in different levels where possible.
  const GROUPS = [
    ['A', 'B', 'C', 'D', 'E'],
    ['F', 'G', 'H', 'I', 'K'],
    ['L', 'O', 'U', 'V', 'W', 'Y'],
    ['M', 'N', 'S', 'T', 'X'],
    ['P', 'Q', 'R', 'J', 'Z'],
  ];

  const WORDS = [
    { w: 'HI', uk: 'привіт' }, { w: 'MOM', uk: 'мама' }, { w: 'DAD', uk: 'тато' },
    { w: 'LOVE', uk: 'любов' }, { w: 'BABY', uk: 'малюк' }, { w: 'HUG', uk: 'обійми' },
    { w: 'EAT', uk: 'їсти' }, { w: 'MILK', uk: 'молоко' }, { w: 'PLAY', uk: 'гратися' },
    { w: 'HOME', uk: 'дім' }, { w: 'YES', uk: 'так' }, { w: 'NO', uk: 'ні' }, { w: 'HELP', uk: 'допомога' },
  ];

  /* ---------- scoring ---------- */
  const ACCEPT = 0.78; // letter score needed to count the sign
  const HARD = 0.4;    // no important constraint (weight >= 1) may fall below this
  const MARGIN = 0.06; // another letter must not look clearly better

  function rangeDegree(x, lo, hi, soft) {
    if (x >= lo && x <= hi) return 1;
    const d = x < lo ? lo - x : x - hi;
    return clamp01(1 - d / soft);
  }
  function fingerDegree(fd, allowed) {
    let dBest = Infinity;
    let dAllow = Infinity;
    for (const s in STATES) {
      const d = stateDist(fd, s);
      if (d < dBest) dBest = d;
      if (allowed.indexOf(s) >= 0 && d < dAllow) dAllow = d;
    }
    return clamp01(1 - (dAllow - dBest) / 30);
  }
  function dirDegree(angleDeg, target) {
    const targets = target === 'up' ? [90] : target === 'down' ? [-90] : [0, 180];
    let best = 180;
    for (const t of targets) best = Math.min(best, Math.abs((((angleDeg - t) % 360) + 540) % 360 - 180));
    return clamp01(1 - (best - 35) / 35); // full credit within 35 degrees, none beyond 70
  }
  function palmDegree(facing, target) {
    if (facing == null) return 1; // not calibrated: palm side is not checked
    if (target === 'front') return clamp01((facing + 0.25) / 0.35);
    if (target === 'side') return clamp01(1 - (Math.abs(facing) - 0.6) / 0.3);
    return 1;
  }

  function evalLetter(L, f, ctx) {
    const items = [];
    let lw = 0;
    let sw = 0;
    let minHard = 1;
    for (const c of L.c) {
      let deg = 1;
      if (c.type === 'finger') deg = fingerDegree(f.fingers[c.k], c.allowed);
      else if (c.type === 'range') deg = rangeDegree(f.v[c.feat], c.lo, c.hi, c.soft);
      else if (c.type === 'dir') deg = dirDegree(f.orient.hand, c.target);
      else if (c.type === 'fdir') deg = dirDegree(f.orient[c.k], c.target);
      else if (c.type === 'palm') deg = palmDegree(ctx && ctx.facing, c.target);
      items.push({ c, deg });
      lw += c.w * Math.log(Math.max(deg, 0.05)); // weighted geometric mean: one clear miss sinks the score
      sw += c.w;
      if (c.w >= 1 && deg < minHard) minHard = deg;
    }
    const spec = Math.exp(lw / sw);
    let tmpl = 0;
    const list = ctx && ctx.templates && ctx.templates[L.id];
    if (list && list.length && ctx.vec) tmpl = templateScore(ctx.vec, list);
    const score = Math.max(spec, tmpl);
    return { id: L.id, score, spec, tmpl, minHard: tmpl >= ACCEPT ? 1 : minHard, items, f };
  }

  function evaluateAll(f, ctx) {
    ctx = Object.assign({}, ctx || {});
    if (ctx.templates && Object.keys(ctx.templates).length) ctx.vec = toVector(f);
    const out = {};
    for (const L of LETTERS) out[L.id] = evalLetter(L, f, ctx);
    return out;
  }

  // Decide whether the target letter is shown. motionSeen: {J: true} when the J motion was just detected.
  function judge(targetId, all, motionSeen) {
    const r = all[targetId];
    const L = BY_ID[targetId];
    let other = null;
    for (const id in all) {
      if (id === targetId || id === L.twin) continue;
      if (BY_ID[id].motion && !(motionSeen && motionSeen[id])) continue;
      if (!other || all[id].score > other.score) other = all[id];
    }
    const shapeOK = r.score >= ACCEPT && r.minHard >= HARD;
    const ok = shapeOK && (!other || other.score - r.score < MARGIN);
    const looks = other && other.score >= ACCEPT && other.score > r.score + 0.02 ? other.id : null;
    return { ok, shapeOK, score: r.score, other, looks };
  }

  function rank(all, motionSeen) {
    return Object.keys(all)
      .filter((id) => !BY_ID[id].motion || (motionSeen && motionSeen[id]))
      .map((id) => ({ id, score: all[id].score + (motionSeen && motionSeen[id] ? 0.05 : 0) }))
      .sort((a, b) => b.score - a.score);
  }

  // Lowest constraint degree per hand part, for colouring the skeleton.
  function partDegrees(res) {
    const out = { i: 1, m: 1, r: 1, p: 1, t: 1, palm: 1 };
    const set = (k, d) => { if (d < out[k]) out[k] = d; };
    for (const it of res.items) {
      const c = it.c;
      const d = it.deg;
      if (c.type === 'finger' || c.type === 'fdir') set(c.k, d);
      else if (c.type === 'range') {
        if (c.feat.indexOf('t.') === 0) set('t', d);
        else if (c.feat === 'gap.im' || c.feat === 'cross.im') { set('i', d); set('m', d); }
        else if (c.feat === 'gap.mr') { set('m', d); set('r', d); }
        else if (c.feat === 'gap.rp') { set('r', d); set('p', d); }
        else if (c.feat === 'tipH.i' || c.feat === 'pipH.i' || c.feat === 'idxRaise') set('i', d);
        else if (c.feat === 'tipsH') FKEYS.forEach((k) => set(k, d));
      } else set('palm', d);
    }
    return out;
  }

  /* ---------- hints ---------- */
  const HINTS = {
    uk: {
      F_EXT: 'Випряміть {f}',
      F_CURL: 'Зігніть {f} до долоні',
      F_HOOK: 'Зігніть {f} гачком: основа пряма, кінчик загнутий',
      F_CURVE: 'Заокругліть {f} дугою',
      F_BENT: 'Зігніть {f} в основі, а сам палець тримайте прямим',
      idxDown: 'Опустіть вказівний палець у кулак',
      thumbCloser: 'Притисніть великий палець до боку вказівного',
      thumbSideA: 'Великий палець має бути збоку від вказівного, а не поверх пальців',
      thumbUp: 'Підніміть великий палець трохи вище',
      thumbDown: 'Опустіть великий палець трохи нижче',
      thumbAcrossB: 'Зігніть великий палець і притисніть його до долоні',
      thumbLowerB: 'Опустіть великий палець нижче, до середини долоні',
      together: 'Зімкніть пальці щільно',
      togetherIM: 'Зімкніть вказівний і середній пальці',
      spreadIM: 'Розведіть вказівний і середній пальці',
      spreadW: 'Розведіть три пальці віялом',
      spread3: 'Трохи розведіть три випрямлені пальці',
      cOpen: 'Розкрийте «C»: між великим і вказівним пальцями має бути проміжок',
      cClose: 'Зігніть пальці сильніше, щоб вийшла дуга',
      thumbOppC: 'Тримайте великий палець знизу, навпроти інших пальців',
      touchMid: 'Торкніться великим пальцем кінчика середнього',
      touchIdx: 'З’єднайте кінчики великого й вказівного пальців у кільце',
      touchO: 'Зведіть кінчики всіх пальців до великого, щоб вийшло «O»',
      tipsUpE: 'Не стискайте кулак: покладіть кінчики пальців на великий палець',
      tipsDownE: 'Зігніть пальці сильніше',
      thumbUnderTips: 'Підтягніть великий палець під кінчики пальців',
      thumbAcrossE: 'Покладіть великий палець поперек долоні',
      thumbParallel: 'Тримайте великий палець паралельно вказівному',
      thumbStraight: 'Випряміть великий палець',
      thumbOverI: 'Прикрийте великим пальцем зігнуті пальці',
      thumbUpK: 'Поставте великий палець між вказівним і середнім',
      thumbToMid: 'Торкніться великим пальцем середнього пальця біля суглоба',
      thumbOutL: 'Відведіть великий палець убік, щоб вийшла «L»',
      thumbOut: 'Відведіть великий палець убік',
      thumbM: 'Просуньте великий палець під три пальці, аж до мізинця',
      thumbN: 'Просуньте великий палець під два пальці, між середнім і безіменним',
      thumbUnder: 'Сховайте великий палець під пальці',
      tipsUpO: 'Розкрийте кулак: пальці мають утворити кільце',
      crossIM: 'Схрестіть середній палець поверх вказівного',
      uncross: 'Не схрещуйте пальці',
      thumbAcrossS: 'Покладіть великий палець поперек пальців спереду',
      thumbFrontS: 'Великий палець має лежати спереду пальців, а не під ними',
      tighterFist: 'Стисніть кулак щільніше',
      thumbT: 'Просуньте великий палець між вказівним і середнім',
      thumbUnderIdx: 'Накрийте великий палець вказівним',
      thumbHold: 'Притримайте великим пальцем безіменний палець і мізинець',
      thumbDownV: 'Опустіть великий палець на безіменний, інакше вийде «K»',
      thumbPinky: 'Притримайте мізинець великим пальцем',
      idxUpX: 'Підніміть вказівний палець і зігніть його гачком',
      thumbHoldMid: 'Притримайте великим пальцем середній',
      dir_up: 'Спрямуйте пальці вгору',
      dir_side: 'Поверніть кисть, щоб пальці дивилися вбік',
      dir_down: 'Спрямуйте пальці донизу',
      palm_front: 'Поверніть долоню до камери',
      palm_side: 'Поверніть руку ребром до камери',
      motion_J: 'Тепер намалюйте мізинцем у повітрі літеру J',
      motion_Z: 'Тепер намалюйте вказівним пальцем у повітрі літеру Z',
      noHand: 'Покажіть руку в кадрі',
      edge: 'Рука виходить за край кадру',
      far: 'Піднесіть руку ближче до камери',
      near: 'Трохи відсуньте руку від камери',
      moving: 'Тримайте руку нерухомо',
    },
    en: {
      F_EXT: 'Straighten {f}',
      F_CURL: 'Curl {f} into your palm',
      F_HOOK: 'Bend {f} into a hook',
      F_CURVE: 'Curve {f} into an arc',
      F_BENT: 'Bend {f} at the knuckle, keeping it straight',
      idxDown: 'Curl your index finger down into the fist',
      thumbCloser: 'Bring your thumb against the side of your index finger',
      thumbSideA: 'Rest your thumb on the side of your index finger, not over your fingers',
      thumbUp: 'Raise your thumb a little',
      thumbDown: 'Lower your thumb a little',
      thumbAcrossB: 'Fold your thumb across your palm',
      thumbLowerB: 'Tuck your thumb lower across your palm',
      together: 'Press your fingers together',
      togetherIM: 'Press your index and middle fingers together',
      spreadIM: 'Spread your index and middle fingers apart',
      spreadW: 'Spread the three fingers apart',
      spread3: 'Spread the three straight fingers a little',
      cOpen: 'Open the C: leave a gap between your thumb and index finger',
      cClose: 'Curve your fingers more to make an arc',
      thumbOppC: 'Hold your thumb below, opposite your fingers',
      touchMid: 'Touch your thumb to the tip of your middle finger',
      touchIdx: 'Touch your thumb and index fingertips to make a circle',
      touchO: 'Bring all fingertips to your thumb to form an O',
      tipsUpE: 'Don’t make a tight fist: rest your fingertips on your thumb',
      tipsDownE: 'Bend your fingers more',
      thumbUnderTips: 'Tuck your thumb under your fingertips',
      thumbAcrossE: 'Lay your thumb across your palm',
      thumbParallel: 'Hold your thumb parallel to your index finger',
      thumbStraight: 'Straighten your thumb',
      thumbOverI: 'Rest your thumb over your curled fingers',
      thumbUpK: 'Place your thumb up between your index and middle fingers',
      thumbToMid: 'Touch your thumb to the middle of your middle finger',
      thumbOutL: 'Stick your thumb out to the side to make an L',
      thumbOut: 'Stick your thumb out to the side',
      thumbM: 'Tuck your thumb under three fingers, next to your pinky',
      thumbN: 'Tuck your thumb under two fingers, between your middle and ring fingers',
      thumbUnder: 'Tuck your thumb under your fingers',
      tipsUpO: 'Open your fist: your fingers should form a ring',
      crossIM: 'Cross your middle finger over your index finger',
      uncross: 'Don’t cross your fingers',
      thumbAcrossS: 'Wrap your thumb across the front of your fingers',
      thumbFrontS: 'Keep your thumb in front of your fingers, not under them',
      tighterFist: 'Make a tighter fist',
      thumbT: 'Tuck your thumb between your index and middle fingers',
      thumbUnderIdx: 'Cover your thumb with your index finger',
      thumbHold: 'Hold down your ring finger and pinky with your thumb',
      thumbDownV: 'Lower your thumb onto your ring finger, otherwise it reads as K',
      thumbPinky: 'Hold your pinky down with your thumb',
      idxUpX: 'Raise your index finger and bend it into a hook',
      thumbHoldMid: 'Hold your middle finger down with your thumb',
      dir_up: 'Point your fingers up',
      dir_side: 'Turn your hand so your fingers point sideways',
      dir_down: 'Point your fingers down',
      palm_front: 'Turn your palm toward the camera',
      palm_side: 'Turn the edge of your hand toward the camera',
      motion_J: 'Now draw a J in the air with your pinky',
      motion_Z: 'Now draw a Z in the air with your index finger',
      noHand: 'Show your hand to the camera',
      edge: 'Your hand is partly out of frame',
      far: 'Move your hand closer to the camera',
      near: 'Move your hand a bit farther from the camera',
      moving: 'Hold your hand still',
    },
  };

  function fingerPhrase(keys, lang) {
    const order = FKEYS.filter((k) => keys.indexOf(k) >= 0);
    const hasP = order.indexOf('p') >= 0;
    const adj = order.filter((k) => k !== 'p');
    if (lang === 'en') {
      if (order.length === 4) return 'all four fingers';
      const names = { i: 'index', m: 'middle', r: 'ring' };
      const a = adj.map((k) => names[k]);
      let s = '';
      if (a.length === 1) s = a[0] + ' finger';
      else if (a.length === 2) s = a[0] + ' and ' + a[1] + ' fingers';
      else if (a.length === 3) s = a[0] + ', ' + a[1] + ' and ' + a[2] + ' fingers';
      if (hasP) s = s ? s + ' and pinky' : 'pinky';
      return 'your ' + s;
    }
    if (order.length === 4) return 'усі чотири пальці';
    const names = { i: 'вказівний', m: 'середній', r: 'безіменний' };
    const a = adj.map((k) => names[k]);
    let s = '';
    if (a.length === 1) s = a[0] + ' палець';
    else if (a.length === 2) s = a[0] + ' і ' + a[1] + ' пальці';
    else if (a.length === 3) s = a[0] + ', ' + a[1] + ' і ' + a[2] + ' пальці';
    if (hasP) s = s ? s + ' та мізинець' : 'мізинець';
    return s;
  }

  // Ranked corrective hints for one evaluated letter.
  function hintsFor(res, lang, max) {
    lang = HINTS[lang] ? lang : 'uk';
    max = max || 2;
    const H = HINTS[lang];
    const groups = {};
    const list = [];
    for (const it of res.items) {
      if (it.deg >= 0.85) continue;
      const c = it.c;
      const pr = c.w * (1 - it.deg);
      if (c.type === 'finger') {
        const fd = res.f.fingers[c.k];
        let want = c.allowed[0];
        let bd = Infinity;
        for (const s of c.allowed) {
          const d = stateDist(fd, s);
          if (d < bd) { bd = d; want = s; }
        }
        const g = groups[want] || (groups[want] = { keys: [], pr: 0 });
        g.keys.push(c.k);
        g.pr += pr;
      } else if (c.type === 'range') {
        const x = res.f.v[c.feat];
        const key = x < c.lo ? c.low : c.high;
        if (key && H[key]) list.push({ key, text: H[key], pr });
      } else if (c.type === 'dir' || c.type === 'fdir') {
        list.push({ key: 'dir_' + c.target, text: H['dir_' + c.target], pr });
      } else if (c.type === 'palm') {
        list.push({ key: 'palm_' + c.target, text: H['palm_' + c.target], pr });
      }
    }
    for (const s in groups) {
      const g = groups[s];
      list.push({ key: 'F_' + s, text: H['F_' + s].replace('{f}', fingerPhrase(g.keys, lang)), pr: g.pr });
    }
    list.sort((a, b) => b.pr - a.pr);
    const seen = {};
    const out = [];
    for (const h of list) {
      if (seen[h.key]) continue;
      seen[h.key] = true;
      out.push(h);
      if (out.length >= max) break;
    }
    return out;
  }

  /* ---------- letter descriptions ---------- */
  const LETTER_TEXT = {
    uk: {
      A: 'Кулак. Великий палець притиснутий збоку до вказівного й дивиться вгору.',
      B: 'Чотири пальці випрямлені й зімкнуті, великий палець зігнутий поперек долоні.',
      C: 'Зігніть пальці й великий палець дугою, як літеру C. Рука повернута ребром до камери.',
      D: 'Вказівний палець угору. Інші пальці торкаються кінчика великого й утворюють кільце.',
      E: 'Пальці зігнуті, кінчики лежать на великому пальці, притиснутому до долоні.',
      F: 'Кінчики великого й вказівного пальців з’єднані в кільце, інші три пальці випрямлені.',
      G: 'Вказівний і великий пальці паралельно дивляться вбік, інші зігнуті.',
      H: 'Вказівний і середній пальці разом дивляться вбік, інші зігнуті.',
      I: 'Мізинець угору, інші пальці в кулаку, великий палець поверх них.',
      J: 'Покажіть I і намалюйте мізинцем у повітрі літеру J: униз, а потім заокругліть.',
      K: 'Вказівний і середній пальці вгору й розведені, великий палець між ними торкається середнього.',
      L: 'Вказівний палець угору, великий убік: виходить кут, як у літери L.',
      M: 'Великий палець під трьома пальцями: вказівним, середнім і безіменним.',
      N: 'Великий палець під двома пальцями: вказівним і середнім.',
      O: 'Усі пальці зігнуті й торкаються кінчика великого, утворюючи кільце O.',
      P: 'Як K, але кисть повернута донизу: середній палець дивиться вниз.',
      Q: 'Як G, але вказівний і великий пальці дивляться вниз.',
      R: 'Вказівний і середній пальці вгору й схрещені: середній лежить поверх вказівного.',
      S: 'Кулак, великий палець поперек пальців спереду.',
      T: 'Кулак, великий палець просунутий між вказівним і середнім.',
      U: 'Вказівний і середній пальці вгору й зімкнуті.',
      V: 'Вказівний і середній пальці вгору й розведені.',
      W: 'Вказівний, середній і безіменний пальці вгору й розведені, великий тримає мізинець.',
      X: 'Вказівний палець піднятий і зігнутий гачком, інші в кулаку.',
      Y: 'Великий палець і мізинець відставлені, інші пальці зігнуті.',
      Z: 'Вказівний палець угору, і ним намалюйте в повітрі літеру Z.',
    },
    en: {
      A: 'Make a fist with your thumb resting against the side of your index finger.',
      B: 'Four fingers straight up and together, thumb folded across your palm.',
      C: 'Curve your fingers and thumb into a C, with the edge of your hand toward the camera.',
      D: 'Index finger up; the other fingers curve to touch your thumb, forming a circle.',
      E: 'Bend your fingers so the tips rest on your thumb, which is tucked across your palm.',
      F: 'Touch your thumb and index fingertips; keep the other three fingers up and apart.',
      G: 'Index finger and thumb point sideways, parallel to each other; other fingers curled.',
      H: 'Index and middle fingers together, pointing sideways; other fingers curled.',
      I: 'Pinky up; other fingers curled with your thumb over them.',
      J: 'Make an I and draw a J in the air with your pinky: down, then curve.',
      K: 'Index and middle fingers up and apart, thumb between them touching the middle finger.',
      L: 'Index finger up and thumb out to the side, forming an L.',
      M: 'Tuck your thumb under your index, middle and ring fingers.',
      N: 'Tuck your thumb under your index and middle fingers.',
      O: 'Curve all fingers to touch your thumb, forming an O.',
      P: 'Like K, but with your hand turned down so the middle finger points down.',
      Q: 'Like G, but with your index finger and thumb pointing down.',
      R: 'Index and middle fingers up and crossed, middle over index.',
      S: 'Make a fist with your thumb wrapped across the front of your fingers.',
      T: 'Make a fist with your thumb tucked between your index and middle fingers.',
      U: 'Index and middle fingers up and together.',
      V: 'Index and middle fingers up and apart, like a V.',
      W: 'Index, middle and ring fingers up and spread; thumb holds the pinky.',
      X: 'Raise your index finger and bend it into a hook; other fingers curled.',
      Y: 'Thumb and pinky out, other fingers curled.',
      Z: 'Point your index finger up and draw a Z in the air.',
    },
  };

  /* ---------- motion letters ---------- */
  function segDist(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  }
  // Ramer-Douglas-Peucker polyline simplification.
  function rdp(pts, eps) {
    if (pts.length < 3) return pts.slice();
    const a = pts[0];
    const b = pts[pts.length - 1];
    let maxD = -1;
    let idx = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = segDist(pts[i], a, b);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
      const left = rdp(pts.slice(0, idx + 1), eps);
      const right = rdp(pts.slice(idx), eps);
      return left.slice(0, -1).concat(right);
    }
    return [a, b];
  }
  // trail: [{t, x, y, s, ok}] with x, y in pixels of the raw frame (y down), s = palm size in pixels,
  // ok = the letter's handshape matched in that frame. Coordinates become palm units.
  function prepTrail(trail, now, windowMs) {
    const pts = trail.filter((p) => now - p.t <= windowMs);
    if (pts.length < 6) return null;
    const okRatio = pts.filter((p) => p.ok).length / pts.length;
    const s = median(pts.map((p) => p.s)) || 1;
    return { pts: pts.map((p) => [p.x / s, p.y / s]), okRatio };
  }
  // Z: three strokes - sideways, diagonal down and back, sideways again (either mirror image).
  function detectZ(trail, now) {
    const T = prepTrail(trail, now, 2200);
    if (!T || T.okRatio < 0.4) return false;
    const v = rdp(T.pts, 0.2);
    const horiz = (s) => Math.abs(s[0]) >= 0.45 && Math.abs(s[1]) <= 0.75 * Math.abs(s[0]);
    for (let i = 0; i + 3 < v.length; i++) {
      const s1 = [v[i + 1][0] - v[i][0], v[i + 1][1] - v[i][1]];
      const s2 = [v[i + 2][0] - v[i + 1][0], v[i + 2][1] - v[i + 1][1]];
      const s3 = [v[i + 3][0] - v[i + 2][0], v[i + 3][1] - v[i + 2][1]];
      const sx = Math.sign(s1[0]);
      if (!sx) continue;
      const diag = Math.sign(s2[0]) === -sx && Math.abs(s2[0]) >= 0.3 && s2[1] >= 0.35;
      if (horiz(s1) && diag && Math.sign(s3[0]) === sx && horiz(s3)) return true;
    }
    return false;
  }
  // J: a mostly vertical stroke down, then a hook sideways (either direction).
  function detectJ(trail, now) {
    const T = prepTrail(trail, now, 1800);
    if (!T || T.okRatio < 0.35) return false;
    const P = T.pts;
    let si = 0;
    for (let i = 1; i < P.length / 2; i++) if (P[i][1] < P[si][1]) si = i;
    let bi = si;
    for (let i = si; i < P.length; i++) if (P[i][1] > P[bi][1]) bi = i;
    const descent = P[bi][1] - P[si][1];
    if (descent < 0.45) return false;
    let k = si;
    while (k < bi && P[k][1] - P[si][1] < 0.7 * descent) k++;
    let sideways = 0;
    for (let i = si + 1; i <= k; i++) sideways += Math.abs(P[i][0] - P[i - 1][0]);
    if (sideways > 0.5 * (P[k][1] - P[si][1]) + 0.1) return false; // the down stroke must be vertical
    const end = P[P.length - 1];
    let hook = 0;
    for (let i = k; i < P.length; i++) hook = Math.max(hook, Math.abs(P[i][0] - P[k][0]));
    const v1 = [P[k][0] - P[si][0], P[k][1] - P[si][1]];
    const v2 = [end[0] - P[k][0], end[1] - P[k][1]];
    const turn = Math.hypot(v2[0], v2[1]) > 0.15 ? angleBetween([v1[0], v1[1], 0], [v2[0], v2[1], 0]) : 0;
    return hook >= 0.22 && turn >= 35;
  }

  /* ---------- recorded references ---------- */
  function toVector(f) {
    const out = [];
    for (const k of FKEYS) {
      const d = f.fingers[k];
      out.push(d.mcp / 90, d.pip / 110, d.dip / 90, clamp(d.tipH, -0.5, 2.5) / 2);
    }
    const t = f.thumb;
    out.push(
      clamp(t.lat, -1.5, 1.5), clamp(t.h, -0.5, 2.5) / 1.5,
      Math.min(t.dIT, 1.5) / 1.5, Math.min(t.dMT, 1.5) / 1.5, Math.min(t.dIP, 1.5) / 1.5, Math.min(t.dMP, 1.5) / 1.5,
      clamp(t.above, -1, 1), t.bend / 150, t.spread / 120, t.par / 120
    );
    out.push(Math.min(f.gaps.im, 1.5) / 1.5, Math.min(f.gaps.mr, 1.5) / 1.5, Math.min(f.gaps.rp, 1.5) / 1.5, clamp(f.crossIM, -1, 1));
    out.push(clamp(f.idxRaise, -1, 1));
    const a = f.orient.hand / DEG;
    out.push(0.7 * Math.cos(a), 0.7 * Math.sin(a));
    return out;
  }
  function rms(a, b) {
    let s = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) s += (a[i] - b[i]) ** 2;
    return Math.sqrt(s / (n || 1));
  }
  function templateScore(vec, list) {
    let best = 0;
    for (const t of list) best = Math.max(best, clamp01(1 - (rms(vec, t.v) - 0.05) / 0.12));
    return best;
  }

  /* ---------- whole-word signs ----------
     A sign = handshape (rules as for letters) + where the hand is relative to the face + movement.
     Only one-handed signs: two-handed signs and facial grammar need pose and face landmarks. */
  const SHAPES = {
    ILY: [fing('i', EX, 1.2), fing('m', CL), fing('r', CL), fing('p', EX, 1.2),
      rng('t.lat', -9, -0.2, 0.15, 1.2, null, 'thumbOut'), rng('t.spread', 35, 180, 15, 0.6, 'thumbOut', null),
      palm('front', 0.4)],
    FIVE: [fing('i', EX), fing('m', EX), fing('r', EX), fing('p', EX),
      rng('gap.im', 0.4, 9, 0.08, 0.7, 'spreadAll', null), rng('gap.mr', 0.4, 9, 0.08, 0.6, 'spreadAll', null),
      rng('t.lat', -9, -0.15, 0.15, 1.0, null, 'thumbOut')],
    // fingers together; the gap thresholds keep a margin from FIVE (spread) so the two never both pass
    FLAT: [fing('i', EX), fing('m', EX), fing('r', EX), fing('p', EX),
      rng('gap.im', 0, 0.34, 0.08, 0.6, null, 'together'), rng('gap.mr', 0, 0.34, 0.08, 0.5, null, 'together')],
    FIST: [...fist(), idxDown(0.6), rng('t.lat', -0.75, 9, 0.15, 0.6, 'thumbCloser', null)],
    ONE: [fing('i', EX, 1.3), fing('m', CL), fing('r', CL), fing('p', CL),
      rng('t.lat', -0.15, 9, 0.15, 0.4, 'thumbHoldMid', null)],
    W: [fing('i', EX), fing('m', EX), fing('r', EX, 1.1), fing('p', ['CURL', 'HOOK', 'CURVE']),
      rng('gap.im', 0.3, 9, 0.1, 0.5, 'spreadW', null), rng('gap.mr', 0.3, 9, 0.1, 0.5, 'spreadW', null)],
    FLATO: [fing('i', ['CURVE', 'HOOK', 'BENT']), fing('m', ['CURVE', 'HOOK', 'BENT']),
      fing('r', ['CURVE', 'HOOK', 'BENT', 'CURL']), fing('p', ['CURVE', 'HOOK', 'BENT', 'CURL']),
      rng('t.dIT', 0, 0.42, 0.15, 1.2, null, 'touchO'), rng('t.dMT', 0, 0.5, 0.15, 0.8, null, 'touchO')],
    C: [fing('i', ['CURVE']), fing('m', ['CURVE']), fing('r', ['CURVE']), fing('p', ['CURVE', 'HOOK']),
      rng('t.dIT', 0.33, 1.5, 0.15, 1.2, 'cOpen', 'cClose')],
    NO: [fing('r', CL), fing('p', CL), fing('i', ['EXT', 'CURVE', 'HOOK']), fing('m', ['EXT', 'CURVE', 'HOOK']),
      rng('gap.im', 0, 0.42, 0.12, 0.5, null, 'togetherIM')],
    Y: [fing('i', CL), fing('m', CL), fing('r', CL), fing('p', EX, 1.3),
      rng('t.lat', -9, -0.3, 0.15, 1.3, null, 'thumbOut'), rng('t.spread', 40, 180, 15, 0.6, 'thumbOut', null)],
  };
  const SIGN_OK = 0.72; // handshape score that counts inside a sign

  // One hand - kind: static (hold a handshape) | contact (handshape touching a face zone) |
  //       away (touch a zone, then move away) | osc (repeated movement) | snap (fingers close onto the thumb)
  // Two hands - kind: touch2 (fingertips meet) | hold2 (fists crossed on the chest) | rock2 (cradle and rock) |
  //       twist2 (both hands twist or shake) | lift2 (fist on the flat palm, both lifted)
  const SIGNS = [
    { id: 'ILY', gloss: 'I LOVE YOU', kind: 'static', shape: 'ILY' },
    { id: 'MOM', gloss: 'MOM', kind: 'contact', shape: 'FIVE', point: 'thumbTip', zone: 'chin' },
    { id: 'DAD', gloss: 'DAD', kind: 'contact', shape: 'FIVE', point: 'thumbTip', zone: 'forehead' },
    { id: 'HELLO', gloss: 'HELLO', kind: 'away', shape: 'FLAT', point: 'indexTip', zone: 'forehead', r: 1.1 },
    { id: 'THANKYOU', gloss: 'THANK YOU', kind: 'away', shape: 'FLAT', point: 'fingertips', zone: 'chin' },
    { id: 'YES', gloss: 'YES', kind: 'osc', shape: 'FIST', signal: 'knuckleY', amp: 0.18, swings: 3 },
    { id: 'NO', gloss: 'NO', kind: 'snap', shape: 'NO' },
    { id: 'WHERE', gloss: 'WHERE', kind: 'osc', shape: 'ONE', signal: 'indexX', amp: 0.22, swings: 3 },
    { id: 'MILK', gloss: 'MILK', kind: 'osc', shape: null, signal: 'curl', amp: 0.3, swings: 3 },
    { id: 'EAT', gloss: 'EAT', kind: 'contact', shape: 'FLATO', point: 'tips', zone: 'mouth' },
    { id: 'DRINK', gloss: 'DRINK', kind: 'contact', shape: 'C', point: 'thumbTip', zone: 'chin' },
    { id: 'WATER', gloss: 'WATER', kind: 'contact', shape: 'W', point: 'indexTip', zone: 'chin' },
    { id: 'MORE', gloss: 'MORE', hands: 2, kind: 'touch2', shapes: ['FLATO', 'FLATO'] },
    { id: 'LOVE', gloss: 'LOVE', hands: 2, kind: 'hold2', shapes: ['FIST', 'FIST'] },
    { id: 'BABY', gloss: 'BABY', hands: 2, kind: 'rock2', shapes: ['OPEN', 'OPEN'], amp: 0.3, swings: 3 },
    { id: 'HELP', gloss: 'HELP', hands: 2, kind: 'lift2', shapes: ['FIST', 'FLAT'] },
    { id: 'PLAY', gloss: 'PLAY', hands: 2, kind: 'twist2', shapes: ['Y', 'Y'], amp: 0.3, swings: 3 },
  ];
  const SIGN_BY_ID = {};
  for (const s of SIGNS) SIGN_BY_ID[s.id] = s;

  const PHRASES = [
    { id: 'ily', signs: ['ILY'], uk: 'Я тебе люблю', en: 'I love you' },
    { id: 'mom-ily', signs: ['MOM', 'ILY'], uk: 'Мамо, я тебе люблю', en: 'Mom, I love you' },
    { id: 'hello-dad', signs: ['HELLO', 'DAD'], uk: 'Привіт, тату', en: 'Hello, Dad' },
    { id: 'thanks-mom', signs: ['THANKYOU', 'MOM'], uk: 'Дякую, мамо', en: 'Thank you, Mom' },
    { id: 'dad-where', signs: ['DAD', 'WHERE'], uk: 'Де тато?', en: 'Where is Dad?', note: true },
    { id: 'milk-yes', signs: ['MILK', 'YES'], uk: 'Молока? Так', en: 'Milk? Yes' },
    { id: 'eat-no', signs: ['EAT', 'NO'], uk: 'Їсти? Ні', en: 'Eat? No' },
    { id: 'more-milk', signs: ['MORE', 'MILK'], uk: 'Ще молока', en: 'More milk' },
    { id: 'mom-help', signs: ['MOM', 'HELP'], uk: 'Мамо, допоможи', en: 'Mom, help' },
    { id: 'play-more', signs: ['PLAY', 'MORE'], uk: 'Ще погратися?', en: 'Play more?' },
    { id: 'baby-love', signs: ['BABY', 'LOVE'], uk: 'Люблю малюка', en: 'I love the baby' },
  ];

  const SIGN_TEXT = {
    uk: {
      ILY: ['Я тебе люблю', 'Великий палець, вказівний і мізинець випрямлені, середній і безіменний зігнуті. Долоня дивиться на співрозмовника.'],
      MOM: ['мама', 'Розчепірте пальці й торкніться великим пальцем підборіддя, можна двічі.'],
      DAD: ['тато', 'Як «мама», але великий палець торкається лоба.'],
      HELLO: ['привіт', 'Пряма долоня біля лоба, як коли віддаєте честь, потім рух убік від голови.'],
      THANKYOU: ['дякую', 'Пряма долоня: кінчики пальців біля підборіддя, потім ведіть руку вперед і вниз.'],
      YES: ['так', 'Стисніть кулак і кивніть ним кілька разів, згинаючи зап’ястя, як голова каже «так».'],
      NO: ['ні', 'Вказівний і середній пальці разом, великий відставлений. Зімкніть їх із великим, ніби дзьоб закривається.'],
      WHERE: ['де', 'Вказівний палець угору. Похитайте ним з боку в бік.'],
      MILK: ['молоко', 'Кілька разів стисніть і розтисніть кулак, ніби доїте корову.'],
      EAT: ['їсти', 'Зберіть кінчики пальців до великого (пласке «O») і торкніться ними губ.'],
      DRINK: ['пити', 'Рука у формі «C», ніби тримаєте склянку. Піднесіть її до рота.'],
      WATER: ['вода', 'Рука «W»: торкніться вказівним пальцем підборіддя, можна двічі.'],
      MORE: ['ще', 'Обидві руки в пласке «O» (кінчики пальців разом). Кілька разів торкніться кінчиками пальців однієї руки до кінчиків іншої.'],
      LOVE: ['любити', 'Стисніть обидва кулаки, схрестіть руки й притисніть кулаки до грудей, ніби обіймаєте себе.'],
      BABY: ['малюк', 'Складіть руки, ніби тримаєте немовля: одне передпліччя на іншому, долоні вгору. Погойдайте руками з боку в бік.'],
      HELP: ['допомога', 'Кулак із піднятим великим пальцем поставте на розкриту долоню іншої руки й підніміть обидві руки разом.'],
      PLAY: ['гратися', 'Обидві руки в «Y»: великий палець і мізинець відставлені. Покрутіть кистями туди-сюди.'],
      note: 'В ASL питальне слово ставлять у кінці, а брови при цьому насуплюють.',
    },
    en: {
      ILY: ['I love you', 'Thumb, index finger and pinky out; middle and ring fingers down. Palm faces the other person.'],
      MOM: ['mom', 'Spread your fingers and tap your thumb on your chin.'],
      DAD: ['dad', 'Like MOM, but tap your thumb on your forehead.'],
      HELLO: ['hello', 'Flat hand at your forehead like a salute, then move it out, away from your head.'],
      THANKYOU: ['thank you', 'Flat hand: fingertips at your chin, then move your hand forward and down.'],
      YES: ['yes', 'Make a fist and nod it a few times from the wrist, like a nodding head.'],
      NO: ['no', 'Index and middle fingers together, thumb out. Snap them shut onto your thumb.'],
      WHERE: ['where', 'Index finger up. Wag it side to side.'],
      MILK: ['milk', 'Squeeze your hand open and closed a few times, like milking a cow.'],
      EAT: ['eat', 'Bring your fingertips together with your thumb (flat O) and tap them to your lips.'],
      DRINK: ['drink', 'Hold a C hand as if holding a glass and bring it to your mouth.'],
      WATER: ['water', 'W hand: tap your index finger on your chin.'],
      MORE: ['more', 'Both hands in a flat O. Tap the fingertips of both hands together a few times.'],
      LOVE: ['love', 'Make two fists, cross your arms and hold your fists to your chest, like a hug.'],
      BABY: ['baby', 'Cradle your arms as if holding a baby, one forearm on the other, palms up, and rock them side to side.'],
      HELP: ['help', 'Rest a thumbs-up fist on your other flat palm and lift both hands together.'],
      PLAY: ['play', 'Both hands in Y, thumb and pinky out. Twist them back and forth at the wrists.'],
      note: 'ASL puts the question word at the end, with lowered brows.',
    },
  };

  Object.assign(HINTS.uk, {
    face: 'Тримайте обличчя в кадрі: цей жест показують біля обличчя',
    spreadAll: 'Розчепірте пальці',
    zone_MOM: 'Торкніться великим пальцем підборіддя',
    zone_DAD: 'Торкніться великим пальцем лоба',
    zone_WATER: 'Торкніться вказівним пальцем підборіддя',
    zone_EAT: 'Піднесіть кінчики пальців до губ',
    zone_DRINK: 'Піднесіть руку до рота, ніби тримаєте склянку',
    zone_THANKYOU: 'Почніть із кінчиків пальців біля підборіддя',
    zone_HELLO: 'Почніть із долоні біля лоба, як коли віддаєте честь',
    motion_THANKYOU: 'Тепер ведіть руку вперед і вниз',
    motion_HELLO: 'Тепер ведіть руку вбік від голови',
    motion_YES: 'Кивніть кулаком кілька разів, згинаючи зап’ястя',
    motion_WHERE: 'Похитайте вказівним пальцем з боку в бік',
    motion_MILK: 'Кілька разів стисніть і розтисніть кулак',
    motion_NO: 'Зімкніть вказівний і середній пальці з великим, як дзьоб',
    twoHands: 'Покажіть обидві руки в кадрі',
    pose_MORE: 'Торкніться кінчиками пальців однієї руки до кінчиків іншої',
    pose_LOVE: 'Схрестіть руки й притисніть кулаки до грудей',
    pose_BABY: 'Складіть руки, ніби тримаєте немовля: передпліччя горизонтально, одне над одним',
    motion_BABY: 'Погойдайте руками з боку в бік',
    motion_PLAY: 'Покрутіть кистями туди-сюди',
    pose_HELP: 'Поставте кулак із піднятим великим пальцем на розкриту долоню іншої руки',
    motion_HELP: 'Тепер підніміть обидві руки разом',
  });
  Object.assign(HINTS.en, {
    face: 'Keep your face in view: this sign is made near the face',
    spreadAll: 'Spread your fingers',
    zone_MOM: 'Touch your thumb to your chin',
    zone_DAD: 'Touch your thumb to your forehead',
    zone_WATER: 'Touch your index finger to your chin',
    zone_EAT: 'Bring your fingertips to your lips',
    zone_DRINK: 'Bring your hand to your mouth as if holding a glass',
    zone_THANKYOU: 'Start with your fingertips at your chin',
    zone_HELLO: 'Start with your flat hand at your forehead, like a salute',
    motion_THANKYOU: 'Now move your hand forward and down',
    motion_HELLO: 'Now move your hand out, away from your head',
    motion_YES: 'Nod your fist a few times from the wrist',
    motion_WHERE: 'Wag your index finger side to side',
    motion_MILK: 'Squeeze your hand open and closed a few times',
    motion_NO: 'Snap your index and middle fingers onto your thumb',
    twoHands: 'Show both hands to the camera',
    pose_MORE: 'Bring the fingertips of both hands together',
    pose_LOVE: 'Cross your arms and hold your fists to your chest',
    pose_BABY: 'Cradle your arms as if holding a baby, forearms level, one above the other',
    motion_BABY: 'Rock your arms side to side',
    motion_PLAY: 'Twist your hands back and forth',
    pose_HELP: 'Rest your thumbs-up fist on your other flat palm',
    motion_HELP: 'Now lift both hands together',
  });

  // Face zones in pixels from a MediaPipe Face Detector detection
  // (keypoints: right eye, left eye, nose tip, mouth, right ear, left ear). d = distance between the eyes.
  function faceZones(det, W, H) {
    const k = det && det.keypoints;
    if (!k || k.length < 4) return null;
    const p = (i) => [k[i].x * W, k[i].y * H];
    const e1 = p(0);
    const e2 = p(1);
    const mouth = p(3);
    const eye = [(e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2];
    const d = Math.hypot(e1[0] - e2[0], e1[1] - e2[1]);
    if (d < 4) return null;
    let down = [mouth[0] - eye[0], mouth[1] - eye[1]];
    const dl = Math.hypot(down[0], down[1]) || 1;
    down = [down[0] / dl, down[1] / dl];
    return {
      d,
      forehead: [eye[0] - down[0] * 0.85 * d, eye[1] - down[1] * 0.85 * d],
      mouth,
      chin: [mouth[0] + down[0] * 0.7 * d, mouth[1] + down[1] * 0.7 * d],
    };
  }

  // One hand for sign detection: handshape scores and key points in pixels.
  function handRecord(f, image, W, H, ctx) {
    const px = (i) => [image[i].x * W, image[i].y * H];
    const res = {};
    const scores = {};
    for (const k in SHAPES) {
      res[k] = evalLetter({ id: k, c: SHAPES[k] }, f, ctx || {});
      scores[k] = res[k].score;
    }
    const a = px(4);
    const b = px(8);
    const c = px(12);
    const w = px(0);
    const kn = px(9);
    return {
      res,
      h: {
        scores,
        pts: {
          thumbTip: a,
          indexTip: b,
          tips: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3],
          fingertips: [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
          knuckle: kn,
          wrist: w,
          center: [(w[0] + kn[0]) / 2, (w[1] + kn[1]) / 2],
        },
        palm: f.palmPx,
        dIM: Math.min(f.thumb.dIT, f.thumb.dMT),
        imExt: f.fingers.i.state === 'EXT' && f.fingers.m.state === 'EXT',
        curl: mean(FKEYS.map((k) => (f.fingers[k].mcp + f.fingers[k].pip) / 2)),
        facing: f.orient.facingRaw,
        ang: f.orient.hand,
      },
    };
  }

  // One frame for sign detection. The first hand's fields sit at the top level (one-handed signs);
  // rec.hands lists the visible hands in a stable order (two-handed signs). second = {f, image, ctx}.
  function signFrame(f, image, W, H, zones, ctx, now, second) {
    const A = handRecord(f, image, W, H, ctx);
    const hands = [A.h];
    let res2 = null;
    if (second) {
      const B = handRecord(second.f, second.image, W, H, second.ctx);
      hands.push(B.h);
      res2 = B.res;
    }
    return { rec: Object.assign({ t: now, zones, hands }, A.h), res: A.res, res2 };
  }

  const recentOf = (hist, now, ms) => hist.filter((r) => now - r.t <= ms);
  const fracOf = (arr, fn) => (arr.length ? arr.filter(fn).length / arr.length : 0);
  function zoneDist(r, point, zone) {
    if (!r.zones) return Infinity;
    const z = r.zones[zone];
    const p = r.pts[point];
    return Math.hypot(p[0] - z[0], p[1] - z[1]) / r.zones.d;
  }
  // Number of monotone moves of at least "amp" (zigzag): nodding twice = 4 swings.
  function countSwings(vals, amp) {
    if (vals.length < 2) return 0;
    let swings = 0;
    let dir = 0;
    let ext = vals[0];
    let lo = vals[0];
    let hi = vals[0];
    for (let i = 1; i < vals.length; i++) {
      const v = vals[i];
      if (dir === 0) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        if (v - lo >= amp) { dir = 1; ext = v; swings++; }
        else if (hi - v >= amp) { dir = -1; ext = v; swings++; }
      } else if (dir === 1) {
        if (v > ext) ext = v;
        else if (ext - v >= amp) { dir = -1; ext = v; swings++; }
      } else if (v < ext) ext = v;
      else if (v - ext >= amp) { dir = 1; ext = v; swings++; }
    }
    return swings;
  }
  const SIGNAL = {
    knuckleY: (r) => r.pts.knuckle[1] / r.palm,
    indexX: (r) => r.pts.indexTip[0] / r.palm,
    curl: (r) => r.curl / 100,
  };

  const scoreOf = (h, s) => (s === 'OPEN' ? Math.max(h.scores.FLAT, h.scores.FIVE) : h.scores[s]);
  // Best way to give shapes sa and sb to the two hands: score = the weaker hand's score,
  // a / b = index of the hand that has to show sa / sb.
  function pairOf(r, sa, sb) {
    if (!r.hands || r.hands.length < 2) return { score: 0, a: -1, b: -1 };
    const h0 = r.hands[0];
    const h1 = r.hands[1];
    const s01 = Math.min(scoreOf(h0, sa), scoreOf(h1, sb));
    const s10 = Math.min(scoreOf(h1, sa), scoreOf(h0, sb));
    return s01 >= s10 ? { score: s01, a: 0, b: 1 } : { score: s10, a: 1, b: 0 };
  }
  const bothHands = (r) => !!(r && r.hands && r.hands.length >= 2);
  const meanPalm = (r) => (r.hands[0].palm + r.hands[1].palm) / 2;
  const dist2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

  function detectTwo(sign, hist, now) {
    const last = hist[hist.length - 1];
    if (!bothHands(last)) return { ok: false, progress: 0, need: 'twoHands' };
    const [sa, sb] = sign.shapes;
    const pairNow = pairOf(last, sa, sb).score;
    const shapeNow = pairNow >= SIGN_OK;
    if (sign.kind === 'touch2') {
      const touching = (r) => dist2(r.hands[0].pts.tips, r.hands[1].pts.tips) / meanPalm(r) <= 0.6;
      const win = recentOf(hist, now, 1000);
      const p = fracOf(win, (r) => bothHands(r) && pairOf(r, sa, sb).score >= SIGN_OK && touching(r));
      return { ok: win.length >= 8 && p >= 0.45, progress: Math.min(1, p / 0.45), need: !shapeNow ? 'shape' : touching(last) ? null : 'pose' };
    }
    if (sign.kind === 'hold2') {
      // crossed arms: the hand on the right of the frame points right, the other one points left
      const crossed = (r) => {
        const [h0, h1] = r.hands;
        const L = h0.pts.center[0] <= h1.pts.center[0] ? h0 : h1;
        const R = L === h0 ? h1 : h0;
        const low = !r.zones || Math.min(h0.pts.center[1], h1.pts.center[1]) > r.zones.chin[1] + 0.5 * r.zones.d;
        return Math.cos(R.ang / DEG) > 0.3 && Math.cos(L.ang / DEG) < -0.3 && low;
      };
      const win = recentOf(hist, now, 700);
      const p = fracOf(win, (r) => bothHands(r) && pairOf(r, sa, sb).score >= SIGN_OK && crossed(r));
      return { ok: win.length >= 6 && p >= 0.85, progress: Math.min(1, p / 0.85), need: !shapeNow ? 'shape' : crossed(last) ? null : 'pose' };
    }
    if (sign.kind === 'rock2') {
      const cradled = (r) => r.hands.every((h) => Math.abs(Math.cos(h.ang / DEG)) >= 0.6) &&
        Math.abs(r.hands[0].pts.center[1] - r.hands[1].pts.center[1]) <= 1.5 * meanPalm(r);
      const win = recentOf(hist, now, 1800);
      const good = win.filter((r) => bothHands(r) && pairOf(r, sa, sb).score >= 0.6 && cradled(r));
      if (good.length < 0.6 * win.length) return { ok: false, progress: 0, need: pairNow < 0.6 ? 'shape' : cradled(last) ? 'motion' : 'pose' };
      const swings = countSwings(good.map((r) => (r.hands[0].pts.center[0] + r.hands[1].pts.center[0]) / 2 / meanPalm(r)), sign.amp);
      const ok = swings >= sign.swings;
      return { ok, progress: Math.min(1, 0.15 + (0.85 * swings) / sign.swings), need: ok ? null : 'motion' };
    }
    if (sign.kind === 'twist2') {
      const win = recentOf(hist, now, 1800);
      const good = win.filter((r) => bothHands(r) && pairOf(r, sa, sb).score >= 0.6);
      if (good.length < 0.6 * win.length) return { ok: false, progress: 0, need: shapeNow ? 'motion' : 'shape' };
      // twisting changes how much each palm faces the camera; shaking moves the hand sideways: either counts
      const sw = (k) => Math.max(
        countSwings(good.map((r) => r.hands[k].facing), sign.amp),
        countSwings(good.map((r) => r.hands[k].pts.center[0] / r.hands[k].palm), sign.amp)
      );
      const swings = Math.min(sw(0), sw(1));
      const ok = swings >= sign.swings;
      return { ok, progress: Math.min(1, 0.15 + (0.85 * swings) / sign.swings), need: ok ? null : 'motion' };
    }
    if (sign.kind === 'lift2') {
      // the fist rests on the flat palm: its wrist is near the palm centre and not below it
      const fistY = (r) => {
        if (!bothHands(r)) return null;
        const p = pairOf(r, sa, sb);
        if (p.score < 0.6) return null;
        const fist = r.hands[p.a];
        const flat = r.hands[p.b];
        const onPalm = dist2(fist.pts.wrist, flat.pts.center) <= 1.1 * flat.palm &&
          fist.pts.wrist[1] <= flat.pts.center[1] + 0.3 * flat.palm;
        return onPalm ? fist.pts.knuckle[1] / fist.palm : null;
      };
      const win = recentOf(hist, now, 1500);
      const ys = win.map(fistY).filter((v) => v != null);
      if (ys.length < 0.5 * win.length) return { ok: false, progress: 0, need: pairNow >= 0.6 ? 'pose' : 'shape' };
      let lowest = -Infinity;
      for (const y of ys) {
        if (y > lowest) lowest = y;
        if (lowest - y >= 0.5) return { ok: true, progress: 1, need: null }; // lifted by half a palm
      }
      return { ok: false, progress: 0.5, need: 'motion' };
    }
    return { ok: false, progress: 0, need: null };
  }

  // Decide whether a sign was just made.
  // need: what is missing now - 'face' | 'shape' | 'zone' | 'motion' | 'twoHands' | 'pose' | null.
  function detectSign(sign, hist, now) {
    if (sign.hands === 2) return detectTwo(sign, hist, now);
    const last = hist[hist.length - 1];
    if (!last) return { ok: false, progress: 0, need: 'shape' };
    const sh = sign.shape;
    const shapeNow = !sh || last.scores[sh] >= SIGN_OK;
    const R = sign.r || 0.85;
    if (sign.kind === 'static') {
      const win = recentOf(hist, now, 600);
      const p = fracOf(win, (r) => r.scores[sh] >= SIGN_OK);
      return { ok: win.length >= 6 && p >= 0.85 && shapeNow, progress: Math.min(1, p / 0.85), need: shapeNow ? null : 'shape' };
    }
    if (sign.kind === 'contact') {
      if (!last.zones) return { ok: false, progress: 0, need: 'face' };
      const win = recentOf(hist, now, 1000);
      const p = fracOf(win, (r) => r.scores[sh] >= SIGN_OK && zoneDist(r, sign.point, sign.zone) <= R);
      const need = !shapeNow ? 'shape' : zoneDist(last, sign.point, sign.zone) > R ? 'zone' : null;
      return { ok: win.length >= 8 && p >= 0.45, progress: Math.min(1, p / 0.45), need };
    }
    if (sign.kind === 'away') {
      if (!last.zones) return { ok: false, progress: 0, need: 'face' };
      let touch = null;
      for (const r of recentOf(hist, now, 1800)) {
        const d = zoneDist(r, sign.point, sign.zone);
        if (r.scores[sh] >= SIGN_OK - 0.07 && d <= R) touch = r.t;
        else if (touch != null && r.t - touch <= 1100 && d >= R + 1.0 && r.scores[sh] >= 0.45) return { ok: true, progress: 1, need: null };
      }
      if (touch != null) return { ok: false, progress: 0.5, need: 'motion' };
      return { ok: false, progress: 0, need: shapeNow ? 'zone' : 'shape' };
    }
    if (sign.kind === 'osc') {
      const win = recentOf(hist, now, 1800);
      const good = sh ? win.filter((r) => r.scores[sh] >= 0.6) : win;
      if (sh && good.length < 0.6 * win.length) return { ok: false, progress: 0, need: shapeNow ? 'motion' : 'shape' };
      const swings = countSwings(good.map(SIGNAL[sign.signal]), sign.amp);
      const ok = swings >= sign.swings;
      return { ok, progress: Math.min(1, 0.15 + (0.85 * swings) / sign.swings), need: ok ? null : 'motion' };
    }
    if (sign.kind === 'snap') {
      let open = null;
      for (const r of recentOf(hist, now, 1300)) {
        if (r.scores[sh] < 0.55) continue;
        if (r.dIM >= 0.55 && r.imExt) open = r.t;
        else if (open != null && r.dIM <= 0.32 && r.t - open <= 900) return { ok: true, progress: 1, need: null };
      }
      return { ok: false, progress: open != null ? 0.5 : 0, need: shapeNow ? 'motion' : 'shape' };
    }
    return { ok: false, progress: 0, need: null };
  }

  const api = {
    VERSION, LETTERS, BY_ID, GROUPS, WORDS, STATES, HINTS, LETTER_TEXT, ACCEPT,
    computeFeatures, classifyFinger, evaluateAll, judge, rank, partDegrees, hintsFor, fingerPhrase,
    detectJ, detectZ, rdp, toVector, templateScore,
    SHAPES, SIGNS, SIGN_BY_ID, PHRASES, SIGN_TEXT, SIGN_OK, faceZones, signFrame, detectSign, countSwings,
    pairOf, scoreOf,
  };
  root.ASLCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
