/* A self-contained pixel-particle birthday firework, independent of the box fireworks. */
(() => {
  'use strict';

  const activeShows = new WeakMap();
  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
  const easeOut = value => 1 - (1 - value) ** 3;
  const colors = {
    cream: '#fff1bc', white: '#fff9e5', pink: '#ff83c3', rose: '#ff4e95',
    gold: '#ffd565', orange: '#ff9b36', blue: '#98eeff', violet: '#c8b0ff'
  };

  // The separated squares form a cake-shaped constellation, rather than a filled image.
  function createCakeParticles() {
    const cells = new Map();
    function pixel(x, y, color, emphasis = false) {
      cells.set(`${x},${y}`, { x, y, color, emphasis });
    }
    function line(x1, y1, x2, y2, color, emphasis = true) {
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      for (let step = 0; step <= steps; step += 1) {
        const progress = steps ? step / steps : 0;
        pixel(Math.round(x1 + (x2 - x1) * progress), Math.round(y1 + (y2 - y1) * progress), color, emphasis);
      }
    }

    // The gold plate, two tiers, and dripped cream provide a clear cake silhouette.
    line(2, 40, 46, 40, colors.gold);
    line(0, 41, 48, 41, colors.cream);
    line(3, 42, 45, 42, colors.orange);
    function tier(left, right, top, bottom) {
      line(left + 2, top, right - 2, top, colors.white);
      line(left + 1, top + 1, right - 1, top + 1, colors.cream);
      line(left, top + 2, left, bottom - 1, colors.pink);
      line(right, top + 2, right, bottom - 1, colors.pink);
      line(left + 1, bottom, right - 1, bottom, colors.rose);
      for (let x = left + 1; x < right; x += 1) {
        const drip = (x - left) % 8 < 3 ? 3 : 1;
        pixel(x, top + 2, colors.cream, true);
        if (drip > 1) pixel(x, top + 3, colors.cream, true);
        if ((x - left) % 8 === 1) pixel(x, top + 4, colors.cream, true);
        for (let y = top + 4; y < bottom; y += 1) {
          if ((x + y) % 3 === 0) pixel(x, y, y === bottom - 2 ? colors.rose : colors.pink);
        }
      }
      // Small bright decorations make each tier readable even on a phone.
      for (let x = left + 5; x < right - 2; x += 8) pixel(x, bottom - 3, colors.white, true);
    }
    tier(3, 45, 27, 38);
    tier(10, 38, 16, 26);

    [13, 24, 35].forEach((x, index) => {
      const candleColor = [colors.blue, colors.pink, colors.violet][index];
      line(x - 1, 8, x - 1, 15, colors.cream);
      line(x, 8, x, 15, candleColor);
      line(x + 1, 8, x + 1, 15, colors.white);
      line(x, 6, x, 7, colors.orange);
      pixel(x, 0, colors.gold, true);
      line(x - 1, 2, x + 1, 2, colors.orange);
      line(x - 2, 3, x + 2, 3, colors.gold);
      line(x - 2, 4, x + 2, 4, colors.gold);
      line(x - 1, 5, x + 1, 5, colors.orange);
      pixel(x, 3, colors.white, true);
      pixel(x, 4, colors.white, true);
    });

    return [...cells.values()].map((cell, index) => ({
      x: (cell.x - 24) / 49 * .27,
      y: (cell.y - 21) / 43 * .18,
      color: cell.color,
      emphasis: cell.emphasis,
      phase: Math.random() * Math.PI * 2,
      delay: Math.random() * 140,
      bend: (Math.random() - .5) * .035,
      driftX: (Math.random() - .5) * .033,
      driftY: .025 + Math.random() * .055,
      size: cell.emphasis ? .77 : .55,
      index
    }));
  }

  // Sample a Catmull-Rom curve by distance for an even flight along the marked bend.
  function createFlightPath(source, aspect) {
    const points = [source,
      { x: .55, y: .60 }, { x: .50, y: .55 }, { x: .46, y: .54 },
      { x: .43, y: .50 }, { x: .43, y: .46 }, { x: .40, y: .44 },
      { x: .36, y: .43 }, { x: .31, y: .40 }, { x: .30, y: .37 },
      { x: .295, y: .323 }
    ];
    const samples = [{ ...source, distance: 0 }];
    for (let segment = 0; segment < points.length - 1; segment += 1) {
      const a = points[Math.max(0, segment - 1)];
      const b = points[segment];
      const c = points[segment + 1];
      const d = points[Math.min(points.length - 1, segment + 2)];
      for (let step = 1; step <= 18; step += 1) {
        const t = step / 18;
        const coordinate = key => .5 * (
          2 * b[key] + (-a[key] + c[key]) * t +
          (2 * a[key] - 5 * b[key] + 4 * c[key] - d[key]) * t * t +
          (-a[key] + 3 * b[key] - 3 * c[key] + d[key]) * t * t * t
        );
        const previous = samples[samples.length - 1];
        const sample = { x: coordinate('x'), y: coordinate('y') };
        sample.distance = previous.distance + Math.hypot(sample.x - previous.x, (sample.y - previous.y) * aspect);
        samples.push(sample);
      }
    }
    const total = samples[samples.length - 1].distance;
    return progress => {
      const distance = clamp(progress) * total;
      let low = 0;
      let high = samples.length - 1;
      while (low + 1 < high) {
        const middle = (low + high) >> 1;
        if (samples[middle].distance < distance) low = middle;
        else high = middle;
      }
      const a = samples[low];
      const b = samples[high];
      const along = (distance - a.distance) / (b.distance - a.distance || 1);
      return { x: a.x + (b.x - a.x) * along, y: a.y + (b.y - a.y) * along };
    };
  }

  window.launchBirthdayCakeFirework = function launchBirthdayCakeFirework({ world, layer, launcher } = {}) {
    if (!world || !layer || !launcher) return () => {};
    activeShows.get(layer)?.();

    const canvas = document.createElement('canvas');
    canvas.className = 'birthday-firework-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;image-rendering:pixelated;';
    const context = canvas.getContext('2d');
    if (!context) return () => {};
    layer.append(canvas);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cake = createCakeParticles();
    const trail = [];
    const start = performance.now();
    const flightDuration = 2200;
    const assembleDuration = 800;
    const holdDuration = 6000;
    const fadeDuration = 1500;
    const totalDuration = flightDuration + assembleDuration + holdDuration + fadeDuration;
    let width = 1;
    let height = 1;
    let offsetX = 0;
    let offsetY = 0;
    let path;
    let frame = 0;
    let timeout = 0;
    let observer;
    let stopped = false;
    let lastEmission = -100;
    let audio;
    let burstStarted = false;

    function startBurstSound() {
      if (burstStarted) return;
      burstStarted = true;
      audio?.burst({ x: .295, power: 1.1 });
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      audio?.cancel();
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pagehide', cleanup);
      canvas.remove();
      if (activeShows.get(layer) === cleanup) activeShows.delete(layer);
    }

    function resize() {
      if (stopped) return;
      const bounds = world.getBoundingClientRect();
      const layerBounds = layer.getBoundingClientRect();
      const sourceBounds = launcher.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      offsetX = bounds.left - layerBounds.left;
      offsetY = bounds.top - layerBounds.top;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(layerBounds.width * ratio));
      canvas.height = Math.max(1, Math.round(layerBounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.imageSmoothingEnabled = false;
      path = createFlightPath({
        x: (sourceBounds.left + sourceBounds.width / 2 - bounds.left) / width,
        y: (sourceBounds.top + sourceBounds.height / 2 - bounds.top) / height
      }, height / width);
      if (reducedMotion) drawCake(assembleDuration + 1, true);
    }

    function clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = 'lighter';
    }

    function square(x, y, size, color, alpha = 1, glow = false) {
      context.globalAlpha = clamp(alpha);
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = glow ? Math.max(3, width * .008) : 0;
      const side = Math.max(1, size);
      context.fillRect(Math.round(offsetX + x * width - side / 2), Math.round(offsetY + y * height - side / 2), side, side);
    }

    function drawFlight(age) {
      const progress = clamp(age / flightDuration);
      const head = path(progress);
      if (age - lastEmission > 18 && progress < 1) {
        lastEmission = age;
        for (let index = 0; index < 2; index += 1) {
          trail.push({
            x: head.x + (Math.random() - .5) * .003,
            y: head.y, born: age, life: 230 + Math.random() * 170,
            drift: (Math.random() - .5) * .009,
            color: index ? colors.orange : colors.gold
          });
        }
      }
      for (let index = trail.length - 1; index >= 0; index -= 1) {
        const spark = trail[index];
        const decay = (age - spark.born) / spark.life;
        if (decay > 1) { trail.splice(index, 1); continue; }
        square(spark.x + spark.drift * decay, spark.y + decay * .008, width * .0032, spark.color, (1 - decay) * .9, index % 3 === 0);
      }
      if (progress < 1) {
        square(head.x, head.y, width * .006, colors.orange, 1, true);
        square(head.x, head.y, width * .0028, colors.white);
      }
    }

    function drawCake(age, still = false) {
      if (still) clear();
      const dispersed = still ? 0 : clamp((age - assembleDuration - holdDuration) / fadeDuration);
      const assembling = age < assembleDuration;
      cake.forEach(particle => {
        const formation = still ? 1 : easeOut(clamp((age - particle.delay) / (assembleDuration - particle.delay)));
        if (!formation) return;
        const bend = assembling ? Math.sin(formation * Math.PI) * particle.bend : 0;
        const x = clamp(.295 + particle.x * formation + bend + particle.driftX * dispersed, .14, .438);
        const y = .323 + particle.y * formation + particle.driftY * dispersed * dispersed;
        const twinkle = still ? 1 : .72 + .28 * Math.sin(age * .008 + particle.phase);
        const alpha = (particle.emphasis ? .9 + twinkle * .1 : twinkle) * (1 - dispersed) * clamp(formation * 3);
        square(x, y, width * .27 / 49 * particle.size * (1 - dispersed * .4), particle.color, alpha, particle.emphasis && particle.index % 3 === 0);
      });
      // A brief expanding ring of sparks makes the transition read as a firework burst.
      if (!still && age < 560) {
        const burst = clamp(age / 560);
        for (let index = 0; index < 22; index += 1) {
          const angle = index / 22 * Math.PI * 2;
          square(.295 + Math.cos(angle) * .135 * easeOut(burst), .323 + Math.sin(angle) * .092 * easeOut(burst), width * .003, index % 2 ? colors.pink : colors.gold, (1 - burst) * .8, true);
        }
      }
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }

    function tick(now) {
      if (stopped) return;
      const age = now - start;
      if (!world.isConnected || !layer.isConnected || age >= totalDuration) { cleanup(); return; }
      clear();
      if (age < flightDuration + 400) drawFlight(age);
      if (age >= flightDuration) {
        startBurstSound();
        drawCake(age - flightDuration);
      }
      frame = requestAnimationFrame(tick);
    }

    activeShows.set(layer, cleanup);
    resize();
    audio = window.islandFireworkAudio?.launch({ flightMs: reducedMotion ? 0 : flightDuration, x: path(0).x, power: 1.1 });
    if (reducedMotion) startBurstSound();
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize);
      observer.observe(world);
    } else {
      window.addEventListener('resize', resize);
    }
    window.addEventListener('pagehide', cleanup, { once: true });
    // This also cleans up a paused/background tab whose animation frames are throttled.
    timeout = window.setTimeout(cleanup, reducedMotion ? holdDuration : totalDuration + 200);
    if (!reducedMotion) frame = requestAnimationFrame(tick);
    return cleanup;
  };
})();
