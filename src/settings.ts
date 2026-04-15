import { App, PluginSettingTab, Setting } from "obsidian";
import type ScriptVaultPlugin from "./main";

export interface ScriptVaultSettings {
  maskEnvByDefault: boolean;
  runnerShell: string;
  runnerTimeoutMs: number;
  runnerConfirmEverySession: boolean;
  enableFilenameIntercept: boolean;
}

export const DEFAULT_SETTINGS: ScriptVaultSettings = {
  maskEnvByDefault: true,
  runnerShell: "",
  runnerTimeoutMs: 30000,
  runnerConfirmEverySession: true,
  enableFilenameIntercept: true,
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
      .setName("Mask .env values by default")
      .setDesc("Hide values after `=` in .env files until you click the toggle.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.maskEnvByDefault).onChange(async (v) => {
          this.plugin.settings.maskEnvByDefault = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Intercept filename-only files")
      .setDesc(
        "Open Dockerfile, Makefile, etc. in ScriptVault automatically. Requires Obsidian setting 'Files & Links → Detect all file extensions' to be enabled.",
      )
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.enableFilenameIntercept)
          .onChange(async (v) => {
            this.plugin.settings.enableFilenameIntercept = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Confirm script execution per session")
      .setDesc(
        "Show a confirmation modal the first time you run a script in each session. After the first confirmation, subsequent runs in the same session execute without prompting until you reload the plugin.",
      )
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.runnerConfirmEverySession)
          .onChange(async (v) => {
            this.plugin.settings.runnerConfirmEverySession = v;
            await this.plugin.saveSettings();
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
          .onChange(async (v) => {
            this.plugin.settings.runnerShell = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Runner timeout (ms)")
      .setDesc("Maximum execution time before the script is killed.")
      .addText((t) =>
        t
          .setValue(String(this.plugin.settings.runnerTimeoutMs))
          .onChange(async (v) => {
            const n = parseInt(v, 10);
            if (Number.isFinite(n) && n > 0) {
              this.plugin.settings.runnerTimeoutMs = n;
              await this.plugin.saveSettings();
            }
          }),
      );
  }
}
