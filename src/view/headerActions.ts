import { Notice } from "obsidian";
import type { ScriptView } from "./ScriptView";
import { canRun } from "../features/runner";
import { RUNNABLE_EXTENSIONS, UNIX_CHMOD_EXTENSIONS } from "../constants";
import { isDesktop } from "../util/platform";

export interface HeaderHandle {
  setMaskActive(active: boolean): void;
  setRunEnabled(enabled: boolean, title?: string): void;
  updateCursor(line: number, col: number, totalLines: number): void;
  updateExecStatus(executable: boolean, canCheck: boolean): void;
  destroy(): void;
}

export function buildHeader(
  parent: HTMLElement,
  view: ScriptView,
): HeaderHandle {
  parent.empty();
  parent.addClass("scriptvault-header");

  // File name label
  const label = parent.createSpan({ cls: "scriptvault-header-label" });
  label.setText(view.file?.name ?? "");

  parent.createDiv({ cls: "scriptvault-header-spacer" });

  // Env mask toggle (only for .env files)
  let maskBtn: HTMLButtonElement | null = null;
  if (view.file?.extension === "env") {
    maskBtn = parent.createEl("button", { text: "Show values" });
    maskBtn.title = "Toggle .env value visibility";
    maskBtn.addEventListener("click", () => view.toggleMask());
  }

  // Copy path button
  const copyBtn = parent.createEl("button", { text: "Copy path" });
  copyBtn.title = "Copy absolute file path to clipboard";
  copyBtn.addEventListener("click", () => {
    const adapter = view.app.vault.adapter;
    const getFullPath = (adapter as { getFullPath?: (p: string) => string }).getFullPath;
    const pathToCopy = view.file
      ? typeof getFullPath === "function"
        ? getFullPath.call(adapter, view.file.path)
        : view.file.path
      : null;
    if (!pathToCopy) return;

    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard?.writeText) {
      new Notice(pathToCopy);
      return;
    }

    clipboard.writeText(pathToCopy).then(() => {
      new Notice("Path copied to clipboard");
    }).catch(() => {
      new Notice(pathToCopy);
    });
  });

  // chmod +x button — only on Unix desktop for shell-executable files
  let chmodBtn: HTMLButtonElement | null = null;
  const ext = view.file?.extension ?? "";
  const showChmod = isDesktop() && process.platform !== "win32" && UNIX_CHMOD_EXTENSIONS.has(ext);
  if (showChmod) {
    chmodBtn = parent.createEl("button", {
      text: "chmod +x",
      cls: "scriptvault-hidden", // hidden until updateExecStatus resolves
    });
    chmodBtn.title = "Make this file executable (chmod +x)";
    chmodBtn.addEventListener("click", () => view.makeExecutable());
  }

  // Run button (desktop only, runnable extensions only)
  let runBtn: HTMLButtonElement | null = null;
  if (canRun() && RUNNABLE_EXTENSIONS.has(ext)) {
    runBtn = parent.createEl("button", { text: "▶ Run" });
    runBtn.title = "Execute this script";
    runBtn.addEventListener("click", () => {
      void view.runScript();
    });
  }

  // Outline button
  const outlineBtn = parent.createEl("button", { text: "Outline" });
  outlineBtn.title = "Open function outline";
  outlineBtn.addEventListener("click", () => view.showOutline());
  void outlineBtn;

  // Cursor / line counter
  const cursorEl = parent.createSpan({ cls: "scriptvault-header-cursor" });
  cursorEl.setText("Ln 1, Col 1");

  return {
    setMaskActive(active: boolean): void {
      if (maskBtn) maskBtn.setText(active ? "Show values" : "Hide values");
    },
    setRunEnabled(enabled: boolean, title?: string): void {
      if (!runBtn) return;
      runBtn.disabled = !enabled;
      runBtn.title = title ?? "Execute this script";
    },
    updateCursor(line: number, col: number, totalLines: number): void {
      cursorEl.setText(`Ln ${line}, Col ${col}  ·  ${totalLines} lines`);
    },
    updateExecStatus(executable: boolean, canCheck: boolean): void {
      if (!chmodBtn) return;
      const hide = !canCheck || executable;
      chmodBtn.classList.toggle("scriptvault-hidden", hide);
      chmodBtn.disabled = false;
    },
    destroy(): void {
      parent.empty();
    },
  };
}
