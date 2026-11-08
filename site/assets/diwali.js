(() => {
  const hero = document.querySelector(".hero:has(.diwali-decor)");
  if (!hero) return;
  const canvas = hero.querySelector(".diwali-canvas");
  if (!canvas) throw new Error("Diwali hero is missing its canvas.");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Diwali fireworks require a 2D canvas context.");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  const fireworks = [...hero.querySelectorAll(".diwali-firework")].map((element, index) => ({
    element, image: element.querySelector("img"), offset: [1.4, 1.7, 3.3, 3.7][index],
    x: 0, y: 0, width: 0, height: 0, visible: true,
  }));
  let inView = true;
  let frame = 0;
  let previousTime = 0;
  let elapsed = 0;
  let width = 0;
  let height = 0;
  let ready = false;

  function resize() {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    fireworks.forEach(firework => {
      const box = firework.element.getBoundingClientRect();
      firework.x = box.x - bounds.x + box.width / 2;
      firework.y = box.y - bounds.y + box.height / 2;
      firework.width = box.width;
      firework.height = box.height;
      firework.visible = box.width > 0 && box.height > 0;
    });
    draw();
  }

  function glow(x, y, radius, opacity) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255,239,143,${opacity})`);
    gradient.addColorStop(.25, `rgba(255,210,92,${opacity * .45})`);
    gradient.addColorStop(1, "rgba(255,210,92,0)");
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function draw() {
    if (!ready) return;
    context.clearRect(0, 0, width, height);
    fireworks.forEach((firework, index) => {
      if (!firework.visible) return;
      const phase = (elapsed + firework.offset) % 4.8;
      const {x, y} = firework;
      const radius = firework.width * .46;
      if (phase < .65) {
        const progress = phase / .65;
        const rocketY = y + (height - y) * (1 - progress);
        const trail = context.createLinearGradient(x, rocketY, x, rocketY + 90);
        trail.addColorStop(0, "#ffcb50");
        trail.addColorStop(1, "rgba(255,203,80,0)");
        context.fillStyle = trail;
        context.fillRect(x - 1, rocketY, 2, 90);
        glow(x, rocketY, 16, .7);
        return;
      }
      const age = phase - .65;
      if (age > 3.1) return;
      const progress = Math.min(1, age / 1.35);
      const spread = 1 - Math.exp(-progress * 3);
      const opacity = Math.min(1, age * 6) * Math.max(0, 1 - Math.max(0, age - 1.5) / 1.6);
      glow(x, y, radius * .75, opacity * .4);
      // The exact mock artwork expands with the live particle burst, not a static background.
      context.globalAlpha = opacity;
      const scale = .12 + spread * .95;
      context.drawImage(firework.image, x - firework.width * scale / 2, y - firework.height * scale / 2, firework.width * scale, firework.height * scale);
      context.globalAlpha = 1;
      const count = width < 761 ? 64 : 144;
      for (let particle = 0; particle < count; particle++) {
        const angle = particle * Math.PI * 2 / count + index * .2;
        const variation = .58 + ((particle * 37) % 47) / 100;
        const distance = radius * spread * variation;
        const drop = age * age * 7;
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance + drop;
        const tail = 5 + radius * .1 * Math.max(0, 1 - progress);
        const colour = particle % 17 === 0 ? "36,145,117" : particle % 11 === 0 ? "233,111,113" : "236,165,47";
        context.strokeStyle = `rgba(${colour},${opacity * .65})`;
        context.lineWidth = particle % 3 === 0 ? 1.4 : .7;
        context.beginPath();
        context.moveTo(px - Math.cos(angle) * tail, py - Math.sin(angle) * tail);
        context.lineTo(px, py);
        context.stroke();
        const sparkle = .5 + .5 * Math.sin(age * 9 + particle * 2.4);
        context.fillStyle = `rgba(255,205,78,${opacity * sparkle})`;
        context.beginPath();
        context.arc(px, py, particle % 7 === 0 ? 1.7 : .9, 0, Math.PI * 2);
        context.fill();
      }
    });
  }

  function animate(time) {
    if (previousTime) elapsed += Math.min((time - previousTime) / 1000, .05);
    previousTime = time;
    draw();
    frame = requestAnimationFrame(animate);
  }

  function update() {
    const animated = ready && !reducedMotion.matches && !forcedColors.matches;
    const stopped = document.hidden || !inView;
    hero.classList.toggle("diwali-animated", animated);
    hero.classList.toggle("diwali-paused", stopped);
    if (animated && !stopped && !frame) {
      previousTime = 0;
      frame = requestAnimationFrame(animate);
    } else if ((!animated || stopped) && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
  }

  reducedMotion.addEventListener("change", update);
  forcedColors.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("resize", resize);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; update(); });
    observer.observe(hero);
  }
  Promise.all(fireworks.map(firework => firework.image.decode())).then(() => {
    ready = true;
    resize();
    update();
  }).catch(error => {
    console.error("Diwali firework artwork could not be decoded; static artwork remains visible.", error);
  });
  update();
})();
