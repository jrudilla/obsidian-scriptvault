import { ItemView, WorkspaceLeaf } from "obsidian";
import type { ChunkKind } from "./runner";
import { VIEW_TYPE_RUNNER } from "../constants";

type Status = "idle" | "running" | "success" | "error";

export class RunnerOutputView extends ItemView {
  private nameEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private outputEl!: HTMLPreElement;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_RUNNER;
  }

  getDisplayText(): string {
    return "Script Output";
  }

  getIcon(): string {
    return "terminal";
  }

  async onOpen(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("scriptvault-runner-view");

    const header = root.createDiv({ cls: "scriptvault-runner-header" });
    this.nameEl = header.createDiv({
      cls: "scriptvault-runner-header-name",
      text: "No script run yet",
    });
    this.statusEl = header.createDiv({ cls: "scriptvault-runner-status" });
    this.statusEl.setText("idle");

    const clearBtn = header.createEl("button", { text: "Clear" });
    clearBtn.addEventListener("click", () => {
      this.outputEl.empty();
    });

    this.outputEl = root.createEl("pre", { cls: "scriptvault-runner-output" });
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  startRun(scriptName: string): void {
    this.nameEl.setText(scriptName);
    this.outputEl.empty();
    this.setStatus("running");
  }

  appendChunk(chunk: string, kind: ChunkKind): void {
    const span = document.createElement("span");
    if (kind === "stderr") span.className = "scriptvault-runner-stderr";
    span.textContent = chunk;
    this.outputEl.appendChild(span);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  finishRun(exitCode: number | null, killed: boolean): void {
    if (killed) {
      this.setStatus("error");
      this.statusEl.setText("killed");
      return;
    }
    if (exitCode === 0) {
      this.setStatus("success");
      this.statusEl.setText("exit 0");
      return;
    }
    this.setStatus("error");
    this.statusEl.setText(`exit ${exitCode ?? "?"}`);
  }

  private setStatus(status: Status): void {
    this.statusEl.removeClass("running", "success", "error");
    if (status !== "idle") this.statusEl.addClass(status);
    this.statusEl.setText(status);
  }
}
