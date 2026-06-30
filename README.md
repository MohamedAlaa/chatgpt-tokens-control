# Tokens Control — Instant by Default

> A Chrome extension that keeps ChatGPT on the right-sized model for everyday work — and gently stops your team from firing up a supercomputer to write a two-line email.

---

## Why this exists (the frustration)

We run ChatGPT across operational departments — support, logistics, admin, field ops. People who are brilliant at their jobs but who do **not** want to think about "reasoning effort," "model tiers," or "token cost." They just want to write an email, summarize a PDF, clean up a message, and move on.

Here's the problem: **OpenAI gives enterprise admins no way to limit which models a department can use.**

There is no policy switch. No "this workspace defaults to the fast model." No "operations can't select Pro." Nothing. So what happens in practice?

The interface happily lets anyone pick **GPT-5.5 Thinking**, **Extra High**, or **Pro** — the heaviest, slowest, most expensive options on the menu — and people do, by default, for tasks that **Instant** would finish in a second for a fraction of the cost. Someone writes "Hi, please find the report attached" using the equivalent of a NASA supercomputer with a PhD research team attached to it. Multiply that by a department, every day, and you're burning time, latency, and tokens for absolutely no benefit.

I kept asking the same question: *why can't I just set a sane default and let people opt up only when they actually need to?*

The answer from the product was: you can't. So I built it.

---

## What I did about it

This frustration turned into a weekend project that became this extension — built **in collaboration with Claude** (in Cowork mode). Claude and I went back and forth: diagnosing how ChatGPT's model menu actually works under the hood, figuring out why a naïve approach silently failed, and hardening it until it behaved. The whole thing — the auto-select, the blocking gate, the playful warnings, the multi-language support — came out of that collaboration.

The result is the policy guardrail OpenAI doesn't give us, implemented at the browser level where I actually have control.

---

## What it does

1. **Defaults every new chat to `GPT-5.3 Instant`.** When you open a new chat, the extension briefly locks the screen, switches the model to the right default, validates it actually took, and then lets you go. No setup, no thinking about it.

2. **Warns you before you reach for a heavier model.** Try to switch to `GPT-5.5`, `GPT-5.4`, `Thinking`, `High`, `Extra High`, `Pro`, or `Medium`, and you get a friendly pop-up sized to the model you picked — the extreme ones get a red banner and a "this can burn up to 5× the tokens" badge. You can still proceed if you genuinely need it. It's a nudge, not a cage.

3. **"Keep Instant" always brings you back.** Decline the warning and the extension actively reverts you to `GPT-5.3 Instant` — you never get left on the heavy model by accident.

4. **Speaks your language.** Messages appear in **English** or **Spanish** based on your browser language; anything else falls back to English.

The philosophy is simple: *Instant by default, heavy by choice.*

---

## The joke that sums it up

> ⚡ **Are you sure this task needs a supercomputer and a PhD team to be done?**

That line shows up when someone tries to write a routine email on the most powerful model available. It usually gets a laugh — and then they switch back to Instant.

---

## Install (load unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top-right)
3. Click **Load unpacked** and select this folder
4. Open [chatgpt.com](https://chatgpt.com) and start a new chat

After any update to the extension files, click the **reload ↻** icon on the extension card and refresh ChatGPT.

---

## Configuration

Everything tunable lives at the top of `content.js`:

- `DEFAULT_INTELLIGENCE` / `DEFAULT_MODEL_VERSION` — the model every new chat snaps to (default `Instant` + `GPT-5.3`)
- `HEAVY_MODELS` / `HEAVY_VERSIONS` — which options trigger a warning
- `HEAVY_TIERS` — severity per option (`mild` / `heavy` / `extreme`)
- `I18N` — all message text, per language

Model names are matched by their **visible text**, so if your workspace renames a model, just update the relevant value — no other changes needed.

---

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 config, scoped to chatgpt.com / chat.openai.com |
| `content.js` | Auto-select, blocking gate, and the heavy-model warnings |
| `styles.css` | Modal and gate styling |
| `icons/` | Toolbar icons |

---

## Contributing

This project is open source — **fork it, modify it, ship your own version.** Whether you want to change the default model, rewrite the warnings, add a language, or adapt it for a totally different model menu, go for it. Pull requests and forks are equally welcome.

## License

Released under the [MIT License](./LICENSE) — do whatever you want with it, including commercial use, with no warranty. Just keep the copyright notice.

## A note

This is an unofficial, self-hosted browser extension. It is not affiliated with, endorsed by, or connected to OpenAI. It simply does at the browser level what I wish the product did at the admin level: let me set a reasonable default for the people who just need to get work done.

Built by Moha, with Claude. 🚀
