# Changelog

All notable changes to ScriptVault are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [0.1.4] — 2026-04-16

### Changed
- Refined remaining UI strings flagged during marketplace review
- Simplified wording around extensionless file support and trust prompts
- Updated the final release metadata for the latest review pass

## [0.1.3] — 2026-04-16

### Changed
- Normalized visible UI text to sentence case for marketplace review compliance
- Switched platform detection back to the Obsidian Platform API
- Continued release-quality cleanup for validator and reviewer feedback

## [0.1.2] — 2026-04-15

### Changed
- Fixed Obsidian marketplace validation issues reported by the review bot
- Reworked async callbacks and promise handling for stricter lint compliance
- Replaced forbidden `require()` usage with ESM imports
- Updated command ids and metadata for marketplace compliance
- Added local lint and release validation tooling to catch submission issues earlier

## [0.1.1] — 2026-04-15

### Changed
- Shortened the plugin description to comply with marketplace validation
- Updated `authorUrl` to point to the author profile instead of the plugin repository

## [0.1.0] — 2026-04-15

### Added
- CodeMirror 6 editor for shell scripts, dotfiles, and developer config files
- Syntax highlighting for Shell/Bash/Zsh/Fish, PowerShell, Dockerfile, Properties, YAML
- Shebang detection (`#!/bin/bash`, `#!/usr/bin/env fish`, etc.) overrides extension
- Filename-only file interception: `Dockerfile`, `Makefile`, `GNUmakefile` open automatically
- `.env` value masking — values hidden by default, toggle to reveal
- Script runner — execute `.sh`, `.bash`, `.zsh`, `.fish`, `.ps1` scripts from the editor header
- Per-file trust confirmation modal before first script execution in a session
- Script Output sidebar panel with stdout/stderr streaming and exit status
- Configurable runner timeout and shell override
- ShellCheck linting — inline diagnostics via `shellcheck --format=json` (desktop, optional)
- `chmod +x` header button — shows when a shell script lacks execute permission (Unix only)
- Function outline sidebar for shell functions, Makefile targets, Dockerfile FROM stages
- New Script modal — create a script file with a template from the file explorer context menu
  - 11 templates: sh, zsh, fish, bash, ps1, .env, Dockerfile, Makefile, .gitignore, .editorconfig, .npmrc
- Copy path button — copies the absolute file path to clipboard
- Live line/column counter in the editor header
- File explorer context menu entries: "Open in ScriptVault" and "New script file…"
- Command: `ScriptVault: Open current file in ScriptVault`
- Command: `ScriptVault: Show ScriptVault outline`
- Settings tab with all options
- Light and dark theme support via Obsidian CSS variables
- Desktop-only release target for marketplace compatibility

[Unreleased]: https://github.com/jrudilla/obsidian-scriptvault/compare/0.1.4...HEAD
[0.1.4]: https://github.com/jrudilla/obsidian-scriptvault/releases/tag/0.1.4
[0.1.3]: https://github.com/jrudilla/obsidian-scriptvault/releases/tag/0.1.3
[0.1.2]: https://github.com/jrudilla/obsidian-scriptvault/releases/tag/0.1.2
[0.1.1]: https://github.com/jrudilla/obsidian-scriptvault/releases/tag/0.1.1
[0.1.0]: https://github.com/jrudilla/obsidian-scriptvault/releases/tag/0.1.0
