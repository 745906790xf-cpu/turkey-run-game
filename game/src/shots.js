// Screenshot scenes behind ?shot=title|play|kitchen|end&seed=…. Each scene
// plays the real rules forward from a fresh world for a fixed time, steered
// by the autopilot, so the frame is what a short game really looks like and
// the same seed always gives the same frame. The kitchen scene runs until
// the run reaches the kitchen stage (1000 m) and then waits for a frame
// with an oven and a carving knife both on screen; the end scene runs
// until the run is over.

import { STEP, VIEW_W } from './config.js';
import { createState, stepWorld, autopilotInput, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';

const TITLE_SECONDS = 3;
const PLAY_SECONDS = 16;
const KITCHEN_LIMIT_SECONDS = 600;
const KITCHEN_WAIT_SECONDS = 20;
const END_LIMIT_SECONDS = 600;

function simulate(state, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    stepWorld(state, autopilotInput(state), STEP);
    if (state.over) break;
  }
}

/** Snap the clock to a whole second so blinking prompts read as "on". */
function steadyBlink(state) {
  state.time = 2 * Math.floor(state.time / 2);
}

/** Run one seed forward into the kitchen; null when the run ends first. */
function runToKitchen(seed) {
  const state = createState(seed);
  state.screen = SCREEN_PLAY;
  const steps = Math.floor(KITCHEN_LIMIT_SECONDS / STEP);
  for (let i = 0; i < steps; i += 1) {
    stepWorld(state, autopilotInput(state), STEP);
    if (state.over) return null;
    if (state.distance >= 1000) return state;
  }
  return null;
}

/** Stage the named scene from a fresh world and return what to draw. */
export function stageShot(name, seed = 1) {
  const state = createState(seed);
  state.screen = SCREEN_PLAY;
  state.banner = '';
  state.bannerTime = 0;
  if (name === 'play') {
    simulate(state, PLAY_SECONDS);
    steadyBlink(state);
    return { state, screen: state.over ? SCREEN_OVER : SCREEN_PLAY };
  }
  if (name === 'kitchen') {
    // Try a few seeds until one survives into the kitchen with a flaming
    // oven and a flying knife both in frame.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const kitchen = runToKitchen(seed + attempt);
      if (kitchen === null) continue;
      const steps = Math.floor(KITCHEN_WAIT_SECONDS / STEP);
      let framed = false;
      for (let i = 0; i < steps; i += 1) {
        stepWorld(kitchen, autopilotInput(kitchen), STEP);
        if (kitchen.over) break;
        const oven = kitchen.entities.some((e) => e.kind === 'oven' && e.flame > 0.6 && e.x > 50 && e.x < 1000);
        const knife = kitchen.entities.some((e) => e.kind === 'knife' && e.x > 200 && e.x < 1150);
        // A clean frame: no red hit-flash and the turkey not blinking
        // through its post-hit invulnerability.
        const clean = kitchen.flash === 0 && kitchen.turkey.invulnerable === 0;
        if (oven && knife && clean) {
          framed = true;
          break;
        }
      }
      if (!kitchen.over && framed) {
        kitchen.banner = '';
        kitchen.bannerTime = 0;
        steadyBlink(kitchen);
        return { state: kitchen, screen: SCREEN_PLAY };
      }
    }
    // Fallback: the plain kitchen frame, even without both hazards.
    const fallback = runToKitchen(seed);
    if (fallback !== null) {
      simulate(fallback, 4);
      steadyBlink(fallback);
      return { state: fallback, screen: fallback.over ? SCREEN_OVER : SCREEN_PLAY };
    }
    return { state, screen: SCREEN_OVER };
  }
  if (name === 'end') {
    simulate(state, END_LIMIT_SECONDS);
    steadyBlink(state);
    return { state, screen: SCREEN_OVER };
  }
  // title: a few seconds of running under the title overlay.
  simulate(state, TITLE_SECONDS);
  steadyBlink(state);
  return { state, screen: SCREEN_TITLE };
}
