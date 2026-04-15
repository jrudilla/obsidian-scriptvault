# ScriptVault

Obsidian plugin to open, view, and edit shell scripts, dotfiles, and developer config files inside your vault — with syntax highlighting, `.env` value masking, a script runner, and a function outline.

## Supported files

- **Shell**: `.sh`, `.bash`, `.zsh`, `.fish`
- **PowerShell**: `.ps1`
- **Env / config**: `.env`, `.gitignore`, `.gitconfig`, `.npmrc`, `.editorconfig`
- **Filename-only**: `Dockerfile`, `Makefile`

## Features

- **Syntax highlighting** via CodeMirror 6 (`@codemirror/legacy-modes`), themed against Obsidian's editor variables.
- **Shebang detection** — a `.txt` file starting with `#!/usr/bin/env bash` will be highlighted as shell (when opened via ScriptVault).
- **`.env` value masking** — values are hidden by default; toggle in the view header to reveal.
- **Run script** (desktop only) — executes the current script with a per-session trust confirmation; output streams to a right-sidebar panel. Configurable timeout and custom interpreter.
- **Function outline** — right-sidebar view listing shell/PowerShell functions, Makefile targets, and Dockerfile `FROM` stages. Click to jump.

## Prerequisites

To open filename-only files like `Dockerfile` and `Makefile`, enable **Settings → Files & Links → Detect all file extensions** in Obsidian. ScriptVault will show a one-time notice if this setting is off.

## Installation

### During development

```bash
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/obsidian-scriptvault/` and enable the plugin in **Settings → Community plugins**.

### From the community marketplace

_(Pending submission to `obsidianmd/obsidian-releases`.)_

## Settings

- **Mask .env values by default** — whether `.env` files open with values hidden.
- **Intercept filename-only files** — automatically open `Dockerfile` / `Makefile` in ScriptVault.
- **Confirm script execution per session** — show a trust modal before the first `Run` in each session. Uncheck for zero-friction iteration.
- **Runner shell override** — force a specific interpreter path for all scripts. Leave empty to auto-detect from shebang or extension.
- **Runner timeout (ms)** — maximum execution time before scripts are killed.

## Security note

The **Run** feature executes arbitrary shell commands from files in your vault. Only run scripts you trust. The per-session trust prompt resets every time you reload the plugin.

## Commands

- `ScriptVault: Open current file in ScriptVault` — force-open the active file in the ScriptVault view.
- `ScriptVault: Show ScriptVault outline` — open the outline panel.

## Stack

- TypeScript (strict)
- Obsidian API
- CodeMirror 6 (core provided by Obsidian, language parsers from `@codemirror/legacy-modes`)
- esbuild

## License

MIT
