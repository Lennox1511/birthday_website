/* Original synthesized firework sounds; the visual engine owns burst timing. */
(() => {
  'use strict';

  const silent = Object.freeze({ burst() {}, cancel() {} });
  const active = new Set();
  const recent = [];
  const random = (min, max) => min + Math.random() * (max - min);
  const finite = (value, fallback, min, max) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  const clock = () => performance.now();
  let context;
  let master;
  let noise;
  let crackle;

  function disconnect(node) {
    try { node.disconnect(); } catch {}
  }

  function cancelAll() {
    [...active].forEach(handle => handle.cancel());
  }

  function prepareContext() {
    if (context && context.state !== 'closed') return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    let candidate;
    try {
      candidate = new AudioContext();
      const level = candidate.createGain();
      const compressor = candidate.createDynamicsCompressor();
      level.gain.value = .58;
      compressor.threshold.value = -19;
      compressor.knee.value = 24;
      compressor.ratio.value = 4;
      compressor.attack.value = .006;
      compressor.release.value = .22;
      level.connect(compressor);
      compressor.connect(candidate.destination);
      noise = candidate.createBuffer(1, candidate.sampleRate * 2, candidate.sampleRate);
      crackle = candidate.createBuffer(1, candidate.sampleRate, candidate.sampleRate);
      const white = noise.getChannelData(0);
      const sparks = crackle.getChannelData(0);
      for (let i = 0; i < white.length; i += 1) white[i] = random(-1, 1);
      // Cache small, irregular noise impulses instead of creating dozens of nodes.
      for (let i = 0; i < 55; i += 1) {
        const start = Math.floor(random(0, sparks.length - 600));
        const length = Math.floor(random(.001, .008) * candidate.sampleRate);
        const volume = random(.15, .8);
        for (let j = 0; j < length; j += 1) {
          sparks[start + j] += random(-1, 1) * volume * (1 - j / length) ** 3;
        }
      }
      context = candidate;
      master = level;
      candidate.addEventListener('statechange', () => {
        if (candidate.state !== 'running') cancelAll();
      });
      return candidate;
    } catch {
      try { candidate?.close()?.catch(() => {}); } catch {}
      return null;
    }
  }

  function launch(options = {}) {
    if (document.hidden) return silent;
    const audio = prepareContext();
    if (!audio) return silent;
    // Calling resume here, before yielding the gesture, unlocks mobile browsers.
    let resuming;
    try {
      if (audio.state !== 'running') resuming = audio.resume();
    } catch { return silent; }

    options = options || {};
    const flightMs = finite(options.flightMs, 1500, 0, 8000);
    const power = finite(options.power, 1, 0, 1.8);
    let position = finite(options.x, .5, 0, 1);
    const started = clock();
    while (active.size >= 8) active.values().next().value.cancel();
    while (recent.length && started - recent[0] > 1100) recent.shift();
    recent.push(started);
    const level = .72 / Math.sqrt(1 + recent.length * .32 + active.size * .18);
    const stages = new Set();
    let canceled = false;
    let didBurst = false;
    let pendingBurst;
    let deadline = 0;
    let ascent;
    let releaseMusic;

    function cleanStage(stage) {
      stage.sources.forEach(source => {
        source.onended = null;
        try { source.stop(); } catch {}
      });
      stage.nodes.forEach(disconnect);
      stage.sources.clear();
      stage.nodes.clear();
      stages.delete(stage);
    }

    function cancel() {
      if (canceled) return;
      canceled = true;
      pendingBurst = undefined;
      clearTimeout(deadline);
      [...stages].forEach(cleanStage);
      active.delete(handle);
      releaseMusic?.();
      releaseMusic = undefined;
    }

    function node(stage, value) {
      stage.nodes.add(value);
      return value;
    }

    function stageAt(x, strength = power) {
      const stage = { nodes: new Set(), sources: new Set() };
      stages.add(stage);
      stage.gain = node(stage, audio.createGain());
      stage.gain.gain.value = level * Math.sqrt(strength);
      if (audio.createStereoPanner) {
        const pan = node(stage, audio.createStereoPanner());
        pan.pan.value = (x - .5) * .6;
        stage.gain.connect(pan);
        pan.connect(master);
      } else stage.gain.connect(master);
      return stage;
    }

    function play(stage, source, chain, duration, offset) {
      const now = audio.currentTime;
      stage.sources.add(source);
      if (!releaseMusic) releaseMusic = window.islandMusic?.duck();
      source.onended = () => {
        source.onended = null;
        stage.sources.delete(source);
        chain.forEach(item => { disconnect(item); stage.nodes.delete(item); });
        if (!stage.sources.size) cleanStage(stage);
        if (didBurst && !stages.size) cancel();
      };
      if (offset === undefined) source.start(now);
      else source.start(now, offset);
      source.stop(now + duration + .015);
    }

    function envelope(stage, duration, peak, attack = .012) {
      const amp = node(stage, audio.createGain());
      const now = audio.currentTime;
      amp.gain.setValueAtTime(.0001, now);
      amp.gain.linearRampToValueAtTime(Math.max(.0001, peak), now + attack);
      amp.gain.exponentialRampToValueAtTime(.0001, now + duration);
      amp.connect(stage.gain);
      return amp;
    }

    function hiss(stage, duration, peak, frequency, endFrequency, buffer = noise) {
      const source = node(stage, audio.createBufferSource());
      const filter = node(stage, audio.createBiquadFilter());
      const amp = envelope(stage, duration, peak, Math.min(.025, duration * .2));
      source.buffer = buffer;
      source.loop = true;
      source.playbackRate.value = random(.87, 1.14);
      filter.type = buffer === crackle ? 'highpass' : 'bandpass';
      filter.Q.value = .65;
      filter.frequency.setValueAtTime(frequency, audio.currentTime);
      filter.frequency.exponentialRampToValueAtTime(endFrequency, audio.currentTime + duration);
      source.connect(filter);
      filter.connect(amp);
      play(stage, source, [source, filter, amp], duration, random(0, .7));
    }

    function tone(stage, duration, peak, frequency, endFrequency) {
      const source = node(stage, audio.createOscillator());
      const amp = envelope(stage, duration, peak);
      source.type = 'sine';
      source.frequency.setValueAtTime(frequency, audio.currentTime);
      source.frequency.exponentialRampToValueAtTime(endFrequency, audio.currentTime + duration);
      source.connect(amp);
      play(stage, source, [source, amp], duration);
    }

    function startFlight() {
      const elapsed = clock() - started;
      // A denied or slow resume must never replay an old launch after unlocking.
      if (canceled || didBurst || document.hidden || audio.state !== 'running' || elapsed > 120) return;
      try {
        const duration = flightMs === 0 ? .065 : Math.max(.065, (flightMs - elapsed) / 1000);
        ascent = stageAt(position);
        hiss(ascent, duration, flightMs === 0 ? .13 : .21, random(850, 1150), 2300);
        if (flightMs > 0) tone(ascent, duration, .032, random(620, 780), random(1450, 1850));
      } catch { cancel(); }
    }

    function soundBurst(strength) {
      if (canceled || document.hidden || audio.state !== 'running') { cancel(); return; }
      try {
        if (ascent && stages.has(ascent)) {
          const now = audio.currentTime;
          ascent.gain.gain.cancelScheduledValues(now);
          ascent.gain.gain.setValueAtTime(ascent.gain.gain.value, now);
          ascent.gain.gain.linearRampToValueAtTime(0, now + .012);
          ascent.sources.forEach(source => source.stop(now + .015));
        }
        const bloom = stageAt(position, strength);
        tone(bloom, .27, .43, random(90, 110), random(39, 48));
        hiss(bloom, .23, .37, 760, 190);
        hiss(bloom, random(.58, .78), .24, 2100, 3600, crackle);
      } catch { cancel(); }
    }

    function burst(overrides = {}) {
      if (canceled || didBurst) return;
      didBurst = true;
      if (document.hidden) { cancel(); return; }
      overrides = overrides || {};
      position = finite(overrides.x, position, 0, 1);
      const strength = finite(overrides.power, power, 0, 1.8);
      if (audio.state !== 'running') {
        // Preserve a first, synchronous bloom while the gesture unlocks audio.
        if (resuming && clock() - started <= 120) pendingBurst = { strength };
        else cancel();
        return;
      }
      soundBurst(strength);
    }

    const handle = { burst, cancel };
    active.add(handle);
    // This only releases a forgotten handle; it never schedules a burst.
    deadline = setTimeout(cancel, Math.max(2300, flightMs + 1900));
    if (resuming) {
      Promise.resolve(resuming).then(() => {
        if (pendingBurst) {
          if (canceled || clock() - started > 120) { cancel(); return; }
          const strength = pendingBurst.strength;
          pendingBurst = undefined;
          soundBurst(strength);
        } else startFlight();
      }, cancel).catch(cancel);
    } else startFlight();
    return handle;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAll();
  });
  window.addEventListener('pagehide', cancelAll);
  window.islandFireworkAudio = { launch };
})();
