'use strict';
// Original procedural audio: no external recordings, downloads or dependencies.
const gameSound = (() => {
  let context, master, music, windGain, windFilter, windPan, whiteBuffer;
  let enabled = false, lastUpdate = 0, nextNote = 0, step = 0;
  function init() {
    if (context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio is not supported');
    context = new AudioContext();
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
    music.gain.setTargetAtTime(playing ? .9 : 0, now, .25);
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
  return { enable, effect, update };
})();
