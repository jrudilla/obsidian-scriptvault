import type { ScriptView } from "./ScriptView";
import { canRun } from "../features/runner";
import { RUNNABLE_EXTENSIONS } from "../constants";

export interface HeaderHandle {
  setMaskActive(active: boolean): void;
  setRunEnabled(enabled: boolean): void;
  destroy(): void;
}

export function buildHeader(
  parent: HTMLElement,
  view: ScriptView,
): HeaderHandle {
  parent.empty();
  parent.addClass("scriptvault-header");

  const label = parent.createSpan({ cls: "scriptvault-header-label" });
  label.setText(view.file?.name ?? "");

  const spacer = parent.createDiv({ cls: "scriptvault-header-spacer" });
  spacer.style.flex = "1";

  const isEnv = view.file?.extension === "env";
  let maskBtn: HTMLButtonElement | null = null;
  if (isEnv) {
    maskBtn = parent.createEl("button", { text: "Show values" });
    maskBtn.addEventListener("click", () => {
      view.toggleMask();
    });
  }

  let runBtn: HTMLButtonElement | null = null;
  const ext = view.file?.extension ?? "";
  if (canRun() && RUNNABLE_EXTENSIONS.has(ext)) {
    runBtn = parent.createEl("button", { text: "Run" });
    runBtn.addEventListener("click", () => {
      view.runScript();
    });
  }

  const outlineBtn = parent.createEl("button", { text: "Outline" });
  outlineBtn.addEventListener("click", () => {
    view.showOutline();
  });

  return {
    setMaskActive(active: boolean): void {
      if (maskBtn) maskBtn.setText(active ? "Show values" : "Hide values");
    },
    setRunEnabled(enabled: boolean): void {
      if (runBtn) runBtn.disabled = !enabled;
    },
    destroy(): void {
      parent.empty();
    },
  };
}
