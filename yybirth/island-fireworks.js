/* Curved rockets and pastel particle constellations for the island's firework box. */
(() => {
  'use strict';

  const shows = new WeakMap();
  const sequences = new WeakMap();
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const random = (min, max) => min + Math.random() * (max - min);
  const mix = (a, b, progress) => a + (b - a) * progress;
  const easeOut = value => 1 - (1 - value) ** 3;
  const sky = [
    { x: .19, y: .25, spreadX: .025, spreadY: .025, radius: .115 },
    { x: .28, y: .31, spreadX: .02, spreadY: .025, radius: .115 },
    { x: .29, y: .20, spreadX: .015, spreadY: .025, radius: .105 },
    { x: .49, y: .465, spreadX: .025, spreadY: .01, radius: .09 },
    { x: .72, y: .465, spreadX: .02, spreadY: .01, radius: .09 }
  ];

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function curvePoint(points, t) {
    const u = 1 - t;
    return {
      x: u ** 3 * points[0].x + 3 * u * u * t * points[1].x + 3 * u * t * t * points[2].x + t ** 3 * points[3].x,
      y: u ** 3 * points[0].y + 3 * u * u * t * points[1].y + 3 * u * t * t * points[2].y + t ** 3 * points[3].y
    };
  }

  function makeShow(world, layer) {
    const canvas = document.createElement('canvas');
    canvas.className = 'island-firework-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const context = canvas.getContext('2d');
    if (!context) return null;
    layer.append(canvas);

    let width = 1;
    let height = 1;
    let offsetX = 0;
    let offsetY = 0;
    let frame = 0;
    let timeout = 0;
    let stopped = false;
    let lastLaunch = -Infinity;
    // Keep the shuffled sequence across idle periods while releasing the canvas.
    let sequence = sequences.get(layer);
    if (!sequence) {
      sequence = { lastShape: '', bag: [], destinations: shuffle(sky) };
      sequences.set(layer, sequence);
    }
    const shots = [];
    const observer = new ResizeObserver(resize);
    observer.observe(world);

    function resize() {
      const bounds = world.getBoundingClientRect();
      const layerBounds = layer.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      offsetX = bounds.left - layerBounds.left;
      offsetY = bounds.top - layerBounds.top;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(layerBounds.width * ratio));
      canvas.height = Math.max(1, Math.round(layerBounds.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.imageSmoothingEnabled = false;
    }

    function cleanup() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      observer.disconnect();
      shots.forEach(shot => shot.audio?.cancel());
      window.removeEventListener('pagehide', cleanup);
      canvas.remove();
      if (shows.get(layer) === api) shows.delete(layer);
    }

    function square(x, y, size, color, alpha = 1, glow = false) {
      context.globalAlpha = clamp(alpha);
      context.fillStyle = color;
      context.shadowColor = color;
      context.shadowBlur = glow ? Math.max(3, width * .007) : 0;
      const side = Math.max(1, size);
      context.fillRect(Math.round(offsetX + x * width - side / 2), Math.round(offsetY + y * height - side / 2), side, side);
    }

    function rocketPosition(shot, age) {
      const progress = clamp(age / shot.flight);
      // A little initial acceleration, then a gentle slowdown approaching the apex.
      return curvePoint(shot.path, (1 - Math.cos(progress * Math.PI)) / 2);
    }

    function drawRocket(shot, age) {
      const head = rocketPosition(shot, age);
      // Emit by elapsed time, not frames, so the tail stays even on slower phones.
      const emissionEnd = Math.min(age, shot.flight);
      while (shot.emitted < emissionEnd) {
        shot.emitted += 14;
        const position = rocketPosition(shot, shot.emitted);
        const previous = rocketPosition(shot, Math.max(0, shot.emitted - 8));
        const heading = Math.atan2((position.y - previous.y) * height, (position.x - previous.x) * width);
        shot.trail.push({
          x: position.x, y: position.y, born: shot.emitted, life: random(280, 620),
          vx: -Math.cos(heading) * random(.008, .02) + random(-.009, .009),
          vy: -Math.sin(heading) * random(.003, .012), size: random(.0015, .004),
          color: Math.random() < .3 ? shot.color : '#ffbd63'
        });
      }
      shot.trail = shot.trail.filter(spark => age - spark.born < spark.life);
      shot.trail.forEach((spark, index) => {
        const decay = clamp((age - spark.born) / spark.life);
        const seconds = (age - spark.born) / 1000;
        square(spark.x + spark.vx * seconds, spark.y + spark.vy * seconds + .045 * seconds * seconds, width * spark.size * (1 - decay * .75), spark.color, (1 - decay) ** 1.4, index % 6 === 0);
      });
      if (age >= shot.flight) return;
      // The bright core follows the recent curve rather than a rigid straight tail.
      for (let index = 9; index >= 0; index -= 1) {
        const point = rocketPosition(shot, Math.max(0, age - index * 9));
        square(point.x, point.y, width * .0035 * (1 - index * .065), index < 3 ? '#fff7d9' : shot.color, 1 - index / 10, index < 2);
      }
      square(head.x, head.y, width * .0048, '#fffce8', 1, true);
    }

    function drawBurst(shot, age) {
      const formationTime = 650;
      const holdTime = 1400;
      const fadeTime = 1250;
      const fading = shot.reduced ? 0 : clamp((age - formationTime - holdTime) / fadeTime);
      const forming = shot.reduced ? 1 : clamp(age / formationTime);
      const expansion = easeOut(forming) + Math.sin(forming * Math.PI) * .13;
      const radius = shot.radius;
      const aspect = width / height;
      const pulse = shot.reduced ? 1 : shot.shape.id === 'heart' ? 1 + Math.sin(age * .008) * .025 : 1;
      const rotation = shot.reduced ? 0 : shot.shape.id === 'flower' ? Math.sin(age * .0009) * .055 : 0;
      const cosine = Math.cos(rotation);
      const sine = Math.sin(rotation);
      shot.particles.forEach((particle, index) => {
        const x = (particle.x * cosine - particle.y * sine) * pulse;
        const y = (particle.x * sine + particle.y * cosine) * pulse;
        const bend = Math.sin(forming * Math.PI) * particle.bend;
        const twinkle = shot.reduced ? 1 : .86 + .14 * Math.sin(age * particle.flicker + particle.phase);
        const alpha = (particle.emphasis >= 1.2 ? .88 + .12 * twinkle : twinkle) * (1 - fading) ** 1.2;
        square(
          shot.target.x + radius * (x * expansion + bend + particle.driftX * fading),
          shot.target.y + radius * aspect * (y * expansion + particle.driftY * fading + 1.4 * fading * fading),
          width * particle.size * (1 - fading * .45),
          particle.color || shot.color, alpha, particle.emphasis >= 1.2 || index % 9 === 0
        );
      });
      if (!shot.reduced && age < 900) {
        const progress = age / 900;
        shot.satellites.forEach(spark => {
          const distance = radius * (.65 + spark.speed * progress);
          square(shot.target.x + Math.cos(spark.angle) * distance, shot.target.y + Math.sin(spark.angle) * distance * aspect + .025 * progress * progress, width * .0025 * (1 - progress * .7), spark.color, (1 - progress) ** 1.5, true);
        });
      }
      if (!shot.reduced && age < 170) {
        square(shot.target.x, shot.target.y, width * .014 * (1 - age / 170), '#fff7db', (1 - age / 170) * .85, true);
      }
    }

    function tick(now) {
      if (stopped) return;
      if (!world.isConnected || !layer.isConnected) { cleanup(); return; }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = 'lighter';
      for (let index = shots.length - 1; index >= 0; index -= 1) {
        const shot = shots[index];
        const age = now - shot.born;
        if (age >= shot.flight + shot.burstDuration) { shot.audio?.cancel(); shots.splice(index, 1); continue; }
        if (!shot.reduced && age < shot.flight + 650) drawRocket(shot, age);
        if (age >= shot.flight) {
          if (!shot.burstStarted) {
            shot.burstStarted = true;
            shot.audio?.burst({ x: shot.target.x, power: shot.power });
          }
          drawBurst(shot, age - shot.flight);
        }
      }
      canvas.dataset.activeShapes = shots.map(shot => shot.shape.id).join(',');
      canvas.dataset.phase = shots.some(shot => now - shot.born >= shot.flight) ? 'burst' : 'flight';
      context.globalAlpha = 1;
      context.shadowBlur = 0;
      if (!shots.length) { cleanup(); return; }
      frame = requestAnimationFrame(tick);
    }

    function launch(launcher) {
      const now = performance.now();
      if (now - lastLaunch < 110 || shots.length >= 7) return false;
      lastLaunch = now;
      if (!sequence.bag.length) {
        sequence.bag = shuffle(window.ISLAND_FIREWORK_SHAPES);
        if (sequence.bag[sequence.bag.length - 1].id === sequence.lastShape) {
          [sequence.bag[0], sequence.bag[sequence.bag.length - 1]] = [sequence.bag[sequence.bag.length - 1], sequence.bag[0]];
        }
      }
      const shape = sequence.bag.pop();
      sequence.lastShape = shape.id;
      if (!sequence.destinations.length) sequence.destinations = shuffle(sky);
      const destination = sequence.destinations.pop();
      const target = { x: destination.x + random(-destination.spreadX, destination.spreadX), y: destination.y + random(-destination.spreadY, destination.spreadY) };
      const bounds = world.getBoundingClientRect();
      const sourceBounds = launcher.getBoundingClientRect();
      const source = { x: (sourceBounds.left + sourceBounds.width / 2 - bounds.left) / width, y: (sourceBounds.top + sourceBounds.height / 2 - bounds.top) / height };
      const bend = (target.x < source.x ? -1 : 1) * random(.08, .14);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Randomize within each sky pocket, preserving space around the calendar.
      const radius = destination.radius * random(.72, 1.12);
      const flight = reduced ? 0 : random(1350, 1850);
      const power = clamp(radius / .1, .72, 1.2);
      const audio = window.islandFireworkAudio?.launch({ flightMs: flight, x: source.x, power });
      shots.push({
        shape, target, reduced, born: now, flight, audio, power, burstStarted: false,
        burstDuration: reduced ? 2600 : 3300, radius,
        color: shape.colors[0], emitted: -14, trail: [],
        path: [source, { x: clamp(source.x - bend * .35, .05, .9), y: source.y - .15 }, { x: clamp(target.x + bend, .05, .9), y: target.y + .12 }, target],
        particles: shape.points.map(point => ({ ...point, phase: random(0, Math.PI * 2), flicker: random(.006, .012), bend: random(-.08, .08), driftX: point.x * random(.05, .22) + random(-.12, .12), driftY: random(-.08, .22), size: random(.0028, .0035) * (point.emphasis || 1) })),
        satellites: Array.from({ length: 18 }, (_, index) => ({ angle: index / 18 * Math.PI * 2 + random(-.08, .08), speed: random(.45, .9), color: shape.colors[index % shape.colors.length] }))
      });
      canvas.dataset.lastShape = shape.id;
      canvas.dataset.lastRadius = radius.toFixed(4);
      canvas.dataset.lastTarget = `${target.x.toFixed(3)},${target.y.toFixed(3)}`;
      launcher.classList.remove('igniting');
      void launcher.offsetWidth;
      launcher.classList.add('igniting');
      launcher.setAttribute('aria-label', '再次点击发射烟花');
      clearTimeout(timeout);
      // A background tab can stop receiving frames; don't leave its canvas behind.
      timeout = window.setTimeout(cleanup, 8000);
      if (!frame) frame = requestAnimationFrame(tick);
      return true;
    }

    const api = { launch, cleanup };
    resize();
    window.addEventListener('pagehide', cleanup, { once: true });
    return api;
  }

  window.launchIslandFirework = function launchIslandFirework({ world, layer, launcher } = {}) {
    if (!world || !layer || !launcher || launcher.disabled || !window.ISLAND_FIREWORK_SHAPES?.length) return false;
    let show = shows.get(layer);
    if (!show) {
      show = makeShow(world, layer);
      if (!show) return false;
      shows.set(layer, show);
    }
    return show.launch(launcher);
  };
})();
