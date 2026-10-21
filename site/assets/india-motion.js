(() => {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.dataset.headingRevealed = "";
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: .3});
  document.querySelectorAll("main > section h2,.page-head h1,.detail-head h1,.about-intro h1,.publication h1,.publication-content > section > h2,.review-content > section > h2").forEach(heading => observer.observe(heading));
})();
