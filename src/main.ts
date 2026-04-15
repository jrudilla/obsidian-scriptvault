import {
  Plugin,
  TFile,
  TFolder,
  WorkspaceLeaf,
  Notice,
  Menu,
  MenuItem,
} from "obsidian";
import { NewScriptModal } from "./features/newScript";
import {
  DEFAULT_SETTINGS,
  ScriptVaultSettings,
  ScriptVaultSettingsTab,
} from "./settings";
import { ScriptView } from "./view/ScriptView";
import { RunnerOutputView } from "./features/runnerPanel";
import { OutlineView } from "./features/outline";
import {
  VIEW_TYPE_SCRIPT,
  VIEW_TYPE_RUNNER,
  VIEW_TYPE_OUTLINE,
  SCRIPT_EXTENSIONS,
  FILENAME_ONLY,
} from "./constants";
import { isFilenameOnly } from "./lang";
import { debounce } from "./util/debounce";

export default class ScriptVaultPlugin extends Plugin {
  settings!: ScriptVaultSettings;
  trustedRunPaths = new Set<string>();

  private reentryGuard = new WeakSet<TFile>();
  private refreshOutlineDebounced!: () => void;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_SCRIPT,
      (leaf: WorkspaceLeaf) => new ScriptView(leaf, this),
    );
    this.registerView(
      VIEW_TYPE_RUNNER,
      (leaf: WorkspaceLeaf) => new RunnerOutputView(leaf),
    );
    this.registerView(
      VIEW_TYPE_OUTLINE,
      (leaf: WorkspaceLeaf) => new OutlineView(leaf, this),
    );

    try {
      this.registerExtensions(SCRIPT_EXTENSIONS, VIEW_TYPE_SCRIPT);
    } catch (err) {
      console.warn("[scriptvault] Some extensions could not be registered:", err);
    }

    this.refreshOutlineDebounced = debounce(() => {
      this.refreshOutline();
    }, 250);

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => this.handleFileOpen(file)),
    );

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu: Menu, abstractFile) => {
        // "Open in ScriptVault" for supported files
        if (abstractFile instanceof TFile && this.shouldOfferOpen(abstractFile)) {
          menu.addItem((item: MenuItem) => {
            item
              .setTitle("Open in ScriptVault")
              .setIcon("file-code")
              .onClick(() => this.openInScriptView(abstractFile));
          });
        }
        // "New script file…" — target the folder itself, or parent of a file
        const folder =
          abstractFile instanceof TFolder
            ? abstractFile
            : abstractFile instanceof TFile
              ? abstractFile.parent
              : null;
        if (folder) {
          menu.addItem((item: MenuItem) => {
            item
              .setTitle("New script file…")
              .setIcon("file-plus")
              .onClick(() => this.openNewScriptModal(folder));
          });
        }
      }),
    );


    this.addCommand({
      id: "open-current-in-scriptvault",
      name: "Open current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (checking) return true;
        this.openInScriptView(file);
        return true;
      },
    });

    this.addCommand({
      id: "show-outline",
      name: "Show outline",
      callback: () => this.openOutlineView(),
    });

    this.addSettingTab(new ScriptVaultSettingsTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.maybeWarnDetectExtensions();
    });
  }

  async onunload(): Promise<void> {
    // Obsidian recommends NOT detaching leaves on unload — leaves persist
    // and reattach when the plugin loads again. Cleanup is automatic via
    // registerView/registerEvent. Leaving this hook empty intentionally.
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // --- File open interception for filename-only files ---

  private async handleFileOpen(file: TFile | null): Promise<void> {
    if (!file) return;
    if (!this.settings.enableFilenameIntercept) return;
    if (!isFilenameOnly(file.name)) return;
    if (this.reentryGuard.has(file)) return;

    const leaf = this.app.workspace.activeLeaf;
    if (!leaf) return;
    if (leaf.view.getViewType() === VIEW_TYPE_SCRIPT) return;

    this.reentryGuard.add(file);
    queueMicrotask(() => this.reentryGuard.delete(file));

    await leaf.setViewState({
      type: VIEW_TYPE_SCRIPT,
      state: { file: file.path },
      active: true,
    });
  }

  private shouldOfferOpen(file: TFile): boolean {
    if (isFilenameOnly(file.name)) return true;
    return SCRIPT_EXTENSIONS.includes(file.extension);
  }

  private async openInScriptView(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({
      type: VIEW_TYPE_SCRIPT,
      state: { file: file.path },
      active: true,
    });
  }

  // --- Outline integration ---

  notifyOutlineRefresh(): void {
    this.refreshOutlineDebounced?.();
  }

  private refreshOutline(): void {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_OUTLINE);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof OutlineView) {
        view.refresh();
      }
    }
  }

  async openOutlineView(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_OUTLINE);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      this.refreshOutline();
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      new Notice("Could not open outline panel.");
      return;
    }
    await leaf.setViewState({ type: VIEW_TYPE_OUTLINE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  getActiveScriptView(): ScriptView | null {
    const active = this.app.workspace.getActiveViewOfType(ScriptView);
    if (active) return active;
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_SCRIPT);
    return (leaves[0]?.view as ScriptView) ?? null;
  }

  revealScriptLine(line: number): void {
    const view = this.getActiveScriptView();
    if (view) view.revealLine(line);
  }

  // --- Runner panel ---

  async openRunnerPanel(): Promise<RunnerOutputView | null> {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_RUNNER);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return existing[0].view as RunnerOutputView;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) return null;
    await leaf.setViewState({ type: VIEW_TYPE_RUNNER, active: true });
    this.app.workspace.revealLeaf(leaf);
    return leaf.view as RunnerOutputView;
  }

  // --- One-time prerequisite warning ---

  private maybeWarnDetectExtensions(): void {
    const vaultAny = this.app.vault as unknown as {
      getConfig?: (key: string) => unknown;
    };
    const showAll = vaultAny.getConfig?.("showUnsupportedFiles");
    if (showAll === false) {
      new Notice(
        "ScriptVault: enable 'Files & Links → Detect all file extensions' in Obsidian settings to open Dockerfile / Makefile and other extensionless files.",
        8000,
      );
    }
  }

  // --- New script modal ---

  openNewScriptModal(folder: TFolder): void {
    const modal = new NewScriptModal(this.app, folder, async (path) => {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        await this.openInScriptView(file);
      }
    });
    modal.open();
  }

  // Expose for tests / future use
  static readonly FILENAME_ONLY = FILENAME_ONLY;
}
