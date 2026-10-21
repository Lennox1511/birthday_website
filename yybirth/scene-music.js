/* Two original island themes, started by a gesture and crossfaded at sunset. */
(() => {
  'use strict';
  const button = document.querySelector('.music-toggle');
  const world = document.querySelector('.world');
  const elements = { day: document.querySelector('.music-day'), festival: document.querySelector('.music-festival') };
  if (!button || !world || !elements.day || !elements.festival) return;
  // iPhone/iPad controls media volume at system level. Reuse one authorized
  // player there rather than overlap two full-volume tracks during a fade.
  const singlePlayer = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const sources = Object.fromEntries(Object.entries(elements).map(([id, track]) => [id, track.innerHTML]));
  const tracks = singlePlayer ? { day: elements.day, festival: elements.day } : elements;
  const players = [...new Set(Object.values(tracks))];
  let loadedScene = 'day';

  const storageKey = 'yybirth:music-enabled';
  let enabled = true;
  try { enabled = localStorage.getItem(storageKey) !== 'false'; } catch {}
  let unlocked = false;
  let scene = world.classList.contains('page-two') ? 'festival' : 'day';
  let generation = 0;
  let frame = 0;
  let requested = '';
  const pending = new WeakMap();
  // Quiet music bed; effects duck it further without changing their volume.
  const levels = { day: .24, festival: .22 };
  const sceneLevels = { day: 0, festival: 0 };
  const effects = new Set();
  let duckLevel = 1;
  let duckFrame = 0;

  function applyLevels() {
    if (singlePlayer) return;
    Object.entries(tracks).forEach(([id, track]) => { track.volume = sceneLevels[id] * duckLevel; });
  }

  function duck() {
    const effect = {};
    effects.add(effect);
    animateDuck(.22, 60);
    if (singlePlayer) pauseAll();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      effects.delete(effect);
      if (!effects.size) {
        animateDuck(1, 450);
        if (singlePlayer) synchronize();
      }
    };
  }

  function animateDuck(target, duration) {
    cancelAnimationFrame(duckFrame);
    const from = duckLevel;
    const started = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      duckLevel = from + (target - from) * progress;
      applyLevels();
      if (progress < 1) duckFrame = requestAnimationFrame(step);
      else duckFrame = 0;
    }
    duckFrame = requestAnimationFrame(step);
  }

  document.querySelectorAll('.palm-rustle-sound, .cat-meow-sound').forEach(sound => {
    let release;
    const stop = () => { release?.(); release = undefined; };
    sound.addEventListener('playing', () => { if (!release) release = duck(); });
    ['ended', 'pause', 'error', 'emptied'].forEach(event => sound.addEventListener(event, stop));
  });
  players.forEach(track => { track.volume = singlePlayer ? 1 : 0; });

  function updateButton() {
    const playing = enabled && players.some(track => !track.paused);
    button.dataset.state = !enabled ? 'off' : playing ? 'playing' : 'ready';
    button.setAttribute('aria-pressed', String(enabled));
    const label = !enabled || !unlocked ? '开启背景音乐' : '关闭背景音乐';
    button.setAttribute('aria-label', label);
    button.title = `${label} · ${scene === 'day' ? '晴日海风' : '星灯庆典'}`;
  }

  function pauseAll() {
    generation += 1;
    cancelAnimationFrame(frame);
    requested = '';
    sceneLevels.day = sceneLevels.festival = 0;
    players.forEach(track => { track.pause(); if (!singlePlayer) track.volume = 0; });
    updateButton();
  }

  function fadeTo(key, duration, token) {
    cancelAnimationFrame(frame);
    if (singlePlayer) {
      if (!key) players.forEach(track => track.pause());
      updateButton();
      return;
    }
    const started = performance.now();
    const from = { ...sceneLevels };
    function step(now) {
      if (token !== generation) return;
      const progress = Math.min(1, (now - started) / duration);
      const blend = progress * progress * (3 - 2 * progress);
      Object.entries(tracks).forEach(([id, track]) => {
        const target = id === key ? levels[id] : 0;
        sceneLevels[id] = Math.max(0, Math.min(1, from[id] + (target - from[id]) * blend));
        if (progress === 1 && id !== key) track.pause();
      });
      applyLevels();
      updateButton();
      if (progress < 1) frame = requestAnimationFrame(step);
      else frame = 0;
    }
    frame = requestAnimationFrame(step);
  }

  async function synchronize() {
    if (!enabled || !unlocked || document.hidden || (singlePlayer && effects.size)) return;
    const key = scene;
    const incoming = tracks[key];
    if (requested === key && (!incoming.paused || pending.has(incoming))) return;
    requested = key;
    const token = ++generation;
    cancelAnimationFrame(frame);
    try {
      if (singlePlayer && loadedScene !== key) {
        pending.delete(incoming);
        incoming.pause();
        incoming.innerHTML = sources[key];
        incoming.load();
        loadedScene = key;
      }
      if (incoming.paused) {
        let attempt = pending.get(incoming);
        if (!attempt) {
          attempt = Promise.resolve(incoming.play());
          pending.set(incoming, attempt);
        }
        try { await attempt; } finally { if (pending.get(incoming) === attempt) pending.delete(incoming); }
      }
      if (token !== generation) return;
      if (!enabled || document.hidden) { pauseAll(); return; }
      fadeTo(key, 1100, token);
    } catch {
      if (token !== generation) return;
      // A denied gesture or unavailable audio never blocks the island story.
      requested = '';
      pauseAll();
      unlocked = false;
    }
    updateButton();
  }

  function unlock(event) {
    if (!event.isTrusted || event.target.closest?.('.music-toggle')) return;
    if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
    unlocked = true;
    synchronize();
  }
  document.addEventListener('click', unlock, true);
  document.addEventListener('pointerup', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, true);
  button.addEventListener('click', () => {
    if (!unlocked) { unlocked = true; enabled = true; }
    else enabled = !enabled;
    try { localStorage.setItem(storageKey, String(enabled)); } catch {}
    if (enabled) synchronize();
    else { requested = ''; fadeTo(null, 280, ++generation); }
    updateButton();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll();
    else synchronize();
  });
  window.addEventListener('pagehide', pauseAll);
  window.addEventListener('pageshow', () => synchronize());
  window.islandMusic = {
    duck,
    setScene(next) {
      if (!Object.hasOwn(tracks, next) || next === scene) return;
      scene = next;
      requested = '';
      synchronize();
      updateButton();
    }
  };
  updateButton();
})();
