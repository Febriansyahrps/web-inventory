/** #rrggbb → HSL (h in degrees, s/l in 0–100). */
function hexToHsl(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

/** HSL → #rrggbb. */
function hslToHex(h: number, s: number, l: number) {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) =>
    light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Build a palette that descends from the primary color: rotate the hue around it
 * and vary saturation/lightness so every slice/bar is distinct but still in the
 * primary's family. Deterministic (index-seeded) so SSR and client agree.
 */
export function paletteFromPrimary(primary: string, count: number): string[] {
  const { h, s } = hexToHsl(primary);
  return Array.from({ length: count }, (_, i) => {
    const hue = (h + i * 35) % 360;
    const sat = Math.min(85, Math.max(50, s - (i % 2 ? 8 : -4)));
    const light = 44 + (i % 3) * 9;
    return hslToHex(hue, sat, light);
  });
}
