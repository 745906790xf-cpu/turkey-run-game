// Gobble Dash: Thanksgiving Escape — tuning constants.
// One place for every number the world and the renderer agree on, so a
// balance change never has to be chased through two files.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 600;
export const STEP = 1 / 60;

export const TURKEY_X = 260;
export const TURKEY_W = 64;
export const TURKEY_H = 78;
export const TURKEY_DUCK_H = 46;

export const GRAVITY = 2400;
export const JUMP_VELOCITY = -900;
export const DOUBLE_JUMP_VELOCITY = -820;
export const MAX_FALL = 1100;

export const ESCAPE_DISTANCE = 1500;
export const START_LIVES = 3;
export const MAX_LIVES = 3;

// The three legs of the escape. Each stage ends at a distance in metres;
// speed and hazard density rise from one to the next.
export const STAGES = [
  { name: 'Farmyard', end: 500, speed: 300, gapMin: 340, gapMax: 560 },
  { name: 'Barn', end: 1000, speed: 360, gapMin: 340, gapMax: 560 },
  { name: 'Kitchen', end: 1500, speed: 420, gapMin: 260, gapMax: 440 },
];

export const DASH_SPEED = 260; // extra px/s while dashing
export const DASH_TIME = 0.55; // seconds a dash lasts
export const DASH_COOLDOWN = 2.2; // seconds before the next dash

export const FARMER_START_GAP = 230; // px behind the turkey
export const FARMER_CATCH_GAP = 26; // gap at or below this means caught
export const FARMER_GAIN_ON_HIT = 70; // px the farmer gains when you stumble
export const FARMER_GAIN_ON_HIDE = 150; // px you win back by hiding
export const HIDE_TIME = 1.6; // seconds a haystack hides you

export const HIT_INVULNERABLE = 1.6; // seconds of mercy after a hit
export const CORN_SCORE = 50;
export const FEATHER_SCORE = 100;

export const BANNER_TIME = 2.2; // seconds a stage banner stays up
