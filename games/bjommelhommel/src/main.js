import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-800.css';
import '@fontsource/barlow-condensed/latin-800.css';
import './style.css';
import { createRun, obstacles, step, steer } from './runner.js';
import { createRenderer, districtAt } from './world.js';

const byId = id => document.getElementById(id);
const canvas = byId('world');
const startButton = byId('start');
const status = byId('loading');
const music = byId('music');
const musicControls = byId('music-controls');
const musicEnabled = byId('music-enabled');
const musicVolume = byId('music-volume');
const musicLevel = byId('music-level');
const meters = ['distance', 'pollen', 'best'].map(byId);
let view;
let phase = 'menu';
let run = createRun();
let lastFrame = performance.now();
let startPoint = null;
let muted = false;
let audio;
let musicGain;
let best = 0;
try {
  best = Math.max(0, Number(localStorage.getItem('bjommelhommel-record')) || 0);
  muted = localStorage.getItem('bjommelhommel-muted') === 'true';
  musicEnabled.checked = localStorage.getItem('bjommelhommel-music-enabled') !== 'false';
  const savedVolume = localStorage.getItem('bjommelhommel-music-volume');
  if (savedVolume !== null && /^\d{1,3}$/.test(savedVolume)) musicVolume.value = savedVolume;
} catch {}

const controls = new Map([
  ['ArrowLeft', 'left'], ['KeyA', 'left'], ['ArrowRight', 'right'], ['KeyD', 'right'],
  ['ArrowUp', 'rise'], ['KeyW', 'rise'], ['Space', 'rise'], ['ArrowDown', 'dive'], ['KeyS', 'dive'],
]);

function sound(frequency, duration, type = 'sine') {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (frequency > 300 ? 1.25 : 0.55), now + duration);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(.085, now + .018);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
  } catch {}
}

function updateMute() {
  byId('mute').textContent = muted ? 'Spelgeluid aan' : 'Spelgeluid uit';
  byId('mute').setAttribute('aria-pressed', String(muted));
}
updateMute();
byId('mute').onclick = () => {
  muted = !muted;
  updateMute();
  try { localStorage.setItem('bjommelhommel-muted', String(muted)); } catch {}
};

function syncMusic() {
  const volume = Number(musicVolume.value) / 100;
  musicLevel.value = musicVolume.value + '%';
  if (phase !== 'running' || !musicEnabled.checked || volume === 0) {
    music.pause();
    return;
  }
  try {
    audio ??= new AudioContext();
    if (!musicGain) {
      const gain = audio.createGain();
      audio.createMediaElementSource(music).connect(gain).connect(audio.destination);
      musicGain = gain;
    }
    musicGain.gain.value = volume;
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
  } catch {
    music.volume = volume;
  }
  if (music.paused) void music.play().catch(() => {});
}

function saveMusicSettings() {
  syncMusic();
  try {
    localStorage.setItem('bjommelhommel-music-enabled', String(musicEnabled.checked));
    localStorage.setItem('bjommelhommel-music-volume', musicVolume.value);
  } catch {}
}

musicEnabled.addEventListener('change', saveMusicSettings);
musicVolume.addEventListener('input', saveMusicSettings);
syncMusic();

function updateMeters() {
  const values = [Math.floor(run.distance) + ' m', String(run.pollen), Math.max(best, Math.floor(run.distance)) + ' m'];
  const district = byId('district');
  const name = districtAt(run.distance);
  if (district.textContent !== name) district.textContent = name;
  meters.forEach((meter, index) => { if (meter.textContent !== values[index]) meter.textContent = values[index]; });
}

function show(next) {
  phase = next;
  document.body.dataset.phase = next;
  byId('menu').hidden = next !== 'menu';
  byId('hud').hidden = next !== 'running';
  byId('touch').hidden = next !== 'running';
  byId('overlay').hidden = next !== 'paused' && next !== 'ended';
  if (next === 'menu') {
    byId('menu-music').append(musicControls);
    startButton.focus({ preventScroll: true });
  } else if (next === 'paused' || next === 'ended') {
    byId('overlay-music').append(musicControls);
  }
  syncMusic();
  if (next !== 'running') startPoint = null;
}

function start() {
  if (!view || startButton.disabled) return;
  run = createRun();
  sound(165, .24, 'triangle');
  updateMeters();
  show('running');
  startButton.blur();
}

function pause() {
  if (phase !== 'running') return;
  byId('result-title').textContent = 'Even landen';
  byId('result-text').textContent = 'Je vlucht staat op pauze.';
  byId('resume').textContent = 'Vlieg verder';
  show('paused');
  byId('resume').focus();
}

function finish() {
  const distance = Math.floor(run.distance);
  const record = distance > best;
  best = Math.max(best, distance);
  try { localStorage.setItem('bjommelhommel-record', String(best)); } catch {}
  byId('result-title').textContent = record ? 'Nieuw record!' : 'Uitgezoemd';
  byId('result-text').textContent = `Je raakte ${obstacles[run.impact].name}. Afstand: ${distance} m. Stuifmeel: ${run.pollen}.`;
  byId('resume').textContent = 'Vlieg opnieuw';
  sound(95, .33, 'triangle');
  show('ended');
  byId('resume').focus();
}

startButton.onclick = start;
byId('pause').onclick = pause;
byId('resume').onclick = () => phase === 'paused' ? show('running') : start();
byId('back').onclick = () => show('menu');
addEventListener('keydown', event => {
  if (event.repeat) return;
  if (event.code === 'Escape' && phase === 'running') pause();
  else if (event.code === 'Escape' && phase === 'paused') show('running');
  else if (phase === 'running' && controls.has(event.code)) {
    event.preventDefault();
    steer(run, controls.get(event.code));
  }
});
for (const button of byId('touch').querySelectorAll('button')) {
  button.onclick = () => steer(run, button.dataset.action);
}
canvas.addEventListener('pointerdown', event => {
  if (phase !== 'running') return;
  canvas.setPointerCapture(event.pointerId);
  startPoint = [event.clientX, event.clientY];
});
canvas.addEventListener('pointerup', event => {
  if (!startPoint || phase !== 'running') return;
  const dx = event.clientX - startPoint[0];
  const dy = event.clientY - startPoint[1];
  startPoint = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
  steer(run, Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'rise' : 'dive'));
});
canvas.addEventListener('pointercancel', () => { startPoint = null; });
addEventListener('blur', pause);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault();
  view = null;
  show('menu');
  status.textContent = 'De 3D-weergave is onderbroken. Herlaad het spel.';
  startButton.disabled = true;
});

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(.10, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!view) return;
  if (phase === 'running') {
    const before = run.pollen;
    const slices = Math.max(1, Math.ceil(elapsed / (1 / 60)));
    for (let i = 0; i < slices && !run.ended; i++) step(run, elapsed / slices);
    if (run.pollen > before) sound(570, .13);
    updateMeters();
    if (run.ended) finish();
  }
  view.draw(run, phase === 'menu', phase === 'menu' ? now / 1000 : run.time, elapsed);
}

document.body.dataset.phase = 'menu';
try {
  const renderer = createRenderer(canvas);
  await renderer.ready;
  view = renderer;
  startButton.disabled = false;
  status.textContent = '';
  requestAnimationFrame(frame);
} catch (error) {
  console.error(error);
  status.textContent = 'De 3D-wereld kon niet laden. Herlaad het spel in een browser met WebGL 2.';
}
