import { Platform } from "obsidian";

export function isDesktop(): boolean {
  return Platform.isDesktopApp && !Platform.isMobile;
}
