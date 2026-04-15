import type { LangId } from "./index";

export function parseShebang(line: string): LangId | null {
  if (!line.startsWith("#!")) return null;

  const lower = line.toLowerCase();

  if (
    /\b(bash|zsh|fish|sh|dash|ksh|ash)\b/.test(lower) &&
    !lower.includes("pwsh")
  ) {
    return "shell";
  }

  if (/\b(pwsh|powershell)\b/.test(lower)) {
    return "powershell";
  }

  return null;
}
