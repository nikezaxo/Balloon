'use strict';
// Original procedural audio: no external recordings, downloads or dependencies.
const gameSound = (() => {
  let context, master, windGain, windFilter, windPan, noiseBuffer;
  let enabled = false, lastUpdate = 0, nextNote = 0, melodyStep = 0;
  function init() {
    if (context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio is not supported');
    context = new AudioContext();
    master = context.createGain(); master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -16; limiter.ratio.value = 5;
    master.connect(limiter); limiter.connect(context.destination);
    noiseBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + .025 * white) / 1.025;
      data[i] = brown * 3.5 + white * .08;
    }
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
    try { init(); await context.resume(); nextNote=context.currentTime; return enabled; }
    catch { enabled = false; return false; }
  }
  function note(start, end, duration, delay = 0, volume = .08, type = 'sine') {
    if (!enabled || !context || context.state !== 'running') return;
    const now = context.currentTime + delay;
    const osc = context.createOscillator(), gain = context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(end, now + duration);
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain); gain.connect(master); osc.start(now); osc.stop(now + duration + .02);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  function effect(kind) {
    if (kind === 'launch') note(330, 660, .16, 0, .055, 'triangle');
    if (kind === 'coin') { note(880, 880, .08, 0, .06, 'triangle'); note(1320, 1320, .12, .07, .045, 'triangle'); }
    if (kind === 'on') note(660, 660, .09, 0, .045, 'triangle');
    if (kind === 'pop') note(180, 45, .16, 0, .1, 'triangle');
  }

  function update(state, wind, speed, altitude, hidden) {
    if (!context || !enabled) return;
    const now = context.currentTime;
    const silent = hidden || state === 'paused';
    master.gain.setTargetAtTime(silent ? 0 : .7, now, .06);
    if (silent || now - lastUpdate < .07) return;
    lastUpdate = now;
    // A slow pentatonic toy-piano melody with soft, sustained harmony.
    if ((state === 'ready' || state === 'flying') && now >= nextNote) {
      const melody=[523.25,659.25,783.99,659.25,587.33,0,523.25,0,440,523.25,659.25,587.33,523.25,0,392,0];
      const pitch=melody[melodyStep%melody.length];
      if(pitch){note(pitch,pitch,.62,0,.055,'sine');note(pitch*2,pitch*2,.2,0,.009,'sine')}
      if(melodyStep%4===0){const bass=[130.81,146.83,110,130.81][Math.floor(melodyStep/4)%4];note(bass,bass,1.8,0,.023,'sine');note(bass*1.5,bass*1.5,1.5,0,.012,'sine')}
      melodyStep++;nextNote=now+.48;
    }
    const flying = state === 'flying', gust = Math.min(1, Math.abs(wind) * 3);
    // Soft, irregular leaf rustling only during gusts; no nature ambience.
    const flutter = .55 + .25 * Math.sin(now * 17) + .2 * Math.sin(now * 29);
    windGain.gain.setTargetAtTime(flying ? gust * .10 * flutter : 0, now, .04);
    windFilter.frequency.setTargetAtTime(650 + gust * 400, now, .08);
    if (windPan) windPan.pan.setTargetAtTime(Math.max(-.8, Math.min(.8, wind * 2)), now, .2);

  }
  return { enable, effect, update };
})();
