# WS-07 — Block Styling (Color · Button · Container)

**Team:** Block-Styling · **Phase:** 1 · **Depends on:** WS-01 (`block-kit` exists; color schema centralized) · **Covers item:** 15

> All schema changes here are **additive + `.optional()`** so existing CRM documents keep parsing.

---

## Objective
Loosen the over-restrictive styling primitives and give buttons/containers real flexibility.

---

## Color handling

**Problem:** `COLOR_SCHEMA = /^#[0-9a-fA-F]{6}$/` everywhere — rejects alpha (`#RRGGBBAA`), shorthand (`#fff`), `rgb()/rgba()`, named colors, transparency. Lives duplicated (now centralized in `block-kit` after WS-01).

**Tasks**
- [ ] Widen `COLOR_SCHEMA` in `block-kit` to accept: 6- and 8-digit hex, 3- and 4-digit hex, `rgb()/rgba()`, and `transparent`. Validate sanely (regex or a small parser). Keep it strict enough to reject garbage.
- [ ] **Email-safety guardrail:** some clients (Outlook) ignore `rgba`/8-digit hex. Document this; consider the editor color picker warning when alpha is used in a context Outlook will drop. Default editor picker stays hex but *allows* alpha.
- [ ] Update `react-colorful` usage in the editor color inputs to support alpha (it has an `RgbaStringColorPicker`). CR with WS-06 for inspector consistency.
- [ ] Tests: schema accepts the new formats, rejects invalid; snapshot a block using `rgba`.

---

## Button

**Problems:** only 4 size + 3 shape presets; inner padding/border-radius not freely settable; `url` not validated; single visual style (`block-button/src/index.tsx:62-117`).

**Tasks**
- [ ] Add optional explicit controls (keep presets as defaults): custom `borderRadius` (number), custom inner padding, optional `border` (`{ color, width, style }`) for outline buttons.
- [ ] Validate `url` as a URL-ish string (allow `mailto:`/`tel:`/`https:` and relative; reject obviously empty). Don't break existing docs — keep `.optional()`.
- [ ] Preserve the MSO bulletproof rendering; coordinate with WS-03 since radius/border affect the VML fallback (Outlook ignores CSS radius — outline/rounded buttons may need `<v:roundrect>`). **CR with WS-03 on `block-button`.**
- [ ] Inspector controls for the new fields (CR with WS-06).
- [ ] Tests/snapshots for outline + custom-radius buttons.

---

## Container

**Problems:** border hardcoded `1px solid` — no width/style control, no per-side borders, single `borderColor`/`borderRadius` (`block-container/src/index.tsx:40-58`).

**Tasks**
- [ ] Add optional `borderWidth`, `borderStyle` (`solid|dashed|dotted|none`), and optionally per-side border config. Default to current `1px solid` behavior when unset.
- [ ] Optional `backgroundColor` already exists — ensure it composes with new border fields.
- [ ] Note Outlook border rendering caveats (radius ignored) — CR with WS-03 if a ghost wrapper is needed.
- [ ] Inspector controls (CR with WS-06).
- [ ] Tests/snapshots.

---

## Interface contracts
- **Owns** color schema changes inside `block-kit` (the one place WS-07 may edit `block-kit` post-freeze, via CR logged in TRACKING).
- **CR with WS-03** for any button/container change that affects Outlook fallbacks.
- **CR with WS-06** for every new inspector control.

## Files
- `packages/block-kit/src/index.ts` (COLOR_SCHEMA)
- `packages/block-button/src/index.tsx`
- `packages/block-container/src/index.tsx`
- `examples/.../InspectorDrawer/ConfigurationPanel/{Button,Container}SidebarPanel*.tsx`
- Editor color input components (alpha support)

## DoD
- [ ] Color schema accepts modern formats with documented Outlook caveats.
- [ ] Buttons support custom radius/padding/border + URL validation; Outlook fallback intact.
- [ ] Containers support border width/style (+ per-side if done); defaults unchanged.
- [ ] Existing samples render unchanged; new inspector controls present.
