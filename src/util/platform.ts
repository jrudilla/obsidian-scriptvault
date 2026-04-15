export function isDesktop(): boolean {
  if (typeof navigator === "undefined") return false;
  return !/Android|iPhone|iPad/i.test(navigator.userAgent);
}
