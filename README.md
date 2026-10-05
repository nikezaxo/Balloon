# Skybound — Balloon Arcade

A full-screen, touch-friendly balloon arcade game. Pick one of six stages, cut the
rope and climb as high as you can.

## Files
- index.html: page, menu, HUD, cards and game canvas
- style.css: chunky arcade styling for desktop and mobile
- sound.js: procedural music and sound effects (no audio files)
- icons.js: hand-drawn cartoon SVG icons (buttons, stage badges, medals, power-ups)
- stages.js: the six stages — backdrops, launch grounds, ledges, creatures and drawing helpers
- skins.js: balloon skins sold in the store, with their card rarity, animations, selection poses, effects and trails
- bosses.js: stage bosses, their attacks, the versus splash and each skin's fatality
- game.js: game loop, input, physics, power-ups, store, revives and saving

## Run locally
Open index.html in a modern browser, or run `python -m http.server 8000` in the
folder and open http://localhost:8000.

## Deploy
Upload all eight files together to any static host, with index.html at the root.
When you change a file, bump the ?v= number on its link in index.html so browsers
fetch the new copy instead of a cached one.
There is no build step, backend, API key or database. The Lilita One and Nunito
fonts load from Google Fonts, with system fallbacks.

## Main menu
- Pick a stage right in the menu with the arrows, the dots, a swipe on the stage
  card or the Left/Right keys; the selected stage plays live behind the menu.
- Press PLAY, or cut the balloon's rope, to launch. The menu flies away, an iris
  in the stage colours opens from the balloon and the stage badge spins in.
  The game goes full screen where the browser allows (not iPhone Safari).
- The stage card shows your stars and high score for that stage.
- STORE sells balloon skins and extra lives; BOOSTS explains the power-ups.
Your coins and lives are shown at the top. On wide screens the action stays in a
centred column framed by side walls. All icons are cartoon SVGs in icons.js.

## Stages
Every stage is endless, with its own best altitude and medals
(🥉 1,000 m, 🥈 2,500 m, 🥇 5,000 m).
- ☀️ Sunny Sky: mountains, rainbows, hot-air balloons, wind gusts and bird flocks
  that fly in from the side (a red arrow warns you first).
- 🌴 Jungle Island: beach start, giant waterfall, vines, parrots, tree-branch
  ledges and monkeys swinging on vines.
- 🦇 Crystal Cave: dim cave with extra light around your balloon, glowing crystals and torches,
  cave walls you must not touch, rocky ledges, roots, bats and monkeys.
- 🏭 Robo Factory: brick walls, turning gears, conveyor belts, girders with
  spinning saw blades, hydraulic pistons and patrol drones.
- 🚀 Outer Space: moon launch, shrinking Earth, and set pieces as you climb —
  space station (500 m), astronaut (1,500 m), comet (2,500 m), UFO (3,300 m) and
  aurora (4,300 m), repeating every 5,000 m.
- 🌌 Deep Universe: nebulae, a spinning galaxy and 3D-looking planets and suns
  that turn, then shrink into the distance after you pass them.

## Score and stars
Every run scores points (STAR_SCORES and PTS in game.js):
- 10 points per metre climbed
- 100 per coin (times the coin multiplier), 500 per perfect coin row
- 200 per energy cell, 300 per power-up
- 250 per smash or bonk, 500 per close call
- 50,000 for defeating a boss

A run earns 1 star at 20,000 points, 2 stars at 60,000 and 3 stars at 150,000. The
HUD shows the score under the altitude, three stars that light up as you pass each
target (a star flies from the balloon into the meter) and a bar towards the next star.

When the balloon pops, an Angry Birds 2 style results screen opens: the score counts
up on a framed plaque while the stars pop in one by one above an orange ribbon,
"NEW HIGHSCORE!" stamps on when you beat your best, and the balloons you own stand on
a grass island. Your balloon celebrates by star count (big jumps and star eyes for 3
stars, a worried look for none). From there you can revive, play again, open the store
or go back to the menu. Each stage keeps its best score and most stars.

## Boss fights
Every 5 minutes of flying (BOSS_INTERVAL in bosses.js; a BOSS timer counts down in the HUD) the stage boss arrives:
1. WARNING: an alarm sounds, ledges retract into the walls (cave walls thin out
   and only bounce you during the fight) and creatures flee.
2. A versus splash in the style of an Angry Birds 2 poster: rays and focus lines in
   the boss colours, the boss slams in from the top, your balloon rockets up with an
   angry face, they clash in a white burst with a big red VS, and the boss name drops
   in letter by letter.
3. The boss drops in and attacks. Dodge its weapons; each attack and the passing
   time drain its stamina bar. Boosts and shields protect you as usual.
4. At zero stamina the boss is TIRED (dizzy and sweating). Tap FATALITY (or press
   F, Space or Enter) to finish it with your skin's fatality.
5. Defeat bursts 500 coins across the screen (+100 per earlier win against that
   boss, +100 with the Golden King skin); they all fly into your balloon, then the
   course resumes. Repeat wins make the boss slightly faster.

Bosses and weapons:
- Thunder King (Sunny Sky): lightning strikes, hail fans, wind gusts.
- Tiki Titan (Jungle Island): fire darts, coconut rain, fire ring.
- Bat Queen (Crystal Cave): sonic rings, falling stalactites, homing bats.
- Mecha Crusher (Robo Factory): aimed lasers, homing missiles, bouncing saws.
- UFO Overlord (Outer Space): plasma fans, tractor-beam sweep, triple bursts.
- Star Devourer (Deep Universe): star spirals, black hole pull with meteors, cosmic rings.
Attacks are tuned to be escapable: shots are slow and few, rings leave a wide gap,
falling objects leave at least three free lanes, lasers, strikes and sweeps flash
a one-second warning, homing only lasts about a second, and fights are short.

Fatalities (one per skin): Classic – Balloon Slam, Gumball – Bubble Trap,
Funny Clown – Pie Party, Toy Robot – Laser Eyes, Watermelon – Seed Storm,
Monster – Mega Chomp, Ninja – Shadow Slash, Galaxy – Black Hole,
Golden King – Midas Touch.

## Controls
Touch/mouse: swipe across the rope to launch, then hold and drag to steer.
Keyboard: Space plays/launches; Left/Right arrows or A/D steer; B, W, Up or
Shift fires the boost engine; F, Space or Enter performs a fatality on a tired
boss; P or Escape pauses.

## Coins, power-ups and boost
- Coins come in rows of 10 that follow the safe path between ledges. Collect
  every coin in 3 rows in a row to raise the coin multiplier to x1.1, then x1.2
  after the next 3, and so on; each coin is worth the multiplier. Missing a single
  coin resets it to x1.0. The multiplier and row progress show under the coin
  counter. Coins you collect are added to your wallet for the store.
- Energy cells (in every second break between coin rows): collect 5, then tap ⚡ BOOST. This is the only
  power with a cinematic intro — the action freezes, rays spin and the balloon
  zooms in with sunglasses — then a rocket engine smashes through everything for
  3.5 seconds.
- Rare power-ups (in every sixth break between coin rows): coin magnet, bubble shield and turbo.
  Turbo plays a quick mini intro in slow motion, then rockets you up.
- Smashing ledges or drones, or bonking creatures while boosted, earns a coin.

## Store
- Skins are shown as Angry Birds style cards with light rays, coloured by rarity
  (common teal, rare blue, epic purple, legendary orange). The picked skin sits on a
  big card next to its details and buy/equip button; all skins are in the fanned row
  of small cards below.
- Picking a card plays that skin's own selection pose (tap the big card to replay it):
  Classic – Heart Hug, Gumball – Bubble Pop, Funny Clown – Juggle & Honk, Toy Robot –
  Robot Dance with laser eyes, Watermelon – Melon Twister, Monster – Monster Roar,
  Ninja – Shadow Clones, Galaxy – Cosmic Warp, Golden King – King's Treasure.
- Skins: Classic (free), Gumball, Funny Clown, Toy Robot, Watermelon, Monster,
  Ninja, Galaxy and Golden King. Each has its own colours, decorations that turn
  with the balloon, and some have their own face and accessories. In the store
  every skin's card moves in its own style with its own effect (bouncing gumball with
  bubbles, wobbling clown with confetti, jerky robot with sparks, spinning
  melon with juice, growling monster with slime, dashing ninja with smoke,
  galaxy with orbiting stars, gleaming gold with glitter), and choosing one
  plays a burst. Each skin also leaves its own trail while flying.
- Extra lives: after a pop, tap REVIVE to re-inflate where you were and keep
  climbing. You can hold up to 9 lives; you start with 1.
Coins, skins, lives, bests, high scores and stars are saved in the browser (localStorage).

## Gameplay details
- Starting climb speed: 130 m/s (game-world units), scaled slightly per stage.
- Speed increases without a cap: (130 + 1.4 × √altitude) × stage speed.
- Hitting a ledge, cave wall or creature pops the balloon unless shielded or boosted.
- Each creature group gets its own widened gap: monkeys hang above a ledge on its
  own side, away from the flight path, and flocks and drones cross mid-gap.
- Off-screen objects are discarded, keeping memory bounded.
- Small physics steps help prevent missed collisions as speed increases.

## Customize
- stages.js: STAGES lists each stage's colours, speed and drawing functions.
- game.js: generateCourse() controls ledge spacing, coins and power-ups;
  spawnCritters() controls creatures; POWERS, MEDALS, LIFE_PRICE, STAR_SCORES and
  PTS set the rules.
- skins.js: add a skin to SKINS with its gores, decorations, face, price and rarity,
  and give it a selection pose in SKIN_POSES.
