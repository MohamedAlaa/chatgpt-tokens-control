/* =========================================================================
 * Tokens Control — STRICT edition
 * -------------------------------------------------------------------------
 * Hard lock, not a nudge:
 *   1. Continuously KEEPS ONLY the allowed model version(s) in ChatGPT's model
 *      menu (a whitelist), removing every other version — GPT-5.4, GPT-5.5,
 *      o3, and anything OpenAI adds later. Because the heavy intelligence
 *      levels (Medium / High / Extra High / Pro) only exist under the flagship
 *      models, removing those versions makes every heavy option disappear —
 *      leaving GPT-5.3 Instant as the only path.
 *   2. Auto-selects GPT-5.3 Instant on every new chat.
 *
 * Everything is text-based and tolerant of ChatGPT's shifting DOM. Tune the
 * CONFIG block if OpenAI renames things.
 * ========================================================================= */
(() => {
  "use strict";

  const CONFIG = {
    DEFAULT_INTELLIGENCE: "Instant",
    DEFAULT_MODEL_VERSION: "GPT-5.3",
    // Whitelist: the ONLY model version(s) allowed to stay in the menu. Every
    // other model version is removed, so new/heavier models are blocked by
    // default without having to maintain a blacklist.
    ALLOWED_VERSIONS: ["GPT-5.3"],
    DEBUG: false,
  };

  const log = (...a) => CONFIG.DEBUG && console.log("[TokensControl:Strict]", ...a);
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------------------------------------------------------------- */
  /* Language-agnostic matching                                               */
  /* -------------------------------------------------------------------------
   * ChatGPT LOCALIZES the intelligence levels:
   *   Instant -> "Instantánea"   Medium -> "Media"
   *   High    -> "Alta"          Extra High -> "Muy alta"
   * Model VERSIONS (GPT-5.3, GPT-5.5, o3) are NOT localized.
   * So we match levels against aliases (accent-insensitive) and normalize back
   * to canonical English keys. Add a language by extending the alias lists.
   * ---------------------------------------------------------------------- */

  const deaccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const key = (s) => deaccent(norm(s).toLowerCase());

  const INTELLIGENCE_ALIASES = {
    Instant: ["instant", "instantanea"],
    Medium: ["medium", "media"],
    High: ["high", "alta"],
    "Extra High": ["extra high", "muy alta"],
    Pro: ["pro"],
    Thinking: ["thinking", "razonamiento", "pensamiento"],
  };
  const ALL_ALIASES = Object.values(INTELLIGENCE_ALIASES).flat();

  // Exact-match a menu item's text to a canonical intelligence level, or null.
  function intelligenceKey(text) {
    const t = key(text);
    for (const canon of Object.keys(INTELLIGENCE_ALIASES)) {
      if (INTELLIGENCE_ALIASES[canon].includes(t)) return canon;
    }
    return null;
  }

  // Custom GPTs live under /g/g-<hash>... — leave them completely alone (no
  // prune, no gate, no auto-select). Projects use the /g/g-p- prefix and are
  // NOT GPTs, so they're handled like normal chats.
  const isGptPage = () =>
    location.pathname.startsWith("/g/") &&
    !location.pathname.startsWith("/g/g-p");

  // True while the gate is opening menus to select GPT-5.3. Declared up here so
  // pruneBlocked() (called immediately below) can read it without a TDZ error.
  let gating = false;

  /* ---------------------------------------------------------------------- */
  /* Keep only the whitelisted model version(s); remove all others           */
  /* ---------------------------------------------------------------------- */

  // Does this menu item look like a model *version* (e.g. "GPT-5.3", "o3")
  // rather than an intelligence level ("Instant", "High", "Pro", …)?
  function isModelVersion(text) {
    return /^gpt/i.test(text) || /^o\d/i.test(text);
  }

  function isAllowedVersion(text) {
    return CONFIG.ALLOWED_VERSIONS.some((v) => text === v || text.startsWith(v));
  }

  function pruneBlocked() {
    if (isGptPage()) return 0; // never alter a custom GPT's menu
    // Don't disturb the menu while our own enforcement is navigating it —
    // removing nodes from the open Radix menu mid-selection can break it.
    if (gating) return 0;
    let removed = 0;
    document.querySelectorAll('[role="menuitemradio"]').forEach((it) => {
      const t = norm(it.textContent);
      if (!t) return;
      // Only touch model versions; leave intelligence levels alone.
      if (!isModelVersion(t)) return;
      // Whitelist: remove any version that isn't explicitly allowed.
      if (!isAllowedVersion(t)) {
        it.remove();
        removed++;
      }
    });
    if (removed) log("Removed", removed, "non-whitelisted version option(s).");
    return removed;
  }

  // Watch the whole document — the model menu mounts/unmounts on demand, so we
  // prune on every relevant DOM change (debounced to a microtask).
  let pruneQueued = false;
  const observer = new MutationObserver(() => {
    if (pruneQueued) return;
    pruneQueued = true;
    queueMicrotask(() => {
      pruneQueued = false;
      pruneBlocked();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  pruneBlocked();

  /* ---------------------------------------------------------------------- */
  /* Auto-select GPT-5.3 Instant on new chats                                */
  /* ---------------------------------------------------------------------- */

  const menuIsOpen = () => !!document.querySelector('[role="menu"]');
  const menuItems = () => [
    ...document.querySelectorAll('[role="menuitemradio"],[role="menuitem"]'),
  ];

  function findModelSwitcherButton() {
    const candidates = document.querySelectorAll(
      'button[aria-haspopup="menu"],button[data-testid*="model"]'
    );
    for (const b of candidates) {
      const t = key(b.textContent);
      if (!t) continue;
      if (t.includes("gpt") || t.includes("model") || t.includes("modelo")) return b;
      if (/\d+\.\d+/.test(t)) return b;
      // The button often shows only the level name, localized ("Media", "Alta"…)
      if (ALL_ALIASES.some((a) => t.includes(a))) return b;
    }
    return null;
  }

  // The menu item for a canonical intelligence level, in any language.
  const findIntelligenceRadio = (canon) =>
    menuItems().find(
      (it) =>
        it.getAttribute("role") === "menuitemradio" &&
        intelligenceKey(it.textContent) === canon
    );

  const currentModelText = () => {
    const b = findModelSwitcherButton();
    return b ? norm(b.textContent) : "";
  };

  const findRadio = (text) =>
    menuItems().find(
      (it) =>
        it.getAttribute("role") === "menuitemradio" &&
        norm(it.textContent).toLowerCase().includes(text.toLowerCase())
    );

  const findSubmenuTrigger = () =>
    menuItems().find(
      (it) =>
        it.getAttribute("aria-haspopup") === "menu" &&
        /gpt|\d+\.\d+/i.test(norm(it.textContent))
    );

  function pointerClick(el) {
    if (!el) return;
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
    try {
      el.dispatchEvent(new PointerEvent("pointerover", base));
      el.dispatchEvent(new PointerEvent("pointermove", base));
      el.dispatchEvent(new PointerEvent("pointerdown", { ...base, buttons: 1 }));
      el.focus?.();
      el.dispatchEvent(new PointerEvent("pointerup", { ...base, buttons: 0 }));
      el.dispatchEvent(new MouseEvent("click", { ...base, detail: 1 }));
    } catch (e) {
      /* ignore */
    }
  }

  // Radix submenus open reliably via keyboard (focus + ArrowRight), not hover.
  function openSubmenu(trigger) {
    if (!trigger) return;
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
  }

  async function openMenu() {
    if (menuIsOpen()) return true;
    const btn = findModelSwitcherButton();
    if (!btn) return false;
    pointerClick(btn);
    await sleep(300);
    return menuIsOpen();
  }

  function closeMenu() {
    if (menuIsOpen())
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
  }

  function isAtDefault() {
    const t = key(currentModelText()); // e.g. "5.3 instantanea" or "media"
    if (!t) return false;
    const ver = CONFIG.DEFAULT_MODEL_VERSION.toLowerCase().replace(/[^0-9.]/g, "");
    const onDefaultLevel = INTELLIGENCE_ALIASES[CONFIG.DEFAULT_INTELLIGENCE].some(
      (a) => t.includes(a)
    );
    return onDefaultLevel && t.includes(ver);
  }

  let enforcing = false;
  async function enforceDefault(attempt = 0) {
    if (enforcing) return;
    if (!currentModelText()) {
      if (attempt < 6) setTimeout(() => enforceDefault(attempt + 1), 500);
      return;
    }
    if (isAtDefault()) return;

    enforcing = true;
    try {
      // Intelligence → Instant (matched in any language)
      if (await openMenu()) {
        const intel = findIntelligenceRadio(CONFIG.DEFAULT_INTELLIGENCE);
        if (intel && intel.getAttribute("aria-checked") !== "true") {
          pointerClick(intel);
          await sleep(380);
        }
      }
      // Version → GPT-5.3 (via the submenu; opens with ArrowRight)
      if (!(await openMenu())) return;
      const trigger = findSubmenuTrigger();
      if (trigger) {
        let model = null;
        for (let i = 0; i < 4 && !model; i++) {
          openSubmenu(trigger);
          await sleep(320);
          model = findRadio(CONFIG.DEFAULT_MODEL_VERSION);
        }
        if (model && model.getAttribute("aria-checked") !== "true") {
          pointerClick(model);
          await sleep(320);
          log("Locked to", CONFIG.DEFAULT_MODEL_VERSION, "Instant.");
        } else {
          closeMenu();
        }
      } else {
        closeMenu();
      }
    } finally {
      await sleep(250);
      enforcing = false;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Blocking gate — locks the page until GPT-5.3 Instant is confirmed        */
  /* ---------------------------------------------------------------------- */

  // Gate copy (Spanish by default; swap these strings for another language).
  const STRINGS = {
    locking: "Activando GPT-5.3 Instant…",
    lockingSub: "Un momento — dejando este chat en el modelo correcto.",
    ready: "GPT-5.3 Instant listo ⚡",
    readySub: "Todo listo. Puedes continuar.",
    failTitle: "No se pudo cambiar automáticamente",
    failSub: "Selecciona GPT-5.3 Instant manualmente, o intenta de nuevo.",
    retry: "Intentar de nuevo",
    dismiss: "Lo hago yo",
  };

  const escapeHtml = (s) => {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  };

  async function waitUntil(fn, timeout = 6000, step = 200) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (fn()) return true;
      await sleep(step);
    }
    return fn();
  }

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
        <h2 id="tc-gate-title">${escapeHtml(STRINGS.locking)}</h2>
        <p id="tc-gate-sub">${escapeHtml(STRINGS.lockingSub)}</p>
        <div id="tc-gate-actions"></div>
      </div>`;
    ["click", "pointerdown", "pointerup", "keydown", "wheel", "touchstart"].forEach(
      (t) =>
        overlay.addEventListener(
          t,
          (e) => {
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
    overlay.querySelector("#tc-gate-title").textContent = STRINGS.locking;
    overlay.querySelector("#tc-gate-sub").textContent = STRINGS.lockingSub;
  }

  function gateSuccess() {
    const overlay = document.getElementById("tc-gate-overlay");
    if (!overlay) return;
    overlay.querySelector("#tc-gate-spinner").style.display = "none";
    overlay.querySelector("#tc-gate-check").style.display = "block";
    overlay.querySelector("#tc-gate-title").textContent = STRINGS.ready;
    overlay.querySelector("#tc-gate-sub").textContent = STRINGS.readySub;
    setTimeout(removeGate, 750);
  }

  function gateFailed() {
    const overlay = document.getElementById("tc-gate-overlay");
    if (!overlay) return;
    overlay.querySelector("#tc-gate-spinner").style.display = "none";
    overlay.querySelector("#tc-gate-check").style.display = "none";
    overlay.querySelector("#tc-gate-title").textContent = STRINGS.failTitle;
    overlay.querySelector("#tc-gate-sub").textContent = STRINGS.failSub;
    const actions = overlay.querySelector("#tc-gate-actions");
    actions.style.display = "flex";
    actions.innerHTML = `
      <button id="tc-gate-retry" class="tc-btn tc-btn-primary">${escapeHtml(
        STRINGS.retry
      )}</button>
      <button id="tc-gate-dismiss" class="tc-btn tc-btn-ghost">${escapeHtml(
        STRINGS.dismiss
      )}</button>`;
    actions.querySelector("#tc-gate-retry").onclick = () => {
      lastGateRun = 0;
      showGate();
      runGate();
    };
    actions.querySelector("#tc-gate-dismiss").onclick = removeGate;
    setTimeout(removeGate, 6000);
  }

  function removeGate() {
    document.getElementById("tc-gate-overlay")?.remove();
  }

  // (gating is declared near the top so pruneBlocked can read it.)
  let lastGateRun = 0;
  async function runGate() {
    if (gating) return;
    if (Date.now() - lastGateRun < 600) return;
    lastGateRun = Date.now();
    gating = true;
    // Failsafe: never leave the gate up — and never leave pruning paused.
    const failsafe = setTimeout(() => {
      removeGate();
      gating = false;
    }, 9000);
    try {
      // Wait for the switcher, then let it settle to THIS chat's model (after a
      // sidebar navigation it can briefly show the previous chat's model).
      await waitUntil(() => currentModelText(), 6000);
      await sleep(450);

      // Already on GPT-5.3 Instant? Nothing to do — no gate.
      if (isAtDefault()) return;

      showGate();
      for (let attempt = 0; attempt < 3; attempt++) {
        await enforceDefault();
        if (await waitUntil(isAtDefault, 1200, 200)) {
          gateSuccess();
          return;
        }
      }
      gateFailed();
    } finally {
      clearTimeout(failsafe);
      gating = false;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* New-chat detection                                                      */
  /* ---------------------------------------------------------------------- */

  let lastPath = location.pathname;
  // New chat, existing conversation (/c/...), or anything inside a Project
  // (/g/g-p-...) — but never the GPT store, settings, etc.
  const isChatPage = () => {
    const p = location.pathname;
    return (
      p === "/" ||
      p === "" ||
      p === "/new" ||
      p.startsWith("/c/") ||
      p.startsWith("/g/g-p")
    );
  };

  function maybeEnforce() {
    if (isGptPage()) {
      removeGate();
      return;
    }
    if (isChatPage()) runGate();
    else removeGate();
  }

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
      maybeEnforce();
    }
  }

  // ChatGPT's router may bypass the pushState wrappers above (it can capture
  // the native function before our script runs), so poll the URL too.
  setInterval(onNav, 400);

  maybeEnforce();
  log("Tokens Control (Strict) active.");
})();
