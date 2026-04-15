# ScriptVault 0.1.0

Initial public release.

Highlights:

- Edit shell scripts, dotfiles, and developer config files directly inside Obsidian
- Syntax highlighting for shell, PowerShell, Dockerfile, YAML, and common dotfiles
- Run scripts from the editor with streamed output in a sidebar panel
- ShellCheck linting for supported shell files
- Outline view for shell functions, Makefile targets, and Dockerfile stages
- New script modal with starter templates
- `.env` masking, absolute path copy, and `chmod +x` support

Security and behavior:

- Desktop-only plugin
- No telemetry or network requests
- Script execution always requires explicit user action
- Trust prompts are remembered per file for the current session only
