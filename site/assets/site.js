(() => {
  const header = document.querySelector(".site-header");
  if (header) {
    const showScrollState = () => { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    showScrollState();
    window.addEventListener("scroll", showScrollState, { passive: true });
  }

  const menu = document.querySelector(".mobile-nav");
  if (menu) {
    const summary = menu.querySelector("summary");
    menu.addEventListener("toggle", () => {
      summary.setAttribute("aria-label", menu.open ? "Close navigation" : "Open navigation");
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { menu.open = false; }));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
    document.addEventListener("pointerdown", event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("focusin", event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    const desktop = window.matchMedia("(min-width: 761px)");
    desktop.addEventListener("change", event => {
      if (event.matches) menu.open = false;
    });
  }

  const tickers = document.querySelectorAll(".ticker");
  if (tickers.length) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      tickers.forEach(ticker => ticker.classList.toggle("motion-ready", !reduced.matches));
    };
    applyMotion();
    reduced.addEventListener("change", applyMotion);
  }

  const wireSearch = ({ inputId, clearId, cardsSelector, chipSelector, statusId, emptyId, noun, published, geographyId }) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const clear = document.getElementById(clearId);
    const status = document.getElementById(statusId);
    const empty = document.getElementById(emptyId);
    if (!clear || !status || !empty) throw new Error(`Incomplete search controls for ${inputId}`);
    const geography = geographyId ? document.getElementById(geographyId) : null;
    if (geographyId && !geography) throw new Error(`Incomplete region filters for ${inputId}`);
    const cards = Array.from(document.querySelectorAll(cardsSelector));
    const chips = Array.from(document.querySelectorAll(chipSelector));
    const apply = (value, selected) => {
      const terms = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let matches = 0;
      cards.forEach(card => {
        card.hidden = !terms.every(term => card.dataset.search.toLowerCase().includes(term))
          || Boolean(geography?.value && !card.dataset.geography.split("|").includes(geography.value));
        if (!card.hidden) matches += 1;
      });
      chips.forEach(chip => {
        const filter = chip.dataset.regionFilter ?? chip.dataset.filter;
        chip.setAttribute("aria-pressed", String(chip === selected || (!terms.length && !geography?.value && filter === "")));
      });
      clear.disabled = !value && !geography?.value;
      empty.hidden = matches !== 0;
      status.textContent = `${matches} ${noun}${matches === 1 ? "" : "s"} ${published ? "in the published snapshot." : "found"}`;
    };
    input.addEventListener("input", () => apply(input.value, null));
    input.addEventListener("search", () => apply(input.value, null));
    clear.addEventListener("click", () => {
      input.value = "";
      if (geography) geography.value = "";
      apply("", null);
      input.focus();
    });
    chips.forEach(chip => chip.addEventListener("click", () => {
      input.value = chip.dataset.regionFilter ?? chip.dataset.filter;
      if (!input.value) {
        if (geography) geography.value = "";
      }
      apply(input.value, chip);
    }));
    geography?.addEventListener("change", () => apply(input.value, null));
    const controls = input.closest("[data-search-controls]");
    if (controls) controls.hidden = false;
    input.value = new URLSearchParams(location.search).get("q") || "";
    apply(input.value, null);
  };
  wireSearch({
    inputId: "region-search", clearId: "region-clear",
    cardsSelector: "#region-results [data-search]", chipSelector: "[data-region-filter]",
    statusId: "region-status", emptyId: "region-empty", noun: "region", published: false,
    geographyId: "region-geography"
  });
  wireSearch({
    inputId: "city-search", clearId: "city-clear",
    cardsSelector: "#locations [data-search]", chipSelector: "[data-filter]",
    statusId: "location-meta", emptyId: "location-empty", noun: "finding", published: true
  });

  const archiveButtons = Array.from(document.querySelectorAll("[data-archive-filter]"));
  if (archiveButtons.length) {
    const select = document.getElementById("archive-region");
    const cards = Array.from(document.querySelectorAll("[data-archive-region]"));
    const status = document.getElementById("archive-count");
    const empty = document.getElementById("archive-empty");
    const emptyTitle = document.getElementById("archive-empty-title");
    const emptyLink = document.getElementById("archive-empty-link");
    const emptyDescription = document.getElementById("archive-empty-description");
    if (!status || !empty || !select || !emptyTitle || !emptyLink || !emptyDescription) throw new Error("Incomplete archive filter controls");
    const names = new Map(Array.from(select.options).map(option => [option.value, option.textContent]));
    const prices = new Map(Array.from(select.options).map(option => {
      const price = Number(option.dataset.price);
      if (!Number.isFinite(price) || price < 0) throw new Error("Invalid archive edition price");
      return [option.value, price];
    }));
    const apply = value => {
      let count = 0;
      cards.forEach(card => {
        card.hidden = Boolean(value && card.dataset.archiveRegion !== value);
        if (!card.hidden) count += 1;
      });
      archiveButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.archiveFilter === value)));
      select.value = value;
      const paid = prices.get(value) > 0;
      status.textContent = paid ? "Members-only regional edition" : `${count} published bulletin${count === 1 ? "" : "s"}`;
      empty.hidden = count !== 0;
      if (!count && value) {
        emptyTitle.textContent = paid ? `Unlock ${names.get(value)} bulletins.` : "No matching bulletins.";
        emptyDescription.textContent = paid ? `Rs ${prices.get(value)}/month for this region's bulletins and scheme updates.` : "Browse all bulletins or explore this region's coverage.";
        emptyLink.href = `../regions/${value}/${paid ? "#edition-access-title" : ""}`;
        emptyLink.textContent = paid ? "View access options" : `View ${names.get(value)} coverage`;
      }
    };
    const currentFilter = () => {
      const requested = new URLSearchParams(location.search).get("region") || "";
      return names.has(requested) ? requested : "";
    };
    const choose = value => {
      const url = new URL(location.href);
      if (value) url.searchParams.set("region", value);
      else url.searchParams.delete("region");
      history.pushState({}, "", url);
      apply(value);
    };
    archiveButtons.forEach(button => button.addEventListener("click", () => choose(button.dataset.archiveFilter)));
    select.addEventListener("change", () => choose(select.value));
    const controls = archiveButtons[0].closest("[data-archive-controls]");
    if (controls) controls.hidden = false;
    window.addEventListener("popstate", () => apply(currentFilter()));
    apply(currentFilter());
  }
})();
