export function isDesktop(): boolean {
  try {
    const { Platform } = require("obsidian") as typeof import("obsidian");
    return Platform.isDesktopApp && !Platform.isMobile;
  } catch {
    return false;
  }
}
