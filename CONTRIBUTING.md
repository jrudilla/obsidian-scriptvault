# Contributing to ScriptVault

Thanks for your interest in contributing!

---

## Getting started

```bash
git clone https://github.com/jrudilla/obsidian-scriptvault.git
cd obsidian-scriptvault
npm install
npm run dev
```

Copy `main.js`, `manifest.json`, and `styles.css` to a test vault:

```
<vault>/.obsidian/plugins/scriptvault/
```

Reload Obsidian (or use the **Reload app without saving** command) to pick up changes.

---

## Submitting changes

1. **Fork** the repo and create a feature branch from `main`.
2. Make your changes. Run `npm run typecheck` — no TypeScript errors allowed.
3. Run `npm test` and `npm run build` and verify both pass cleanly.
4. Open a **Pull Request** against `main` with a clear description of what changed and why.

---

## Code guidelines

- TypeScript strict mode — no `any`, no unused locals/parameters.
- No `innerHTML` — use the Obsidian DOM helpers (`createEl`, `createDiv`, etc.) or set `textContent`.
- No `console.log` in production code — use `console.warn`/`console.error` sparingly, prefixed with `[scriptvault]`.
- Keep `require("child_process")` and `require("fs")` inside desktop guards — these modules must never be called at the module top level (mobile compatibility).
- Desktop-only features must check `Platform.isDesktopApp` or `isDesktop()` before running.
- Clean up in `onClose()` / `onunload()` — destroy editor instances, clear event listeners.

---

## Reporting bugs

Open an issue with:
- Obsidian version
- Plugin version
- Operating system
- Steps to reproduce
- Expected vs actual behaviour
- Console errors (open with **Cmd/Ctrl+Shift+I**)

---

## License

By contributing you agree that your changes will be released under the [MIT License](LICENSE).
