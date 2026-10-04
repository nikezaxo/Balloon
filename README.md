# Skybound — Balloon Arcade

A full-screen, touch-friendly balloon arcade game. Pick one of six stages, cut the
rope and climb as high as you can.

## Files
- index.html: page, menu, HUD, cards and game canvas
- style.css: chunky arcade styling for desktop and mobile
- sound.js: procedural music and sound effects (no audio files)
- stages.js: the six stages — backdrops, launch grounds, ledges, creatures and drawing helpers
- skins.js: balloon skins sold in the store
- game.js: game loop, input, physics, power-ups, store, revives and saving

## Run locally
Open index.html in a modern browser, or run `python -m http.server 8000` in the
folder and open http://localhost:8000.

## Deploy
Upload all six files together to any static host, with index.html at the root.
There is no build step, backend, API key or database. The Lilita One and Nunito
fonts load from Google Fonts, with system fallbacks.

## Main menu
- ▶ PLAY opens the stage picker. Choosing a stage starts it in full screen where
  the browser allows (iPhone Safari does not; the game still fills the window).
- 🛒 STORE sells balloon skins and extra lives.
- ⚡ BOOSTS explains the power-ups.
Your coins and lives are shown at the top. On wide screens the action stays in a
centred column framed by side walls.

## Stages
Every stage is endless, with its own best altitude and medals
(🥉 1,000 m, 🥈 2,500 m, 🥇 5,000 m).
- ☀️ Sunny Sky: mountains, rainbows, hot-air balloons, wind gusts and bird flocks
  that fly in from the side (a red arrow warns you first).
- 🌴 Jungle Island: beach start, giant waterfall, vines, parrots, tree-branch
  ledges and monkeys swinging on vines.
- 🦇 Crystal Cave: dark cave lit around your balloon, glowing crystals and torches,
  cave walls you must not touch, rocky ledges, roots, bats and monkeys.
- 🏭 Robo Factory: brick walls, turning gears, conveyor belts, girders with
  spinning saw blades, hydraulic pistons and patrol drones.
- 🚀 Outer Space: moon launch, shrinking Earth, and set pieces as you climb —
  space station (500 m), astronaut (1,500 m), comet (2,500 m), UFO (3,300 m) and
  aurora (4,300 m), repeating every 5,000 m.
- 🌌 Deep Universe: nebulae, a spinning galaxy and 3D-looking planets and suns
  that turn, then shrink into the distance after you pass them.

## Controls
Touch/mouse: swipe across the rope to launch, then hold and drag to steer.
Keyboard: Space plays/launches; Left/Right arrows or A/D steer; B, W, Up or
Shift fires the boost engine; P or Escape pauses.

## Coins, power-ups and boost
- Coins come in small trails between ledges. Chain them for combos. Coins you
  collect are added to your wallet for the store.
- Energy cells (every third gap): collect 5, then tap ⚡ BOOST. This is the only
  power with a cinematic intro — the action freezes, rays spin and the balloon
  zooms in with sunglasses — then a rocket engine smashes through everything for
  3.5 seconds.
- Rare power-ups (about every 11 gaps): coin magnet, bubble shield and nitro.
- Smashing ledges or drones, or bonking creatures while boosted, earns a coin.

## Store
- Skins: Classic (free), Gumball, Funny Clown, Toy Robot, Watermelon, Monster,
  Ninja, Galaxy and Golden King. Each has its own colours, decorations that turn
  with the balloon, and some have their own face and accessories.
- Extra lives: after a pop, tap REVIVE to re-inflate where you were and keep
  climbing. You can hold up to 9 lives; you start with 1.
Coins, skins, lives and bests are saved in the browser (localStorage).

## Gameplay details
- Starting climb speed: 130 m/s (game-world units), scaled slightly per stage.
- Speed increases without a cap: (130 + 1.4 × √altitude) × stage speed.
- Hitting a ledge, cave wall or creature pops the balloon unless shielded or boosted.
- Off-screen objects are discarded, keeping memory bounded.
- Small physics steps help prevent missed collisions as speed increases.

## Customize
- stages.js: STAGES lists each stage's colours, speed and drawing functions.
- game.js: generateCourse() controls ledge spacing, coins and power-ups;
  spawnCritters() controls creatures; POWERS, MEDALS and LIFE_PRICE set the rules.
- skins.js: add a skin to SKINS with its gores, decorations, face and price.
