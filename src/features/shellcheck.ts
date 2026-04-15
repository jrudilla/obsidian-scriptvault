import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { commandExists } from "./runner";
import { isDesktop } from "../util/platform";

interface ShellCheckResult {
  file: string;
  line: number;
  endLine: number;
  column: number;
  endColumn: number;
  level: "error" | "warning" | "info" | "style";
  code: number;
  message: string;
}

function severityFor(level: ShellCheckResult["level"]): Diagnostic["severity"] {
  if (level === "error") return "error";
  if (level === "warning") return "warning";
  return "info";
}

/** Candidate absolute paths where shellcheck is commonly installed. */
const SHELLCHECK_CANDIDATES = [
  "/opt/homebrew/bin/shellcheck",  // macOS Apple Silicon (Homebrew)
  "/usr/local/bin/shellcheck",     // macOS Intel (Homebrew) or Linux
  "/usr/bin/shellcheck",           // Linux (apt, pacman, etc.)
  "/snap/bin/shellcheck",          // Linux (snap)
  "shellcheck",                    // fallback: rely on PATH
];

let resolvedShellCheckPath: string | null | undefined = undefined; // undefined = not yet probed

/**
 * Finds the shellcheck binary by probing known paths.
 * Result is cached after the first call. Returns null if not found anywhere.
 */
export function resetShellCheckPathCache(): void {
  resolvedShellCheckPath = undefined;
}

export function resolveShellCheckPath(
  candidates: readonly string[],
  override?: string,
): string | null {
  if (override) return override;

  const fs = require("fs") as typeof import("fs");
  for (const candidate of candidates) {
    // For absolute paths, verify they exist and are executable.
    if (!candidate.startsWith("/")) {
      return commandExists(candidate) ? candidate : null;
    }
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // not here, try next
    }
  }

  return null;
}

export function findShellCheck(override?: string): string | null {
  if (override) return override;
  if (resolvedShellCheckPath !== undefined) return resolvedShellCheckPath;

  resolvedShellCheckPath = resolveShellCheckPath(SHELLCHECK_CANDIDATES, override);
  return resolvedShellCheckPath;
}

/** Map a file extension to a ShellCheck dialect. Returns null if unsupported. */
function extToShellCheckDialect(ext: string): string | null {
  switch (ext) {
    case "sh":   return "sh";
    case "bash": return "bash";
    case "dash": return "dash";
    case "ksh":  return "ksh";
    default:     return null; // zsh / fish / ps1 / etc. — not supported
  }
}

/**
 * CM6 linter that pipes the current editor content through shellcheck via stdin.
 *
 * ShellCheck dialect resolution:
 *   - If the content starts with `#!`, shellcheck auto-detects the shell from the shebang.
 *   - Otherwise we pass `--shell=<dialect>` based on the file extension.
 *
 * Returns an empty extension for unsupported extensions (fish, zsh, ps1, …).
 * Silent no-op if shellcheck is not installed on the system.
 */
export function makeShellCheckLinter(ext: string, pathOverride?: string): Extension {
  const dialect = extToShellCheckDialect(ext);
  if (!dialect) return [];

  return linter(
    (view) => {
      if (!isDesktop()) return Promise.resolve([]);

      return new Promise<Diagnostic[]>((resolve) => {
        let cp: typeof import("child_process");
        try {
          cp = require("child_process") as typeof import("child_process");
        } catch {
          return resolve([]);
        }

        const binary = findShellCheck(pathOverride);
        if (!binary) return resolve([]); // not installed anywhere

        const content = view.state.doc.toString();
        const hasShebang = content.startsWith("#!");

        const args = ["--format=json", "--norc"];
        if (!hasShebang) args.push(`--shell=${dialect}`);
        args.push("-");

        let proc: ReturnType<typeof cp.spawn>;
        try {
          proc = cp.spawn(binary, args);
        } catch {
          return resolve([]);
        }

        // spawn() with default stdio returns non-null stdio streams.
        if (!proc.stdout || !proc.stderr || !proc.stdin) return resolve([]);

        let stdout = "";
        let settled = false;
        const done = (diags: Diagnostic[]) => {
          if (settled) return;
          settled = true;
          resolve(diags);
        };

        proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        proc.stderr.on("data", () => { /* discard — shellcheck writes errors here */ });
        proc.stdin.on("error", () => { /* swallow EPIPE when binary missing */ });
        proc.on("error", () => done([])); // ENOENT: shellcheck not installed
        proc.on("close", () => {
          if (!stdout.trim()) return done([]);

          let results: ShellCheckResult[];
          try {
            results = JSON.parse(stdout);
          } catch {
            return done([]);
          }

          const doc = view.state.doc;
          const diagnostics: Diagnostic[] = [];

          for (const r of results) {
            const lineNum = Math.max(1, Math.min(r.line, doc.lines));
            const lineObj = doc.line(lineNum);

            const from = Math.min(lineObj.from + Math.max(0, r.column - 1), lineObj.to);

            const endLineNum = Math.max(lineNum, Math.min(r.endLine ?? r.line, doc.lines));
            const endLineObj = doc.line(endLineNum);
            const to = Math.min(
              endLineObj.from + Math.max(0, (r.endColumn ?? r.column + 1) - 1),
              endLineObj.to,
            );

            diagnostics.push({
              from,
              to: Math.max(from + 1, to),
              severity: severityFor(r.level),
              message: `[SC${r.code}] ${r.message}`,
              source: "shellcheck",
            });
          }

          done(diagnostics);
        });

        try {
          proc.stdin!.write(content, "utf8");
          proc.stdin!.end();
        } catch {
          done([]);
        }
      });
    },
    { delay: 750 },
  );
}

/** Static gutter decoration that shows lint markers in the line-number gutter. */
export { lintGutter };
