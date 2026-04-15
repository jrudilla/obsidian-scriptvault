export const VIEW_TYPE_SCRIPT = "scriptvault-view";
export const VIEW_TYPE_RUNNER = "scriptvault-runner";
export const VIEW_TYPE_OUTLINE = "scriptvault-outline";

export const SCRIPT_EXTENSIONS = [
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "env",
  "gitignore",
  "gitconfig",
  "npmrc",
  "editorconfig",
];

export const FILENAME_ONLY = [
  "Dockerfile",
  "dockerfile",
  "Makefile",
  "makefile",
  "GNUmakefile",
];

export const RUNNABLE_EXTENSIONS = new Set(["sh", "bash", "zsh", "fish", "ps1"]);

// Extensions where chmod +x makes sense (Unix shells, excludes ps1 and Windows-only)
export const UNIX_CHMOD_EXTENSIONS = new Set(["sh", "bash", "zsh", "fish"]);

// Extensions ShellCheck can analyze. ShellCheck officially supports only
// sh/bash/dash/ksh/busybox — NOT fish or zsh (running it on those yields
// bogus diagnostics because it falls back to POSIX sh rules).
export const SHELLCHECK_EXTENSIONS = new Set(["sh", "bash", "dash", "ksh"]);
