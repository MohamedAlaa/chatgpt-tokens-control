# Tokens Control — Strict (GPT-5.3 only)

A no-compromises edition of [Tokens Control](../README.md). Instead of *warning* people away from heavyweight models, it **removes them from the menu entirely**.

## What it does

1. **Keeps only `GPT-5.3` in ChatGPT's model menu (whitelist).** A `MutationObserver` strips out every other model version — GPT-5.4, GPT-5.5, o3, and anything OpenAI adds later — each time the menu renders, so they can never be selected.
2. **Locks every new chat to `GPT-5.3 Instant`.**

The trick: ChatGPT only exposes the heavy intelligence levels (`Medium`, `High`, `Extra High`, `Pro`) *under* the flagship models. Whitelisting only GPT-5.3 removes every heavier version, and the heavy levels vanish with them — leaving GPT-5.3 Instant as the only path. No nudge, no override. Because it's a whitelist, any new model OpenAI ships is blocked automatically.

## When to use this instead of the standard edition

- **Standard edition** (`../`): friendly — defaults to Instant, warns on heavy picks, but lets people proceed.
- **Strict edition** (this folder): enforced — the heavy models simply aren't there.

Use Strict for operational departments where the heavyweight models should never be an option.

## Install (load unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and select this `strict` folder
4. Refresh ChatGPT

> Load **either** the standard edition or this one — not both at once.

## Configuration

At the top of `content.js`:

- `ALLOWED_VERSIONS` — the only model version(s) allowed to stay (default `["GPT-5.3"]`); everything else is removed
- `DEFAULT_INTELLIGENCE` / `DEFAULT_MODEL_VERSION` — what new chats lock to
- `DEBUG` — set `true` to log activity to the console

Model names are matched by visible text, so if a workspace renames a model, just update `ALLOWED_VERSIONS`.

## License

MIT — same as the parent project.
