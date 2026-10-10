# Skybound — Balloon Arcade

A full-screen, touch-friendly balloon arcade game. Pick one of six stages, cut the
rope and climb as high as you can.

## Files
- index.html: page, menu, HUD, cards and game canvas
- tutorial.js: the beginner tutorial (welcome question, coach tips, skip) and the settings screen
- style.css: chunky arcade styling for desktop and mobile
- sound.js: procedural music, sound effects and the cartoon voice synthesiser (no audio files)
- icons.js: hand-drawn cartoon SVG icons (buttons, stage badges, medals, power-ups)
- stages.js: the six stages — backdrops, launch grounds, ledges, creatures and drawing helpers
- skins.js: balloon skins sold in the store, with their card rarity, animations, selection poses, effects and trails
- voices.js: each skin's voice and lines, plus creature and boss voices
- bosses.js: stage bosses, their attacks, the versus splash and each skin's fatality
- game.js: game loop, input, physics, power-ups, store, revives and saving
- online.js: Google sign-in, cloud save, public profiles, worldwide and weekly leaderboards and the weekly tournament
- cosmetics.js: profile avatars, avatar frames and the gold name, and the profile screen
- clans.js: clans (create, find, join, requests, roles, settings) and player profile cards
- season.js: monthly seasons, ranks, season points, daily and season tasks, rewards and the Season and Tasks screens
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
Laid out like Subway Surfers: the live stage fills the screen with your balloon tied to its rope,
and only a few buttons sit around the edges.
- Top bar: your avatar (opens PROFILE), coins, gems and lives, and the gear (SETTINGS).
- Stage banner: the stage's name, stars and best score, with page dots. SWIPE THE SKY (anywhere
  above the balloon) or the banner to change stage, left for the next one; the small arrows,
  the dots and the Left/Right keys work too. The hint under the dots disappears after your first
  swipe.
- CUT THE ROPE (swipe across it below the balloon) to fly, or press Space or Enter. There is no
  PLAY button: the menu flies away, an iris in the stage colours opens from the balloon and the
  stage badge spins in. The game goes full screen where the browser allows (not iPhone Safari).
- Bottom bar: STORE (skins and lives), TASKS (red dot when a reward is ready), RANKS (weekly
  tournament, all-time and your bests; the badge shows the time left this week), SEASON (your rank
  badge) and CLAN.
- SETTINGS: sound, full screen, your account (guest: SIGN UP or LOG IN; member: sign out), your
  USERNAME, HOW TO PLAY (power-ups, boost and bosses) and the tutorial (replay it or turn it off).
On wide screens the action stays in a centred column framed by side walls. All icons are cartoon
SVGs in icons.js.

## Tutorial
The first time someone opens the game they are asked whether they want a quick tutorial (players
who already played skip the question). While it is on, the HUD shows all its labels, a coach bubble
gives each tip and a pointing hand shows what to do. For the actions the game WAITS, frozen, until
the player does them:
1. On the menu the hand swipes across the rope: cut it to fly.
2. Right after take-off the game stops and the hand drags left and right: drag (or press an arrow key)
   to carry on.
3. Tips about dodging ledges and creatures, then coins and the multiplier.
4. The boost is filled up, the game stops and the hand taps BOOST: tap it to carry on.
5. A tip about power-ups, then at the first boss a tip to dodge until it is tired.
6. When the boss is tired the game stops and the hand taps FATALITY: tap it to finish the boss.
7. How bosses give stars; then the tutorial switches itself off.
Tips carry over between runs. ESC, or SKIP TUTORIAL under each tip, leaves the tutorial at any time,
and Settings can replay it or turn it off (tutorial.js).

## In-game display
Kept clean so the sky stays clear: the score with its three stars and the bar towards the next star
at the top left, coins and pause at the top right, power-up timers under them and the BOOST button at
the bottom. The coin multiplier only shows while a row streak or multiplier is active, the boss
timer only in the last 20 seconds before a boss, and the wind only when a gust is coming or blowing.
Your altitude pops up as a big "1,000 m" banner at every 1,000 metres. During the tutorial the HUD also
shows the altitude, stage name, wind, speed and the boss timer all the time.

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
Monster (deep growl) "Mega chomp!", Golden King "Long live the king!", Starlight "I am the
Star Legend!", Sly Fox "Nobody suspects the fox.", Grumpy Wolf "Don't make me huff and puff.".
The four talking characters (Sleepy Dog, Chick Trio, Sly Fox, Grumpy Wolf) have two or three lines
for each moment plus eight "chat" lines they say on their own while flying. Bosses have a taunt,
a tired line and "Nooo! Impossible!". The words also pop up as a bubble above the balloon.

The lines are pre-made clips in audio/voices/<character>/ (about 3 MB, mp3). They were
spoken by the open-source Kokoro speech model and then turned into cartoon voices with
ffmpeg: chipmunk pitch shifts, growls, a robot filter, chorus and echo, each character
with its own settings (tools/make_voices.py; add character names after the output folder to
remake only those). Only the clips for your skin and the stage boss load, in the
background, once sound is on. Until a clip has loaded, or if it can't load, a small
synthesised cartoon voice is used instead (also used for birds, bats, monkeys and drones).
A deep, dark announcer (an octave-dropped voice with distortion and a cavernous echo,
over a booming sting) calls out power-ups instead of the balloon: "Energy!", "Boost ready!",
"Engine boost!", "Turbo!", "Coin magnet!", "Shield!", "Double coins!", plus "Boss incoming!"
and "Fatality!". Its clips are in audio/voices/announcer (tools/make_announcer.py).
The music dips while someone talks. On iPhone, sound plays even with the silent switch on
(Safari 17 and newer).

## Score and stars
Every run scores points (PTS in game.js):
- 10 points per metre climbed
- 100 per coin (times the coin multiplier), 500 per perfect coin row
- 200 per energy cell, 300 per power-up
- 250 per smash or bonk, 500 per close call
- 50,000 for defeating a boss

Stars come from bosses defeated in ONE run (revives keep the count; STAR_BOSSES in game.js):
beat 3 bosses for 1 star, 6 for 2 stars and 12 for 3 stars. The HUD shows the score with
three stars that light up as you earn them (a star flies from the balloon into the meter)
and a bar towards the next star; when the boss timer shows it counts your kills towards it
(for example "BOSS 0:12 · 2/3"). Stars you earned before this rule stay earned.

When the balloon pops, an Angry Birds 2 style results screen opens: the score counts
up on a framed plaque while the stars pop in one by one above an orange ribbon (with how
many bosses the next star needs),
"NEW HIGHSCORE!" stamps on when you beat your best, and the balloons you own stand on
a grass island. Your balloon celebrates by star count (big jumps and star eyes for 3
stars, a worried look for none). From there you can revive, play again, open the store
or go back to the menu. Each stage keeps its best score and most stars.

## Online high scores
With online play switched on:
- Everyone starts as a GUEST: they can play, see the weekly, all-time and season rankings, tap any player
  and see where their own best would place ("your best would be #12 this week"). Guest progress is kept
  on that device only.
- SIGN UP (Settings, the high scores screen or the results screen) creates an account with Google:
  the player picks a USERNAME, their guest progress and best scores go into the account and on the boards,
  and everything is saved in the cloud. LOG IN signs in to an account they already have.
- Signing up with a Google account that already has a Skybound account asks first: CANCEL (stay a guest,
  nothing changes) or SIGN IN with that account (skins and best scores from this device are added to it).
  Nothing is written to the cloud until the account is confirmed.
- Usernames are unique (usernames/{name} in Firestore). Picking a name someone else has shows
  "already taken, please choose another name". Change it any time in SETTINGS > USERNAME; the new name
  shows right away on the boards, in clans and on your player card, and the old one is freed.
- Your best score goes on the ALL TIME board and your best this week on the WEEKLY board.
  The results screen shows your world and weekly rank after each run.
- The weekly tournament runs Monday 00:00 to Sunday 23:59 UTC. The first time you sign in
  after it ends you get your prize: 1st 1,000 coins + 50 gems, 2nd 750 + 30 gems,
  3rd 500 + 20 gems, 4th-10th 300 + 10 gems, top 50 150 coins, everyone else who played 50 coins.
- Your progress (coins, skins, lives, bests and stars) is saved to your account, so it
  follows you to other devices. Skins and records merge; coins, gems and lives come from the newer save.
Without it the high scores screen shows your bests on this device.

Switching it on (free Firebase plan, about 10 minutes):
1. Go to https://console.firebase.google.com, sign in and create a project (Analytics can be off).
2. Add a Web app (the </> button), give it a name and register it. Copy the firebaseConfig values.
3. Build > Authentication > Get started > Sign-in method > Google > Enable > Save.
   Then Authentication > Settings > Authorized domains > Add domain: nikezaxo.github.io
4. Build > Firestore Database > Create database (production mode, any location).
   Open its Rules tab, paste the contents of firestore.rules and Publish. Publish it again
   whenever firestore.rules changes (profiles, clans, seasons and usernames need the current version;
   until it is published, usernames still save but are not checked for duplicates).
   tools/rules.test.mjs tests the rules against the Firestore emulator.
5. Put the config into firebase-config.js, for example
   `const FIREBASE_CONFIG={apiKey:'...',authDomain:'...',projectId:'...',appId:'...'};`
   and publish. The config values are not secret; the rules protect the data.
Scores are sent by the game itself, so the rules can check their shape and stop scores
from going down, but a determined cheater could still post a fake score.

## Profiles, avatars and frames
Open PROFILE to pick your avatar, its frame and your name colour. Six avatars (Sunny, Kitty,
Bear, Froggy, Bot, Balloon) and four frames (Classic, Wood, Cloud, Leafy) are free. Animated
ones cost gems: avatars Phoenix and Ghost (150), Alien (200), Dragon (250) and Lion King (300);
frames Golden Laurel (200), Inferno and Rainbow (250), Thunder (300), Galaxy (350) and
Diamond (400). A shimmering GOLD NAME costs 500 gems; the white name is free.
Season frames (Bronze, Silver, Gold, Titanium and Diamond Season, Star Legend) and avatars
(Golden Eagle, Mech Pilot, Crystal Fox, Star Legend) are only won at the end of a season.
Tap any gem item (or the gold name) to try it on: your big avatar shows it animated with a
PREVIEW badge and a BUY button, before you spend anything.
When you are signed in, your avatar, frame, gold name and clan tag show to everyone: on the
weekly and all-time boards (read from each player's profile, so they always show the newest look), in clans and on your player card (tap any player to see theirs).

PLAYER CARDS: tap any player on the weekly, all-time or season ranking (or in a clan) to open
their card, even without signing in: avatar and frame, name and clan, this season's rank badge
and points, their past season finishes and how many season reward items they own, TOTAL SCORE
(their best scores in every stage added up), BEST SCORE, stars (out of 18), bosses beaten, and
the highest score and stars in each stage. The stats are saved in their public profile each
time they play (profiles/{uid} in Firestore), so the card shows the full picture once that
player has played this version and the updated firestore.rules are published.

## Seasons and ranks
A season is one calendar month (UTC); Season 1 is October 2026. Every run earns SEASON
POINTS (SP): 1 per 1,000 score (up to 150), 15 per star and 25 per boss defeated. Tasks add
more. SP never go down during a season and start again from zero in the next one.
- Ranks, lowest to highest: METAL, BRONZE, SILVER, GOLD, TITANIUM and DIAMOND, each with
  classes V, IV, III, II and I (Metal V is the start, Diamond I needs 7,750 SP). Each class
  needs more points the higher the tier (Metal 100 SP per class up to Diamond 500).
- STAR LEGEND, the final rank, is only for the global top 1,000: past Diamond I (8,250 SP)
  and in the season's top 1,000 players.
- Reaching a new class pays coins right away (25 in Metal up to 160 in Diamond); reaching a
  new tier also pays gems (3, 5, 8, 12 and 20), and becoming a Star Legend pays 500 coins and
  30 gems.
- END-OF-SEASON REWARDS go to everyone who scored that season, by the tier they finished in,
  and include the special items of every tier below:

  | Final rank | Coins | Gems | Special items |
  |---|---|---|---|
  | Metal | 200 | 3 | |
  | Bronze | 400 | 8 | Bronze Season frame |
  | Silver | 700 | 15 | Silver Season frame |
  | Gold | 1,000 | 25 | Gold Season frame, Golden Eagle avatar |
  | Titanium | 1,500 | 40 | Titanium Season frame, Mech Pilot avatar |
  | Diamond | 2,500 | 60 | Diamond Season frame, Crystal Fox avatar, PRISM balloon skin |
  | Star Legend | 4,000 | 120 | Star Legend frame and avatar, STARLIGHT balloon skin |

  Season items can't be bought: they show a trophy in the profile and store, and you can
  still try them on to see them.
- The SEASON screen shows your rank badge, points and progress, and a THIS SEASON / LAST
  SEASON toggle with the global ranking of either season (avatars, names and rank badges),
  plus the REWARDS list. After a season ends, the next time you open the game it shows your
  final rank and pays the rewards (a Star Legend's final place is checked online).
- When signed in, your season points are saved to seasons/{S#}/players/{uid} in Firestore.

## Tasks
- DAILY: three tasks a day (the same for everyone, new at midnight UTC), such as flying a
  distance in one run, collecting coins, perfect coin rows, engine boosts, smashes, close
  calls, stars, power-ups, runs or defeating bosses. Each pays coins and SP (some gems), and
  finishing all three pays a bonus of 100 coins, 50 SP and 2 gems.
- SEASON: ten big goals for the whole season (50 runs, 150,000 m in total, 3,000 coins,
  100 perfect rows, 30 engine boosts, 20 stars, 30 bosses, 10,000 m in one run, 20 daily tasks,
  300 smashes) worth 200 to 300 SP plus coins or gems.
- Progress counts while you fly ("TASK DONE!" pops up) and on the results screen, which also
  shows the SP the run earned and any rank up. Open TASKS and tap CLAIM to collect.

## Clans
- CREATE A CLAN costs 100 gems: pick a name, a 2 to 5 letter tag, a description, a badge,
  a colour and whether it is open (anyone joins) or closed (players send a join request).
- Find clans on the clan screen (top clans by trophies, or search by name) and JOIN or REQUEST.
- Up to 30 members. Roles: the LEADER (founder) promotes members to ADMIN, demotes them,
  kicks anyone and can MAKE LEADER another member. ADMINS accept or decline requests, kick
  members and edit the description, badge, colour and open setting. Everyone can leave; a
  leader who leaves hands the clan to an admin (or the best member), and a leader alone can
  disband it.
- Clan trophies add up members' best scores when they join plus every new personal best
  they set while in the clan. Your clan tag shows before your name everywhere.
These features, and the season ranking, need the updated firestore.rules published in Firebase (see Online high scores).

## Boss fights
The first boss arrives after 1 minute 40 seconds of flying, and the next one 1 minute 20 seconds after each
boss you beat (BOSS_FIRST and BOSS_GAP in bosses.js; a BOSS timer counts down in the HUD):
1. WARNING: an alarm sounds, ledges retract into the walls (cave walls thin out
   and only bounce you during the fight) and creatures flee.
2. A versus splash in the style of an Angry Birds 2 poster: rays and focus lines in
   the boss colours, the boss slams in from the top, your balloon rockets up with an
   angry face, they clash in a white burst with a big red VS, and the boss name drops
   in letter by letter.
3. The boss drops in and attacks. Dodge its weapons; each attack and the passing
   time drain its stamina bar slowly (a fight lasts about 40 seconds). Below half
   stamina it gets ENRAGED: the bar turns red, it attacks faster and often chains a
   second attack right after the first. Every boss you beat in the same run makes the
   next one faster and more likely to combo (the bar shows which boss of the run it is,
   e.g. #3). Boosts and shields protect you as usual.
4. At zero stamina the boss is TIRED (dizzy and sweating). Tap FATALITY (or press
   F, Space or Enter) to finish it with your skin's fatality.
5. Defeat bursts 500 coins across the screen (+100 per earlier win against that
   boss, +100 with the Golden King skin); they all fly into your balloon, then the
   course resumes. Repeat wins against a stage's boss also make it slightly faster.

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
Touch/mouse: swipe across the rope to launch, then put a finger anywhere and drag: the
balloon follows your finger's movement in every direction (left, right, up and down), so your
finger never covers it. It stays below the HUD, above the bottom edge, and below the boss
during a boss fight. Flying higher on the screen reaches things sooner.
Keyboard: Space or Enter plays from the menu and launches; Left/Right in the menu change stage; arrow keys or WASD move; B, E or Shift fires the boost engine; F, Space or Enter performs a fatality on a tired
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
  Ninja – Shadow Clones, Galaxy – Cosmic Warp, Golden King – King's Treasure, Sleepy Dog –
  Nap Time, Chick Trio – Chick Parade, Sly Fox – Sneaky Scheme, Grumpy Wolf – Huff and Puff.
- Skins: Classic (free), Gumball, Funny Clown, Toy Robot, Watermelon, Monster,
  Ninja, Galaxy and Golden King for coins, and three MYTHIC skins sold only for gems:
  Fire Dragon (30 gems, Dragon Fire pose, Dragon Breath fatality), Rainbow Unicorn
  (50 gems, Rainbow Dash, Rainbow Blast) and Diamond (80 gems, Crystal Shine, Diamond Storm).
- Four TALKING CHARACTERS for coins, original characters each with 35 voice lines: Sleepy Dog
  (350: floppy ears, eye patch and nightcap; trails Zzz, bones and puffs; Sleepy Slam fatality),
  Chick Trio (450: a chick balloon with two baby chicks flying beside it; feathers, music notes
  and seeds; Peck Peck Peck), Sly Fox (600: pointy ears, white muzzle, whiskers and a bushy tail;
  feathers; Feather Frenzy) and Grumpy Wolf (800: ragged ears, heavy brows and fangs; wind puffs
  and blown leaves; Big Bad Blow). Besides their lines for every moment, they chat on their own
  every 13 to 22 seconds while flying (not during boss fights), with a speech bubble.
- Two SEASON skins are never sold, only won as end-of-season rewards: PRISM (Diamond: rainbow
  crystal, Rainbow Flash pose, rainbow crystal trail) and STARLIGHT (Star Legend: night-sky
  balloon with a halo of stars, Supernova pose, starlight trail). Both have their own voice.
- Gems are won in the weekly tournament's top 10, from tasks and from seasons, and shown next to your coins. Each has its own colours, decorations that turn
  with the balloon, and some have their own face and accessories. In the store
  every skin's card moves in its own style with its own effect (bouncing gumball with
  bubbles, wobbling clown with confetti, jerky robot with sparks, spinning
  melon with juice, growling monster with slime, dashing ninja with smoke,
  galaxy with orbiting stars, gleaming gold with glitter), and choosing one
  plays a burst.
- Every skin leaves its own signature trail while flying (the engine boost's fire replaces it
  while it burns), and the store cards preview it under the balloon: Classic hearts and puffs,
  Gumball bubbles, Funny Clown confetti and clown-nose balls, Toy Robot gears, sparks and oil
  smoke, Watermelon seeds and juice drops, Monster slime and stink clouds, Ninja smoke with the
  odd flying shuriken, Galaxy glowing nebula and stardust, Golden King spinning coins and
  glitter, Fire Dragon flames and embers, Rainbow Unicorn a rainbow ribbon with sparkles, and
  Diamond crystal shards with glints (SKIN_TRAILS in skins.js).
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
  spawnCritters() controls creatures; POWERS, MEDALS, LIFE_PRICE, STAR_BOSSES and
  PTS set the rules.
- skins.js: add a skin to SKINS with its gores, decorations, face, price and rarity,
  and give it a selection pose in SKIN_POSES.
