// src/utils/backupFilename.ts

const pad = (value: number): string => String(value).padStart(2, "0");

/**
 * Timestamped backup file name in local time, e.g.
 * `Backup 2026-09-26 15:05:03.zip`.
 *
 * Note: `:` is not a legal character in Windows file names, so when saving on
 * Windows the browser substitutes it (typically with `_`).
 */
export const backupFilename = (date: Date = new Date()): string => {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `Backup ${day} ${time}.zip`;
};
