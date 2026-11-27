// Gobble Dash entry point: wires the world, the renderer, input and sound
// together, runs the fixed-step loop, and stages ?shot=… screenshots.
// In normal play the loop runs on requestAnimationFrame; in shot mode the
// scene is staged once, drawn once, and window.__shotReady tells the
// screenshot tool the frame is final. Behind the title screen a demo run
// plays itself, so the title never sits over a frozen yard.

import { VIEW_W, VIEW_H, STEP } from './config.js';
import {
  createState,
  stepWorld,
  autopilotInput,
  startRun,
  SCREEN_TITLE,
  SCREEN_PLAY,
  SCREEN_OVER,
} from './world.js';
import { createInput } from './input.js';
import { playSound, unlockAudio, toggleMute, isMuted } from './audio.js';
import { drawFrame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotSeed = Number(params.get('seed') ?? '1') || 1;

const input = createInput(window, canvas);
const state = createState(shotSeed);
try {
  state.best = Number(window.localStorage.getItem('gobble-dash-best') ?? '0') || 0;
} catch {
  state.best = 0;
}

// The attract-mode run behind the title screen.
const demo = createState(shotSeed);
demo.screen = SCREEN_PLAY;
demo.best = state.best;

function saveBest() {
  try {
    window.localStorage.setItem('gobble-dash-best', String(state.best));
  } catch {
    // Private mode or no storage: the best distance is session-only.
  }
}

/** Drain this step's events into sounds. */
function handleEvents(target) {
  for (const event of target.events) {
    if (event.type === 'jump') playSound('jump');
    else if (event.type === 'dash') playSound('dash');
    else if (event.type === 'pickup') playSound('pickup');
    else if (event.type === 'hit') playSound('hit');
    else if (event.type === 'hide') playSound('hide');
    else if (event.type === 'stage') playSound('stage');
    else if (event.type === 'escaped') playSound('escaped');
    else if (event.type === 'caught') playSound('caught');
    else if (event.type === 'start') playSound('gobble');
  }
  target.events.length = 0;
}

if (shotName !== null) {
  // Screenshot mode: stage the scene, draw it once, stop.
  const staged = stageShot(shotName, shotSeed);
  drawFrame(ctx, staged.state, staged.screen);
  window.__shotReady = true;
} else {
  // Normal play.
  let last = performance.now();
  let accumulator = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;

    if (input.mutePressed()) toggleMute();
    unlockAudio();

    if (state.screen === SCREEN_TITLE) {
      // The demo turkey runs itself; a caught demo restarts quietly.
      accumulator += elapsed;
      while (accumulator >= STEP) {
        stepWorld(demo, autopilotInput(demo), STEP);
        accumulator -= STEP;
        if (demo.over) {
          const best = state.best;
          Object.assign(demo, createState(demo.seed));
          demo.screen = SCREEN_PLAY;
          demo.best = best;
        }
      }
      demo.events.length = 0;
      if (input.startPressed()) {
        startRun(state);
        handleEvents(state);
        playSound('gobble');
      }
      drawFrame(ctx, demo, SCREEN_TITLE);
      return;
    }

    if (state.screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        stepWorld(state, input.snapshot(), STEP);
        accumulator -= STEP;
      }
      handleEvents(state);
      if (state.over) saveBest();
    } else if (state.screen === SCREEN_OVER) {
      state.time += elapsed;
      if (input.restartPressed()) {
        startRun(state);
        handleEvents(state);
      }
    }

    drawFrame(ctx, state, state.screen);
  }

  window.__mute = () => isMuted();
  requestAnimationFrame(frame);
}
