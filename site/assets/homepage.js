(() => {
  const disclosure = document.querySelector(".home-x");
  if (!disclosure) return;
  const trigger = disclosure.querySelector("summary");
  if (!trigger) throw new Error("Social disclosure is missing its trigger.");
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !disclosure.open) return;
    if (disclosure.contains(document.activeElement)) trigger.focus();
    disclosure.open = false;
  });
  document.addEventListener("pointerdown", event => {
    if (!disclosure.contains(event.target)) disclosure.open = false;
  });
  disclosure.addEventListener("focusout", event => {
    if (!disclosure.contains(event.relatedTarget)) disclosure.open = false;
  });
})();
