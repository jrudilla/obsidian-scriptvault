import { isDesktop } from "../util/platform";

export function canRun(): boolean {
  return isDesktop();
}

export interface RunResult {
  exitCode: number | null;
  killed: boolean;
}

export type ChunkKind = "stdout" | "stderr";

export function pickInterpreter(
  absPath: string,
  ext: string,
  firstLine: string | undefined,
  settingShell: string,
): string[] {
  if (settingShell) return [settingShell, absPath];

  if (firstLine && firstLine.startsWith("#!")) {
    const cleaned = firstLine.slice(2).trim();
    const parts = cleaned.split(/\s+/).filter((p) => p.length > 0);
    if (parts.length > 0) {
      if (parts[0].endsWith("env") && parts[1]) {
        return [parts[1], absPath];
      }
      return [parts[0], absPath];
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
