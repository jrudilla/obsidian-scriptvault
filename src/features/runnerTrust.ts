import { App, Modal } from "obsidian";
import type ScriptVaultPlugin from "../main";

class RunnerTrustModal extends Modal {
  private resolveFn: ((value: { allow: boolean; rememberSession: boolean }) => void) | null = null;
  private result: { allow: boolean; rememberSession: boolean } = {
    allow: false,
    rememberSession: false,
  };

  constructor(
    app: App,
    private scriptPath: string,
    private interpreter: string[],
  ) {
    super(app);
  }

  open(): void {
    super.open();
  }

  async waitForChoice(): Promise<{ allow: boolean; rememberSession: boolean }> {
    return new Promise((resolve) => {
      this.resolveFn = resolve;
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Run script?" });

    const body = contentEl.createDiv({ cls: "scriptvault-trust-modal-body" });
    body.createEl("p", {
      text: "ScriptVault is about to execute the following script on your machine. Only run scripts you trust.",
    });

    body.createEl("strong", { text: "Script:" });
    body.createEl("code", { text: this.scriptPath });

    body.createEl("strong", { text: "Interpreter:" });
    body.createEl("code", { text: this.interpreter.join(" ") });
    body.createEl("p", {
      text: "Trust applies only to this file path for the rest of the current plugin session.",
    });

    const buttons = contentEl.createDiv({ cls: "scriptvault-trust-modal-buttons" });

    const cancelBtn = buttons.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => {
      this.result = { allow: false, rememberSession: false };
      this.close();
    });

    const onceBtn = buttons.createEl("button", { text: "Run once" });
    onceBtn.addEventListener("click", () => {
      this.result = { allow: true, rememberSession: false };
      this.close();
    });

    const trustBtn = buttons.createEl("button", {
      text: "Run and trust this file this session",
      cls: "mod-cta",
    });
    trustBtn.addEventListener("click", () => {
      this.result = { allow: true, rememberSession: true };
      this.close();
    });
  }

  onClose(): void {
    this.contentEl.empty();
    if (this.resolveFn) {
      this.resolveFn(this.result);
      this.resolveFn = null;
    }
  }
}

export async function requireTrust(
  plugin: ScriptVaultPlugin,
  scriptPath: string,
  interpreter: string[],
): Promise<boolean> {
  if (!plugin.settings.runnerConfirmEverySession) return true;
  if (plugin.trustedRunPaths.has(scriptPath)) return true;

  const modal = new RunnerTrustModal(plugin.app, scriptPath, interpreter);
  modal.open();
  const choice = await modal.waitForChoice();

  if (choice.allow && choice.rememberSession) {
    plugin.trustedRunPaths.add(scriptPath);
  }

  return choice.allow;
}
