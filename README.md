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

## Controls
Touch/mouse: swipe across the rope to launch, then hold and drag to steer.
Keyboard: Space launches; Left/Right arrows or A/D steer; P or Escape pauses.
After a collision, click Try again or press Space to reset, then launch again.
Sound is optional and can be enabled using the Sound button.

## Gameplay
- Spinning, shaded 3D-style balloon rendered on a 2D HTML canvas.
- Starting climb speed: 90 m/s (game-world units).
- Speed increases without a programmed cap: 90 + 1.2 * sqrt(altitude).
- Endless course: there is no winning altitude or finish line.
- Gold coins increase your coin count; they do not provide temporary boosts.
- Gusts alternate direction with advance warnings and flying leaves.
- Hitting an obstacle ends the run and shows altitude and coins collected.
- Off-screen objects are discarded, keeping course memory bounded.
- Small physics steps help prevent missed collisions as speed increases.

## Customize
In game.js, edit flightSpeed(height) for starting speed and acceleration.
Edit generateCourse() for obstacle spacing and coin placement.
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
three parachutists fall 3.5 seconds apart in widely separated random lanes.
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
