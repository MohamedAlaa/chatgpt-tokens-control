# Tokens Control — Strict (GPT-5.3 only)

A no-compromises edition of [Tokens Control](../README.md). Instead of *warning* people away from heavyweight models, it **removes them from the menu entirely**.

## What it does

1. **Deletes `GPT-5.4` and `GPT-5.5` from ChatGPT's model menu.** A `MutationObserver` strips those options out every time the menu renders, so they can never be selected.
2. **Locks every new chat to `GPT-5.3 Instant`.**

The trick: ChatGPT only exposes the heavy intelligence levels (`Medium`, `High`, `Extra High`, `Pro`) *under* GPT-5.5/5.4. Remove those two model versions and the heavy options vanish with them — leaving GPT-5.3 Instant as the only practical choice. No nudge, no override.

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

- `BLOCKED_VERSIONS` — model versions to delete (default `["GPT-5.5", "GPT-5.4"]`)
- `DEFAULT_INTELLIGENCE` / `DEFAULT_MODEL_VERSION` — what new chats lock to
- `DEBUG` — set `true` to log activity to the console

Model names are matched by visible text, so if a workspace renames a model, just update `BLOCKED_VERSIONS`.

## License

MIT — same as the parent project.
