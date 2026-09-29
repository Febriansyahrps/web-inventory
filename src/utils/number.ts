import type React from "react";

/**
 * Blocks letters and symbols at the keystroke level so a numeric field can only
 * receive digits. Control/navigation keys (Backspace, Tab, arrows, Enter, …) and
 * Ctrl/Cmd/Alt shortcuts are left untouched.
 */
export const preventNonNumeric = (
  e: React.KeyboardEvent<HTMLInputElement>,
) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length > 1) return;
  if (!/\d/.test(e.key)) e.preventDefault();
};

/** Normalize a price param: empty, 0 and non-numbers all mean "no filter". */
export const normalizePrice = (value: string | null | undefined): string => {
  const num = Number(value);
  return value && !Number.isNaN(num) && num > 0 ? String(num) : "";
};
