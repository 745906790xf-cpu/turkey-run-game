// Gobble Dash: Thanksgiving Escape — the world.
// Pure game rules, no drawing and no sound: createState builds a fresh run,
// stepWorld advances it one fixed step from an input snapshot, and
// autopilotInput plays it well enough to stage screenshots. The renderer and
// the audio layer only read state and the events stepWorld emits.

import {
  VIEW_W,
  GROUND_Y,
  STEP,
  TURKEY_X,
  TURKEY_W,
  TURKEY_H,
  TURKEY_DUCK_H,
  GRAVITY,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  MAX_FALL,
  ESCAPE_DISTANCE,
  START_LIVES,
  MAX_LIVES,
  STAGES,
  DASH_SPEED,
  DASH_TIME,
  DASH_COOLDOWN,
  FARMER_START_GAP,
  FARMER_CATCH_GAP,
  FARMER_GAIN_ON_HIT,
  FARMER_GAIN_ON_HIDE,
  HIDE_TIME,
  HIT_INVULNERABLE,
  CORN_SCORE,
  FEATHER_SCORE,
  BANNER_TIME,
} from './config.js';
import { makeRng, intBetween, pick } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

const HAZARD_KINDS = ['fence', 'bale', 'pumpkin'];

/** A fresh run. `seed` fixes the hazard and pickup layout. */
export function createState(seed = 1) {
  return {
    seed,
    rng: makeRng(seed),
    screen: SCREEN_TITLE,
    time: 0,
    distance: 0, // metres run
    scroll: 0, // px of world scrolled past
    score: 0,
    lives: START_LIVES,
    stage: 0,
    banner: '',
    bannerTime: 0,
    best: 0,
    over: false,
    escaped: false,
    overReason: '',
    shake: 0,
    flash: 0,
    spotted: false,
    turkey: {
      x: TURKEY_X,
      y: GROUND_Y - TURKEY_H,
      vy: 0,
      jumps: 0,
      ducking: false,
      dashTime: 0,
      dashCooldown: 0,
      invulnerable: 0,
      hidden: 0,
      runCycle: 0,
    },
    farmer: {
      gap: FARMER_START_GAP, // px behind the turkey
      searching: 0, // seconds left paused to search a haystack
      runCycle: 0,
    },
    entities: [], // hazards, pickups and haystacks, sorted by x
    nextSpawnAt: 420, // scroll px at which the next entity spawns, just off the right edge
    events: [], // sound/animation cues for this step, drained by main.js
  };
}

/** The run speed in px/s right now, including a dash. */
export function runSpeed(state) {
  const stage = STAGES[state.stage];
  const dash = state.turkey.dashTime > 0 ? DASH_SPEED : 0;
  return stage.speed + dash;
}

function stageOf(distance) {
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance < STAGES[i].end) return i;
  }
  return STAGES.length - 1;
}

function pushEvent(state, type, data = null) {
  state.events.push({ type, data });
}

function turkeyBox(state) {
  const t = state.turkey;
  const h = t.ducking ? TURKEY_DUCK_H : TURKEY_H;
  return { x: t.x - 8, y: t.y + (TURKEY_H - h), w: TURKEY_W - 6, h };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnEntity(state, x) {
  const stage = STAGES[state.stage];
  const roll = state.rng();
  if (roll < 0.58) {
    // A hazard. The kitchen adds the oven and the carving knife.
    let kind = pick(state.rng, HAZARD_KINDS);
    if (state.stage === 2 && state.rng() < 0.45) kind = pick(state.rng, ['oven', 'knife']);
    if (state.stage === 1 && state.rng() < 0.12) kind = 'knife';
    state.entities.push(makeHazard(state, kind, x));
  } else if (roll < 0.82) {
    // A line of corn to chase.
    const n = intBetween(state.rng, 2, 4);
    for (let i = 0; i < n; i += 1) {
      state.entities.push({ kind: 'corn', x: x + i * 52, y: GROUND_Y - 96, w: 30, h: 34, taken: false, bob: state.rng() * 6 });
    }
  } else if (roll < 0.92) {
    state.entities.push({ kind: 'feather', x, y: GROUND_Y - 150, w: 34, h: 34, taken: false, bob: 0 });
  } else {
    state.entities.push({ kind: 'haystack', x, y: GROUND_Y - 84, w: 96, h: 84, used: false });
  }
  const gap = intBetween(state.rng, stage.gapMin, stage.gapMax);
  state.nextSpawnAt = state.scroll + gap;
}

function makeHazard(state, kind, x) {
  const base = { kind, x, taken: false, passed: false };
  if (kind === 'fence') return { ...base, y: GROUND_Y - 58, w: 34, h: 58 };
  if (kind === 'bale') return { ...base, y: GROUND_Y - 74, w: 62, h: 74 };
  if (kind === 'pumpkin') return { ...base, y: GROUND_Y - 52, w: 52, h: 52, roll: 0 };
  if (kind === 'oven') return { ...base, y: GROUND_Y - 108, w: 92, h: 108, flame: 0, flameOn: true, flameTimer: 1.4 };
  // A carving knife that flies across at head height: duck under it.
  // Standing turkey top is GROUND_Y-78, ducking top is GROUND_Y-46, so a
  // blade at GROUND_Y-72 clips a standing bird and clears a ducking one.
  return { ...base, y: GROUND_Y - 72, w: 74, h: 16, flySpeed: 260 };
}

function hurtTurkey(state, cause) {
  const t = state.turkey;
  if (t.invulnerable > 0 || t.hidden > 0) return;
  state.lives -= 1;
  t.invulnerable = HIT_INVULNERABLE;
  state.shake = 0.45;
  state.flash = 0.35;
  state.farmer.gap = Math.max(0, state.farmer.gap - FARMER_GAIN_ON_HIT);
  pushEvent(state, 'hit', { cause, lives: state.lives });
  if (state.lives <= 0) endRun(state, false, 'caught');
}

function endRun(state, escaped, reason) {
  state.over = true;
  state.escaped = escaped;
  state.overReason = reason;
  state.screen = SCREEN_OVER;
  state.best = Math.max(state.best, Math.floor(state.distance));
  pushEvent(state, escaped ? 'escaped' : 'caught', { distance: Math.floor(state.distance), score: state.score });
}

function enterStage(state, index) {
  state.stage = index;
  state.banner = STAGES[index].name;
  state.bannerTime = BANNER_TIME;
  pushEvent(state, 'stage', { name: STAGES[index].name });
}

/** Advance the world one fixed step. `input` is {jump, duck, dash} booleans. */
export function stepWorld(state, input, dt = STEP) {
  state.time += dt;
  if (state.screen !== SCREEN_PLAY || state.over) return;
  const t = state.turkey;

  // --- the turkey: run, jump, double-jump, duck, dash --------------------
  const grounded = t.y >= GROUND_Y - TURKEY_H;
  if (input.jump && grounded && t.jumps === 0) {
    t.vy = JUMP_VELOCITY;
    t.jumps = 1;
    pushEvent(state, 'jump');
  } else if (input.jump && !grounded && t.jumps === 1) {
    t.vy = DOUBLE_JUMP_VELOCITY;
    t.jumps = 2;
    pushEvent(state, 'jump');
  }
  t.ducking = Boolean(input.duck && grounded);
  if (input.dash && t.dashCooldown <= 0 && t.dashTime <= 0) {
    t.dashTime = DASH_TIME;
    t.dashCooldown = DASH_COOLDOWN;
    pushEvent(state, 'dash');
  }
  t.vy = Math.min(t.vy + GRAVITY * dt, MAX_FALL);
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y - TURKEY_H) {
    t.y = GROUND_Y - TURKEY_H;
    t.vy = 0;
    t.jumps = 0;
  }
  t.dashTime = Math.max(0, t.dashTime - dt);
  t.dashCooldown = Math.max(0, t.dashCooldown - dt);
  t.invulnerable = Math.max(0, t.invulnerable - dt);
  t.hidden = Math.max(0, t.hidden - dt);
  t.runCycle += dt * (grounded ? 11 : 4);

  // --- the world scrolls past --------------------------------------------
  const speed = runSpeed(state);
  const dx = speed * dt;
  state.scroll += dx;
  state.distance += (dx / 50) * 1.0; // 50 px ≈ 1 m
  state.shake = Math.max(0, state.shake - dt);
  state.flash = Math.max(0, state.flash - dt);

  const newStage = stageOf(state.distance);
  if (newStage !== state.stage) enterStage(state, newStage);
  if (state.bannerTime > 0) state.bannerTime -= dt;

  // --- the farmer: he gains when you stumble, searches when you hide -----
  const f = state.farmer;
  f.runCycle += dt * 10;
  if (f.searching > 0) {
    f.searching -= dt;
    f.gap = Math.min(420, f.gap + 90 * dt);
  } else if (t.hidden > 0) {
    f.searching = 1.2;
    f.gap = Math.min(420, f.gap + FARMER_GAIN_ON_HIDE);
    pushEvent(state, 'hide');
  } else {
    // He runs a touch slower than you at full tilt, so a clean run pulls
    // away — but every stumble hands him ground.
    const farmerSpeed = speed - 34;
    f.gap += (speed - farmerSpeed) * dt;
    f.gap = Math.min(420, f.gap);
  }
  state.spotted = f.gap < 110;
  if (f.gap <= FARMER_CATCH_GAP) {
    endRun(state, false, 'caught');
    return;
  }

  // --- spawn ahead, recycle behind ----------------------------------------
  // Entities spawn at a fixed screen position just off the right edge when
  // the scroll reaches the next spawn point, so the hazard stream keeps
  // the designed density in every stage (spawning at an absolute x would
  // fall further and further behind as the scroll grows).
  while (state.scroll >= state.nextSpawnAt) {
    spawnEntity(state, VIEW_W + 80);
  }
  for (const e of state.entities) e.x -= dx;
  if (state.entities.length > 0 && state.entities[0].x + state.entities[0].w < -80) {
    state.entities.shift();
  }

  // --- hazards, pickups and haystacks --------------------------------------
  const box = turkeyBox(state);
  for (const e of state.entities) {
    if (e.kind === 'pumpkin') {
      e.roll += dx * 0.02;
      e.x -= 60 * dt; // it rolls back toward you
    }
    if (e.kind === 'knife') e.x -= e.flySpeed * dt;
    if (e.kind === 'oven') {
      e.flameTimer -= dt;
      if (e.flameTimer <= 0) {
        e.flameOn = !e.flameOn;
        e.flameTimer = e.flameOn ? 1.1 + state.rng() * 0.5 : 0.9 + state.rng() * 0.6;
      }
      e.flame = e.flameOn ? Math.min(1, e.flame + dt * 6) : Math.max(0, e.flame - dt * 6);
    }
    if (e.kind === 'corn' || e.kind === 'feather') {
      if (!e.taken && boxesOverlap(box, { x: e.x, y: e.y - 6, w: e.w, h: e.h + 12 })) {
        e.taken = true;
        if (e.kind === 'corn') {
          state.score += CORN_SCORE;
          pushEvent(state, 'pickup', { kind: 'corn' });
        } else {
          state.score += FEATHER_SCORE;
          if (state.lives < MAX_LIVES) state.lives += 1;
          pushEvent(state, 'pickup', { kind: 'feather' });
        }
      }
      continue;
    }
    if (e.kind === 'haystack') {
      if (!e.used && t.hidden <= 0 && boxesOverlap(box, e)) {
        e.used = true;
        t.hidden = HIDE_TIME;
        pushEvent(state, 'hide');
      }
      continue;
    }
    // Hazards: a hitbox the turkey must clear.
    let hit = null;
    if (e.kind === 'oven') {
      // The body always hurts; a live flame jet extends the danger upward,
      // so you must time the jump for a lull instead of jumping through fire.
      hit = e.flame > 0.55
        ? { x: e.x + 14, y: e.y - 96, w: e.w - 28, h: 96 + e.h }
        : { x: e.x + 4, y: e.y, w: e.w - 8, h: e.h };
    } else if (e.kind === 'knife') {
      hit = { x: e.x + 6, y: e.y, w: e.w - 12, h: e.h };
    } else {
      hit = { x: e.x + 4, y: e.y, w: e.w - 8, h: e.h };
    }
    if (hit && boxesOverlap(box, hit)) {
      if (!e.passed) {
        e.passed = true;
        hurtTurkey(state, e.kind);
      }
    } else if (hit && e.x + e.w < t.x - 10 && !e.passed) {
      e.passed = true;
      state.score += 10; // cleared cleanly
    }
  }
  state.entities = state.entities.filter((e) => !e.taken || e.kind === 'haystack');

  // --- escape ---------------------------------------------------------------
  if (state.distance >= ESCAPE_DISTANCE) {
    state.distance = ESCAPE_DISTANCE;
    endRun(state, true, 'escaped');
  }
}

/** Start a run from the title screen. */
export function startRun(state) {
  const best = state.best;
  const fresh = createState(state.seed);
  fresh.best = best;
  Object.assign(state, fresh);
  state.screen = SCREEN_PLAY;
  state.banner = STAGES[0].name;
  state.bannerTime = BANNER_TIME;
  pushEvent(state, 'start');
}

/** A simple pilot: jump the jumpable, duck the knives, dash when cornered.
 * It reasons in time, not pixels: for every hazard ahead it works out
 * when its hitbox first reaches the turkey (a rolling pumpkin and a flying
 * knife close faster than the scroll), and jumps late — the turkey's screen
 * x never moves, so a jump is only above a hazard for the middle of its
 * arc. A knife arriving while the turkey jumps a fence still has to be
 * ducked, so knives are weighed alongside the jumpable hazards. */
export function autopilotInput(state) {
  const t = state.turkey;
  const input = { jump: false, duck: false, dash: false };
  if (state.screen !== SCREEN_PLAY || state.over) return input;
  const grounded = t.y >= GROUND_Y - TURKEY_H;
  const speed = runSpeed(state);

  // Seconds until a hazard's hitbox first overlaps the turkey's box
  // (turkey box right edge is TURKEY_X + TURKEY_W - 8 = 316), and how long
  // the overlap then lasts.
  const etaOf = (e) => {
    const closing = speed + (e.kind === 'pumpkin' ? 60 : e.kind === 'knife' ? 260 : 0);
    const left = e.kind === 'knife' ? e.x + 6 : e.x + 4;
    return (left - (TURKEY_X + TURKEY_W - 8)) / closing;
  };
  // The first jump only lifts the turkey above a hazard for the middle of
  // its arc, so the double jump is spent near the first jump's apex
  // (vy close to zero): a second arc from up there clears the widest
  // hazard. Firing it right after takeoff would waste it.
  const nearApex = t.vy > -300;

  let knifeEta = Infinity;
  let jumpEta = Infinity;
  let ovenEta = Infinity;
  let ovenFlame = 0;
  for (const e of state.entities) {
    const eta = etaOf(e);
    if (eta < -0.3 || eta > 2) continue;
    if (e.kind === 'knife') knifeEta = Math.min(knifeEta, eta);
    // A jumpable hazard already passing (eta <= 0) is too late to jump
    // and must not spend the double jump — the next hazard still needs it.
    else if (eta <= 0) continue;
    else if (e.kind === 'oven') {
      ovenEta = Math.min(ovenEta, eta);
      ovenFlame = e.flame;
    } else if (e.kind === 'fence' || e.kind === 'bale' || e.kind === 'pumpkin') {
      jumpEta = Math.min(jumpEta, eta);
    }
  }

  // A knife at head height: duck if grounded and nothing needs jumping;
  // if a jump is due at the same moment, jump instead — airborne above
  // the blade clears both the knife and the fence. Airborne and too low
  // for the blade, double-jump over it.
  if (knifeEta < 0.35) {
    if (jumpEta < 0.3 || ovenEta < 0.3) {
      if (grounded) input.jump = true;
      else if (t.jumps === 1 && nearApex) input.jump = true;
    } else if (grounded) {
      input.duck = true;
    } else if (t.jumps === 1 && nearApex && knifeEta < 0.25) {
      input.jump = true;
    }
  }

  // Jumpable hazards: one jump from 0.24 s out — late enough that the
  // overlap falls inside the jump's high middle — then a double jump near
  // the apex to stretch the flight over the wide ones.
  if (jumpEta < 0.24 && grounded) input.jump = true;
  else if (jumpEta < 0.22 && !grounded && t.jumps === 1 && nearApex) input.jump = true;

  // The oven: jump the body while the flame is out; over a live flame,
  // jump early and double-jump over the jet — the double jump clears it.
  if (ovenEta < Infinity) {
    if (ovenFlame <= 0.4) {
      if (ovenEta < 0.24 && grounded) input.jump = true;
      else if (ovenEta < 0.22 && !grounded && t.jumps === 1 && nearApex) input.jump = true;
    } else {
      if (ovenEta < 0.35 && grounded) input.jump = true;
      else if (ovenEta < 0.3 && !grounded && t.jumps === 1 && nearApex) input.jump = true;
    }
  }

  // A high feather is worth a hop — unless a hazard is due soon, in which
  // case the jump is saved for the hazard.
  const hazardDue = Math.min(jumpEta, ovenEta, knifeEta) < 0.6;
  for (const e of state.entities) {
    if (e.kind !== 'feather' || e.taken) continue;
    const ahead = e.x - (t.x + TURKEY_W);
    if (ahead > 0 && ahead < 120 && grounded && !input.jump && !hazardDue) input.jump = true;
  }

  if (state.farmer.gap < 80 && t.dashCooldown <= 0) input.dash = true;
  return input;
}
