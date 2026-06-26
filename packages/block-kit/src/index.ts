import { z } from 'zod';

//
// Shared schemas and helpers used across all @usewaypoint/block-* packages.
//
// This module is the single source of truth for the primitives that were
// previously copy-pasted verbatim into every block package (color/padding/font
// schemas + their helpers). Keep these definitions byte-for-byte equivalent to
// the originals so block output stays identical.
//

export const FONT_FAMILY_SCHEMA = z
  .enum([
    'MODERN_SANS',
    'BOOK_SANS',
    'ORGANIC_SANS',
    'GEOMETRIC_SANS',
    'HEAVY_SANS',
    'ROUNDED_SANS',
    'MODERN_SERIF',
    'BOOK_SERIF',
    'MONOSPACE',
  ])
  .nullable()
  .optional();

export function getFontFamily(fontFamily: z.infer<typeof FONT_FAMILY_SCHEMA>) {
  switch (fontFamily) {
    case 'MODERN_SANS':
      return '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif';
    case 'BOOK_SANS':
      return 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif';
    case 'ORGANIC_SANS':
      return 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif';
    case 'GEOMETRIC_SANS':
      return 'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif';
    case 'HEAVY_SANS':
      return 'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif';
    case 'ROUNDED_SANS':
      return 'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif';
    case 'MODERN_SERIF':
      return 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif';
    case 'BOOK_SERIF':
      return '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif';
    case 'MONOSPACE':
      return '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace';
  }
  return undefined;
}

//
// Color value schema (WS-07, item 15-A — widened past the WS-01 freeze; logged
// as a Change Request in TRACKING).
//
// Historically this only accepted 6-digit hex (`#RRGGBB`). It now also accepts
// 3-/4-/8-digit hex, `rgb()/rgba()`, and the `transparent` keyword, while still
// rejecting arbitrary garbage (it does NOT fall back to a bare `z.string()`).
//
// The regex below is anchored and matches, case-insensitively:
//   - `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA` (3/4/6/8 hex digits)
//   - `rgb(...)` / `rgba(...)` with integer or percentage channels and an
//     optional alpha (0..1, decimal, or percentage). Whitespace and either
//     comma- or space-separated (CSS Color 4) syntaxes are tolerated loosely;
//     the goal is to reject junk, not to be a full CSS parser.
//   - the keyword `transparent`
//
// OUTLOOK CAVEAT: Outlook on Windows (the Word/MSO rendering engine) ignores
// CSS alpha entirely — `rgba()` and 8-digit `#RRGGBBAA` hex are NOT honored.
// In Outlook the color falls back to opaque (alpha dropped) or, for some
// properties, is ignored outright. Authors who need cross-client transparency
// should not rely on alpha here; use a solid color or an image. Apple Mail,
// iOS Mail, and modern webmail clients honor alpha fine.
//
const HEX_COLOR = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})/;
const RGB_CHANNEL = /\s*(?:\d{1,3}%?|\d{1,3}\.\d+%?)\s*/;
const RGB_ALPHA = /\s*(?:0|1|0?\.\d+|\d{1,3}%)\s*/;
const RGB_COLOR = new RegExp(
  `rgba?\\(${RGB_CHANNEL.source}[, ]${RGB_CHANNEL.source}[, ]${RGB_CHANNEL.source}(?:[,/]${RGB_ALPHA.source})?\\)`
);
const COLOR_VALUE_REGEX = new RegExp(`^(?:${HEX_COLOR.source}|${RGB_COLOR.source}|transparent)$`, 'i');

export const COLOR_SCHEMA = z.string().regex(COLOR_VALUE_REGEX).nullable().optional();

export const PADDING_SCHEMA = z
  .object({
    top: z.number(),
    bottom: z.number(),
    right: z.number(),
    left: z.number(),
  })
  .optional()
  .nullable();

export const getPadding = (padding: z.infer<typeof PADDING_SCHEMA>) =>
  padding ? `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px` : undefined;

//
// Style Registry — head <style> infrastructure for responsive / dark / hover CSS.
//
export { StyleRegistryProvider, useStyleRegistry, createStyleRegistry } from './StyleRegistry';
export type { StyleRegistry, CollectingStyleRegistry } from './StyleRegistry';

//
// HTML sanitization — single audited allow-list shared by block-html and the
// block-text markdown path (WS-08, item 17). `htmlToText` is the plain-text
// stripper shared with WS-05.
//
export { sanitizeEmailHtml, htmlToText } from './sanitize';

//
// Dark-mode color derivation (WS-04 Option A) — single canonical home (WS-07
// CR-4). Previously copy-pasted into every color-bearing block package.
//
export { deriveDarkColor, registerDarkColor, joinClasses } from './darkColor';
export type { DarkColorRole } from './darkColor';
