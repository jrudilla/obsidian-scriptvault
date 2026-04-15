import fs from "fs";
import { isDesktop } from "../util/platform";

export interface FilePermissions {
  executable: boolean;
  canCheck: boolean; // false on Windows or mobile
}

export function getFilePermissions(absPath: string): FilePermissions {
  if (!isDesktop()) return { executable: false, canCheck: false };
  if (process.platform === "win32") return { executable: true, canCheck: false };

  try {
    const stat = fs.statSync(absPath);
    const executable = (stat.mode & 0o111) !== 0;
    return { executable, canCheck: true };
  } catch {
    return { executable: false, canCheck: false };
  }
}

export function makeExecutable(absPath: string): boolean {
  if (!isDesktop() || process.platform === "win32") return false;
  try {
    const stat = fs.statSync(absPath);
    fs.chmodSync(absPath, stat.mode | 0o111);
    return true;
  } catch {
    return false;
  }
}
