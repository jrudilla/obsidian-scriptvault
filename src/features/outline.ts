import { ItemView, WorkspaceLeaf } from "obsidian";
import type { LangId } from "../lang";
import type ScriptVaultPlugin from "../main";
import { VIEW_TYPE_OUTLINE } from "../constants";

export interface OutlineItem {
  name: string;
  line: number;
  kind: "function" | "target" | "section";
}

export function extractOutline(
  doc: string,
  lang: LangId,
  filename: string,
): OutlineItem[] {
  const items: OutlineItem[] = [];
  const lines = doc.split(/\r?\n/);
  const lower = filename.toLowerCase();
  const isMakefile = lower === "makefile" || lower === "gnumakefile";
  const isDockerfile = lang === "dockerfile";
  const isPowerShell = lang === "powershell";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isDockerfile) {
      const fromMatch = /^FROM\s+(.+?)(?:\s+AS\s+(\S+))?\s*$/i.exec(line);
      if (fromMatch) {
        const label = fromMatch[2] ? `${fromMatch[2]} (${fromMatch[1]})` : fromMatch[1];
        items.push({ name: label, line: i, kind: "section" });
      }
      continue;
    }

    if (isMakefile) {
      if (!line.startsWith("\t")) {
        const targetMatch = /^([A-Za-z0-9_.\-/]+)\s*:(?!=)/.exec(line);
        if (targetMatch) {
          items.push({ name: targetMatch[1], line: i, kind: "target" });
        }
      }
      continue;
    }

    if (isPowerShell) {
      const psMatch = /^\s*function\s+([A-Za-z][\w-]*)/i.exec(line);
      if (psMatch) {
        items.push({ name: psMatch[1], line: i, kind: "function" });
      }
      continue;
    }

    if (lang === "shell") {
      const shellFn2 = /^\s*function\s+([a-zA-Z_][\w-]*)\s*(?:\{|$|\()/.exec(line);
      const shellFn1 = /^\s*([a-zA-Z_][\w-]*)\s*\(\s*\)\s*\{?/.exec(line);
      const match = shellFn2 || shellFn1;
      if (match) {
        items.push({ name: match[1], line: i, kind: "function" });
      }
    }
  }

  return items;
}

export class OutlineView extends ItemView {
  private listEl!: HTMLElement;
  private currentItems: OutlineItem[] = [];

  constructor(leaf: WorkspaceLeaf, private plugin: ScriptVaultPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_OUTLINE;
  }

  getDisplayText(): string {
    return "ScriptVault outline";
  }

  getIcon(): string {
    return "list-tree";
  }

  async onOpen(): Promise<void> {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("scriptvault-outline-view");
    this.listEl = root.createDiv();
    this.refresh();
    await Promise.resolve();
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
    await Promise.resolve();
  }

  refresh(): void {
    const active = this.plugin.getActiveScriptView();
    if (!active || !active.file) {
      this.currentItems = [];
      this.render();
      return;
    }

    const doc = active.getViewData();
    this.currentItems = extractOutline(doc, active.currentLang, active.file.name);
    this.render();
  }

  private render(): void {
    if (!this.listEl) return;
    this.listEl.empty();

    if (this.currentItems.length === 0) {
      this.listEl.createDiv({
        cls: "scriptvault-outline-empty",
        text: "No outline items in the current file.",
      });
      return;
    }

    for (const item of this.currentItems) {
      const row = this.listEl.createDiv({ cls: "scriptvault-outline-item" });
      const icon = row.createSpan({ cls: "scriptvault-outline-icon" });
      icon.setText(
        item.kind === "function" ? "ƒ" : item.kind === "target" ? "▶" : "§",
      );
      row.createSpan({ cls: "scriptvault-outline-name", text: item.name });

      row.addEventListener("click", () => {
        this.plugin.revealScriptLine(item.line);
      });
    }
  }
}
