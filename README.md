# Gobble Dash: Thanksgiving Escape

An original Canvas 2D side-scrolling runner for make.fun's
"Make the best turkey escape game" bounty (turkey-run-game-01). You are a
turkey escaping becoming Thanksgiving dinner: outrun the farmer through the
farmyard, the barn and the kitchen, and reach 1500 m to freedom.

## How to play

- **Space / ↑ / W** — jump (press again mid-air for a double jump)
- **↓ / S** — duck under the flying carving knives
- **Shift** — dash for a burst of speed
- **Enter / click** — start, **R / click** — run again, **M** — mute

Dodge fences, hay bales, rolling pumpkins, oven flame jets and carving
knives. Grab corn for points and golden feathers for an extra life; duck
into a haystack to hide and make the farmer stop to search. The danger
meter (top right) shows how close the farmer is — stumble and he gains on
you. Three hits, or letting him catch you, ends the run.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no libraries, no network requests at runtime: plain static
files (`game/index.html` + ES modules) with WebAudio-synthesised sound.
Screenshots are staged from the real game with `?shot=title|play|kitchen|end&seed=1`.
