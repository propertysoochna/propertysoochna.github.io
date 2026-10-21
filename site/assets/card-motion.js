(() => {
  const root = document.documentElement;
  if (!root.classList.contains("theme-locked")) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const selectors = ".region-card,.fact,.buyer-card,.method-card,.join-card,.archive-card,.coverage-box,.latest-box,.opportunity-card,.answer-box,.workflow-grid article";
  const cards = Array.from(document.querySelectorAll(selectors)).map((element, index) => {
    element.dataset.motionCard = "";
    return { element, index, hero: Boolean(element.closest(".hero")) };
  });
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const positions = cards.map(card => {
      if (reduced.matches || card.element.hidden) return { card, y: 0, scale: 1 };
      const rect = card.element.getBoundingClientRect();
      const style = getComputedStyle(card.element);
      const currentY = parseFloat(style.getPropertyValue("--scroll-y")) || 0;
      const hoverY = parseFloat(style.getPropertyValue("--hover-y")) || 0;
      const currentScale = parseFloat(style.getPropertyValue("--card-scale")) || 1;
      // Measure the layout position, not the animation's previous position.
      const top = rect.top - currentY - hoverY - card.element.offsetHeight * .6 * (1 - currentScale);
      const progress = Math.max(0, Math.min(1, (innerHeight * .92 - top) / (innerHeight * .52)));
      const remaining = 1 - progress;
      const expressive = root.dataset.motionLevel === "expressive";
      const strength = card.hero ? 12 : (expressive ? 64 : 38);
      return {
        card,
        y: Math.round(remaining * strength * (card.index % 2 === 0 ? 1 : .82) * 100) / 100,
        scale: 1 - remaining * (card.hero ? .006 : (expressive ? .03 : .018))
      };
    });
    positions.forEach(({card, y, scale}) => {
      card.element.style.setProperty("--scroll-y", `${y}px`);
      card.element.style.setProperty("--card-scale", String(scale));
    });
  };
  const schedule = () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(update);
    }
  };
  const applyPreference = () => {
    root.dataset.motion = "flow";
    root.dataset.reducedMotion = String(reduced.matches);
    update();
  };
  reduced.addEventListener("change", applyPreference);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("toggle", schedule, true);
  document.addEventListener("input", schedule);
  document.addEventListener("click", schedule);
  document.fonts.ready.then(schedule);
  applyPreference();
})();
