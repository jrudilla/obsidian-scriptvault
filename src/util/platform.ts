import { createRequire } from "module";

const require = createRequire(typeof __filename === "string" ? __filename : process.cwd());

export function isDesktop(): boolean {
  try {
    const { Platform } = require("obsidian") as typeof import("obsidian");
    return Platform.isDesktopApp && !Platform.isMobile;
  } catch {
    return false;
  }
}
