/* Tokens Control — popup: language preference (Auto / English / Español) */
(() => {
  "use strict";

  const STORAGE_KEY = "tcLang";
  const opts = [...document.querySelectorAll(".opt")];
  const savedEl = document.getElementById("saved");

  // Show which language "Auto" currently resolves to, based on the browser.
  const autoLang = (navigator.language || "en").toLowerCase().startsWith("es")
    ? "Español"
    : "English";
  document.getElementById("auto-note").textContent = ` · ${autoLang}`;

  function paint(pref) {
    const value = pref || "auto";
    opts.forEach((o) => o.classList.toggle("active", o.dataset.lang === value));
  }

  function flashSaved() {
    savedEl.classList.add("show");
    setTimeout(() => savedEl.classList.remove("show"), 1200);
  }

  // Load the current preference.
  chrome.storage.sync.get([STORAGE_KEY], (res) => {
    paint(res && res[STORAGE_KEY]);
  });

  // Save on click.
  opts.forEach((o) => {
    o.addEventListener("click", () => {
      const value = o.dataset.lang;
      paint(value);
      chrome.storage.sync.set({ [STORAGE_KEY]: value }, flashSaved);
    });
  });
})();
