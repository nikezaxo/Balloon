# Skybound — Endless Balloon Game

Complete, self-contained source for the endless version.

## Files
- index.html: page, controls and game canvas
- style.css: responsive desktop and mobile styling
- sound.js: calm cartoon melody, gentle leaf rustling and effects
- cosmos.js: atmosphere, stars, planets, Sun and universe backgrounds
- game.js: rendering, input, physics, coins, obstacles, weather and audio

## Run locally
Extract the ZIP and open index.html in a modern browser.
Optional local server: run `python -m http.server 8000` in the extracted
folder, then open http://localhost:8000.

## Deploy
Upload index.html, style.css, sound.js, cosmos.js and game.js together to any static web host.
Keep all five in the same directory, with index.html at the website root.
There is no build command, package installation, backend, API key or database.
If a host asks for an output directory, select the folder containing index.html.
This package contains no credentials or account-specific hosting configuration.

## Main menu & full screen
The game fills the whole screen. The main menu has PLAY, STAGES (every zone with
its events and hazards) and BOOSTS (every power-up and where it appears).
Pressing PLAY switches the browser to full screen where supported (iPhone Safari
does not allow web pages to go full screen; the game still fills the window).
On wide screens the action stays in a centred column framed by side walls.

## Controls
Touch/mouse: swipe across the rope to launch, then hold and drag to steer.
Keyboard: Space plays/launches; Left/Right arrows or A/D steer; B, W, Up or
Shift fires the boost engine; P or Escape pauses.
After a crash, choose Play again or Menu. Sound and full screen can be toggled
from the menu or the pause card.

## Gameplay
- Spinning, shaded 3D-style balloon rendered on a 2D HTML canvas.
- Starting climb speed: 130 m/s (game-world units).
- Speed increases without a programmed cap: 130 + 1.4 * sqrt(altitude).
- Endless course: there is no winning altitude or finish line.
- Gold coins increase your coin count; they do not provide temporary boosts.
- Gusts alternate direction with advance warnings and flying leaves.
- Hitting an obstacle ends the run and shows altitude and coins collected.
- Off-screen objects are discarded, keeping course memory bounded.
- Small physics steps help prevent missed collisions as speed increases.

## Hazards by stage
- 1,500 m+: falling satellite junk (broken solar panels and gears).
- 3,000 m+: broken satellites rain down more often, sparking as they fall.
- 6,000 m+: asteroids drift through the gaps and bounce off the walls.
- 16,000 m+: blazing meteors streak across diagonally.
- 23,000 m+: meteor showers mixed with junk and asteroid fields.
Falling hazards are announced by a flashing warning triangle a second ahead.

## Power-ups
- Gas boost (300 m+): short speed burst plus 2 energy cells.
- Energy cells (800 m+): collect 5 to charge the BOOST engine, then tap BOOST.
  The engine rockets you up for 3.5 s and smashes anything in the way.
- Coin magnet (1,500 m+): pulls coins and energy cells in for 8 s.
- Nitro engine (2,500 m+): a rocket for 5 s that smashes through everything.
- Bubble shield (4,500 m+): absorbs one hit, lasting up to 20 s.
Collecting a power-up triggers a short intro: the action freezes, rays spin
and the balloon zooms in to celebrate with star eyes or sunglasses.
Smashed hazards are worth a coin. Parachutists are never harmed: boosts and
shields simply push them aside.

## Customize
In game.js, edit flightSpeed(height) for starting speed and acceleration.
Edit generateCourse() for obstacle spacing, coin, power-up and asteroid placement.
Edit POWERS in game.js for power-up unlock heights and fallPlan() for falling hazards.
Edit weatherAt(seconds) for gust timing and strength.
Edit drawBalloon() for balloon colours and the rotating surface emblem.
Edit style.css for the page colours and layout.

No external libraries or images are required. The Lilita One and Nunito fonts
load from Google Fonts, with system fallbacks if they are unavailable.

## Look & feel
- Bold cartoon style with thick outlines, chunky buttons and a Lilita One font.
- Cel-shaded striped balloon with a face that blinks, follows your steering,
  grins after coins and panics near spikes.
- Squash-and-stretch launch, rope-snap animation and a big "GO!" banner.
- Coins burst into sparks and fly into the HUD counter; chain them for combos.
- Skimming past a spike tip triggers a "CLOSE CALL!" bonus popup.
- Speed lines, trails, wind streaks, gust warning chevrons and a red danger vignette.
- Crashing pops the balloon into rubber shards and confetti, with slow motion,
  screen shake and a white flash, then shows a results card.
- Slam-in banners for every 1,000 m, each new zone and beating your best.
- Your best altitude is saved in the browser (localStorage).
- Reduced-motion settings soften the shake and decorative animations.

## Sound
A bouncy pentatonic loop starts on your first launch; drums join once you fly. Sound off mutes
all audio. Soft leaf rustling plays during gusts, with whooshes, rising combo coin chimes,
close-call swishes, zone fanfares and a punchy pop. No nature recordings or external audio files are required.

## Aircraft sequence
At 1,200 game metres, a shaded 3D plane enters from the left and arcs toward
the upper left. It trails smoke near the end of its pass. After a delay,
three parachutists drop 2.5 seconds apart in widely separated random lanes.
Side obstacles are cleared during the event to leave room for avoidance.
The plane event occurs once per run, within the atmosphere.

## Journey regions (fictional arcade distances)
0–2,999 m: atmosphere and clouds.
3,000–5,999 m: outer atmospheric shell and Earth's glowing edge.
6,000–9,999 m: starfield. Wind and leaves stop in space.
10,000–15,999 m: planets.
16,000–22,999 m: pass the Sun.
23,000 m onward: an endless universe with nebulae and a galaxy.
There is still no winning altitude or speed cap.
