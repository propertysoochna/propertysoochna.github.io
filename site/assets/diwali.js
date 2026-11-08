(() => {
  const hero = document.querySelector(".hero:has(.diwali-decor)");
  if (!hero) return;
  const button = hero.querySelector(".diwali-toggle");
  if (!button) throw new Error("Diwali hero is missing its pause control.");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  let paused = false;
  let inView = true;

  function update() {
    const animated = !reducedMotion.matches && !forcedColors.matches;
    hero.classList.toggle("diwali-animated", animated);
    hero.classList.toggle("diwali-paused", paused || document.hidden || !inView);
    button.hidden = !animated;
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Resume festive lights" : "Pause festive lights";
  }

  button.addEventListener("click", () => {
    paused = !paused;
    update();
  });
  reducedMotion.addEventListener("change", update);
  forcedColors.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      update();
    });
    observer.observe(hero);
  }
  update();
})();
