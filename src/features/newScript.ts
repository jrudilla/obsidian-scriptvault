import { App, Modal, Notice, TFolder, normalizePath } from "obsidian";
import { SCRIPT_TYPES, applyTemplate, type ScriptType } from "./templates";

export class NewScriptModal extends Modal {
  private selectedType: ScriptType = SCRIPT_TYPES[0];
  private nameInput!: HTMLInputElement;
  private previewEl!: HTMLElement;
  private folder: TFolder;
  private onCreated: (path: string) => Promise<void> | void;

  constructor(app: App, folder: TFolder, onCreated: (path: string) => Promise<void> | void) {
    super(app);
    this.folder = folder;
    this.onCreated = onCreated;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("scriptvault-new-modal");

    contentEl.createEl("h3", { text: "New script file" });

    // Folder hint
    contentEl.createEl("p", {
      text: `In: ${this.folder.path || "/"}`,
      cls: "scriptvault-new-folder-hint",
    });

    // Name field
    const nameRow = contentEl.createDiv({ cls: "scriptvault-new-row" });
    nameRow.createEl("label", { text: "Name" });
    this.nameInput = nameRow.createEl("input", { type: "text" });
    this.nameInput.placeholder = "my-script";
    this.nameInput.value = this.selectedType.fixedName ?? "";
    this.nameInput.disabled = !!this.selectedType.fixedName;
    this.nameInput.addEventListener("input", () => this.updatePreview());
    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") void this.create();
    });

    // Type grid
    const typeSection = contentEl.createDiv({ cls: "scriptvault-new-types" });
    typeSection.createEl("label", { text: "Type" });
    const grid = typeSection.createDiv({ cls: "scriptvault-new-type-grid" });

    for (const type of SCRIPT_TYPES) {
      const btn = grid.createEl("button", { text: type.label, cls: "scriptvault-type-btn" });
      if (type === this.selectedType) btn.addClass("is-active");
      btn.addEventListener("click", () => {
        grid.querySelectorAll(".scriptvault-type-btn").forEach((b) => b.removeClass("is-active"));
        btn.addClass("is-active");
        this.selectedType = type;
        if (type.fixedName) {
          this.nameInput.value = type.fixedName;
          this.nameInput.disabled = true;
        } else {
          this.nameInput.disabled = false;
          if (!this.nameInput.value || SCRIPT_TYPES.some((t) => t.fixedName === this.nameInput.value)) {
            this.nameInput.value = "";
          }
        }
        this.updatePreview();
        if (!type.fixedName) this.nameInput.focus();
      });
    }

    // Filename preview
    this.previewEl = contentEl.createDiv({ cls: "scriptvault-new-preview" });
    this.updatePreview();

    // Action buttons
    const actions = contentEl.createDiv({ cls: "scriptvault-new-actions" });
    const cancelBtn = actions.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => this.close());
    const createBtn = actions.createEl("button", { text: "Create", cls: "mod-cta" });
    createBtn.addEventListener("click", () => {
      void this.create();
    });

    // Focus name field after open
    setTimeout(() => {
      if (!this.selectedType.fixedName) this.nameInput.focus();
      else this.nameInput.blur();
    }, 50);
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private updatePreview(): void {
    const base = this.nameInput.value.trim() || "my-script";
    const filename = this.selectedType.filename(base);
    this.previewEl.setText(`Will create: ${this.folder.path ? this.folder.path + "/" : ""}${filename}`);
  }

  private async create(): Promise<void> {
    const base = this.nameInput.value.trim();
    if (!base && !this.selectedType.fixedName) {
      new Notice("Please enter a file name.");
      this.nameInput.focus();
      return;
    }

    const filename = this.selectedType.filename(base || this.selectedType.fixedName!);
    const path = normalizePath(
      this.folder.path ? `${this.folder.path}/${filename}` : filename,
    );

    if (this.app.vault.getAbstractFileByPath(path)) {
      new Notice(`File already exists: ${filename}`);
      return;
    }

    const content = applyTemplate(this.selectedType.template, base || filename);

    try {
      await this.app.vault.create(path, content);
      this.close();
      await Promise.resolve(this.onCreated(path));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      new Notice(`Failed to create file: ${msg}`);
    }
  }
}
