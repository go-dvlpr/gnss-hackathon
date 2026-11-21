// Camera + MediaPipe + the rule-based recognizer of asl_claude_demo/asl-trainer, for one target item.
// A letter is judged by its handshape held for HOLD_MS; a word sign by ASLCore.detectSign with face zones.
import "./vendor/asl-core.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const C: Any = (globalThis as Any).ASLCore;
const HT: Record<string, string> = C.HINTS.en;

const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const HAND_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const HOLD_MS = 650; // a static letter has to be held this long
const HINT_DELAY_MS = 1500; // no handshape hint in the first moments of a try
const HINT_EVERY_MS = 900; // a hint stays at least this long

export const isSignItem = (id: string) => !!C.SIGN_BY_ID[id];

export type Reading = {
  hand: boolean;
  face: boolean;
  progress: number;
  ok: boolean;
  hint: string | null;
  /** The hint is praise ("Hold it"), not a fix. */
  good: boolean;
  /** Letter the hand looks like instead of the target, if any. */
  looks: string | null;
};

/** What the coach screen shows after a failed try. */
export const attempt: { hint: string | null; looks: string | null; image: string | null } = {
  hint: null,
  looks: null,
  image: null,
};

let models: Promise<{ hand: Any; face: Any }> | null = null;
function loadModels() {
  models ??= (async () => {
    const { FilesetResolver, HandLandmarker, FaceDetector } = await import(/* @vite-ignore */ `${VISION}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    const create = async (Task: Any, path: string, extra: object) => {
      const opts = (delegate: string) => ({ baseOptions: { modelAssetPath: path, delegate }, runningMode: "VIDEO", ...extra });
      try {
        return await Task.createFromOptions(files, opts("GPU"));
      } catch {
        return Task.createFromOptions(files, opts("CPU"));
      }
    };
    const hand = await create(HandLandmarker, HAND_URL, {
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    const face = await create(FaceDetector, FACE_URL, { minDetectionConfidence: 0.5 });
    return { hand, face };
  })();
  models.catch(() => (models = null));
  return models;
}

type P = { x: number; y: number; z: number };
const copy = (p: P) => ({ x: p.x, y: p.y, z: p.z });
function blend(dst: P[], src: P[], a: number) {
  for (let i = 0; i < dst.length; i++) {
    dst[i].x += a * (src[i].x - dst[i].x);
    dst[i].y += a * (src[i].y - dst[i].y);
    dst[i].z += a * (src[i].z - dst[i].z);
  }
}
function qualityKey(f: Any) {
  if (!f.quality.inFrame) return "edge";
  if (f.quality.size < 0.09) return "far";
  if (f.quality.size > 0.5) return "near";
  return null;
}

// Keep each detected hand in the same slot from frame to frame (closest wrist) and smooth it there.
function track(slots: Any[], hands: { lm: P[]; wl: P[] }[], now: number) {
  for (let i = 0; i < 2; i++) if (slots[i] && now - slots[i].t > 300) slots[i] = null;
  const wd = (s: Any, h: Any) => (s ? Math.hypot(s.lm[0].x - h.lm[0].x, s.lm[0].y - h.lm[0].y) : 0.6);
  const order =
    hands.length >= 2
      ? wd(slots[0], hands[0]) + wd(slots[1], hands[1]) <= wd(slots[0], hands[1]) + wd(slots[1], hands[0])
        ? [0, 1]
        : [1, 0]
      : [wd(slots[0], hands[0]) <= wd(slots[1], hands[0]) ? 0 : 1];
  return order
    .map((i, k) => {
      const h = hands[k];
      let s = slots[i];
      if (!s || wd(s, h) > 0.25) s = slots[i] = { lm: h.lm.map(copy), wl: h.wl.map(copy), prevRaw: null };
      else {
        blend(s.lm, h.lm, 0.55);
        blend(s.wl, h.wl, 0.55);
      }
      s.t = now;
      s.raw = h.lm;
      s.slot = i;
      return s;
    })
    .sort((a, b) => a.slot - b.slot);
}

const CONN: Record<string, number[][]> = {
  palm: [[0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]],
  t: [[1, 2], [2, 3], [3, 4]],
  i: [[5, 6], [6, 7], [7, 8]],
  m: [[9, 10], [10, 11], [11, 12]],
  r: [[13, 14], [14, 15], [15, 16]],
  p: [[17, 18], [18, 19], [19, 20]],
};
const OK = "#3ccf91";
const WARN = "#ffc247";
const colorFor = (d: number | null | undefined) =>
  d == null ? "rgba(255,255,255,0.85)" : d >= 0.8 ? OK : d >= 0.5 ? WARN : "#ff6b6b";

// Hands coloured per finger by how well each matches; for face signs, the zone the hand has to reach.
function draw(ctx: CanvasRenderingContext2D, hands: { lm: P[]; parts: Any }[], zone: Any) {
  const { width: W, height: H } = ctx.canvas;
  ctx.clearRect(0, 0, W, H);
  const lw = Math.max(2, W * 0.0065);
  ctx.lineCap = "round";
  for (const { lm, parts } of hands) {
    for (const part of Object.keys(CONN)) {
      ctx.strokeStyle = colorFor(parts ? parts[part] : null);
      ctx.lineWidth = part === "palm" ? lw * 0.8 : lw;
      ctx.beginPath();
      for (const [a, b] of CONN[part]) {
        ctx.moveTo(lm[a].x * W, lm[a].y * H);
        ctx.lineTo(lm[b].x * W, lm[b].y * H);
      }
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, lw * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (zone) {
    const hit = Math.hypot(zone.p[0] - zone.c[0], zone.p[1] - zone.c[1]) <= zone.r;
    ctx.lineWidth = lw;
    ctx.setLineDash(hit ? [] : [lw * 2, lw * 1.6]);
    ctx.strokeStyle = hit ? OK : "rgba(255,255,255,0.75)";
    ctx.beginPath();
    ctx.arc(zone.c[0], zone.c[1], zone.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hit ? OK : WARN;
    ctx.beginPath();
    ctx.arc(zone.p[0], zone.p[1], lw * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Mirrored still of the camera with the skeleton on top, for the coach screen. */
export function snapshot(video: HTMLVideoElement, overlay: HTMLCanvasElement): string | null {
  const c = document.createElement("canvas");
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  const x = c.getContext("2d");
  if (!x || !c.width) return null;
  x.translate(c.width, 0);
  x.scale(-1, 1);
  x.drawImage(video, 0, 0);
  x.drawImage(overlay, 0, 0);
  return c.toDataURL("image/jpeg", 0.8);
}

/**
 * Start the camera and judge `item` on every frame.
 * `ready` rejects when the camera or the models fail.
 */
export function watch(video: HTMLVideoElement, canvas: HTMLCanvasElement, item: string, onReading: (r: Reading) => void) {
  const sign = C.SIGN_BY_ID[item] ?? null;
  const ctx = canvas.getContext("2d")!;
  let stopped = false;
  let raf = 0;
  let stream: MediaStream | null = null;
  const slots: Any[] = [null, null];
  const st = {
    start: performance.now(),
    hist: [] as Any[],
    hold: null as number | null,
    lastOk: 0,
    lastHand: 0,
    steady: 0,
    face: null as { z: Any; t: number } | null,
    hint: null as string | null,
    hintKey: "",
    hintAt: 0,
    // fingertip paths for the moving letters: index tip (8) for Z, pinky tip (20) for J
    trail: { 8: [], 20: [] } as Record<number, Any[]>,
    motionAt: 0,
  };
  const letter = C.BY_ID[item];

  const say = (text: string | null, key: string, now: number, immediate = false) => {
    if (key === st.hintKey || (!immediate && now - st.hintAt < HINT_EVERY_MS)) return;
    st.hint = text;
    st.hintKey = key;
    st.hintAt = now;
  };
  const shapeHint = (r: Any, now: number) => {
    if (now - st.start < HINT_DELAY_MS) return say(null, "wait", now, true);
    const h = r && C.hintsFor(r, "en", 1)[0];
    say(h ? h.text : "Almost there", h ? h.key : "almost", now);
  };

  const frame = (m: { hand: Any; face: Any }, now: number) => {
    const W = video.videoWidth;
    const H = video.videoHeight;
    const res = m.hand.detectForVideo(video, now);
    const hands = (res.landmarks || []).map((lm: P[], i: number) => ({ lm, wl: res.worldLandmarks[i] }));
    if (sign) {
      const det = m.face.detectForVideo(video, now).detections?.[0];
      const z = det && C.faceZones(det, W, H);
      if (z) st.face = { z, t: now }; // kept 2 s: the hand often covers the face
    }
    const zones = st.face && now - st.face.t < 2000 ? st.face.z : null;
    const emit = (hand: boolean, progress: number, ok: boolean, looks: string | null = null) =>
      onReading({ hand, face: !!zones, progress, ok, hint: st.hint, good: st.hintKey === "hold", looks });

    if (!hands.length) {
      if (now - st.lastHand < 250) return;
      st.hold = null;
      draw(ctx, [], null);
      say(HT.noHand, "noHand", now, true);
      emit(false, 0, false);
      return;
    }
    const vis = track(slots, hands, now);
    for (const s of vis) s.f = C.computeFeatures(s.wl, s.lm, W, H);
    // main hand: the bigger one on screen, usually the one closer to the camera
    const main = vis.length > 1 && vis[1].f.palmPx > vis[0].f.palmPx ? vis[1] : vis[0];
    st.lastHand = now;
    if (main.prevRaw) {
      let d = 0;
      for (let i = 0; i < 21; i++)
        d += Math.hypot((main.raw[i].x - main.prevRaw[i].x) * W, (main.raw[i].y - main.prevRaw[i].y) * H);
      st.steady = st.steady * 0.7 + (d / 21 / main.f.palmPx) * 0.3;
    }
    main.prevRaw = main.raw.map(copy);

    if (sign) {
      // HACK: palm side is not calibrated (facing: null), so it is not checked.
      const second = vis[1] ? { f: vis[1].f, image: vis[1].lm, ctx: { facing: null } } : null;
      const fr = C.signFrame(vis[0].f, vis[0].lm, W, H, zones, { facing: null }, now, second);
      // a one-handed sign follows whichever hand fits it better
      const sc = (k: number) => (sign.shape ? fr.rec.hands[k].scores[sign.shape] : vis[k].f.palmPx);
      const lead = vis.length > 1 && sc(1) > sc(0) ? 1 : 0;
      const rec = lead === 0 ? fr.rec : { ...fr.rec, ...fr.rec.hands[1] };
      st.hist.push(rec);
      while (now - st.hist[0].t > 2500) st.hist.shift();
      const shapeRes = sign.shape ? [fr.res, fr.res2][lead][sign.shape] : null;
      const zone = sign.zone && zones ? { c: zones[sign.zone], r: (sign.r || 0.85) * zones.d, p: rec.pts[sign.point] } : null;
      draw(ctx, vis.map((s: Any, k: number) => ({ lm: s.lm, parts: k === lead && shapeRes ? C.partDegrees(shapeRes) : null })), zone);
      const det = C.detectSign(sign, st.hist, now);
      const q = qualityKey(vis[lead].f);
      if (q) say(HT[q], "q-" + q, now, true);
      else if (det.need === "face") say(HT.face, "face", now, true);
      else if (det.need === "shape") shapeHint(shapeRes, now);
      else if (det.need) say(HT[`${det.need}_${sign.id}`] ?? null, det.need, now, true);
      else if (det.progress > 0) say("Hold it", "hold", now, true);
      emit(true, det.progress, det.ok);
      return;
    }

    const all = C.evaluateAll(main.f, { facing: null });
    const r = all[item];
    draw(ctx, [{ lm: main.lm, parts: C.partDegrees(r) }], null);
    const q = qualityKey(main.f);

    if (letter?.motion) {
      // J and Z: the handshape plus the fingertip drawing the letter in the air (as in asl-trainer).
      const arr = st.trail[letter.track];
      arr.push({ t: now, x: main.lm[letter.track].x * W, y: main.lm[letter.track].y * H, s: main.f.palmPx, ok: r.spec >= 0.7 });
      while (arr.length && now - arr[0].t > 2500) arr.shift();
      if ((item === "J" ? C.detectJ : C.detectZ)(arr, now)) st.motionAt = now;
      const done = st.motionAt > 0;
      const shapeReady = r.score >= 0.7;
      if (done) say("Hold it", "hold", now, true);
      else if (q) say(HT[q], "q-" + q, now, true);
      else if (shapeReady) say(HT[`motion_${item}`], "motion", now, true);
      else shapeHint(r, now);
      emit(true, done ? 1 : shapeReady ? 0.5 : 0, done);
      return;
    }

    const j = C.judge(item, all, {});
    if (j.ok && !q) {
      st.hold ??= now;
      st.lastOk = now;
    } else if (st.hold && now - st.lastOk > 160) st.hold = null;
    const progress = st.hold ? Math.min(1, (now - st.hold) / HOLD_MS) : 0;
    if (st.hold) say("Hold it", "hold", now, true);
    else if (q) say(HT[q], "q-" + q, now, true);
    else if (st.steady > 0.09) say(HT.moving, "moving", now);
    else shapeHint(r, now);
    emit(true, progress, progress >= 1, j.looks && j.looks !== C.BY_ID[item]?.twin ? j.looks : null);
  };

  const ready = (async () => {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    if (stopped) return stream.getTracks().forEach((t) => t.stop());
    video.srcObject = stream;
    await video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const m = await loadModels();
    let lastTime = -1;
    const loop = () => {
      if (stopped) return;
      raf = requestAnimationFrame(loop);
      if (video.readyState < 2 || video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      try {
        frame(m, performance.now());
      } catch (e) {
        console.error(e);
      }
    };
    loop();
  })();

  return {
    ready,
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    },
  };
}
