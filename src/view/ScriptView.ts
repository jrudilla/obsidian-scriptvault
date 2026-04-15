import { TextFileView, WorkspaceLeaf, Notice } from "obsidian";
import { EditorView } from "@codemirror/view";
import { Compartment, EditorSelection } from "@codemirror/state";
import { createEditor } from "./editorSetup";
import { buildHeader, type HeaderHandle } from "./headerActions";
import { detectLanguage, loadLanguageSupport, type LangId } from "../lang";
import { envMaskExtension } from "../features/envMask";
import {
  canRun,
  getScriptWorkingDirectory,
  isInterpreterAvailable,
  pickInterpreter,
  runScript,
} from "../features/runner";
import { requireTrust } from "../features/runnerTrust";
import { makeShellCheckLinter } from "../features/shellcheck";
import { getFilePermissions, makeExecutable } from "../features/permissions";
import {
  VIEW_TYPE_SCRIPT,
  UNIX_CHMOD_EXTENSIONS,
  SHELLCHECK_EXTENSIONS,
  RUNNABLE_EXTENSIONS,
} from "../constants";
import { isDesktop } from "../util/platform";
import type ScriptVaultPlugin from "../main";

export class ScriptView extends TextFileView {
  private cm: EditorView | null = null;
  private langCompartment = new Compartment();
  private maskCompartment = new Compartment();
  private lintCompartment = new Compartment();
  private headerEl!: HTMLElement;
  private editorEl!: HTMLElement;
  private header: HeaderHandle | null = null;
  private isMaskOn = false;
  private pendingData = "";
  private editorBuilt = false;

  currentLang: LangId = "plain";

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: ScriptVaultPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_SCRIPT;
  }

  getDisplayText(): string {
    return this.file?.name ?? "Script";
  }

  getIcon(): string {
    return "file-code";
  }

  async onOpen(): Promise<void> {
    const root = this.contentEl;
    root.empty();
    root.addClass("scriptvault-view");
    this.headerEl = root.createDiv();
    this.editorEl = root.createDiv({ cls: "scriptvault-editor" });
    await Promise.resolve();
  }

  async onClose(): Promise<void> {
    this.header?.destroy();
    this.header = null;
    if (this.cm) {
      this.cm.destroy();
      this.cm = null;
    }
    this.editorBuilt = false;
    this.contentEl.empty();
    await Promise.resolve();
  }

  getViewData(): string {
    if (this.cm) return this.cm.state.doc.toString();
    return this.pendingData;
  }

  setViewData(data: string, _clear: boolean): void {
    this.pendingData = data;

    if (!this.editorBuilt) {
      this.buildEditor(data);
      this.editorBuilt = true;
    } else if (this.cm) {
      const current = this.cm.state.doc.toString();
      if (current !== data) {
        this.cm.dispatch({
          changes: { from: 0, to: current.length, insert: data },
        });
      }
    }

    this.applyLanguage(data);
    this.applyInitialMask();
    this.applyLinter();
    this.rebuildHeader();
    this.refreshPermissions();
    this.refreshRunAvailability();
    this.plugin.notifyOutlineRefresh();
  }

  clear(): void {
    this.pendingData = "";
    if (this.cm) {
      const current = this.cm.state.doc.toString();
      this.cm.dispatch({
        changes: { from: 0, to: current.length, insert: "" },
      });
    }
  }

  private buildEditor(data: string): void {
    if (!this.editorEl) return;
    this.editorEl.empty();
    this.cm = createEditor({
      parent: this.editorEl,
      doc: data,
      langCompartment: this.langCompartment,
      maskCompartment: this.maskCompartment,
      lintCompartment: this.lintCompartment,
      onChange: () => {
        this.requestSave();
        this.plugin.notifyOutlineRefresh();
      },
      onCursorMove: (line, col, totalLines) => {
        this.header?.updateCursor(line, col, totalLines);
      },
    });
  }

  private applyLanguage(data: string): void {
    const firstLine = data.split(/\r?\n/, 1)[0];
    this.currentLang = detectLanguage(this.file, firstLine);
    if (this.cm) {
      this.cm.dispatch({
        effects: this.langCompartment.reconfigure(loadLanguageSupport(this.currentLang)),
      });
    }
  }

  private applyInitialMask(): void {
    if (this.file?.extension === "env") {
      const enabled = this.plugin.settings.maskEnvByDefault;
      this.isMaskOn = enabled;
      if (this.cm) {
        this.cm.dispatch({
          effects: this.maskCompartment.reconfigure(enabled ? envMaskExtension() : []),
        });
      }
    } else {
      this.isMaskOn = false;
      if (this.cm) {
        this.cm.dispatch({
          effects: this.maskCompartment.reconfigure([]),
        });
      }
    }
  }

  private applyLinter(): void {
    if (!this.cm) return;
    const file = this.file;
    // ShellCheck only supports sh/bash/dash/ksh — not fish, zsh, or ps1.
    const shouldLint =
      isDesktop() &&
      this.plugin.settings.enableShellCheck &&
      file != null &&
      SHELLCHECK_EXTENSIONS.has(file.extension);

    this.cm.dispatch({
      effects: this.lintCompartment.reconfigure(
        shouldLint
          ? makeShellCheckLinter(
              file.extension,
              this.plugin.settings.shellCheckPath || undefined,
            )
          : [],
      ),
    });
  }

  private rebuildHeader(): void {
    this.header?.destroy();
    this.header = buildHeader(this.headerEl, this);
    this.header.setMaskActive(this.isMaskOn);
  }

  private refreshRunAvailability(): void {
    if (!this.header || !this.file || !RUNNABLE_EXTENSIONS.has(this.file.extension)) return;

    const firstLine = this.getViewData().split(/\r?\n/, 1)[0];
    const interpreter = pickInterpreter(
      this.getAbsPath() ?? this.file.path,
      this.file.extension,
      firstLine,
      this.plugin.settings.runnerShell,
    );

    if (!isInterpreterAvailable(interpreter)) {
      this.header.setRunEnabled(false, `Interpreter not found: ${interpreter[0]}`);
      return;
    }

    this.header.setRunEnabled(true, `Execute with ${interpreter.join(" ")}`);
  }

  /** Read filesystem permissions and update the header chmod button. */
  private refreshPermissions(): void {
    if (!this.file) return;
    const ext = this.file.extension;
    if (!UNIX_CHMOD_EXTENSIONS.has(ext)) return;

    const absPath = this.getAbsPath();
    if (!absPath) return;

    const perms = getFilePermissions(absPath);
    this.header?.updateExecStatus(perms.executable, perms.canCheck);
  }

  /** Resolve the absolute path of the current file, or null if not available. */
  private getAbsPath(): string | null {
    if (!this.file) return null;
    const adapter = this.app.vault.adapter;
    const getFullPath = (adapter as { getFullPath?: (p: string) => string }).getFullPath;
    if (typeof getFullPath !== "function") return null;
    return getFullPath.call(adapter, this.file.path);
  }

  toggleMask(): void {
    if (this.file?.extension !== "env" || !this.cm) return;
    this.isMaskOn = !this.isMaskOn;
    this.cm.dispatch({
      effects: this.maskCompartment.reconfigure(this.isMaskOn ? envMaskExtension() : []),
    });
    this.header?.setMaskActive(this.isMaskOn);
  }

  makeExecutable(): void {
    const absPath = this.getAbsPath();
    if (!absPath) {
      new Notice("Cannot resolve file path.");
      return;
    }
    const ok = makeExecutable(absPath);
    if (ok) {
      new Notice("File is now executable (chmod +x).");
      this.header?.updateExecStatus(true, true);
    } else {
      new Notice("Failed to set executable permission.");
    }
  }

  showOutline(): void {
    void this.plugin.openOutlineView();
  }

  revealLine(lineIndex: number): void {
    if (!this.cm) return;
    const line = this.cm.state.doc.line(Math.min(lineIndex + 1, this.cm.state.doc.lines));
    this.cm.dispatch({
      selection: EditorSelection.cursor(line.from),
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
    this.cm.focus();
  }

  async runScript(): Promise<void> {
    if (!this.file) return;
    if (!canRun()) {
      new Notice("Script execution is only available on desktop.");
      return;
    }

    const absPath = this.getAbsPath();
    if (!absPath) {
      new Notice("Cannot resolve absolute path on this platform.");
      return;
    }

    const firstLine = this.getViewData().split(/\r?\n/, 1)[0];
    const interpreter = pickInterpreter(
      absPath,
      this.file.extension,
      firstLine,
      this.plugin.settings.runnerShell,
    );
    if (!isInterpreterAvailable(interpreter)) {
      new Notice(`Interpreter not found: ${interpreter[0]}`);
      this.refreshRunAvailability();
      return;
    }

    await this.save();

    const allowed = await requireTrust(this.plugin, this.file.path, interpreter);
    if (!allowed) return;

    const panel = await this.plugin.openRunnerPanel();
    if (!panel) {
      new Notice("Could not open runner panel.");
      return;
    }

    panel.startRun(this.file.name);

    try {
      const cwd = getScriptWorkingDirectory(absPath);
      const result = await runScript(
        interpreter,
        cwd,
        this.plugin.settings.runnerTimeoutMs,
        (chunk, kind) => panel.appendChunk(chunk, kind),
      );
      panel.finishRun(result.exitCode, result.killed);
      if (result.killed) {
        new Notice(`Script killed after ${this.plugin.settings.runnerTimeoutMs} ms`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      panel.appendChunk(`\n[scriptvault] ${msg}\n`, "stderr");
      panel.finishRun(null, false);
      new Notice(`Run failed: ${msg}`);
    }
  }
}
