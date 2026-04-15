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
