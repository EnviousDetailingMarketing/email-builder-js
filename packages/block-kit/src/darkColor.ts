import type { StyleRegistry } from './StyleRegistry';

//
// WS-04 dark mode (Option A — auto-derived palette).
//
// Given an existing color and its role, derive a dark-scheme variant and register
// it through the Style Registry under a deduped, color-stable class. Returns the
// class name to attach to the element, or `undefined` when there is no color or
// no override is needed — so the light-mode markup and stylesheet are left
// byte-for-byte unchanged in the common case.
//
// Derivation is a conditional lightness flip in HSL that preserves hue +
// saturation: foreground colors are only *lightened* when they are dark, and
// background colors only *darkened* when they are light. So dark body text
// becomes light, a white card becomes near-black, while already-light text (e.g.
// a white button label) and already-dark backgrounds are left as-is. No author
// configuration is required (Option B `darkModeColor` schema fields are a
// documented WS-07 follow-up, not implemented here).
//
// WS-07 (CR-4): this is now the single canonical implementation. It previously
// lived as a byte-identical copy in each color-bearing block package; those
// copies were collapsed into this block-kit export and the consumers re-point at
// `@usewaypoint/block-kit`. (In a worktree, `@usewaypoint/block-kit` resolves to
// the main checkout's pre-built dist, so consumers only see this move once all
// dists are rebuilt together at merge time.)
//
export type DarkColorRole = 'fg' | 'bg';

export function deriveDarkColor(hex: string, role: DarkColorRole): string {
  const { h, s, l } = hexToHsl(hex);
  let nl = l;
  if (role === 'fg' && l < 0.5) {
    nl = 1 - l;
  } else if (role === 'bg' && l > 0.5) {
    nl = 1 - l;
  }
  if (nl === l) {
    return hex.toLowerCase();
  }
  return hslToHex(h, s, nl);
}

export function registerDarkColor(
  registry: StyleRegistry,
  color: string | null | undefined,
  role: DarkColorRole
): string | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return undefined;
  }
  const dark = deriveDarkColor(color, role);
  if (dark === color.toLowerCase()) {
    // Already dark-mode-appropriate: no override, no class, no markup change.
    return undefined;
  }
  const className = `ebw-d-${role}-${color.slice(1).toLowerCase()}`;
  const prop = role === 'fg' ? 'color' : 'background-color';
  // @media (prefers-color-scheme: dark) override (Apple Mail, iOS, supported
  // Gmail app). `!important` because inline styles win specificity.
  registry.addClass(className, { dark: `${prop}:${dark}!important;` });
  // Outlook.com / Windows dark mode strips @media and rewrites colors, exposing
  // the original via [data-ogsc] (foreground) / [data-ogsb] (background). Re-apply
  // the same override through those hooks.
  const ogsAttr = role === 'fg' ? 'data-ogsc' : 'data-ogsb';
  registry.addRule(`${className}::ogs`, `[${ogsAttr}] .${className}{${prop}:${dark}!important;}`);
  return className;
}

/** Join class names, dropping `undefined`; returns `undefined` if none remain. */
export function joinClasses(...names: Array<string | undefined>): string | undefined {
  const filtered = names.filter((n): n is string => Boolean(n));
  return filtered.length > 0 ? filtered.join(' ') : undefined;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  let r: number;
  let g: number;
  let b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) {tt += 1;}
      if (tt > 1) {tt -= 1;}
      if (tt < 1 / 6) {return p + (q - p) * 6 * tt;}
      if (tt < 1 / 2) {return q;}
      if (tt < 2 / 3) {return p + (q - p) * (2 / 3 - tt) * 6;}
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
