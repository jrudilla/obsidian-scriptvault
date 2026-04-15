import path from "path";
import { isDesktop } from "../util/platform";

export function canRun(): boolean {
  return isDesktop();
}

export interface RunResult {
  exitCode: number | null;
  killed: boolean;
}

export type ChunkKind = "stdout" | "stderr";

function tokenizeCommandLine(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;

  for (const char of input) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += "\\";
  if (current) tokens.push(current);

  return tokens;
}

function parseShebangInterpreter(firstLine: string): string[] | null {
  if (!firstLine.startsWith("#!")) return null;

  const tokens = tokenizeCommandLine(firstLine.slice(2).trim());
  if (tokens.length === 0) return null;

  const [cmd, ...rest] = tokens;
  if (path.basename(cmd).toLowerCase() !== "env") {
    return [cmd, ...rest];
  }

  let index = 0;
  while (index < rest.length) {
    const token = rest[index];
    if (token === "-S") {
      const splitArgs = tokenizeCommandLine(rest.slice(index + 1).join(" "));
      return splitArgs.length > 0 ? splitArgs : null;
    }
    if (token.startsWith("-")) {
      index += 1;
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) {
      index += 1;
      continue;
    }
    return rest.slice(index);
  }

  return null;
}

function isWindowsPath(input: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(input) || input.includes("\\");
}

function canAccessExecutable(candidate: string): boolean {
  try {
    const fs = require("fs") as typeof import("fs");
    if (process.platform === "win32") {
      fs.accessSync(candidate, fs.constants.F_OK);
    } else {
      fs.accessSync(candidate, fs.constants.X_OK);
    }
    return true;
  } catch {
    return false;
  }
}

export function commandExists(command: string): boolean {
  if (!command) return false;

  if (command.includes("/") || command.includes("\\")) {
    return canAccessExecutable(command);
  }

  const pathValue = process.env.PATH ?? "";
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean);
  const pathext = process.platform === "win32"
    ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM")
        .split(";")
        .filter(Boolean)
    : [""];

  for (const entry of pathEntries) {
    for (const ext of pathext) {
      const candidate = path.join(
        entry,
        process.platform === "win32" ? `${command}${ext}` : command,
      );
      if (canAccessExecutable(candidate)) return true;
    }
  }

  return false;
}

export function isInterpreterAvailable(interpreter: string[]): boolean {
  return interpreter.length > 0 && commandExists(interpreter[0]);
}

export function getScriptWorkingDirectory(absPath: string): string {
  if (!absPath) return "/";
  if (isWindowsPath(absPath)) {
    return path.win32.dirname(absPath);
  }
  return path.posix.dirname(absPath);
}

export function pickInterpreter(
  absPath: string,
  ext: string,
  firstLine: string | undefined,
  settingShell: string,
): string[] {
  if (settingShell) return [settingShell, absPath];

  if (firstLine) {
    const shebangInterpreter = parseShebangInterpreter(firstLine);
    if (shebangInterpreter && shebangInterpreter.length > 0) {
      return [...shebangInterpreter, absPath];
    }
  }

  switch (ext.toLowerCase()) {
    case "sh":
    case "bash":
      return ["bash", absPath];
    case "zsh":
      return ["zsh", absPath];
    case "fish":
      return ["fish", absPath];
    case "ps1":
      return ["pwsh", "-File", absPath];
    default:
      return ["bash", absPath];
  }
}

export async function runScript(
  interpreter: string[],
  cwd: string,
  timeoutMs: number,
  onChunk: (chunk: string, kind: ChunkKind) => void,
): Promise<RunResult> {
  if (!canRun()) {
    throw new Error("Script execution is only available on desktop.");
  }

  const cp = require("child_process") as typeof import("child_process");

  return new Promise<RunResult>((resolve) => {
    const [cmd, ...args] = interpreter;
    let killed = false;
    let settled = false;

    const proc = cp.spawn(cmd, args, { cwd });

    const timer = setTimeout(() => {
      killed = true;
      try {
        proc.kill("SIGTERM");
      } catch {
        // ignore
      }
    }, timeoutMs);

    proc.stdout.on("data", (buf: Buffer) => onChunk(buf.toString("utf8"), "stdout"));
    proc.stderr.on("data", (buf: Buffer) => onChunk(buf.toString("utf8"), "stderr"));

    const finish = (exitCode: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode, killed });
    };

    proc.on("error", (err: Error) => {
      onChunk(`\n[scriptvault] failed to start: ${err.message}\n`, "stderr");
      finish(null);
    });

    proc.on("close", (code: number | null) => {
      finish(code);
    });
  });
}
