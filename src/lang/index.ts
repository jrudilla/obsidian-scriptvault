import type { TFile } from "obsidian";
import type { Extension } from "@codemirror/state";
import { parseShebang } from "./shebang";
import { getLanguageExtension } from "./registry";

export type LangId =
  | "shell"
  | "powershell"
  | "dockerfile"
  | "properties"
  | "yaml"
  | "plain";

const FILENAME_LANG: Record<string, LangId> = {
  dockerfile: "dockerfile",
  makefile: "shell",
  gnumakefile: "shell",
};

const EXTENSION_LANG: Record<string, LangId> = {
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  env: "properties",
  gitignore: "properties",
  gitconfig: "properties",
  npmrc: "properties",
  editorconfig: "properties",
  yml: "yaml",
  yaml: "yaml",
};

export function detectLanguage(
  file: TFile | null,
  firstLine: string | undefined,
): LangId {
  if (firstLine) {
    const fromShebang = parseShebang(firstLine);
    if (fromShebang) return fromShebang;
  }

  if (file) {
    const basename = file.name.toLowerCase();
    if (FILENAME_LANG[basename]) return FILENAME_LANG[basename];

    const ext = file.extension.toLowerCase();
    if (EXTENSION_LANG[ext]) return EXTENSION_LANG[ext];
  }

  return "plain";
}

export function isFilenameOnly(name: string): boolean {
  const lower = name.toLowerCase();
  return lower in FILENAME_LANG;
}

export function loadLanguageSupport(id: LangId): Extension {
  return getLanguageExtension(id);
}
