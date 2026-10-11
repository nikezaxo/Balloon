'use strict';
// Original procedural audio: no external recordings, downloads or dependencies.
const gameSound = (() => {
  let context, master, music, windGain, windFilter, windPan, whiteBuffer, drive;
  let enabled = false, lastUpdate = 0, nextNote = 0, step = 0, duckUntil = 0;
  function init() {
    if (context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio is not supported');
    // iPhone: play through the silent switch like other games do.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
    context = new AudioContext();
    drive = new Float32Array(256);
    for (let i = 0; i < 256; i++) drive[i] = Math.tanh((i / 127.5 - 1) * 2.6);
    master = context.createGain(); master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -14; limiter.ratio.value = 6;
    master.connect(limiter); limiter.connect(context.destination);
    music = context.createGain(); music.gain.value = .9; music.connect(master);
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .025 * white) / 1.025;
      data[i] = brown * 3.5 + white * .08;
    }
    whiteBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const white = whiteBuffer.getChannelData(0);
    for (let i = 0; i < white.length; i++) white[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource(); source.buffer = noiseBuffer; source.loop = true;
    windFilter = context.createBiquadFilter(); windFilter.type = 'lowpass'; windFilter.frequency.value = 850; windFilter.Q.value = .4;
    windGain = context.createGain(); windGain.gain.value = 0;
    source.connect(windFilter); windFilter.connect(windGain);
    if (context.createStereoPanner) { windPan = context.createStereoPanner(); windGain.connect(windPan); windPan.connect(master); }
    else windGain.connect(master);
    source.start();
  }
  async function enable(value) {
    enabled = value;
    if (!value) { if (master) master.gain.setTargetAtTime(0, context.currentTime, .025); return false; }
    try { init(); await context.resume(); nextNote = context.currentTime; return enabled; }
    catch { enabled = false; return false; }
  }
  const running = () => enabled && context && context.state === 'running';
  function note(start, end, duration, delay = 0, volume = .08, type = 'sine', out = master) {
    if (!running()) return;
    const now = context.currentTime + delay;
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(out); osc.start(now); osc.stop(now + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  // Filtered white-noise bursts for whooshes, pops and percussion.
  function noise(duration, { delay = 0, volume = .1, filter = 'bandpass', from = 1000, to = from, q = 1 } = {}, out = master) {
    if (!running()) return;
    const now = context.currentTime + delay;
    const src = context.createBufferSource(), shape = context.createBiquadFilter(), gain = context.createGain();
    src.buffer = whiteBuffer; shape.type = filter; shape.Q.value = q;
    shape.frequency.setValueAtTime(from, now); shape.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    src.connect(shape); shape.connect(gain); gain.connect(out);
    src.start(now, Math.random() * .5); src.stop(now + duration + .02);
    src.onended = () => { src.disconnect(); shape.disconnect(); gain.disconnect(); };
  }
  // Cartoon voices: a buzzy pitched source shaped by three vowel formant filters, one syllable at a time.
  // A syllable is {c: onset consonant, v: vowel or two-vowel glide, d: seconds, p: pitch multipliers across
  // it, end: coda consonant, g: gap after it, vol} or {fx, d} for a sound effect. The voice sets the pitch,
  // size (formant scale; small characters sound higher), rate, swing (pitch excursion), vibrato, texture
  // (plain, robot, growl, rasp or whisper), echo and volume.
  const VOWELS = { a: [820, 1220, 2600], e: [520, 1850, 2550], i: [310, 2350, 3050], o: [500, 880, 2500], u: [350, 780, 2350] };
  const ONSET = { w: 'u', y: 'i', l: [360, 1100, 2550], r: [420, 1150, 1650], m: [260, 950, 2250], n: [260, 1500, 2450], b: [260, 850, 2200], d: [260, 1650, 2550], g: [260, 1900, 2400] };
  function voiceFx(kind, delay) {
    if (kind === 'honk') { note(330, 300, .2, delay, .1, 'square'); note(415, 380, .2, delay, .07, 'square'); note(330, 300, .22, delay + .24, .1, 'square'); }
    if (kind === 'zap') { noise(.25, { delay, filter: 'highpass', from: 2500, volume: .2 }); note(1600, 200, .25, delay, .05, 'sawtooth'); }
    if (kind === 'swish') noise(.22, { delay, from: 800, to: 5000, q: 1.2, volume: .22 });
  }
  function speak(sylls, voice = {}, delay = 0) {
    if (!running() || !sylls || !sylls.length) return 0;
    const { pitch = 300, size = 1, rate = 1, swing = 1, vib = .02, vibRate = 5.5, texture = 'plain', echo = 0, volume = .6 } = voice;
    const t0 = context.currentTime + delay + .01, nodes = [], make = n => (nodes.push(n), n);
    const src = make(context.createOscillator()); src.type = texture === 'robot' ? 'square' : 'sawtooth';
    const tilt = make(context.createBiquadFilter()); tilt.type = 'lowpass'; tilt.frequency.value = 5200 * size; tilt.Q.value = .4;
    const voiced = make(context.createGain()), air = make(context.createBufferSource()), airGain = make(context.createGain()), mix = make(context.createGain()), amp = make(context.createGain());
    const whisper = texture === 'whisper', baseAir = whisper ? .55 : .035;
    voiced.gain.value = whisper ? .25 : 1; air.buffer = whiteBuffer; air.loop = true; airGain.gain.value = baseAir; amp.gain.value = 0;
    src.connect(tilt); tilt.connect(voiced); voiced.connect(mix); air.connect(airGain); airGain.connect(mix);
    const formants = [0, 1, 2].map(k => { const f = make(context.createBiquadFilter()), g = make(context.createGain()); f.type = 'bandpass'; f.Q.value = [6, 9, 10][k]; g.gain.value = [2, 3.2, 2][k]; mix.connect(f); f.connect(g); g.connect(amp); return f; });
    let out = amp; const oscs = [src];
    if (texture === 'robot') { const ring = make(context.createGain()), mod = make(context.createOscillator()); ring.gain.value = 0; mod.type = 'square'; mod.frequency.value = 72; mod.connect(ring.gain); amp.connect(ring); out = ring; oscs.push(mod); }
    if (texture === 'growl' || texture === 'rasp') { const rasp = make(context.createGain()), lfo = make(context.createOscillator()), depth = make(context.createGain()), shaper = make(context.createWaveShaper()); rasp.gain.value = .6; lfo.frequency.value = texture === 'growl' ? 31 : 78; depth.gain.value = .5; lfo.connect(depth); depth.connect(rasp.gain); amp.connect(rasp); shaper.curve = drive; rasp.connect(shaper); out = shaper; oscs.push(lfo); }
    const level = make(context.createGain()); level.gain.value = volume * .6 * (texture === 'robot' ? .62 : 1) * (1 - echo * .75); out.connect(level); level.connect(master);
    if (echo) { const dl = make(context.createDelay(1)), fb = make(context.createGain()); dl.delayTime.value = .16; fb.gain.value = echo; level.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(master); }
    const lfo = make(context.createOscillator()), vg = make(context.createGain()); lfo.frequency.value = vibRate; vg.gain.value = pitch * vib; lfo.connect(vg); vg.connect(src.frequency); oscs.push(lfo);
    const F = v => (Array.isArray(v) ? v : VOWELS[v] || VOWELS.a).map(f => f * (Array.isArray(v) ? 1 : size)), P = m => pitch * (1 + (m - 1) * swing);
    const robot = texture === 'robot';
    let t = t0; src.frequency.setValueAtTime(P((sylls.find(s => s.p) || { p: [1] }).p[0]), t0);
    for (const s of sylls) {
      const d = (s.d || .15) / rate;
      if (s.fx) { voiceFx(s.fx, t - context.currentTime); t += d; continue; }
      const c = s.c || '', p = s.p || [1], vol = s.vol || 1, v1 = s.v[0], v2 = s.v[1] || s.v[0];
      let start = t;
      if (/^[ptk]/.test(c)) { noise(.025, { delay: t - context.currentTime, from: c[0] === 'k' ? 1800 : c[0] === 't' ? 3500 : 900, q: 1, volume: .12 }); start = t + .03 / rate; }
      if (/^(s|sh|f|ch)/.test(c)) { noise(.08 / rate, { delay: t - context.currentTime, filter: 'highpass', from: c[0] === 'f' ? 2500 : 4500, volume: .12 }); start = t + .07 / rate; }
      const end = start + d, glide = Math.min(.07 / rate, d * .4), on = ONSET[c[0]], from = on ? F(on) : F(v1);
      formants.forEach((f, k) => { f.frequency.setValueAtTime(from[k], start); f.frequency.linearRampToValueAtTime(F(v1)[k], start + glide); if (v2 !== v1) f.frequency.linearRampToValueAtTime(F(v2)[k], end); });
      if (c[0] === 'h') { airGain.gain.setValueAtTime(.75, start); airGain.gain.linearRampToValueAtTime(baseAir, start + .06 / rate); voiced.gain.setValueAtTime(whisper ? .1 : .15, start); voiced.gain.linearRampToValueAtTime(whisper ? .25 : 1, start + .05 / rate); }
      p.forEach((m, k) => { const at = start + (p.length > 1 ? d * k / (p.length - 1) : 0); if (robot || k === 0) src.frequency.setValueAtTime(P(m), at); else src.frequency.linearRampToValueAtTime(P(m), at); });
      amp.gain.setValueAtTime(0, start); amp.gain.linearRampToValueAtTime(vol, start + .015); amp.gain.setValueAtTime(vol, Math.max(start + .016, end - .04)); amp.gain.linearRampToValueAtTime(0, end);
      if (s.end === 'f' || s.end === 's') noise(.12 / rate, { delay: end - context.currentTime - .02, filter: 'highpass', from: s.end === 'f' ? 2200 : 4500, volume: .1 });
      if (s.end === 'r') { formants[2].frequency.linearRampToValueAtTime(1600 * size, end); }
      if (s.end === 'p' || s.end === 't' || s.end === 'k') noise(.025, { delay: end - context.currentTime, from: 2500, volume: .1 });
      t = end + (s.g === undefined ? .03 : s.g) / rate;
    }
    const stop = t + .05;
    for (const o of oscs) { o.start(t0); o.stop(stop); }
    air.start(t0, Math.random() * .5); air.stop(stop);
    src.onended = () => setTimeout(() => nodes.forEach(n => n.disconnect()), echo ? 1500 : 50);
    duckUntil = Math.max(duckUntil, stop);
    return stop - context.currentTime;
  }
  const arpeggio = (notes, gap, volume, type = 'triangle') => notes.forEach((f, i) => note(f, f, .24, i * gap, volume, type));
  function effect(kind, level = 1) {
    if (kind === 'launch') { noise(.45, { from: 300, to: 2600, q: .8, volume: .22 }); note(260, 780, .28, 0, .06, 'triangle'); }
    if (kind === 'coin') { const k = Math.pow(2, (Math.min(level, 12) - 1) / 12); note(988 * k, 988 * k, .08, 0, .035, 'square'); note(1319 * k, 1319 * k, .22, .07, .03, 'square'); }
    if (kind === 'close') { noise(.32, { from: 3200, to: 500, q: 1.2, volume: .18 }); note(900, 1500, .12, 0, .03, 'triangle'); }
    if (kind === 'pop') { noise(.25, { filter: 'highpass', from: 900, q: .5, volume: .4 }); note(240, 40, .35, 0, .22, 'sine'); note(120, 30, .45, .02, .1, 'triangle'); }
    if (kind === 'zone') arpeggio([523.25, 659.25, 783.99, 1046.5, 1318.5], .08, .055);
    if (kind === 'milestone') { note(783.99, 783.99, .14, 0, .06, 'triangle'); note(1174.7, 1174.7, .35, .11, .06, 'triangle'); }
    if (kind === 'record') arpeggio([659.25, 783.99, 987.77, 1318.5, 1568, 1975.5], .06, .03, 'square');
    if (kind === 'on') note(660, 660, .09, 0, .045, 'triangle');
    if (kind === 'power') { arpeggio([784, 988, 1175, 1568, 1976], .05, .03, 'square'); noise(.6, { from: 500, to: 4000, q: .7, volume: .16 }); }
    if (kind === 'boost') { noise(.5, { from: 400, to: 3000, q: .8, volume: .2 }); note(300, 900, .4, 0, .05, 'sawtooth'); }
    if (kind === 'nitro') { noise(1.2, { filter: 'lowpass', from: 300, to: 1800, q: 2, volume: .3 }); note(70, 180, 1, 0, .08, 'sawtooth'); note(140, 360, 1, 0, .035, 'square'); }
    if (kind === 'shield') { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, f * 1.01, .9, i * .03, .03, 'sine')); noise(.5, { filter: 'highpass', from: 5000, volume: .05 }); }
    if (kind === 'shieldbreak') { noise(.4, { filter: 'highpass', from: 3000, volume: .3 }); note(1600, 400, .3, 0, .05, 'triangle'); }
    if (kind === 'smash') { noise(.3, { filter: 'lowpass', from: 1400, to: 200, q: .7, volume: .45 }); note(120, 40, .25, 0, .16, 'square'); }
    if (kind === 'energy') note(660, 1320, .12, 0, .045, 'square');
    if (kind === 'charged') arpeggio([523.25, 783.99, 1046.5, 1568], .06, .035, 'square');
    if (kind === 'boop') { note(260, 900, .1, 0, .07, 'triangle'); note(900, 300, .14, .09, .05, 'triangle'); }
    if (kind === 'buy') { arpeggio([1046.5, 1318.5, 1568, 2093], .05, .035, 'square'); noise(.2, { filter: 'highpass', from: 6000, volume: .06 }); }
    if (kind === 'siren') for (let i = 0; i < 4; i++) note(i % 2 ? 660 : 880, i % 2 ? 660 : 880, .22, i * .24, .045, 'square');
    if (kind === 'vs') { note(110, 40, .6, 0, .25, 'sawtooth'); noise(.5, { filter: 'lowpass', from: 2000, to: 200, volume: .4 }); arpeggio([392, 523.25, 659.25, 783.99], .07, .05, 'square'); }
    if (kind === 'roar') { note(90, 55, .7, 0, .18, 'sawtooth'); note(140, 70, .6, .02, .08, 'square'); noise(.6, { filter: 'lowpass', from: 900, to: 300, q: 2, volume: .25 }); }
    if (kind === 'zap') { noise(.25, { filter: 'highpass', from: 2500, volume: .22 }); note(1800, 200, .25, 0, .05, 'sawtooth'); }
    if (kind === 'pew') note(1200, 300, .12, 0, .035, 'square');
    if (kind === 'fatality') { note(65, 65, 1.2, 0, .2, 'sawtooth'); arpeggio([196, 233.1, 277.2, 329.6], .12, .05, 'sawtooth'); noise(1, { filter: 'lowpass', from: 400, to: 3000, volume: .2 }); }
    if (kind === 'boom') { noise(.8, { filter: 'lowpass', from: 1500, to: 80, q: .8, volume: .55 }); note(80, 30, .8, 0, .3, 'sine'); }
    if (kind === 'star') { const k = Math.pow(2, Math.min(level, 2) * 4 / 12); arpeggio([784 * k, 988 * k, 1175 * k, 1568 * k], .05, .045, 'square'); note(2093 * k, 2093 * k, .5, .2, .03, 'triangle'); noise(.35, { filter: 'highpass', from: 6000, volume: .08 }); }
    if (kind === 'tick') note(1500, 1500, .03, 0, .02, 'square');
    if (kind === 'stamp') { noise(.3, { filter: 'lowpass', from: 1200, to: 200, volume: .4 }); note(160, 60, .25, 0, .2, 'square'); arpeggio([1046.5, 1318.5, 1568, 2093, 2637], .05, .035, 'square'); }
    // Ominous sting under the announcer: a deep boom, a dark rumble and a dissonant metallic ring.
    if (kind === 'sting') { note(72, 30, 1.3, 0, .28, 'sine'); noise(1.1, { filter: 'lowpass', from: 700, to: 90, q: .7, volume: .3 }); note(220, 214, 1, .02, .028, 'sawtooth'); note(233, 226, 1, .02, .028, 'sawtooth'); note(110, 108, 1.2, 0, .05, 'triangle'); }
    // Box opening: the box lands, rattles and blasts open, then each reward flips (rarer ones ring brighter).
    if (kind === 'whoosh') noise(.28, { from: 500, to: 2600, q: .9, volume: .14 });
    if (kind === 'thud') { noise(.3, { filter: 'lowpass', from: 900, to: 120, volume: .45 }); note(120, 45, .3, 0, .22, 'sine'); }
    if (kind === 'charge') { note(180, 760, .95, 0, .05, 'sawtooth'); noise(.95, { from: 300, to: 3200, q: 3, volume: .12 }); for (let i = 0; i < 9; i++) noise(.05, { filter: 'highpass', from: 1800, volume: .06 + i * .012, delay: i * .1 }); }
    if (kind === 'burst') { noise(.7, { filter: 'lowpass', from: 3200, to: 140, q: .7, volume: .55 }); note(95, 32, .6, 0, .28, 'sine'); arpeggio([1046.5, 1318.5, 1568, 2093, 2637], .04, .03, 'square'); noise(.6, { filter: 'highpass', from: 6000, volume: .1 }); }
    if (kind === 'flip') { note(420, 1300, .1, 0, .04, 'triangle'); noise(.1, { filter: 'highpass', from: 3500, volume: .07 }); }
    if (kind === 'reveal') {
      const sets = [[784, 1046.5], [659.25, 783.99, 1046.5, 1318.5], [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568], [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093]];
      arpeggio(sets[Math.max(0, Math.min(3, level))], .05, .035, 'square');
      if (level >= 2) { noise(.8, { filter: 'highpass', from: 5000, volume: .1 }); note(1046.5, 1046.5, .9, .3, .03, 'triangle'); }
      if (level >= 3) { note(85, 35, .9, 0, .25, 'sine'); [523.25, 659.25, 783.99].forEach(f => note(f, f, 1.2, .35, .025, 'sawtooth')); }
    }
    if (kind === 'unlock') { arpeggio([523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093], .07, .04, 'square'); [1046.5, 1318.5, 1568].forEach(f => note(f, f, 1.1, .5, .03, 'triangle')); noise(1, { filter: 'highpass', from: 5500, volume: .1, delay: .4 }); }
    if (kind === 'warn') { note(880, 880, .08, 0, .035, 'square'); note(880, 880, .08, .14, .035, 'square'); }
  }
  // A bouncy pentatonic loop; drums join once the balloon is flying.
  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 0, 523.25, 0, 440, 523.25, 659.25, 587.33, 523.25, 0, 392, 0];
  const bass = [130.81, 146.83, 110, 130.81];
  function beat(i, delay, flying) {
    const pitch = melody[i % melody.length];
    if (pitch) { note(pitch, pitch, flying ? .3 : .55, delay, .045, 'triangle', music); note(pitch * 2, pitch * 2, .12, delay, .01, 'sine', music); }
    if (i % 4 === 0) {
      const root = bass[Math.floor(i / 4) % 4];
      note(root, root, flying ? .7 : 1.6, delay, .05, 'triangle', music);
      if (flying) note(150, 42, .2, delay, .15, 'sine', music);
    }
    if (flying) {
      if (i % 2 === 1) noise(.035, { filter: 'highpass', from: 7000, volume: .03, delay }, music);
      if (i % 8 === 4) noise(.14, { from: 1800, q: .6, volume: .07, delay }, music);
    }
  }
  function update(state, wind, speed, altitude, hidden) {
    if (!context || !enabled) return;
    const now = context.currentTime, silent = hidden || state === 'paused';
    master.gain.setTargetAtTime(silent ? 0 : .7, now, .06);
    if (silent || now - lastUpdate < .05) return;
    lastUpdate = now;
    const playing = state === 'ready' || state === 'flying', flying = state === 'flying';
    music.gain.setTargetAtTime(playing ? (now < duckUntil ? .35 : .9) : 0, now, now < duckUntil ? .05 : .25);
    // Schedule slightly ahead so the beat stays steady between frames.
    if (playing) {
      if (nextNote < now) nextNote = now + .03;
      while (nextNote < now + .2) { beat(step++, nextNote - now, flying); nextNote += flying ? .2 : .32; }
    }
    const gust = Math.min(1, Math.abs(wind) * 3);
    // Soft, irregular leaf rustling only during gusts; no nature ambience.
    const flutter = .55 + .25 * Math.sin(now * 17) + .2 * Math.sin(now * 29);
    windGain.gain.setTargetAtTime(flying ? gust * .10 * flutter : 0, now, .04);
    windFilter.frequency.setTargetAtTime(650 + gust * 400, now, .08);
    if (windPan) windPan.pan.setTargetAtTime(Math.max(-.8, Math.min(.8, wind * 2)), now, .2);
  }
  // Lower the music for a while (used while a character talks).
  const duck = seconds => { if (context) duckUntil = Math.max(duckUntil, context.currentTime + seconds); };
  // Recorded voice clips: fetched once, decoded, then played through the mix.
  const clips = new Map();
  function loadClip(url) {
    if (!context) return null;
    if (!clips.has(url)) clips.set(url, fetch(url).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status)).then(b => new Promise((ok, no) => context.decodeAudioData(b, ok, no))).catch(() => { clips.delete(url); return null; }));
    return clips.get(url);
  }
  function playClip(buffer, { volume = 1, delay = 0, rate = 1 } = {}) {
    if (!running() || !buffer) return 0;
    const src = context.createBufferSource(), gain = context.createGain(), at = context.currentTime + delay;
    src.buffer = buffer; src.playbackRate.value = rate; gain.gain.value = volume;
    src.connect(gain); gain.connect(master); src.start(at);
    src.onended = () => { src.disconnect(); gain.disconnect(); };
    const length = buffer.duration / rate; duckUntil = Math.max(duckUntil, at + length); return delay + length;
  }
  return { enable, effect, update, speak, duck, loadClip, playClip };
})();
