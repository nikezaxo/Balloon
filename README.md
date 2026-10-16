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
- season.js: monthly seasons, ranks, season points, daily, box and season tasks, rewards and the Season and Tasks screens
- modes.js: the MAP screen (Campaign and Free Run)
- boxes.js: boxes (coins, gems and skin cards), card unlocks, the box opening show and the store's BOXES tab
- medals.js: medals (five levels each), their drawing and 3D spin viewer, and PROFILE > MEDALS
- levelmap.js: the living world map behind the LEVEL path (islands, bridges, flying creatures and the six stage worlds)
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
- CUT THE ROPE (swipe across it below the balloon, where a dot slides along a dashed line) to fly, or press
  Space or Enter. There is no PLAY button or text label: the menu flies away, an iris in the stage colours opens from the balloon and the
  stage badge spins in. The game goes full screen where the browser allows (not iPhone Safari).
- Bottom bar: STORE (skins, boxes and lives; a red badge counts unopened boxes), TASKS (red dot when a reward is ready), MAP (Campaign or
  Free Run, see Modes), RANKS (weekly tournament, all-time, Free Run and your bests; the badge shows
  the time left this week), SEASON (your rank badge) and CLAN.
- SETTINGS: sound, full screen, your account (guest: SIGN UP or LOG IN; member: sign out), your
  USERNAME (or guest name), HOW TO PLAY (power-ups, boost and bosses) and the tutorial (replay it or turn it off).
On wide screens the action stays in a centred column framed by side walls. All icons are cartoon
SVGs in icons.js.

## Modes: Campaign and Free Run
The MAP button (the big middle button of the bottom bar), or a tap on the stage banner, opens the map.
- CAMPAIGN: the six stages in order. Only Sunny Sky is open at first. Each stage has a GOAL altitude, and
  every goal is higher than the one before: Sunny Sky 8,000 m, Jungle Island 15,000 m, Crystal Cave
  25,000 m, Robo Factory 40,000 m, Outer Space 60,000 m and Deep Universe 90,000 m (STAGE_GOALS in game.js).
  Runs start at 130 m a second and speed up, so Sunny Sky's goal means surviving about 45 seconds and Deep
  Universe's about four minutes. Stages already cleared stay cleared.
  Reaching a stage's goal CLEARS it and unlocks the next stage mid-flight ("STAGE CLEAR! JUNGLE ISLAND
  UNLOCKED"), and the first clear of each stage pays a box (Sky Box for the first two, Storm Box for the
  next three, Legend Box for Deep Universe). The menu banner shows the goal under the stage name and the map shows a goal bar for each stage. Locked stages
  show a padlock on the map, the banner and the page dots with what opens them ("REACH 8,000 m IN SUNNY
  SKY"); cutting the rope on a locked stage does nothing. Stages you had already played or cleared stay
  open. Campaign runs count for the stage's best, stars, and the weekly and all-time boards.
- FREE RUN: one endless run through every stage. It starts at Sunny Sky; after each boss the run flies
  straight on into the next stage (new backdrop, ledges, creatures and boss), and after Deep Universe it
  starts again at Sunny Sky. Each lap its bosses rank up one level (I to V, then back to I; see BOSS RANKS under
  Boss fights), so it never ends. It has its own record (FREE RUN in MY BESTS) and its own
  world ranking by highest score (the FREE RUN tab of the rankings, freerun/{uid} in Firestore); it
  does not change your stage records. The banner reads FREE RUN with your best; change mode on the map.

## Tutorial
The first time someone opens the game they are asked whether they want a quick tutorial (players
who already played skip the question). While it is on, the HUD shows all its labels, a coach bubble
gives each tip and a pointing hand shows what to do. For the actions the game WAITS, frozen, until
the player does them:
1. On the menu the hand swipes across the rope: cut it to fly.
2. Right after take-off the game stops and the hand drags left and right: drag (or press an arrow key)
   to carry on.
3. Tips about dodging ledges and creatures, then coins and row bonuses.
4. The boost is filled up, the game stops and the hand taps BOOST: tap it to carry on.
5. A tip about power-ups, then at the first boss a tip to dodge until it is tired.
6. When the boss is tired the game stops and the hand taps FATALITY: tap it to finish the boss.
7. How bosses give stars; then the tutorial switches itself off.
Tips carry over between runs. ESC, or SKIP TUTORIAL under each tip, leaves the tutorial at any time,
and Settings can replay it or turn it off (tutorial.js).

## In-game display
Kept clean so the sky stays clear: the score with its three stars and the bar towards the next star
at the top left, coins and pause at the top right, power-up timers under them and the BOOST button at
the bottom. A rainbow x2 timer shows while the rainbow star's double score lasts, the boss
timer only in the last 20 seconds before a boss, and the wind only when a gust is coming or blowing.
Your altitude pops up as a big banner only every 100,000 metres (MILESTONE in game.js). During the tutorial the HUD also
shows the altitude, stage name, wind, speed and the boss timer all the time.
Messages are kept to what matters (boss warnings and special skills, rewards, stars, medals, records, stage clear,
revives). Tips and "something appeared" notices show only while the tutorial is on (tipsOn in game.js): the stage
banner at the start, MYSTERY BOX / RAINBOW STAR appearing, BOOST READY, ENGINE BOOST, COIN RUSH, energy counts,
SHIELD OFF, DOUBLE COINS OVER, space events (astronaut, UFO and so on), ENRAGED, LIGHTS OUT, ESCAPE THE BEAM, GET
LOW and task notices in flight (the results screen still reports finished tasks). A mystery box you grab shows a
small "+1 BOX".

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
- 100 per coin, 500 per perfect coin row (every coin of a row)
- 200 per energy cell, 300 per power-up
- 250 per smash or bonk, 500 per close call
- 50,000 for defeating a boss

Stars come from bosses defeated in ONE run (revives keep the count; STAR_BOSSES in game.js):
beat 1 boss for 1 star, 3 for 2 stars and 5 for 3 stars (in the campaign the fifth is the level V boss, which
conquers the stage). The HUD shows the score with
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
- Everyone starts as a GUEST with a fun guest name of their own (like CometDash226 or SkyPilot482), shown on
  their profile; SETTINGS > USERNAME changes it. Guests can play, see the weekly, all-time, Free Run, level and
  season rankings, tap any player and see where their own best would place ("your best would be #12 this
  week"). Guest progress is kept on that device only.
- SIGN UP (Settings, the high scores screen or the results screen) creates an account with Google without
  asking anything: the guest name becomes the USERNAME (or a fresh one like it if somebody already has it),
  the guest progress and best scores go into the account and on the boards, and everything is saved in the
  cloud. LOG IN signs in to an account they already have.
- An account that has a username never asks for one again, whether you log out and back in or switch
  devices. Only an older account that never picked one is asked once, when you log in.
- Signing up with a Google account that already has a Skybound account asks first: CANCEL (stay a guest,
  nothing changes) or SIGN IN with that account (skins and best scores from this device are added to it).
  Nothing is written to the cloud until the account is confirmed.
- SIGN OUT (Settings, after a confirmation) saves the latest progress to the account, then wipes it from
  the device: the game restarts as a fresh guest with nothing unlocked, until the player signs up (linking
  the new guest progress to an account) or logs in again, which brings back all their records and items.
- Usernames are unique (usernames/{name} in Firestore). Picking a name someone else has shows
  "already taken, please choose another name". Change it any time in SETTINGS > USERNAME; the new name
  shows right away on the boards, in clans and on your player card, and the old one is freed.
- Your best score goes on the ALL TIME board and your best this week on the WEEKLY board.
- LEVEL board: the top 100 players in the game by level, with their level badges (read from the public profiles,
  sorted by total metres flown); your own row follows if you are further down.
  The results screen shows your world and weekly rank after each run.
- The weekly tournament runs Monday 00:00 to Sunday 23:59 UTC. The first time you sign in
  after it ends you get your prize: 1st 1,000 coins + 50 gems, 2nd 750 + 30 gems,
  3rd 500 + 20 gems, 4th-10th 300 + 10 gems, top 50 150 coins, everyone else who played 50 coins.
- Your progress (coins, skins, lives, bests, stars, skin cards and boxes) is saved to your account, so it
  follows you to other devices. Skins, records, cards and total metres (your level) merge; coins, gems, lives and unopened boxes come from
  the newer save.
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

## Player level
Your PLAYER LEVEL comes from the total metres you have flown in every run (revives count only the new metres).
Like PUBG Mobile, every level needs more than the one before (levelNeed in cosmetics.js):

| Level | Metres for the next level | Total metres to reach it |
|---|---|---|
| 2 | 2,500 | 2,500 |
| 10 | 19,780 (to 11) | 82,020 |
| 20 | 54,180 (to 21) | 421,420 |
| 30 | 104,580 (to 31) | 1,176,820 |
| 50 | 253,380 (to 51) | 4,575,620 |
| 100 (max) | | 31,552,620 |

- The level number sits on a badge at the bottom right of your avatar frame, everywhere your avatar shows: the menu,
  your profile, the rankings, the season board, clans, the results screen and your player card, and other players
  see it too. Only the number shows; the badge's look changes as you climb: 1-9 bronze circle, 10-19 silver and
  20-29 gold hexagon, 30-49 teal and 50-69 purple shield, 70-99 red with a crown, and 100 a shimmering rainbow crown.
- PROFILE shows "LEVEL 23" and a bar towards the next level; player cards show the same for other players.
- LEVEL TICKETS: very rarely a box holds a x2 or x4 LEVEL TICKET (Sky Box 1.5% / 0.3%, Storm Box 4% / 1%, Legend Box
  10% / 3%). Use one in the store's BOXES tab and your next 3 runs add two or four times their metres to your level
  (one boost at a time). PROFILE shows the boost and the runs left, and the results screen marks boosted runs
  ("x2 BOOST").
- The results screen shows the metres the run added and how far it is to the next level. A new level shows
  "LEVEL UP!" and "REWARD READY · TASKS > LEVEL".
- LEVEL PATH (TASKS > LEVEL, the orange third tab with a red count of rewards waiting; like PUBG Mobile's level rewards): a winding road from level 1 at the bottom to level 100
  at the top. Your avatar stands on your current
  level and the road is gold up to it. Every level from 2 to 100 has a reward card; reached levels show CLAIM (or
  CLAIM ALL at the top) and the TASKS button's red dot counts the rewards waiting (levelPrize in cosmetics.js):

  | Levels | Reward |
  |---|---|
  | most levels | coins (60 + 15 × level, rounded) |
  | every 5th | coins (100 + 20 × level) and gems (3 + level / 10) |
  | 10, 20, 30, 40, 50 | 500 + 50 × level coins and as many gems as the level (for example 1,000 coins + 10 gems at 10) |
  | 60 / 70 / 80 | 6,000 coins + 120 gems / 8,000 coins + 180 gems / 10,000 coins + 250 gems |
  | 90 | AURORA SPIRIT, an animated avatar: a glowing spirit under waving aurora ribbons with a flickering crown of light |
  | 100 | CROWN OF THE SKIES, an animated frame: a turning gold-and-rainbow ring with feathered wings, a jewelled crown and orbiting stars |

- LEVEL WORLD MAP (levelmap.js): the path is a real map. The road runs over floating islands (two to five levels
  each) joined by bridges, and climbing it travels through the six stages in order, each world starting after a
  long bridge under a sign with its name and levels:

  | Levels | World | What you see |
  |---|---|---|
  | 1-16 | SUNNY SKY | a sandy start island in the sea with a sailing boat, then grassy floating islands with trees, huts and flowers, clouds, hot-air balloons, a rainbow and flocks of birds; wooden bridges |
  | 17-33 | JUNGLE ISLAND | jungle islands with palms and hibiscus, leafy edges with swinging vines, a waterfall, parrots and butterflies |
  | 34-50 | CRYSTAL CAVE | purple rock islands with crystals, glowing mushrooms and fire bowls between jagged cave walls, floating spores and bats; crystal bridges |
  | 51-66 | ROBO FACTORY | steel platforms on rocket thrusters with lamps, crates and gears, riveted pillars with warning lights, turning gears, steaming pipes and patrol drones; girder bridges |
  | 67-83 | OUTER SPACE | asteroid islands with craters, flags, dishes and rockets, twinkling stars, Earth, a red planet and a moon, satellites, UFOs, an astronaut and shooting stars; light-beam bridges |
  | 84-100 | DEEP UNIVERSE | glowing crystal islands with golden stars and tiny planets, nebulas, spiral galaxies, a ringed planet, comets, and golden rays behind level 100 |

  Decorations stand on the free side of each level, away from its reward card. The world is drawn on one canvas
  that follows the scroll (only the visible part is drawn) and the same seed lays it out the same way every visit.

  Claiming the avatar or frame asks whether to wear it now. Both are never sold; in PROFILE they show "LEVEL 90" and
  "LEVEL 100" until claimed. Claimed rewards are saved to your account.
- Players from before levels start from what their save shows they flew (their best altitudes or this season's
  total, whichever is bigger). Signed-in players' levels are saved to their account and public profile.

## Medals
Open PROFILE > MEDALS to see the 18 medals: 12 for tasks and one for each of the six bosses. Each task medal is earned
by doing a task over and over, and has five
levels. Finishing a level moves the medal up to the next one with a harder goal (SKY EXPLORER I, then II, then III and so on):

| Medal | Task | I | II | III | IV | V |
|---|---|---|---|---|---|---|
| SKY EXPLORER | metres flown in total | 25,000 | 250,000 | 1,200,000 | 5,000,000 | 25,000,000 |
| HIGH FLYER | metres in one run | 8,000 | 20,000 | 40,000 | 70,000 | 120,000 |
| BOSS HUNTER | bosses beaten | 5 | 30 | 100 | 300 | 1,000 |
| STAR COLLECTOR | stage stars (out of 18) | 3 | 6 | 10 | 14 | 18 |
| COIN TYCOON | coins collected in runs | 2,000 | 20,000 | 100,000 | 400,000 | 1,500,000 |
| PERFECTIONIST | perfect coin rows | 50 | 250 | 1,000 | 3,000 | 8,000 |
| DAREDEVIL | close calls | 60 | 250 | 1,000 | 3,000 | 8,000 |
| SMASHER | smashes and bonks | 150 | 700 | 2,500 | 8,000 | 25,000 |
| TURBO ACE | engine boosts | 15 | 60 | 200 | 600 | 1,500 |
| VETERAN | runs played | 25 | 100 | 400 | 1,000 | 3,000 |
| TASK MASTER | daily tasks done | 15 | 60 | 150 | 400 | 900 |
| TREASURE HUNTER | boxes opened | 3 | 20 | 60 | 150 | 400 |

Boss medals: THUNDER KING, TIKI TITAN, BAT QUEEN, MECHA CRUSHER, UFO OVERLORD and STAR DEVOURER. Each medal level is
earned by beating that boss at that rank level (SERGEANT I for level I up to SERGEANT V for level V), in the campaign
or in Free Run.

- Higher levels look cooler: I is a round BRONZE medal, II a scalloped SILVER one, III a starburst GOLD one,
  IV is FIRE GOLD (animated flame colours, flames and sparks) and V is ROYAL FIRE (fire gold with a halo, wings
  and a crown). Each level pays once: 100 coins, 300 coins, 10 gems, 25 gems, then 60 gems.
- Medals you have not earned yet are faded grey with a "?" until their first level. Each card shows its level,
  a progress bar and the next goal; the top shows how many of the 90 medal levels you own.
- Tap a medal to open it big: it spins round in 3D (front, edge, the back with an embossed star, front again),
  with its five levels in a row underneath and what the next level needs.
- A medal earned mid-run pops up in flight ("MEDAL! SMASHER III"); the results screen shows it with its reward
  (tap to see it spin). Players from before medals get the levels their old saves have already earned, and medal levels
  already earned stay earned when goals change.
- Signed-in players' medals are saved to their account and public profile, and show on their player card
  (needs the updated firestore.rules).

## Profiles, avatars and frames
Open PROFILE to pick your avatar, its frame and your name colour. Six avatars (Sunny, Kitty,
Bear, Froggy, Bot, Balloon) and four frames (Classic, Wood, Cloud, Leafy) are free. Animated
ones cost a lot of gems, so they take a long time to save for: avatars Phoenix and Ghost (1,200), Alien (1,600),
Dragon (2,000) and Lion King (2,500); frames Golden Laurel (1,500), Inferno and Rainbow (1,800), Thunder (2,200),
Galaxy (2,700) and Diamond (3,500). A shimmering GOLD NAME costs 2,000 gems; the white name is free.
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
- BOX TASKS: on Tuesday, Thursday and Saturday (UTC) one extra, harder task shows at the top of the daily tasks
  (for example "Defeat 2 bosses" or "Fly 8,000 m in one run"). Claiming it opens a box right away: a Sky Box, or a
  Storm Box on Saturdays. On other days the row says when the next one comes.
- Progress counts while you fly ("TASK DONE!" pops up) and on the results screen, which also
  shows the SP the run earned and any rank up. Open TASKS and tap CLAIM to collect.

## Clans
- CREATE A CLAN costs 300 gems: pick a name, a 2 to 5 letter tag, a description, a badge,
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
   second attack right after the first. The boss's rank level (below) sets how fast it
   attacks and how often it combos. Boosts and shields protect you as usual.
4. At zero stamina the boss is TIRED (dizzy and sweating). Tap FATALITY (or press
   F, Space or Enter) to finish it with your skin's fatality.
5. Defeat bursts 500 coins across the screen (+100 for each rank level above I,
   +100 with the Golden King skin); they all fly into your balloon, then the course
   resumes.

BOSS RANKS. Every boss has five rank levels, SERGEANT I to V (BOSS_RANKS in bosses.js), shown by the same bronze
shield badge at its bottom right on every boss, with one chevron per level, and in the boss bar and the versus splash
("JUNGLE BOSS · SERGEANT II"). Every game starts at level I:
- CAMPAIGN: each boss you beat comes back one level higher (I, II, III, IV, V). Beating the level V boss CONQUERS
  the stage: the run ends in celebration with "CONQUERED!" and three stars.
- FREE RUN: the first lap through the six stages has every boss at level I, the second lap level II, and so on up
  to level V; after a lap of level V bosses it starts again at level I, so a Free Run never ends.
- Higher levels look angrier and better armoured: steam puffs from level II, a throbbing anger mark and a red flush
  from level III, steel armour with a sweeping shine at level IV, and gold armour with turning rays and a glow at
  level V. They also attack faster, combo more and lose stamina more slowly. The Thunder King (the first boss
  players meet) is a little gentler at every level: its attacks are slower, its second lightning strike is not
  aimed at you and its chain lightning spans at most about a third of the screen.
- BOSS MEDALS: each boss has its own medal (PROFILE > MEDALS), one medal level for every rank level you beat it at.

Bosses, weapons and SPECIAL SKILLS. Every boss has three weapons of its own and one special skill that no other
boss uses (ATTACKS in bosses.js). The special skill comes with a SPECIAL SKILL banner: first when the boss's stamina
drops below 70, again just after it gets enraged, then every 16 seconds.
- THUNDER KING (Sunny Sky):
  - LIGHTNING strikes down a flashing column.
  - A TORNADO funnel crosses most of the screen and drags you a little towards it; it stops short of the far side,
    so fly to that edge.
  - A GUST blows you sideways (wind streaks show it) while leaves and branches fly across.
  - Special CHAIN LIGHTNING: two storm orbs joined by a crackling arc sweep slowly down the screen (a second sweep
    once enraged). The arc never spans more than about a third of the width, so there is always room beside it.
- TIKI TITAN (Jungle Island):
  - A BOOMERANG axe loops out to where you were and comes back (two once enraged).
  - COCONUT BOMBS fall and burst high up into five slower splinters, leaving time to dodge.
  - LAVA GEYSERS erupt from the bottom after bubbling (the first one under you).
  - Special FIRE BREATH: a cone of fire sweeps across below the mask; "GET LOW!" and fly under its reach.
- BAT QUEEN (Crystal Cave):
  - SONIC SCREAM rings with a gap.
  - STALACTITES drop from the ceiling.
  - A homing BAT SWARM.
  - Special BLACKOUT: the lights go out except a small glow around you, and bats hunt you in the dark,
    showing only their glowing red eyes.
- MECHA CRUSHER (Robo Factory):
  - Aimed LASER eyes.
  - HOMING MISSILES.
  - Bouncing SAW BLADES.
  - Special PISTON PRESS: giant pistons slam in from both sides at your height, leaving one gap (green arrows),
    or get out of the striped row.
- UFO OVERLORD (Outer Space):
  - A sweeping TRACTOR BEAM.
  - MINI SAUCERS fly out and zap straight down, one of them following you.
  - A PLASMA BOMB splits into six shots.
  - Special ABDUCTION: a beam locks on, follows you and lifts you up; a red ring fills while you are in it, and
    if it fills you are abducted. Fly out sideways.
- STAR DEVOURER (Deep Universe):
  - A BLACK HOLE pulls you in, then bursts into stars.
  - A spinning two-armed STAR SPIRAL.
  - COMETS streak across the screen at your height after a side warning.
  - Special CONSTELLATION: stars appear around you, dotted lines join them, then they turn into laser lines.
Everything is tuned to be escapable: each weapon warns first (flashing columns, outlines, arrows or dotted lines),
falling objects leave free lanes, and homing only lasts a moment.

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
- Coin rows: collecting every coin of a row pays a 500 point PERFECT ROW bonus (and counts for
  the row tasks). Coins you collect are added to your wallet for the store.
- RAINBOW STAR: after every 5 minutes of flying (once any boss fight is over) a big spinning rainbow
  star marked x2 appears in the middle of the course, in a gap between ledges. Grab it for 30 seconds
  of DOUBLE SCORE: every metre climbed and every bonus counts twice. A rainbow x2 timer shows under the
  coins and the score glows pink while it lasts. (It replaces the old coin-row multiplier.)
- Energy cells (in every second gap between coin rows, roughly one engine boost every
  13,000 m): collect 5, then tap ⚡ BOOST. This is the only
  power with a cinematic intro — the action freezes, rays spin and the balloon
  zooms in with sunglasses — then a rocket engine smashes through everything for
  3.5 seconds.
- HOLDING ITS BREATH: through the engine boost and turbo (and their intros), and while it gulps
  a beaten boss's coins, every skin takes a big breath and holds it. It swells up rounder and
  about a sixth bigger from its knot, trembling a little, with puffed-out cheeks and pressed lips
  (sunglasses stay on). Grabbing coins then makes it swell a little more instead of squeezing it
  thin. When the boost ends or the last coin is in, it lets the air out with a small puff.
- Rare power-ups (in every eighth gap between coin rows): coin magnet, bubble shield, turbo and
  DOUBLE COINS (every coin counts twice for 15 seconds; the coin
  counter glows and an x2 timer shows in the HUD).
  Turbo plays a quick mini intro in slow motion, then rockets you up.
- Smashing ledges or drones, or bonking creatures while boosted, earns a coin.

## Boxes and skin cards
- A box holds coins, sometimes GEMS (rare) and SKIN CARD rewards (each one is several cards of one skin). EPIC, LEGENDARY and MYTHIC skins are not sold
  any more: collect enough cards of one to unlock it. The rarer the skin, the more cards it needs and the rarer its
  cards are: EPIC 10 cards, LEGENDARY 20, MYTHIC 30 (CARD_NEED in boxes.js). Each card reward goes to a different locked skin
  when it can (usually the one you are closest to). If you already have every skin of the rarity that was rolled,
  the reward comes from the nearest rarity that still has locked skins, so a box always gives the card rewards it
  lists. Cards beyond what a skin needs, or once every card skin is unlocked, come as coins (a SPARE CARDS reward). Skins you already owned stay yours.
- Boxes (BOXES in boxes.js; the store lists these odds too):

  | Box | Price | Coins | Gems | Card rewards | Each reward: epic / legendary / mythic | Level ticket x2 / x4 |
  |---|---|---|---|---|---|---|
  | SKY BOX | 1,500 coins | 60-140 | 3% chance, 1-2 | 2 | 76% / 20% / 4% | 1.5% / 0.3% |
  | STORM BOX | 5,000 coins | 180-360 | 8% chance, 2-4 | 3 | 55% / 35% / 10% | 4% / 1% |
  | LEGEND BOX | 150 gems | 400-800 | 12% chance, 3-6 | 4 (the first always legendary or mythic) | 30% / 45% / 25% | 10% / 3% |

- Free boxes: BOX TASKS (Tuesday, Thursday and Saturday, see Tasks), the first clear of each campaign stage's goal,
  and MYSTERY BOXES that float through the sky in about a third of runs (at most two a day): grab one to keep it.
  Won and found boxes wait under YOUR BOXES in the store (the STORE button shows how many), and the results
  screen has an OPEN BOX button for boxes found in that run.
- OPENING A BOX plays a full-screen show: the box drops in and bounces, TAP TO OPEN, it shakes while light leaks
  from the lid, then blasts open (the lid flies off) with a light beam in the colour of the best reward inside.
  The rewards fly out one by one, face down; the rarer the reward, the longer the card shakes before it flips
  (mythic cards shimmer in rainbow colours). Coins and gems count up, a skin card fills its bar (for example
  6 / 10), and completing a set shows NEW SKIN UNLOCKED! while the skin plays its pose and speaks. A badge on the
  box counts the rewards left; SKIP jumps to the end. The last screen lists everything with OPEN NEXT (when more
  boxes are waiting) and OK.
- The store's BOXES tab has your boxes, the three boxes to buy, what is inside each and your CARD COLLECTION
  (each card skin's progress; tap one to see the skin).

## Store
- PRICES are set high on purpose because coins (about 600-1,500 from a good run with a boss) and gems (tasks,
  seasons, medals and level rewards) come in steadily: skins and boxes take several runs of saving, and animated
  avatars, frames and the gold name are long-term goals. Prices live in skins.js (skins), boxes.js (BOXES),
  cosmetics.js (AVATARS, FRAMES, GOLD_NAME_PRICE, CLAN_PRICE) and game.js (LIFE_PRICE, LIFE_PACK_PRICE).
- The store has your coins and gems at the top and three big tabs: SKINS, BOXES (with a badge counting unopened
  boxes) and LIVES (two offer cards: +1 life for 400 coins, or +3 lives for 1,000 coins as the best deal).
- Skins are shown as Angry Birds style cards with light rays, coloured by rarity
  (common teal, rare blue, epic purple, legendary orange). The picked skin sits on a
  big card next to its details and buy/equip button; all skins are in the fanned row
  of small cards below.
- Picking a card plays that skin's own selection pose (tap the big card to replay it):
  Classic – Heart Hug, Gumball – Bubble Pop, Funny Clown – Juggle & Honk, Toy Robot –
  Robot Dance with laser eyes, Watermelon – Melon Twister, Monster – Monster Roar,
  Ninja – Shadow Clones, Galaxy – Cosmic Warp, Golden King – King's Treasure, Sleepy Dog –
  Nap Time, Chick Trio – Chick Parade, Sly Fox – Sneaky Scheme, Grumpy Wolf – Huff and Puff.
- Skins: Classic (free), and Gumball (3,000 coins), Funny Clown (4,500), Toy Robot (6,000) and Watermelon (7,500). The EPIC skins
  (Monster, Ninja, Chick Trio, Sly Fox), LEGENDARY skins (Galaxy, Golden King, Grumpy Wolf) and MYTHIC skins
  (Fire Dragon: Dragon Fire pose, Dragon Breath fatality; Rainbow Unicorn: Rainbow Dash, Rainbow Blast; Diamond:
  Crystal Shine, Diamond Storm) are unlocked with skin cards from boxes; their store button shows the cards
  collected (for example 4 / 10 CARDS) and opens the BOXES tab.
- Four TALKING CHARACTERS, original characters each with 35 voice lines: Sleepy Dog
  (rare, 9,000 coins: floppy ears, eye patch and nightcap; trails Zzz, bones and puffs; Sleepy Slam fatality),
  Chick Trio (epic, cards: a chick balloon with two baby chicks flying beside it; feathers, music notes
  and seeds; Peck Peck Peck), Sly Fox (epic, cards: pointy ears, white muzzle, whiskers and a bushy tail;
  feathers; Feather Frenzy) and Grumpy Wolf (legendary, cards: ragged ears, heavy brows and fangs; wind puffs
  and blown leaves; Big Bad Blow). Besides their lines for every moment, they chat on their own
  every 13 to 22 seconds while flying (not during boss fights), with a speech bubble.
- Two SEASON skins are never sold, only won as end-of-season rewards: PRISM (Diamond: rainbow
  crystal, Rainbow Flash pose, rainbow crystal trail) and STARLIGHT (Star Legend: night-sky
  balloon with a halo of stars, Supernova pose, starlight trail). Both have their own voice.
- Gems are won in the weekly tournament's top 10, from tasks, from seasons and (rarely) from boxes, and shown next to your coins. Each has its own colours, decorations that turn
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
Coins, skins, cards, boxes, lives, bests, high scores and stars are saved in the browser (localStorage).

## Gameplay details
- Starting climb speed: 130 m/s (game-world units), scaled slightly per stage.
- Speed increases without a cap: (130 + 1.4 × √altitude) × stage speed.
- Hitting a ledge, cave wall or creature pops the balloon unless shielded or boosted.
- Some ledges slide in and out from the sides, and the higher you fly the harder they get: every 4th ledge
  moves at first, every 3rd from 6,000 m and every 2nd from 15,000 m, sliding faster (about four times as fast
  by 20,000 m) and reaching a little further. Birds, bats and drones crossing from the sides also speed up
  with altitude (up to 70% faster).
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

## License
Copyright (c) 2026 nikezaxo. All rights reserved. Skybound's code, art, sounds and other content are not open
source: being public on GitHub gives nobody permission to copy, modify, reuse, host or share any of it without the
owner's written permission. See [LICENSE](LICENSE). You are welcome to play the game at https://nikezaxo.github.io/Balloon/.
