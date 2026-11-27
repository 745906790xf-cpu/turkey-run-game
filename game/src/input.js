// Keyboard + mouse input for Gobble Dash. The game reads a plain snapshot
// { jump, duck, dash } each step; this module owns the listeners and turns
// raw key events into that snapshot plus one-shot actions (start, restart,
// mute) the main loop drains.

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const DASH_KEYS = new Set(['ShiftLeft', 'ShiftRight']);
const START_KEYS = new Set(['Enter', 'Space']);
const RESTART_KEYS = new Set(['KeyR', 'Enter', 'Space']);
const MUTE_KEYS = new Set(['KeyM']);

/** Wire listeners onto `target` (window) and `canvas`; returns the handle. */
export function createInput(target, canvas) {
  const held = new Set();
  const pressed = new Set(); // keys pressed since the last snapshot
  let clicked = false;

  function onKeyDown(event) {
    if (JUMP_KEYS.has(event.code) || DUCK_KEYS.has(event.code) || event.code === 'Space') {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  }
  function onKeyUp(event) {
    held.delete(event.code);
  }
  function onBlur() {
    held.clear();
  }
  function onClick() {
    clicked = true;
  }

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);
  canvas.addEventListener('mousedown', onClick);

  return {
    /** The held-state snapshot for this step; `jump` fires once per press. */
    snapshot() {
      const jump = [...JUMP_KEYS].some((code) => pressed.has(code));
      const duck = [...DUCK_KEYS].some((code) => held.has(code));
      const dash = [...DASH_KEYS].some((code) => pressed.has(code));
      pressed.clear();
      const click = clicked;
      clicked = false;
      return { jump, duck, dash, click };
    },
    /** True when a start key or a click happened since the last call. */
    startPressed() {
      const hit = [...START_KEYS].some((code) => pressed.has(code)) || clicked;
      pressed.clear();
      clicked = false;
      return hit;
    },
    /** True when a restart key or a click happened since the last call. */
    restartPressed() {
      const hit = [...RESTART_KEYS].some((code) => pressed.has(code)) || clicked;
      pressed.clear();
      clicked = false;
      return hit;
    },
    /** True when the mute key was pressed since the last call. */
    mutePressed() {
      const hit = [...MUTE_KEYS].some((code) => pressed.has(code));
      pressed.delete('KeyM');
      return hit;
    },
    destroy() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      canvas.removeEventListener('mousedown', onClick);
    },
  };
}
