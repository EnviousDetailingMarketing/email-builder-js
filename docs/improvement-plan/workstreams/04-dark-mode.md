# WS-04 — Dark Mode (Editor Preview + Rendered Output)

**Team:** Dark-Mode · **Phase:** 1 · **Depends on:** WS-01 (head + Style Registry) · **Covers item:** 5

> Two deliverables: (a) the **editor preview** can show dark mode, and (b) the **rendered HTML** behaves correctly when a client forces dark mode (Gmail/Outlook/Apple Mail each do this differently).

---

## Objective

Ship emails that look intentional in dark mode instead of being unpredictably color-inverted, and let users preview that in the editor.

---

## Current state

- Zero dark-mode support. Hardcoded light defaults (`#F5F5F5` backdrop, `#FFFFFF` canvas, `#262626` text — `EmailLayoutReader.tsx:43-44`). No `color-scheme`, no `prefers-color-scheme`. Clients force-invert unpredictably.

## Rendered-output tasks

- [ ] (WS-01 already adds `<meta name="color-scheme">` + `supported-color-schemes`.) Confirm present.
- [ ] Add `@media (prefers-color-scheme: dark)` overrides via the Style Registry for the shell + text/heading/button/container colors. Target stable classes (don't fight inline styles — use class overrides with `!important` where needed since inline wins specificity).
- [ ] Add Outlook.com / Windows dark-mode hooks: `[data-ogsc]` and `[data-ogsb]` override selectors for foreground/background swaps.
- [ ] Decide the dark palette strategy:
  - **Option A (recommended, minimal):** auto-derive dark variants from existing colors (darken canvas, lighten text) so authors don't configure anything.
  - **Option B:** add optional `darkModeColor` overrides to color-bearing blocks (schema additions, coordinate with WS-07/`block-kit`). More control, more UI.
  - Document the choice; default to A, leave B as a follow-up hook.
- [ ] Ensure logos/images that need a light background get a neutral padding/background (document guidance; optionally an image `darkModeBackground` flag — only if cheap).

## Editor-preview tasks (in `examples/`)

- [ ] Add a **light/dark preview toggle** next to the existing desktop/mobile toggle (`TemplatePanel/index.tsx` toolbar).
- [ ] Apply dark preview by rendering the `<Reader/>` inside a container that simulates the dark `@media` (e.g. force the dark class set, or render in an iframe with `prefers-color-scheme: dark`). Iframe is the most faithful — coordinate with WS-06 if the preview gets refactored into an iframe.
- [ ] Store the toggle in the Zustand store (`selectedColorScheme: 'light' | 'dark'`), like `selectedScreenSize`.

## Interface contracts

- **Consumes** WS-01 registry (`addClass({ dark })`).
- If choosing Option B (dark override fields), **coordinate schema** with WS-07/`block-kit` so color fields stay centralized.

## Files

- `packages/email-builder/.../EmailLayout/EmailLayoutReader.tsx` + color-bearing blocks (via registry)
- `examples/.../TemplatePanel/index.tsx` (preview toggle)
- `examples/.../documents/editor/EditorContext.tsx` (store field) — CR with WS-06

## DoD

- [ ] Forced dark mode in Gmail (mobile), Apple Mail, Outlook.com verified — colors intentional, text legible, no invisible-on-invisible.
- [ ] Editor preview toggle works and matches rendered output reasonably.
- [ ] No light-mode regression.
