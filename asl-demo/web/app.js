const sampleFPS = 6;
const version = '0.10.21';
const visionURL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + version;
const modelURL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const video = document.querySelector('#camera');
const canvas = document.querySelector('#hands');
const ctx = canvas.getContext('2d');
const startButton = document.querySelector('#start');
const stopButton = document.querySelector('#stop');
const recognizeButton = document.querySelector('#recognize');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const gloss = document.querySelector('#gloss');
const translation = document.querySelector('#translation');

function showResult(signs) {
  gloss.textContent = signs.map(sign => sign.gloss).join(' → ') || '—';
  translation.textContent = signs.map(sign => sign.translation).filter(Boolean).join(' · ');
  translation.hidden = !translation.textContent;
}

let activeSession;
let landmarkerPromise;

function loadLandmarker() {
  landmarkerPromise ??= import(visionURL + '/vision_bundle.mjs').then(async ({ FilesetResolver, HandLandmarker }) => {
    const vision = await FilesetResolver.forVisionTasks(visionURL + '/wasm');
    return HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: modelURL },
      runningMode: 'VIDEO',
      numHands: 2,
    });
  }).catch(error => {
    landmarkerPromise = undefined;
    throw error;
  });
  return landmarkerPromise;
}

function startRecording(session) {
  const recording = { started: performance.now(), frames: [] };
  session.recording = recording;
  startButton.disabled = true;
  recognizeButton.disabled = false;
  status.textContent = 'Идёт запись. Покажите жесты и нажмите «Остановить и распознать».';

  const interval = 1000 / sampleFPS;
  let nextSample = recording.started;
  let lastVideoTime = -1;

  function sample(now) {
    if (activeSession !== session || session.recording !== recording) return;
    if (now >= nextSample && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      nextSample += (Math.floor((now - nextSample) / interval) + 1) * interval;
      lastVideoTime = video.currentTime;
      const detection = session.landmarker.detectForVideo(video, now);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#5df3ad';
      const hands = detection.landmarks.map((landmarks, index) => {
        const points = landmarks.map(({ x, y, z }) => {
          ctx.fillRect(x * canvas.width - 2, y * canvas.height - 2, 4, 4);
          return [x, y, z].map(value => Math.round(value * 1000));
        });
        return { side: detection.handedness[index][0].categoryName, points };
      });
      recording.frames.push({ timestamp_ms: Math.round(now - recording.started), hands });
    }
    session.animation = requestAnimationFrame(safeSample);
  }

  function safeSample(now) {
    try {
      sample(now);
    } catch (error) {
      stop('Ошибка MediaPipe. ' + error.message);
    }
  }

  session.animation = requestAnimationFrame(safeSample);
}

async function recognizeRecording(session) {
  const { frames } = session.recording;
  session.recording = undefined;
  cancelAnimationFrame(session.animation);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  recognizeButton.disabled = true;

  if (!frames.some(frame => frame.hands.length)) {
    startButton.disabled = false;
    status.textContent = 'В записи не обнаружены кисти. Начните новую запись.';
    return;
  }

  result.setAttribute('aria-busy', 'true');
  status.textContent = 'Распознаём фразу…';
  try {
    const response = await fetch('/api/recognize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aspect_ratio: Number((video.videoWidth / video.videoHeight).toFixed(4)),
        frames,
      }),
      signal: session.abort.signal,
    });
    if (!response.ok) throw new Error((await response.text()).trim());
    const { signs } = await response.json();
    if (activeSession !== session) return;
    showResult(signs);
    status.textContent = signs.length
      ? 'Готово. Можно начать новую запись.'
      : 'Жесты не распознаны. Попробуйте ещё раз.';
  } catch (error) {
    if (activeSession === session) status.textContent = error.message || 'Запрос не удался.';
  } finally {
    if (activeSession === session) {
      result.setAttribute('aria-busy', 'false');
      startButton.disabled = false;
    }
  }
}

function stop(message = 'Камера выключена.') {
  const session = activeSession;
  activeSession = undefined;
  if (session) {
    session.abort.abort();
    cancelAnimationFrame(session.animation);
    session.stream?.getTracks().forEach(track => track.stop());
  }
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startButton.disabled = false;
  stopButton.disabled = true;
  recognizeButton.disabled = true;
  result.setAttribute('aria-busy', 'false');
  status.textContent = message;
}

startButton.addEventListener('click', async () => {
  if (startButton.disabled) return;
  if (activeSession) {
    startRecording(activeSession);
    return;
  }
  const session = { abort: new AbortController() };
  activeSession = session;
  startButton.disabled = true;
  stopButton.disabled = false;
  showResult([]);

  try {
    status.textContent = 'Загружаем MediaPipe…';
    session.landmarker = await loadLandmarker();
    if (activeSession !== session) return;
    status.textContent = 'Запрашиваем доступ к камере…';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      audio: false,
    });
    if (activeSession !== session) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    session.stream = stream;
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      if (activeSession === session) stop('Доступ к камере потерян.');
    });
    video.srcObject = stream;
    await video.play();
    if (activeSession !== session) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    startRecording(session);
  } catch (error) {
    if (activeSession === session) stop('Не удалось запустить камеру. ' + error.message);
  }
});

recognizeButton.addEventListener('click', () => {
  if (!activeSession?.recording || recognizeButton.disabled) return;
  void recognizeRecording(activeSession);
});

stopButton.addEventListener('click', () => stop());
window.addEventListener('pagehide', () => stop());
if (navigator.mediaDevices?.getUserMedia) {
  startButton.disabled = false;
  status.textContent = 'Нажмите «Начать запись» и покажите жесты ASL.';
} else {
  status.textContent = 'Откройте страницу через localhost или HTTPS для доступа к камере.';
}
