# Skybound — Balloon Arcade

A full-screen, touch-friendly balloon arcade game. Pick one of six stages, cut the
rope and climb as high as you can.

## Files
- index.html: page, menu, HUD, cards and game canvas
- style.css: chunky arcade styling for desktop and mobile
- sound.js: procedural music, sound effects and the cartoon voice synthesiser (no audio files)
- icons.js: hand-drawn cartoon SVG icons (buttons, stage badges, medals, power-ups)
- stages.js: the six stages — backdrops, launch grounds, ledges, creatures and drawing helpers
- skins.js: balloon skins sold in the store, with their card rarity, animations, selection poses, effects and trails
- voices.js: each skin's voice and lines, plus creature and boss voices
- bosses.js: stage bosses, their attacks, the versus splash and each skin's fatality
- game.js: game loop, input, physics, power-ups, store, revives and saving
- online.js: Google sign-in, cloud save, worldwide and weekly leaderboards and the weekly tournament
- firebase-config.js: your Firebase project config (online play is off while it is empty)
- firestore.rules: security rules to paste into Firebase

## Run locally
Open index.html in a modern browser, or run `python -m http.server 8000` in the
folder and open http://localhost:8000.

## Deploy
Upload all the files together to any static host, with index.html at the root.
When you change a file, bump the ?v= number on its link in index.html so browsers
fetch the new copy instead of a cached one.
There is no build step. Online high scores use Firebase (free plan) once you add a config; everything else runs in the browser. The Lilita One and Nunito
fonts load from Google Fonts, with system fallbacks.

## Main menu
- Pick a stage right in the menu with the arrows, the dots, a swipe on the stage
  card or the Left/Right keys; the selected stage plays live behind the menu.
- Press PLAY, or cut the balloon's rope, to launch. The menu flies away, an iris
  in the stage colours opens from the balloon and the stage badge spins in.
  The game goes full screen where the browser allows (not iPhone Safari).
- The stage card shows your stars and high score for that stage.
- The orange WEEKLY TOURNAMENT banner opens the high scores (it reads HIGH SCORES
  while online play is off). The Google button at the top signs you in.
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

## Voices
Every balloon has its own cartoon voice and says short English lines in a funny, angry or sad
way: when you pick it in the store, cut the rope, boost, hit something, lose your shield, earn
a star, start a fatality, beat a boss, pop and revive. Examples: Classic "Wheee! Here we go!",
Gumball (chipmunk squeak) "Hee hee! I'm Gumball!", Toy Robot "Turbo mode, activated!",
Monster (deep growl) "Mega chomp!", Golden King "Long live the king!". Bosses have a taunt,
a tired line and "Nooo! Impossible!". The words also pop up as a bubble above the balloon.

The lines are pre-made clips in audio/voices/<character>/ (about 1.5 MB, mp3). They were
spoken by the open-source Kokoro speech model and then turned into cartoon voices with
ffmpeg: chipmunk pitch shifts, growls, a robot filter, chorus and echo, each character
with its own settings. Only the clips for your skin and the stage boss load, in the
background, once sound is on. Until a clip has loaded, or if it can't load, a small
synthesised cartoon voice is used instead (also used for birds, bats, monkeys and drones).
A deep, dark announcer (an octave-dropped voice with distortion and a cavernous echo,
over a booming sting) calls out power-ups instead of the balloon: "Energy!", "Boost ready!",
"Engine boost!", "Turbo!", "Coin magnet!", "Shield!", "Double coins!", plus "Boss incoming!"
and "Fatality!". Its clips are in audio/voices/announcer (tools/make_announcer.py).
The music dips while someone talks. On iPhone, sound plays even with the silent switch on
(Safari 17 and newer).

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

## Online high scores
With online play switched on:
- Sign in with Google (the G button in the menu, the high scores screen or the results screen).
- Your best score goes on the ALL TIME board and your best this week on the WEEKLY board.
  The results screen shows your world and weekly rank after each run.
- The weekly tournament runs Monday 00:00 to Sunday 23:59 UTC. The first time you sign in
  after it ends you get your prize: 1st 1,000 coins + 50 gems, 2nd 750 + 30 gems,
  3rd 500 + 20 gems, 4th-10th 300 + 10 gems, top 50 150 coins, everyone else who played 50 coins.
- Your progress (coins, skins, lives, bests and stars) is saved to your account, so it
  follows you to other devices. Skins and records merge; coins, gems and lives come from the newer save.
- The leaderboard shows your first name and last initial; RENAME picks another name.
Without it the high scores screen shows your bests on this device.

Switching it on (free Firebase plan, about 10 minutes):
1. Go to https://console.firebase.google.com, sign in and create a project (Analytics can be off).
2. Add a Web app (the </> button), give it a name and register it. Copy the firebaseConfig values.
3. Build > Authentication > Get started > Sign-in method > Google > Enable > Save.
   Then Authentication > Settings > Authorized domains > Add domain: nikezaxo.github.io
4. Build > Firestore Database > Create database (production mode, any location).
   Open its Rules tab, paste the contents of firestore.rules and Publish.
5. Put the config into firebase-config.js, for example
   `const FIREBASE_CONFIG={apiKey:'...',authDomain:'...',projectId:'...',appId:'...'};`
   and publish. The config values are not secret; the rules protect the data.
Scores are sent by the game itself, so the rules can check their shape and stop scores
from going down, but a determined cheater could still post a fake score.

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
- Coins are scarce in normal flight: rows of 10 that follow the safe path, about one row
  every three ledges. The big haul is the COIN RUSH: while the engine boost (two lanes) or
  turbo fires, a wavy river of coins pours in and the balloon pulls nearby coins in.
- Coin rows: Collect
  every coin in 3 rows in a row to raise the coin multiplier to x1.1, then x1.2
  after the next 3, and so on; each coin is worth the multiplier. Missing a single
  coin resets it to x1.0. The multiplier and row progress show under the coin
  counter. Coins you collect are added to your wallet for the store.
- Energy cells (in every second gap between coin rows, roughly one engine boost every
  13,000 m): collect 5, then tap ⚡ BOOST. This is the only
  power with a cinematic intro — the action freezes, rays spin and the balloon
  zooms in with sunglasses — then a rocket engine smashes through everything for
  3.5 seconds.
- Rare power-ups (in every eighth gap between coin rows): coin magnet, bubble shield, turbo and
  DOUBLE COINS (every coin counts twice for 15 seconds, on top of the row multiplier; the coin
  counter glows and an x2 timer shows in the HUD).
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
  Ninja, Galaxy and Golden King for coins, and three MYTHIC skins sold only for gems:
  Fire Dragon (30 gems, Dragon Fire pose, Dragon Breath fatality), Rainbow Unicorn
  (50 gems, Rainbow Dash, Rainbow Blast) and Diamond (80 gems, Crystal Shine, Diamond Storm).
- Gems are won in the weekly tournament's top 10 and shown next to your coins. Each has its own colours, decorations that turn
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
