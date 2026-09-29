"use client";

import { useSyncExternalStore } from "react";
import Cookies from "js-cookie";

// Cookies can't be subscribed to, so this is a no-op subscriber.
const subscribe = () => () => {};

/**
 * Read a cookie without breaking hydration. The server snapshot is `undefined`,
 * so the server HTML and the first client render agree; React swaps in the real
 * value once it syncs with the client after hydration.
 */
export function useCookie(name: string): string | undefined {
  return useSyncExternalStore(
    subscribe,
    () => Cookies.get(name),
    () => undefined,
  );
}
