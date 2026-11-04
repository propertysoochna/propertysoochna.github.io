(() => {
  const dialog = document.getElementById("digest-dialog");
  if (!dialog) return;
  const content = dialog.querySelector(".digest-dialog-content");
  const closeButton = dialog.querySelector(".digest-dialog-close");
  const official = dialog.querySelector(".digest-dialog-official");
  const title = document.getElementById("digest-dialog-title");
  const authority = dialog.querySelector(".digest-dialog-authority");
  const location = dialog.querySelector(".digest-dialog-location");
  const sourceButton = dialog.querySelector(".source-shortcut");
  if (!content || !closeButton || !official || !title || !authority || !location || !sourceButton) throw new Error("Incomplete scheme dialog");
  let opener = null;
  let details = null;
  let panelAnimation = null;
  let closing = false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce), (forced-colors: active)");
  const stopPanelAnimation = () => {
    if (panelAnimation) panelAnimation.cancel();
    panelAnimation = null;
  };

  const restore = () => {
    stopPanelAnimation();
    closing = false;
    dialog.classList.remove("is-closing");
    if (!details) return;
    details.append(content.firstElementChild);
    document.documentElement.classList.remove("digest-modal-open");
    opener.focus({ preventScroll: true });
    details = null;
  };
  const finishClose = () => {
    dialog.close();
    restore();
  };
  const close = () => {
    if (!dialog.open || closing) return;
    if (reducedMotion.matches || typeof dialog.animate !== "function") {
      finishClose();
      return;
    }
    const style = getComputedStyle(dialog);
    const from = { transform: style.transform, opacity: style.opacity };
    stopPanelAnimation();
    closing = true;
    dialog.classList.add("is-closing");
    panelAnimation = dialog.animate(
      [from, { transform: "translateX(100%)", opacity: 0 }],
      { duration: 280, easing: "ease-in", fill: "both" }
    );
    panelAnimation.addEventListener("finish", finishClose, { once: true });
  };
  let arrivalObserver = null;
  if (!reducedMotion.matches && typeof window.IntersectionObserver === "function") {
    arrivalObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion.matches) entry.target.dataset.readerArrived = "";
        arrivalObserver.unobserve(entry.target);
      });
    }, { threshold: .06 });
    document.querySelectorAll('.open-digest[data-presentation="compact-v1"] .digest-stat, .open-digest[data-presentation="compact-v1"] .digest-scheme').forEach(element => {
      arrivalObserver.observe(element);
    });
  }
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    if (arrivalObserver) arrivalObserver.disconnect();
    document.querySelectorAll("[data-reader-arrived]").forEach(element => {
      element.removeAttribute("data-reader-arrived");
    });
    if (closing) finishClose();
    else stopPanelAnimation();
  });

  document.querySelectorAll('.open-digest[data-presentation="compact-v1"] .digest-matrix tbody tr').forEach(row => {
    const link = row.querySelector('th a[href^="#"]');
    if (!link) return;
    if (!document.getElementById(link.hash.slice(1))) throw new Error("Authority row has no details target");
    row.addEventListener("click", event => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element) || event.target.closest("a, button, input, select, textarea, label, [contenteditable]")) return;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && (row.contains(selection.anchorNode) || row.contains(selection.focusNode))) return;
      link.click();
    });
    row.dataset.clickable = "true";
  });

  document.querySelectorAll(".digest-scheme-details > summary").forEach(summary => {
    const scheme = summary.closest(".digest-scheme, .digest-results");
    if (!scheme) throw new Error("Scheme details control has no container");
    summary.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const body = scheme.querySelector(".digest-detail-body");
      if (!body) throw new Error("Scheme details are missing");
      const sourceUrl = scheme.querySelector(".digest-official-link")?.href || scheme.dataset.officialUrl;
      if (!sourceUrl) throw new Error("Scheme official source is missing");
      event.preventDefault();
      opener = summary;
      details = summary.parentElement;
      title.textContent = scheme.querySelector("h4").textContent;
      authority.textContent = scheme.dataset.owner || scheme.closest(".digest-authority").querySelector("h3").textContent;
      location.replaceChildren(document.createTextNode(scheme.dataset.location || ""));
      const status = scheme.querySelector(".digest-status");
      if (status) location.append(document.createTextNode(" "), status.cloneNode(true));
      official.href = sourceUrl;
      sourceButton.hidden = !body.querySelector(".source-record");
      body.querySelectorAll(".deeper").forEach(section => { section.open = false; });
      content.replaceChildren(body);
      dialog.showModal();
      document.documentElement.classList.add("digest-modal-open");
      content.scrollTop = 0;
      closeButton.focus();
      if (!reducedMotion.matches && typeof dialog.animate === "function") {
        panelAnimation = dialog.animate(
          [{ transform: "translateX(100%)", opacity: .75 }, { transform: "translateX(0)", opacity: 1 }],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      }
    });
    if (scheme.matches(".digest-scheme")) {
      scheme.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (!(event.target instanceof Element) || event.target.closest("a, button, summary, input, select, textarea, label, [contenteditable], .digest-detail-body")) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && (scheme.contains(selection.anchorNode) || scheme.contains(selection.focusNode))) return;
        summary.click();
      });
      scheme.dataset.clickable = "true";
    }
  });
  sourceButton.addEventListener("click", () => {
    const sources = content.querySelector(".source-record");
    if (!sources) throw new Error("Scheme source documents are missing");
    sources.open = true;
    sources.querySelector("summary").focus();
    sources.scrollIntoView({ block: "start" });
  });
  content.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const shortcut = event.target.closest("[data-open-section]");
    if (!shortcut || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const section = document.getElementById(shortcut.hash.slice(1));
    if (!section || !content.contains(section)) throw new Error("Missing application steps section");
    event.preventDefault();
    section.open = true;
    section.querySelector("summary").focus();
    section.scrollIntoView({ block: "start" });
  });
  closeButton.addEventListener("click", close);
  dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
  dialog.addEventListener("close", () => {
    if (!dialog.open) restore();
  });
  window.addEventListener("beforeprint", () => {
    if (dialog.open) finishClose();
  });
  dialog.addEventListener("click", event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      if (event.shiftKey && document.activeElement === closeButton) {
        event.preventDefault();
        official.focus();
      } else if (!event.shiftKey && document.activeElement === official) {
        event.preventDefault();
        closeButton.focus();
      }
    }
  });
})();
