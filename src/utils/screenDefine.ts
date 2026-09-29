"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useScreenDefine(maxWidth: number): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth <= maxWidth,
    () => false,
  );
}
