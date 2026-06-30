/* =========================================================================
 * Tokens Control — Instant by Default
 * -------------------------------------------------------------------------
 * 1. When a new ChatGPT chat opens, force the model to "GPT-5.3 Instant".
 * 2. If the user tries to pick a heavier model (Thinking, High, Extra High,
 *    Pro, Medium), intercept the click and show a warning. They may proceed
 *    if they confirm; otherwise the selection is cancelled.
 *
 * ChatGPT's DOM changes often, so everything here is text-based and tolerant
 * of layout shifts. Tune the CONFIG block if OpenAI renames things.
 * ========================================================================= */
(() => {
  "use strict";

  const CONFIG = {
    // --- Default we enforce on every new chat: "GPT-5.3 Instant" ---
    // The intelligence/speed level (a menuitemradio in the main menu).
    DEFAULT_INTELLIGENCE: "Instant",
    // The underlying model version, which lives in the submenu (GPT-5.5 ›).
    // Matched against the menu item's visible text.
    DEFAULT_MODEL_VERSION: "GPT-5.3",
    // Heavy intelligence levels that should trigger a warning.
    HEAVY_MODELS: ["Thinking", "Extra High", "High", "Pro", "Medium"],
    // Heavy base models (in the version submenu) that should also warn.
    HEAVY_VERSIONS: ["GPT-5.5", "GPT-5.4"],
    DEBUG: false,
  };

  // Kept for the heavy-model warning logic (the "safe" level that never warns).
  CONFIG.DEFAULT_MODEL = CONFIG.DEFAULT_INTELLIGENCE;

  /* ---------------------------------------------------------------------- */
  /* Localization — English / Spanish (anything else falls back to English)  */
  /* ---------------------------------------------------------------------- */

  const LANG = (() => {
    const l = (
      navigator.language ||
      navigator.userLanguage ||
      "en"
    ).toLowerCase();
    return l.startsWith("es") ? "es" : "en";
  })();

  // Visual severity per heavy option (locale-independent).
  //   "mild"    → subtle teal nudge
  //   "heavy"   → amber caution
  //   "extreme" → red, with a token-cost badge
  const HEAVY_TIERS = {
    "GPT-5.5": "extreme",
    "GPT-5.4": "heavy",
    "Extra High": "extreme",
    Pro: "extreme",
    High: "heavy",
    Thinking: "heavy",
    Medium: "mild",
  };

  const I18N = {
    en: {
      keep: "Keep GPT-5.3 Instant",
      proceed: "Yes, I really need it",
      warningText:
        "Are you sure this task needs a super computer and a PhD team to be done!!!",
      switchTo: (label) =>
        `You're about to switch to ${label}. Instant usually gets the job done for a fraction of the cost.`,
      messages: {
        "GPT-5.5": {
          title: "Whoa — that's the NASA-grade supercomputer 🚀",
          body: "GPT-5.5 is built for protein design, aerospace simulations, and frontier research. For everyday tasks it's like booking a rocket to cross the street.",
          badge: "Up to 5× the tokens",
        },
        "GPT-5.4": {
          title: "That's a heavy research model 🧠",
          body: "GPT-5.4 digs far deeper than Instant — great for genuinely complex reasoning, overkill (and pricier) for routine work.",
        },
        "Extra High": {
          title: "Extra High is deep-research mode 🔬",
          body: "It explores many paths and reasons across variables — like a research team on the clock.",
          badge: "Up to 5× the tokens",
        },
        Pro: {
          title: "Pro spins up parallel supercompute 🚀",
          body: "Maximum reasoning, maximum cost. Reserve it for the truly complex.",
          badge: "Highest token usage",
        },
        High: {
          title: "High effort = a lot more thinking ⚡",
          body: "PhD-level deliberation. Worth it for hard problems, wasteful for emails and summaries.",
        },
        Thinking: {
          title: "Thinking mode = slow, deep reasoning 🧠",
          body: "Great for hard logic, overkill for quick asks.",
        },
        Medium: {
          title: "Sure you need Medium? 🤔",
          body: "Instant already handles most tasks. Medium just thinks a bit harder and costs a bit more.",
        },
      },
      gate: {
        locking: "Locking in GPT-5.3 Instant…",
        lockingSub: "Hang tight — getting this chat set up on the right model.",
        ready: "GPT-5.3 Instant ready ⚡",
        readySub: "All set. You're good to go.",
        failTitle: "Couldn't switch automatically",
        failSub: "Pick GPT-5.3 Instant manually, or let me try again.",
        retry: "Try again",
        dismiss: "I'll do it",
      },
    },
    es: {
      keep: "Mantener GPT-5.3 Instant",
      proceed: "Sí, de verdad lo necesito",
      warningText:
        "¿Seguro que esta tarea necesita una supercomputadora y un equipo de doctorado para resolverse?",
      switchTo: (label) =>
        `Estás a punto de cambiar a ${label}. Instant suele bastar por una fracción del costo.`,
      messages: {
        "GPT-5.5": {
          title: "Uy — esa es la supercomputadora nivel NASA 🚀",
          body: "GPT-5.5 está hecho para diseño de proteínas, simulaciones aeroespaciales e investigación de frontera. Para tareas del día a día es como reservar un cohete para cruzar la calle.",
          badge: "Hasta 5× los tokens",
        },
        "GPT-5.4": {
          title: "Ese es un modelo de investigación pesado 🧠",
          body: "GPT-5.4 razona mucho más profundo que Instant — ideal para problemas realmente complejos, excesivo (y más caro) para trabajo rutinario.",
        },
        "Extra High": {
          title: "Extra High es modo investigación profunda 🔬",
          body: "Explora muchos caminos y razona entre variables — como un equipo de investigación a contrarreloj.",
          badge: "Hasta 5× los tokens",
        },
        Pro: {
          title: "Pro enciende supercómputo en paralelo 🚀",
          body: "Máximo razonamiento, máximo costo. Resérvalo para lo realmente complejo.",
          badge: "El mayor consumo de tokens",
        },
        High: {
          title: "High = pensar mucho más ⚡",
          body: "Deliberación nivel doctorado. Vale la pena para problemas difíciles, un desperdicio para correos y resúmenes.",
        },
        Thinking: {
          title: "Modo Thinking = razonamiento lento y profundo 🧠",
          body: "Ideal para lógica difícil, excesivo para preguntas rápidas.",
        },
        Medium: {
          title: "¿Seguro que necesitas Medium? 🤔",
          body: "Instant ya resuelve la mayoría de las tareas. Medium solo piensa un poco más y cuesta un poco más.",
        },
      },
      gate: {
        locking: "Activando GPT-5.3 Instant…",
        lockingSub: "Un momento — dejando este chat con el modelo correcto.",
        ready: "GPT-5.3 Instant listo ⚡",
        readySub: "Todo listo. Puedes continuar.",
        failTitle: "No se pudo cambiar automáticamente",
        failSub: "Selecciona GPT-5.3 Instant manualmente, o deja que lo intente de nuevo.",
        retry: "Intentar de nuevo",
        dismiss: "Lo hago yo",
      },
    },
  };

  const T = I18N[LANG];

  const log = (...a) => CONFIG.DEBUG && console.log("[TokensControl]", ...a);

  // A flag set on a node when WE re-fire its click after the user confirms,
  // so our own interceptor lets it through.
  const BYPASS = "__tokensControlBypass";

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                 */
  /* ---------------------------------------------------------------------- */

  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();

  // Does this menu-item text correspond to a heavy model? Returns the matched
  // label (e.g. "High", "GPT-5.4") or null. Matches both intelligence levels
  // and heavy base-model versions.
  function heavyModelMatch(text) {
    const t = norm(text).toLowerCase();
    if (!t) return null;
    // Never warn on the default we enforce (Instant level / GPT-5.3 version).
    if (t.includes(CONFIG.DEFAULT_MODEL.toLowerCase())) return null;
    if (t.includes(CONFIG.DEFAULT_MODEL_VERSION.toLowerCase())) return null;
    for (const v of CONFIG.HEAVY_VERSIONS) {
      if (t.includes(v.toLowerCase())) return v;
    }
    for (const m of CONFIG.HEAVY_MODELS) {
      if (t.includes(m.toLowerCase())) return m;
    }
    return null;
  }

  // Walk up from an event target to find the actual selectable menu option.
  function closestMenuItem(el) {
    if (!el || !el.closest) return null;
    return el.closest(
      '[role="menuitem"],[role="option"],[role="menuitemradio"],li,a,button'
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Warning modal                                                           */
  /* ---------------------------------------------------------------------- */

  function messageFor(label) {
    const tier = HEAVY_TIERS[label] || "heavy";
    const m = T.messages[label];
    if (m) return { tier, ...m };
    // Fallback for any heavy item without a tailored entry.
    return { tier, title: T.warningText, body: T.switchTo(label) };
  }

  function showWarning(label) {
    return new Promise((resolve) => {
      // Remove any stale modal.
      document.getElementById("tc-modal-overlay")?.remove();

      const msg = messageFor(label);
      const badge = msg.badge
        ? `<div id="tc-modal-badge">⚡ ${escapeHtml(msg.badge)}</div>`
        : "";

      const overlay = document.createElement("div");
      overlay.id = "tc-modal-overlay";
      overlay.innerHTML = `
        <div id="tc-modal" class="tc-tier-${escapeHtml(msg.tier)}"
             role="alertdialog" aria-modal="true" aria-labelledby="tc-modal-title">
          <h2 id="tc-modal-title">${escapeHtml(msg.title)}</h2>
          <p id="tc-modal-sub">${escapeHtml(msg.body)}</p>
          ${badge}
          <div id="tc-modal-actions">
            <button id="tc-cancel" class="tc-btn tc-btn-primary">${escapeHtml(
              T.keep
            )}</button>
            <button id="tc-proceed" class="tc-btn tc-btn-ghost">${escapeHtml(
              T.proceed
            )}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      const cleanup = (val) => {
        overlay.remove();
        document.removeEventListener("keydown", onKey, true);
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cleanup(false);
        }
      };

      overlay
        .querySelector("#tc-cancel")
        .addEventListener("click", () => cleanup(false));
      overlay
        .querySelector("#tc-proceed")
        .addEventListener("click", () => cleanup(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
      });
      document.addEventListener("keydown", onKey, true);
      overlay.querySelector("#tc-cancel").focus();
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---------------------------------------------------------------------- */
  /* Blocking gate — locks the page until GPT-5.3 Instant is confirmed        */
  /* ---------------------------------------------------------------------- */

  function buildGate() {
    let overlay = document.getElementById("tc-gate-overlay");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "tc-gate-overlay";
    overlay.innerHTML = `
      <div id="tc-gate" role="alertdialog" aria-modal="true" aria-live="polite">
        <div id="tc-gate-spinner"></div>
        <svg id="tc-gate-check" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <h2 id="tc-gate-title">${escapeHtml(T.gate.locking)}</h2>
        <p id="tc-gate-sub">${escapeHtml(T.gate.lockingSub)}</p>
        <div id="tc-gate-actions"></div>
      </div>`;
    // Swallow every interaction while the gate is up.
    ["click", "pointerdown", "pointerup", "keydown", "wheel", "touchstart"].forEach(
      (t) =>
        overlay.addEventListener(
          t,
          (e) => {
            // Allow clicks on our own action buttons through.
            if (e.target.closest && e.target.closest("#tc-gate-actions")) return;
            e.preventDefault();
            e.stopPropagation();
          },
          true
        )
    );
    return overlay;
  }

  function showGate() {
    const overlay = buildGate();
    if (!overlay.isConnected) document.body.appendChild(overlay);
    overlay.querySelector("#tc-gate-spinner").style.display = "block";
    overlay.querySelector("#tc-gate-check").style.display = "none";
    overlay.querySelector("#tc-gate-actions").style.display = "none";
    overlay.querySelector("#tc-gate-title").textContent = T.gate.locking;
    overlay.querySelector("#tc-gate-sub").textContent = T.gate.lockingSub;
  }

  function gateSuccess() {
    const overlay = document.getElementById("tc-gate-overlay");
    if (!overlay) return;
    overlay.querySelector("#tc-gate-spinner").style.display = "none";
    overlay.querySelector("#tc-gate-check").style.display = "block";
    overlay.querySelector("#tc-gate-title").textContent = T.gate.ready;
    overlay.querySelector("#tc-gate-sub").textContent = T.gate.readySub;
    setTimeout(removeGate, 750);
  }

  function gateFailed() {
    const overlay = document.getElementById("tc-gate-overlay");
    if (!overlay) return;
    overlay.querySelector("#tc-gate-spinner").style.display = "none";
    overlay.querySelector("#tc-gate-check").style.display = "none";
    overlay.querySelector("#tc-gate-title").textContent = T.gate.failTitle;
    overlay.querySelector("#tc-gate-sub").textContent = T.gate.failSub;
    const actions = overlay.querySelector("#tc-gate-actions");
    actions.style.display = "flex";
    actions.innerHTML = `
      <button id="tc-gate-retry" class="tc-btn tc-btn-primary">${escapeHtml(
        T.gate.retry
      )}</button>
      <button id="tc-gate-dismiss" class="tc-btn tc-btn-ghost">${escapeHtml(
        T.gate.dismiss
      )}</button>`;
    actions.querySelector("#tc-gate-retry").onclick = () => {
      lastGateRun = 0; // allow an immediate retry
      showGate();
      runGate();
    };
    actions.querySelector("#tc-gate-dismiss").onclick = removeGate;
    // Never trap the user: auto-dismiss the failure state after a few seconds.
    setTimeout(removeGate, 6000);
  }

  function removeGate() {
    document.getElementById("tc-gate-overlay")?.remove();
  }

  /* ---------------------------------------------------------------------- */
  /* Interceptor — capture pointer/click on model menu items                 */
  /* -------------------------------------------------------------------------
   * ChatGPT's model menu is built with Radix UI. Radix menu items commit
   * their selection on POINTER events (pointerup), not on a plain "click",
   * and the menu closes immediately. So a click-only listener is too late.
   * We intercept pointerdown / pointerup / click in the capture phase and
   * swallow the whole interaction for one gesture, then either cancel or
   * re-fire a real click (which Radix also honours) after the user decides.
   * ---------------------------------------------------------------------- */

  let dialogOpen = false;

  async function handleInterception(e) {
    const item = closestMenuItem(e.target);
    if (!item) return;

    if (item[BYPASS]) {
      // Our own re-dispatched event — let this one gesture through.
      return;
    }

    // Skip menu *openers* (the switcher button and the submenu arrow) — those
    // just navigate; only the leaf options should be matched. Both carry
    // aria-haspopup="menu".
    if (item.getAttribute("aria-haspopup") === "menu") return;

    const model = heavyModelMatch(item.textContent);
    if (!model) return;

    // Block ChatGPT/Radix from acting on this gesture.
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    // Only show one dialog per gesture (pointerdown fires first; we ignore
    // the following pointerup/click for the same interaction).
    if (dialogOpen) return;
    dialogOpen = true;

    log("Intercepted heavy model:", model);
    const isVersion = CONFIG.HEAVY_VERSIONS.some(
      (v) => v.toLowerCase() === model.toLowerCase()
    );
    const proceed = await showWarning(model);
    dialogOpen = false;

    if (proceed) {
      // User explicitly chose the heavy model — don't let the gate fight them.
      userOverride = true;
      if (item.isConnected) {
        // Menu still open — re-fire the original selection.
        pointerClick(item);
      } else {
        // Menu closed behind the modal — re-open and select it cleanly.
        await applySelection(model, isVersion);
      }
    } else {
      // "Keep Instant" → always fall back to GPT-5.3 Instant.
      closeMenu();
      await sleep(200);
      await enforceDefaultModel();
    }
  }

  // Programmatically select an intelligence level or a model version.
  async function applySelection(label, isVersion) {
    if (!(await openMenu())) return;
    let opt = findRadio(label);
    if (isVersion && !opt) {
      const trigger = findSubmenuTrigger();
      if (trigger) {
        for (let i = 0; i < 4 && !opt; i++) {
          openSubmenu(trigger);
          await sleep(320);
          opt = findRadio(label);
        }
      }
    }
    if (opt) pointerClick(opt);
  }

  // Capture phase, earliest first: pointerdown is where Radix begins selection.
  ["pointerdown", "pointerup", "click"].forEach((type) =>
    document.addEventListener(type, handleInterception, true)
  );

  /* ---------------------------------------------------------------------- */
  /* Default model enforcement on new chats                                  */
  /* -------------------------------------------------------------------------
   * Goal: every new chat starts on "GPT-5.3 Instant", i.e. intelligence
   * level = Instant AND model version = GPT-5.3 (which lives in a Radix
   * submenu). Selecting a menu item closes the menu, and the two choices are
   * in separate radio groups, so we may need two passes. Everything is driven
   * by synthetic pointer events (no screen coordinates) so it works headless
   * and regardless of window scaling.
   * ---------------------------------------------------------------------- */

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // The composer button that shows the current model (e.g. "5.3 Instant").
  function findModelSwitcherButton() {
    const candidates = document.querySelectorAll(
      'button[aria-haspopup="menu"],button[data-testid*="model"],button[id*="model"]'
    );
    for (const b of candidates) {
      const t = norm(b.textContent).toLowerCase();
      if (t.includes("gpt") || t.includes("instant") || t.includes("model")) {
        return b;
      }
      // After we set it, the button reads like "5.3 Instant" / "5.5 Pro".
      if (/\d+\.\d+/.test(t)) return b;
    }
    return null;
  }

  function currentModelText() {
    const b = findModelSwitcherButton();
    return b ? norm(b.textContent) : "";
  }

  const menuIsOpen = () => !!document.querySelector('[role="menu"]');

  function menuItems() {
    return [
      ...document.querySelectorAll('[role="menuitemradio"],[role="menuitem"]'),
    ];
  }

  // Find a radio option (intelligence level or model version) by text.
  function findRadio(text) {
    const t = text.toLowerCase();
    return menuItems().find(
      (it) =>
        it.getAttribute("role") === "menuitemradio" &&
        norm(it.textContent).toLowerCase().includes(t)
    );
  }

  // The submenu trigger that holds the model versions (has aria-haspopup).
  function findSubmenuTrigger() {
    return menuItems().find(
      (it) =>
        it.getAttribute("aria-haspopup") === "menu" &&
        /gpt|\d+\.\d+/i.test(norm(it.textContent))
    );
  }

  // Fire a real pointer+click on a Radix item (it commits on these events).
  // Radix checks button === 0 and isPrimary, and expects the pointer to have
  // hovered the item first — so we send a full, faithful gesture.
  function pointerClick(el) {
    const r = el.getBoundingClientRect();
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      clientX: r.x + r.width / 2,
      clientY: r.y + r.height / 2,
    };
    el[BYPASS] = true; // don't let our own warning interceptor catch this
    try {
      el.dispatchEvent(new PointerEvent("pointerover", base));
      el.dispatchEvent(new PointerEvent("pointerenter", base));
      el.dispatchEvent(new PointerEvent("pointermove", base));
      el.dispatchEvent(new MouseEvent("mousemove", base));
      el.dispatchEvent(new PointerEvent("pointerdown", { ...base, buttons: 1 }));
      el.dispatchEvent(new MouseEvent("mousedown", { ...base, buttons: 1 }));
      el.focus?.();
      el.dispatchEvent(new PointerEvent("pointerup", { ...base, buttons: 0 }));
      el.dispatchEvent(new MouseEvent("mouseup", { ...base, buttons: 0 }));
      el.dispatchEvent(new MouseEvent("click", { ...base, detail: 1 }));
    } catch (e) {
      /* ignore */
    }
    setTimeout(() => (el[BYPASS] = false), 0);
  }

  // Open a Radix submenu flyout. Synthetic *hover* does NOT reliably trip
  // Radix's hover-intent timer, so we drive it by keyboard (focus the trigger
  // then press ArrowRight), which is deterministic. Hover is kept as a backup.
  function openSubmenu(trigger) {
    trigger.focus?.();
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        code: "ArrowRight",
        keyCode: 39,
        which: 39,
        bubbles: true,
      })
    );
    const r = trigger.getBoundingClientRect();
    const o = {
      bubbles: true,
      cancelable: true,
      view: window,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      clientX: r.x + r.width / 2,
      clientY: r.y + r.height / 2,
    };
    ["pointerover", "pointerenter", "pointermove"].forEach((t) =>
      trigger.dispatchEvent(new PointerEvent(t, o))
    );
  }

  async function openMenu() {
    if (menuIsOpen()) return true;
    const btn = findModelSwitcherButton();
    if (!btn) return false;
    // The switcher is a Radix trigger that opens on pointerdown, not a plain
    // click — so fire the full pointer sequence.
    pointerClick(btn);
    await sleep(280);
    return menuIsOpen();
  }

  function closeMenu() {
    if (menuIsOpen()) document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
  }

  function isAtDefault() {
    const t = currentModelText().toLowerCase();
    const ver = CONFIG.DEFAULT_MODEL_VERSION.toLowerCase().replace(/[^0-9.]/g, "");
    return (
      t.includes(CONFIG.DEFAULT_INTELLIGENCE.toLowerCase()) &&
      (!ver || t.includes(ver))
    );
  }

  let enforcing = false;
  async function enforceDefaultModel(attempt = 0) {
    if (enforcing) return;
    if (!currentModelText()) {
      // Switcher not mounted yet — retry a few times.
      if (attempt < 6) setTimeout(() => enforceDefaultModel(attempt + 1), 500);
      return;
    }
    if (isAtDefault()) return;

    enforcing = true;
    try {
      // ---- Pass A: intelligence level (Instant) ----
      if (await openMenu()) {
        const intel = findRadio(CONFIG.DEFAULT_INTELLIGENCE);
        if (intel && intel.getAttribute("aria-checked") !== "true") {
          pointerClick(intel); // this closes the menu
          await sleep(350);
        }
      }

      // ---- Pass B: model version (GPT-5.3) via submenu ----
      if (!(await openMenu())) return;
      const trigger = findSubmenuTrigger();
      if (trigger) {
        // Opening the submenu can occasionally miss — retry until GPT-5.3 shows.
        let model = null;
        for (let i = 0; i < 4 && !model; i++) {
          openSubmenu(trigger);
          await sleep(320);
          model = findRadio(CONFIG.DEFAULT_MODEL_VERSION);
        }
        if (model && model.getAttribute("aria-checked") !== "true") {
          pointerClick(model);
          await sleep(300);
          log("Set default model to", CONFIG.DEFAULT_MODEL_VERSION, "Instant.");
        } else {
          closeMenu();
        }
      } else {
        closeMenu();
      }
    } finally {
      await sleep(300);
      enforcing = false;
    }
  }

  // Detect "new chat" by URL changes and initial load.
  let lastPath = location.pathname;
  function isNewChat() {
    const p = location.pathname;
    // ChatGPT uses "/" or "/?..." for a brand-new chat.
    return p === "/" || p === "" || p.startsWith("/g/") || p === "/new";
  }

  // Wait until a predicate is true (or timeout). Returns true if satisfied.
  async function waitUntil(fn, timeout = 8000, step = 250) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (fn()) return true;
      await sleep(step);
    }
    return fn();
  }

  // True once the user has explicitly confirmed a heavy model — the gate must
  // not fight that choice until a genuinely new chat begins.
  let userOverride = false;

  let gating = false;
  let lastGateRun = 0;
  async function runGate() {
    if (gating) return;
    if (userOverride) return; // user chose a heavy model on purpose
    // Debounce: ignore re-triggers within 3s (in-page nav churn).
    if (Date.now() - lastGateRun < 3000) return;
    lastGateRun = Date.now();
    gating = true;

    // Safety net: the gate can NEVER lock the page permanently.
    const failsafe = setTimeout(removeGate, 9000);

    try {
      // Lock the page while we validate.
      showGate();

      // Wait for the model switcher to mount.
      await waitUntil(() => currentModelText(), 6000);

      if (isAtDefault()) {
        gateSuccess();
        return;
      }

      // Try to enforce, re-checking after each attempt.
      for (let attempt = 0; attempt < 3; attempt++) {
        await enforceDefaultModel();
        if (await waitUntil(isAtDefault, 1200, 200)) {
          gateSuccess();
          return;
        }
      }

      // Couldn't switch automatically — show the manual fallback, which
      // auto-dismisses so the page is never trapped.
      gateFailed();
    } finally {
      clearTimeout(failsafe);
      gating = false;
    }
  }

  function maybeEnforce() {
    if (isNewChat()) {
      runGate();
    } else {
      // Left the new-chat screen — make sure no stale gate remains.
      removeGate();
    }
  }

  // Watch for SPA navigation.
  const _push = history.pushState;
  history.pushState = function () {
    _push.apply(this, arguments);
    queueMicrotask(onNav);
  };
  const _replace = history.replaceState;
  history.replaceState = function () {
    _replace.apply(this, arguments);
    queueMicrotask(onNav);
  };
  window.addEventListener("popstate", onNav);

  function onNav() {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      userOverride = false; // a real navigation = fresh start, re-enforce
      maybeEnforce();
    }
  }

  // Initial run once the DOM settles.
  maybeEnforce();
  log("Tokens Control active.");
})();
