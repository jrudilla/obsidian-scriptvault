export interface ScriptType {
  label: string;
  filename: (name: string) => string;  // given a base name, returns the final filename
  fixedName?: string;                  // if set, the name field is pre-filled and locked
  template: string;
}

export const SCRIPT_TYPES: ScriptType[] = [
  {
    label: ".sh",
    filename: (n) => (n.endsWith(".sh") ? n : `${n}.sh`),
    template: `#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────
# Script: {name}
# ──────────────────────────────────────────

main() {
  echo "Hello from {name}"
}

main "$@"
`,
  },
  {
    label: ".zsh",
    filename: (n) => (n.endsWith(".zsh") ? n : `${n}.zsh`),
    template: `#!/usr/bin/env zsh
set -euo pipefail

# ──────────────────────────────────────────
# Script: {name}
# ──────────────────────────────────────────

main() {
  echo "Hello from {name}"
}

main "$@"
`,
  },
  {
    label: ".fish",
    filename: (n) => (n.endsWith(".fish") ? n : `${n}.fish`),
    template: `#!/usr/bin/env fish

# ──────────────────────────────────────────
# Script: {name}
# ──────────────────────────────────────────

function main
    echo "Hello from {name}"
end

main $argv
`,
  },
  {
    label: ".bash",
    filename: (n) => (n.endsWith(".bash") ? n : `${n}.bash`),
    template: `#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────
# Script: {name}
# ──────────────────────────────────────────

main() {
  echo "Hello from {name}"
}

main "$@"
`,
  },
  {
    label: ".ps1",
    filename: (n) => (n.endsWith(".ps1") ? n : `${n}.ps1`),
    template: `# ──────────────────────────────────────────
# Script: {name}
# ──────────────────────────────────────────

param(
  [string]$Name = "World"
)

function Main {
  Write-Host "Hello, $Name"
}

Main
`,
  },
  {
    label: ".env",
    filename: (n) => (n.startsWith(".") ? n : `.${n}`),
    template: `# Environment variables — {name}
# Do NOT commit this file to version control.

APP_NAME=myapp
APP_ENV=development
# APP_SECRET=changeme
`,
  },
  {
    label: "Dockerfile",
    filename: () => "Dockerfile",
    fixedName: "Dockerfile",
    template: `FROM ubuntu:22.04

LABEL maintainer="you@example.com"

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
  && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["bash"]
`,
  },
  {
    label: "Makefile",
    filename: () => "Makefile",
    fixedName: "Makefile",
    template: `.PHONY: all build clean help

all: build

build:
\t@echo "Building..."

clean:
\t@echo "Cleaning..."

help:
\t@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \\
\t  awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\\n", $$1, $$2}'
`,
  },
  {
    label: ".gitignore",
    filename: () => ".gitignore",
    fixedName: ".gitignore",
    template: `# Dependencies
node_modules/
vendor/

# Build output
dist/
build/
*.o
*.a

# Environment
.env
.env.local
*.env

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp
`,
  },
  {
    label: ".editorconfig",
    filename: () => ".editorconfig",
    fixedName: ".editorconfig",
    template: `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`,
  },
  {
    label: ".npmrc",
    filename: () => ".npmrc",
    fixedName: ".npmrc",
    template: `# npm configuration
# registry=https://registry.npmjs.org/
# save-exact=true
`,
  },
];

export function applyTemplate(template: string, name: string): string {
  return template.replace(/\{name\}/g, name);
}
