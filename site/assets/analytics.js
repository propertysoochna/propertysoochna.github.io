(() => {
  const script = document.currentScript;
  if (!script || location.origin !== script.dataset.siteOrigin) return;
  const measurementId = script.dataset.measurementId;
  if (!/^G-[A-Z0-9]{10}$/.test(measurementId || "")) {
    throw new Error("Invalid Google Analytics Measurement ID");
  }
  let panel = document.getElementById("analytics-consent");
  const settings = document.getElementById("analytics-settings");
  const status = document.getElementById("analytics-status");
  const footer = document.querySelector(".footer-meta");
  if (!panel || !settings || !status || !footer) throw new Error("Incomplete analytics consent controls");
  // Upgrade cached corner notices when they load the new dialog runtime.
  if (!(panel instanceof HTMLDialogElement)) {
    const dialog = document.createElement("dialog");
    for (const attribute of panel.attributes) dialog.setAttribute(attribute.name, attribute.value);
    dialog.append(...panel.childNodes);
    panel.replaceWith(dialog);
    panel = dialog;
    const heading = panel.querySelector("h2");
    const description = panel.querySelector("p");
    if (!heading || !description) throw new Error("Incomplete cookie dialog description");
    heading.id = "analytics-consent-title";
    heading.tabIndex = -1;
    description.id = "analytics-consent-description";
    panel.removeAttribute("aria-label");
    panel.setAttribute("aria-labelledby", heading.id);
    panel.setAttribute("aria-describedby", description.id);
  }
  if (settings.parentElement !== footer) footer.appendChild(settings);
  let feedback = document.getElementById("analytics-feedback");
  // Earlier cached pages do not yet include the confirmation region.
  if (!feedback) {
    feedback = document.createElement("p");
    feedback.id = "analytics-feedback";
    feedback.className = "analytics-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");
    panel.after(feedback);
  }
  const storageKey = "propertysoochna.analytics-consent.v1";
  const disableKey = `ga-disable-${measurementId}`;
  let choice = null;
  let initialized = false;
  let feedbackTimer;
  let loadFailed = false;
  const loadFailureMessage = "Analytics is allowed but could not load. Refresh to retry. You can continue using the website.";

  const clearFeedback = () => {
    clearTimeout(feedbackTimer);
    feedback.textContent = "";
  };
  const confirmChoice = message => {
    clearFeedback();
    feedback.textContent = message;
    feedbackTimer = setTimeout(clearFeedback, 8000);
  };
  const updateControls = () => {
    settings.textContent = "Cookie settings";
    panel.querySelectorAll("[data-analytics-choice]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.analyticsChoice === choice));
    });
  };
  const storageFailure = error => {
    if (!(error instanceof DOMException)
      || !["SecurityError", "QuotaExceededError"].includes(error.name)) throw error;
    console.warn("Analytics consent could not access browser storage.", error);
    status.textContent = "Your browser could not save this choice. It applies to this page only.";
  };
  const readChoice = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      storageFailure(error);
      return null;
    }
  };
  const showPanel = visible => {
    if (visible) {
      panel.hidden = false;
      if (!panel.open) {
        panel.showModal();
        panel.querySelector("h2").focus({ preventScroll: true });
      }
    } else {
      if (panel.open) panel.close();
      panel.hidden = true;
    }
    settings.setAttribute("aria-expanded", String(visible));
  };
  const stopAnalytics = () => {
    window[disableKey] = true;
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.trim().split("=")[0];
      if (name === "_ga" || name === `_ga_${measurementId.slice(2)}`) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      }
    }
  };
  const startAnalytics = () => {
    window[disableKey] = false;
    if (!initialized) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      window.gtag("js", new Date());
      const config = {
        send_page_view: false,
        page_location: location.origin + location.pathname,
        page_referrer: document.referrer ? new URL(document.referrer).origin + "/" : "",
        page_title: document.title,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
        cookie_path: "/",
        cookie_expires: 60 * 60 * 24 * 365
      };
      const params = new URLSearchParams(location.search);
      for (const [query, field] of [
        ["utm_source", "campaign_source"],
        ["utm_medium", "campaign_medium"],
        ["utm_campaign", "campaign_name"]
      ]) {
        const value = params.get(query);
        if (value && /^[A-Za-z0-9_-]{1,80}$/.test(value)) config[field] = value;
      }
      window.gtag("config", measurementId, config);
      const tag = document.createElement("script");
      tag.async = true;
      tag.referrerPolicy = "origin";
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      tag.addEventListener("error", () => {
        console.error("Google Analytics could not load; website access is unaffected.");
        loadFailed = true;
        if (choice === "accepted") {
          clearFeedback();
          status.textContent = loadFailureMessage;
          showPanel(true);
        }
      });
      document.head.appendChild(tag);
      initialized = true;
      window.gtag("event", "page_view", { send_to: measurementId });
    }
  };
  const applyChoice = value => {
    choice = value;
    if (choice === "accepted") startAnalytics();
    else stopAnalytics();
    updateControls();
    showPanel(choice !== "accepted" && choice !== "rejected");
    if (choice === "accepted" && loadFailed) {
      status.textContent = loadFailureMessage;
      showPanel(true);
    }
  };
  settings.hidden = false;
  settings.addEventListener("click", () => {
    clearFeedback();
    showPanel(panel.hidden);
  });
  const dismissPanel = event => {
    event.preventDefault();
    showPanel(false);
  };
  panel.addEventListener("cancel", dismissPanel);
  panel.addEventListener("keydown", event => {
    if (event.key === "Escape") dismissPanel(event);
  });
  panel.querySelectorAll("[data-analytics-choice]").forEach(button => {
    button.addEventListener("click", () => {
      status.textContent = "";
      try {
        localStorage.setItem(storageKey, button.dataset.analyticsChoice);
      } catch (error) {
        storageFailure(error);
      }
      applyChoice(button.dataset.analyticsChoice);
      if (status.textContent) showPanel(true);
      else {
        confirmChoice("Thank you!");
      }
    });
  });
  window.addEventListener("storage", event => {
    if (event.key === storageKey || event.key === null) {
      clearFeedback();
      status.textContent = "";
      applyChoice(readChoice());
      if (status.textContent) showPanel(true);
    }
  });
  document.addEventListener("click", event => {
    if (choice !== "accepted" || !(event.target instanceof Element)) return;
    const anchor = event.target.closest("a[data-region-channel]");
    if (!anchor || new URL(anchor.href).hostname !== "chat.whatsapp.com") return;
    const region = anchor.dataset.regionChannel;
    if (!/^[a-z0-9-]+$/.test(region || "")) return;
    window.gtag("event", "whatsapp_join_click", {
      send_to: measurementId,
      region_id: region
    });
  });
  applyChoice(readChoice());
})();
