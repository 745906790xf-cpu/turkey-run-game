// Gobble Dash rendering: everything is drawn in code on one canvas —
// procedural parallax, the turkey, the farmer, every hazard and pickup,
// the HUD and the title / end screens. No images, no fonts beyond the
// system sans-serif stack.

import { VIEW_W, VIEW_H, GROUND_Y, TURKEY_W, TURKEY_H, TURKEY_DUCK_H, STAGES, FARMER_CATCH_GAP } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './world.js';

const INK = '#3a2415';
const CREAM = '#fff6e3';

// Warm autumn palettes, one per stage.
const PALETTES = [
  { // Farmyard: late-afternoon sky over the yard.
    skyTop: '#f7b267', skyBottom: '#ffe8b3', sun: '#ffdf6b', far: '#c98a4b',
    ground: '#8a6b3d', groundTop: '#b98d4f', grass: '#7d9b4a',
  },
  { // Barn: lamplit wood inside.
    skyTop: '#5d3a22', skyBottom: '#8a5a33', sun: '#ffca7a', far: '#4a2c18',
    ground: '#6b4a2a', groundTop: '#8a6136', grass: '#c9a86a',
  },
  { // Kitchen: cream tiles and a checker floor.
    skyTop: '#f2e3c6', skyBottom: '#fbf3df', sun: '#ffe9a8', far: '#d9b98a',
    ground: '#b08954', groundTop: '#d9b98a', grass: '#a8573c',
  },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, state) {
  const p = PALETTES[state.stage];
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(1, p.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

  // Sun — not in the kitchen, where the window carries its own.
  if (state.stage !== 2) {
    ctx.fillStyle = p.sun;
    ctx.beginPath();
    ctx.arc(1050, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 233, 168, 0.35)';
    ctx.beginPath();
    ctx.arc(1050, 110, 74, 0, Math.PI * 2);
    ctx.fill();
  }

  // Drifting clouds, two parallax depths — outdoors only; indoors the
  // kitchen wall has no sky to drift across.
  if (state.stage !== 2) {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 340 - state.scroll * 0.12) % (VIEW_W + 260) + VIEW_W + 260) % (VIEW_W + 260) - 130;
      const cy = 70 + i * 46;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 44, cy + 6, 44, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Far silhouettes: a barn and fence line in the yard, beams in the barn,
  // a window and cupboards in the kitchen.
  ctx.fillStyle = p.far;
  if (state.stage === 0) {
    const bx = ((620 - state.scroll * 0.3) % (VIEW_W + 500) + VIEW_W + 500) % (VIEW_W + 500) - 250;
    ctx.fillRect(bx, GROUND_Y - 190, 220, 190);
    ctx.beginPath();
    ctx.moveTo(bx - 18, GROUND_Y - 190);
    ctx.lineTo(bx + 110, GROUND_Y - 268);
    ctx.lineTo(bx + 238, GROUND_Y - 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(bx + 88, GROUND_Y - 110, 44, 110);
    for (let i = 0; i < 6; i += 1) {
      const fx = ((i * 260 - state.scroll * 0.5) % (VIEW_W + 260) + VIEW_W + 260) % (VIEW_W + 260) - 130;
      ctx.fillStyle = p.far;
      ctx.fillRect(fx, GROUND_Y - 34, 8, 34);
      ctx.fillRect(fx + 120, GROUND_Y - 34, 8, 34);
      ctx.fillRect(fx, GROUND_Y - 30, 128, 6);
      ctx.fillRect(fx, GROUND_Y - 16, 128, 6);
    }
  } else if (state.stage === 1) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 5; i += 1) {
      const bx = ((i * 320 - state.scroll * 0.25) % (VIEW_W + 320) + VIEW_W + 320) % (VIEW_W + 320) - 160;
      ctx.fillRect(bx, 0, 26, GROUND_Y);
    }
    ctx.fillStyle = '#ffca7a';
    ctx.beginPath();
    ctx.arc(240, 120, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 202, 122, 0.25)';
    ctx.beginPath();
    ctx.arc(240, 120, 90, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Kitchen wall: tiles, a window, hanging pans.
    ctx.fillStyle = 'rgba(120, 70, 30, 0.16)';
    for (let y = 0; y < GROUND_Y; y += 64) {
      ctx.fillRect(0, y, VIEW_W, 2);
    }
    for (let x = 0; x < VIEW_W; x += 96) {
      ctx.fillRect(x, 0, 2, GROUND_Y);
    }
    ctx.fillStyle = '#cfe8f5';
    roundRect(ctx, 880, 70, 260, 190, 10);
    ctx.fill();
    ctx.strokeStyle = '#8a5a33';
    ctx.lineWidth = 8;
    ctx.strokeRect(880, 70, 260, 190);
    ctx.beginPath();
    ctx.moveTo(1010, 70);
    ctx.lineTo(1010, 260);
    ctx.moveTo(880, 165);
    ctx.lineTo(1140, 165);
    ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(950, 120, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d3d46';
    for (let i = 0; i < 3; i += 1) {
      const px = 180 + i * 90;
      ctx.beginPath();
      ctx.arc(px, 130, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#23232b';
      ctx.beginPath();
      ctx.arc(px, 130, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d3d46';
      ctx.beginPath();
      ctx.moveTo(px, 96);
      ctx.lineTo(px, 78);
      ctx.stroke();
    }
  }
}

function drawGround(ctx, state) {
  const p = PALETTES[state.stage];
  ctx.fillStyle = p.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = p.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  ctx.fillStyle = p.grass;
  if (state.stage === 2) {
    // Checkerboard kitchen floor.
    const tile = 55;
    for (let col = 0; col * tile < VIEW_W; col += 1) {
      for (let row = 0; row * tile < VIEW_H - GROUND_Y - 10; row += 1) {
        const scrolledCol = col + Math.floor(state.scroll / tile);
        ctx.fillStyle = (scrolledCol + row) % 2 === 0 ? '#e8dcc0' : '#c9a06a';
        ctx.fillRect(col * tile, GROUND_Y + 10 + row * tile, tile, tile);
      }
    }
  } else {
    for (let i = 0; i < 26; i += 1) {
      const gx = ((i * 97 - state.scroll) % (VIEW_W + 100) + VIEW_W + 100) % (VIEW_W + 100) - 50;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y + 26);
      ctx.lineTo(gx + 6, GROUND_Y + 12);
      ctx.lineTo(gx + 12, GROUND_Y + 26);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawTurkey(ctx, state) {
  const t = state.turkey;
  const ducking = t.ducking;
  const hidden = t.hidden > 0;
  const blink = t.invulnerable > 0 && Math.floor(state.time * 14) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;
  if (hidden) ctx.globalAlpha = 0.55;
  const x = t.x + TURKEY_W / 2;
  const y = t.y + TURKEY_H;
  const squash = ducking ? 0.62 : 1;
  const legSwing = Math.sin(t.runCycle) * (t.y >= GROUND_Y - TURKEY_H ? 10 : 3);
  const airborne = t.y < GROUND_Y - TURKEY_H;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);

  // Fanned tail.
  ctx.fillStyle = '#8a5a2b';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 11);
    ctx.beginPath();
    ctx.ellipse(-26, -58, 11, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = i === 0 ? '#a06a35' : '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(-26, -58, 6, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a5a2b';
    ctx.restore();
  }

  // Legs.
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -8);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Body.
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.ellipse(0, -34, 34, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(6, -30, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing.
  ctx.fillStyle = '#5d3a1e';
  ctx.beginPath();
  ctx.ellipse(-4, -34, 18, 12, airborne ? -0.7 : -0.2 + Math.sin(t.runCycle) * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Head, beak and wattle.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(28, -62, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a33d';
  ctx.beginPath();
  ctx.moveTo(38, -64);
  ctx.lineTo(52, -59);
  ctx.lineTo(38, -55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d23c2e';
  ctx.beginPath();
  ctx.ellipse(34, -50, 5, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(31, -65, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawFarmer(ctx, state) {
  const f = state.farmer;
  const t = state.turkey;
  // The farmer's screen position compresses with distance: he is always at
  // least partly on screen (so the chase reads), while the real gap still
  // drives the danger meter and the catch.
  const visualGap = Math.min(f.gap, 240) + Math.max(0, f.gap - 240) * 0.15;
  const x = t.x - visualGap;
  if (x < -160) return; // off the left edge: he is catching up off-screen
  const y = GROUND_Y;
  const swing = Math.sin(f.runCycle) * 12;
  const searching = f.searching > 0 || t.hidden > 0;

  ctx.save();
  ctx.translate(x + 40, y);

  // Legs.
  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -34);
  ctx.lineTo(-4 + (searching ? 0 : swing), 0);
  ctx.moveTo(10, -34);
  ctx.lineTo(10 - (searching ? 0 : swing), 0);
  ctx.stroke();

  // Body + apron.
  ctx.fillStyle = '#4a6b8a';
  roundRect(ctx, -22, -92, 52, 60, 10);
  ctx.fill();
  ctx.fillStyle = '#f2ead8';
  roundRect(ctx, -14, -72, 36, 42, 6);
  ctx.fill();
  ctx.fillStyle = '#d23c2e';
  ctx.fillRect(-14, -72, 36, 6);

  // Reaching arm.
  ctx.strokeStyle = '#4a6b8a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(24, -78);
  ctx.lineTo(searching ? 34 : 52, searching ? -96 : -76);
  ctx.stroke();

  // Head + straw hat.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(8, -104, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b25f';
  ctx.beginPath();
  ctx.ellipse(8, -114, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#b98d4f';
  ctx.beginPath();
  ctx.ellipse(8, -116, 16, 8, 0, Math.PI, 0);
  ctx.fill();

  ctx.restore();
}

function drawEntity(ctx, state, e) {
  ctx.save();
  if (e.kind === 'fence') {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(e.x, e.y + 8, e.w, e.h - 8);
    ctx.fillStyle = '#8a6136';
    ctx.fillRect(e.x - 8, e.y + 10, e.w + 16, 8);
    ctx.fillRect(e.x - 8, e.y + 34, e.w + 16, 8);
    ctx.fillStyle = '#5d3a22';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + 8);
    ctx.lineTo(e.x + e.w / 2, e.y - 6);
    ctx.lineTo(e.x + e.w, e.y + 8);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'bale') {
    ctx.fillStyle = '#d9b25f';
    roundRect(ctx, e.x, e.y, e.w, e.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(e.x + 4, e.y + (e.h / 4) * i);
      ctx.lineTo(e.x + e.w - 4, e.y + (e.h / 4) * i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#8a6b3d';
    ctx.beginPath();
    ctx.moveTo(e.x + 8, e.y + 4);
    ctx.lineTo(e.x + e.w - 8, e.y + 4);
    ctx.stroke();
  } else if (e.kind === 'pumpkin') {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    ctx.fillStyle = '#e8722a';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c85a17';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14 + Math.abs(i) * 8, 26, 0, -Math.PI / 2 + i * 0.2, Math.PI / 2 + i * 0.2);
      ctx.stroke();
    }
    ctx.fillStyle = '#3d6b2f';
    ctx.fillRect(cx - 3, cy - 32, 6, 10);
    ctx.fillStyle = '#1c1c1c';
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy - 4);
    ctx.lineTo(cx - 6, cy + 2);
    ctx.lineTo(cx, cy - 4);
    ctx.lineTo(cx + 6, cy + 2);
    ctx.lineTo(cx + 12, cy - 4);
    ctx.lineTo(cx + 8, cy + 8);
    ctx.lineTo(cx - 8, cy + 8);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'oven') {
    ctx.fillStyle = '#3d3d46';
    roundRect(ctx, e.x, e.y, e.w, e.h, 8);
    ctx.fill();
    ctx.fillStyle = '#23232b';
    roundRect(ctx, e.x + 10, e.y + 18, e.w - 20, 52, 6);
    ctx.fill();
    if (e.flame > 0.05) {
      const flick = Math.sin(state.time * 22 + e.x) * 6;
      const grad = ctx.createLinearGradient(0, e.y - 10, 0, e.y - 96 * e.flame);
      grad.addColorStop(0, '#ff9d00');
      grad.addColorStop(0.6, '#ff5a00');
      grad.addColorStop(1, '#ffd23d');
      ctx.fillStyle = grad;
      for (let i = 0; i < 3; i += 1) {
        const fx = e.x + 22 + i * 24;
        ctx.beginPath();
        ctx.moveTo(fx - 9, e.y - 6);
        ctx.quadraticCurveTo(fx - 12, e.y - 52 * e.flame + flick, fx, e.y - 92 * e.flame + flick);
        ctx.quadraticCurveTo(fx + 12, e.y - 52 * e.flame - flick, fx + 9, e.y - 6);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.fillStyle = '#c9c9d4';
    ctx.fillRect(e.x + 14, e.y + e.h - 22, e.w - 28, 6);
    ctx.fillStyle = '#ff5a00';
    ctx.beginPath();
    ctx.arc(e.x + e.w - 20, e.y + 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'knife') {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate(-0.12 + Math.sin(state.time * 6 + e.x) * 0.04);
    ctx.fillStyle = '#dfe3e8';
    ctx.beginPath();
    ctx.moveTo(-6, -7);
    ctx.lineTo(30, -7);
    ctx.lineTo(38, 0);
    ctx.lineTo(30, 7);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5d3a22';
    roundRect(ctx, -38, -6, 32, 12, 5);
    ctx.fill();
    ctx.fillStyle = '#c9c9d4';
    ctx.fillRect(-10, -7, 4, 14);
    ctx.restore();
  } else if (e.kind === 'corn') {
    const bob = Math.sin(state.time * 4 + e.bob) * 3;
    ctx.translate(0, bob);
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.ellipse(e.x + 15, e.y + 17, 11, 16, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(e.x + 11 + i * 5, e.y + 12 + (i % 2) * 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4a8a3d';
    ctx.beginPath();
    ctx.moveTo(e.x + 4, e.y + 26);
    ctx.lineTo(e.x + 15, e.y + 34);
    ctx.lineTo(e.x + 26, e.y + 26);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'feather') {
    const bob = Math.sin(state.time * 3) * 4;
    ctx.translate(0, bob);
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.ellipse(e.x + 17, e.y + 16, 9, 15, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8a33d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.x + 17, e.y + 2);
    ctx.lineTo(e.x + 17, e.y + 30);
    ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(e.x + 17, e.y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'haystack') {
    // In the kitchen the hiding place is a pantry cupboard, not a haystack.
    if (state.stage === 2) {
      ctx.fillStyle = '#7a5230';
      roundRect(ctx, e.x, e.y, e.w, e.h, 6);
      ctx.fill();
      ctx.fillStyle = '#8a6136';
      ctx.fillRect(e.x + 6, e.y + 8, e.w / 2 - 10, e.h - 16);
      ctx.fillRect(e.x + e.w / 2 + 4, e.y + 8, e.w / 2 - 10, e.h - 16);
      ctx.fillStyle = '#d9b25f';
      ctx.beginPath();
      ctx.arc(e.x + e.w / 2 - 8, e.y + e.h / 2, 4, 0, Math.PI * 2);
      ctx.arc(e.x + e.w / 2 + 8, e.y + e.h / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      if (!e.used) {
        ctx.fillStyle = INK;
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HIDE', e.x + e.w / 2, e.y - 8);
      }
      ctx.restore();
      return;
    }
    ctx.fillStyle = e.used ? '#c9a86a' : '#e8c96a';
    ctx.beginPath();
    ctx.moveTo(e.x, e.y + e.h);
    ctx.quadraticCurveTo(e.x + e.w / 2, e.y - 26, e.x + e.w, e.y + e.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b98d4f';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2 + i * 16, e.y + e.h - 8);
      ctx.quadraticCurveTo(e.x + e.w / 2 + i * 20, e.y + 26, e.x + e.w / 2 + i * 26, e.y + e.h - 4);
      ctx.stroke();
    }
    if (!e.used) {
      ctx.fillStyle = INK;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIDE', e.x + e.w / 2, e.y - 8);
    }
  }
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Score + distance.
  ctx.fillStyle = 'rgba(58, 36, 21, 0.55)';
  roundRect(ctx, 18, 16, 300, 66, 12);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`SCORE ${state.score}`, 34, 46);
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(state.distance)} m  ·  ${STAGES[state.stage].name}`, 34, 72);

  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const hx = 350 + i * 40;
    const hy = 48;
    ctx.fillStyle = i < state.lives ? '#d23c2e' : 'rgba(58, 36, 21, 0.3)';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 8);
    ctx.bezierCurveTo(hx - 14, hy - 6, hx - 4, hy - 16, hx, hy - 6);
    ctx.bezierCurveTo(hx + 4, hy - 16, hx + 14, hy - 6, hx, hy + 8);
    ctx.fill();
  }

  // Danger meter: how close the farmer is.
  const danger = 1 - Math.max(0, Math.min(1, (state.farmer.gap - FARMER_CATCH_GAP) / 300));
  const mw = 260;
  const mx = VIEW_W - mw - 24;
  ctx.fillStyle = 'rgba(58, 36, 21, 0.55)';
  roundRect(ctx, mx - 8, 16, mw + 16, 66, 12);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(state.spotted ? '⚠ SPOTTED!' : 'FARMER', mx, 38);
  ctx.fillStyle = '#3a2415';
  roundRect(ctx, mx, 46, mw, 14, 7);
  ctx.fill();
  ctx.fillStyle = danger > 0.66 ? '#d23c2e' : danger > 0.33 ? '#e8722a' : '#7d9b4a';
  roundRect(ctx, mx, 46, Math.max(8, mw * danger), 14, 7);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('M mute · Shift dash', mx, 76);

  // Stage banner.
  if (state.bannerTime > 0 && state.banner !== '') {
    ctx.globalAlpha = Math.min(1, state.bannerTime);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(58, 36, 21, 0.6)';
    roundRect(ctx, VIEW_W / 2 - 190, 120, 380, 62, 14);
    ctx.fill();
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillText(state.banner.toUpperCase(), VIEW_W / 2, 163);
    ctx.globalAlpha = 1;
  }
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(58, 36, 21, 0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 84px system-ui, sans-serif';
  ctx.fillText('GOBBLE DASH', VIEW_W / 2, 190);
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('— Thanksgiving Escape —', VIEW_W / 2, 244);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText('The farmer wants you for dinner. Run 1500 m through the farmyard,', VIEW_W / 2, 310);
  ctx.fillText('the barn and the kitchen — and do not get caught.', VIEW_W / 2, 340);
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ffd23d';
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) ctx.fillText('PRESS ENTER OR CLICK TO START', VIEW_W / 2, 420);
  ctx.fillStyle = CREAM;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Space / ↑ / W — jump (twice)      ↓ / S — duck      Shift — dash', VIEW_W / 2, 480);
  ctx.fillText('Grab corn for points, golden feathers for a life, hide in haystacks to lose the farmer.', VIEW_W / 2, 510);
  ctx.fillText('Jump the fences and pumpkins, duck the carving knives, time the oven flames.', VIEW_W / 2, 540);
  if (state.best > 0) {
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`Best escape so far: ${state.best} m`, VIEW_W / 2, 600);
  }
}

function drawEnd(ctx, state) {
  ctx.fillStyle = 'rgba(30, 16, 8, 0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  if (state.escaped) {
    ctx.fillStyle = '#8fce5a';
    ctx.font = 'bold 88px system-ui, sans-serif';
    ctx.fillText('ESCAPED!', VIEW_W / 2, 230);
    ctx.fillStyle = CREAM;
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('You made it past the kitchen and into the wild. Happy Thanksgiving —', VIEW_W / 2, 290);
    ctx.fillText('as a free turkey, not a dinner.', VIEW_W / 2, 324);
  } else {
    ctx.fillStyle = '#ff6b57';
    ctx.font = 'bold 88px system-ui, sans-serif';
    ctx.fillText('CAUGHT!', VIEW_W / 2, 230);
    ctx.fillStyle = CREAM;
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('The farmer caught up with you. The oven was already warm…', VIEW_W / 2, 290);
    ctx.fillText('Gobble once more and try again.', VIEW_W / 2, 324);
  }
  ctx.fillStyle = CREAM;
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText(`Distance  ${Math.floor(state.distance)} m      Score  ${state.score}`, VIEW_W / 2, 400);
  ctx.font = '20px system-ui, sans-serif';
  ctx.fillText(`Reached: ${STAGES[state.stage].name}  ·  Best: ${state.best} m`, VIEW_W / 2, 440);
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_W / 2, 520);
  }
}

/** Draw one frame. `screen` is the screen to overlay on the world. */
export function drawFrame(ctx, state, screen) {
  ctx.save();
  if (state.shake > 0) {
    const mag = state.shake * 22;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawSky(ctx, state);
  drawGround(ctx, state);
  for (const e of state.entities) drawEntity(ctx, state, e);
  drawFarmer(ctx, state);
  drawTurkey(ctx, state);
  ctx.restore();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(210, 60, 46, ${Math.min(0.45, state.flash)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (screen === SCREEN_PLAY) drawHud(ctx, state);
  else if (screen === SCREEN_TITLE) drawTitle(ctx, state);
  else if (screen === SCREEN_OVER) drawEnd(ctx, state);
}
