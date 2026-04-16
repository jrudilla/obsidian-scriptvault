import { App, PluginSettingTab, Setting } from "obsidian";
import type ScriptVaultPlugin from "./main";

export interface ScriptVaultSettings {
  maskEnvByDefault: boolean;
  runnerShell: string;
  runnerTimeoutMs: number;
  runnerConfirmEverySession: boolean;
  enableFilenameIntercept: boolean;
  enableShellCheck: boolean;
  shellCheckPath: string; // empty = auto-detect from known locations
}

export const DEFAULT_SETTINGS: ScriptVaultSettings = {
  maskEnvByDefault: true,
  runnerShell: "",
  runnerTimeoutMs: 30000,
  runnerConfirmEverySession: true,
  enableFilenameIntercept: true,
  enableShellCheck: true,
  shellCheckPath: "",
};

export class ScriptVaultSettingsTab extends PluginSettingTab {
  plugin: ScriptVaultPlugin;

  constructor(app: App, plugin: ScriptVaultPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Enable shellcheck linting")
      .setDesc(
        "Show inline shellcheck diagnostics for shell scripts (.sh, .bash). Requires shellcheck to be installed (brew install shellcheck). Desktop only.",
      )
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableShellCheck).onChange((v) => {
          this.plugin.settings.enableShellCheck = v;
          void this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Shellcheck path")
      .setDesc(
        "Absolute path to the shellcheck binary. Leave empty to auto-detect (/opt/homebrew/bin, /usr/local/bin, /usr/bin).",
      )
      .addText((t) =>
        t
          .setPlaceholder("/opt/homebrew/bin/shellcheck")
          .setValue(this.plugin.settings.shellCheckPath)
          .onChange((v) => {
            this.plugin.settings.shellCheckPath = v.trim();
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Mask .env values by default")
      .setDesc("Hide values after `=` in .env files until you click the toggle.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.maskEnvByDefault).onChange((v) => {
          this.plugin.settings.maskEnvByDefault = v;
          void this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Intercept filename-only files")
      .setDesc(
        "Open dockerfile, makefile, and similar files in the script editor automatically. Requires Obsidian setting 'Files & Links → Detect all file extensions' to be enabled.",
      )
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.enableFilenameIntercept)
          .onChange((v) => {
            this.plugin.settings.enableFilenameIntercept = v;
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Confirm script execution per session")
      .setDesc(
        "Show a confirmation modal the first time you run each script in a session. After confirmation, that same file can run again without prompting until you reload the plugin.",
      )
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.runnerConfirmEverySession)
          .onChange((v) => {
            this.plugin.settings.runnerConfirmEverySession = v;
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Runner shell override")
      .setDesc(
        "Optional. Absolute path to an interpreter to use for all scripts. Leave empty to auto-detect from shebang or extension.",
      )
      .addText((t) =>
        t
          .setPlaceholder("/bin/bash")
          .setValue(this.plugin.settings.runnerShell)
          .onChange((v) => {
            this.plugin.settings.runnerShell = v.trim();
            void this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Runner timeout (ms)")
      .setDesc("Maximum execution time before the script is killed.")
      .addText((t) =>
        t
          .setValue(String(this.plugin.settings.runnerTimeoutMs))
          .onChange((v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) {
              this.plugin.settings.runnerTimeoutMs = n;
              void this.plugin.saveSettings();
            }
          }),
      );
  }
}
