// Gobble Dash sound: WebAudio synthesis only — no audio files, no network.
// Every effect is a few oscillators and a gain envelope. The context is
// created lazily on the first user gesture (browsers block autoplay), and
// everything is a no-op until then or while muted.

let context = null;
let muted = false;
let master = null;

function ensureContext() {
  if (context !== null) return context;
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (AudioContext === undefined) return null;
  context = new AudioContext();
  master = context.createGain();
  master.gain.value = 0.5;
  master.connect(context.destination);
  return context;
}

/** Call from a user gesture so the browser lets sound start. */
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx !== null && ctx.state === 'suspended') void ctx.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (master !== null) master.gain.value = muted ? 0 : 0.5;
  return muted;
}

function tone({ type = 'sine', from = 440, to = null, at = 0, dur = 0.12, vol = 0.25 }) {
  const ctx = ensureContext();
  if (ctx === null || muted) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function thud() {
  const ctx = ensureContext();
  if (ctx === null || muted) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t0);
  osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.22);
  gain.gain.setValueAtTime(0.5, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.3);
}

/** Play one named effect. Unknown names are ignored. */
export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'gobble':
      // The turkey's call: four quick low gobbles, each falling in pitch.
      for (let i = 0; i < 4; i += 1) {
        tone({ type: 'square', from: 320 - i * 30, to: 170 - i * 20, at: i * 0.09, dur: 0.08, vol: 0.16 });
      }
      break;
    case 'jump':
      tone({ type: 'sine', from: 300, to: 620, dur: 0.14, vol: 0.2 });
      break;
    case 'dash':
      tone({ type: 'sawtooth', from: 500, to: 900, dur: 0.12, vol: 0.1 });
      break;
    case 'pickup':
      tone({ type: 'sine', from: 660, dur: 0.09, vol: 0.2 });
      tone({ type: 'sine', from: 990, at: 0.08, dur: 0.14, vol: 0.2 });
      break;
    case 'hit':
      thud();
      tone({ type: 'sawtooth', from: 220, to: 70, dur: 0.2, vol: 0.18 });
      break;
    case 'hide':
      tone({ type: 'sine', from: 520, to: 780, dur: 0.18, vol: 0.14 });
      break;
    case 'stage':
      tone({ type: 'triangle', from: 523, dur: 0.12, vol: 0.2 });
      tone({ type: 'triangle', from: 659, at: 0.11, dur: 0.12, vol: 0.2 });
      tone({ type: 'triangle', from: 784, at: 0.22, dur: 0.2, vol: 0.2 });
      break;
    case 'escaped':
      // A little victory jingle.
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
        tone({ type: 'triangle', from: f, at: i * 0.13, dur: 0.18, vol: 0.22 });
      });
      break;
    case 'caught':
      [392, 330, 262, 196].forEach((f, i) => {
        tone({ type: 'triangle', from: f, at: i * 0.16, dur: 0.22, vol: 0.2 });
      });
      break;
    default:
      break;
  }
}
