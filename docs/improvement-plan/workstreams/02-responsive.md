# WS-02 — Responsive Layout & Per-Column Stacking

**Team:** Responsive · **Phase:** 1 · **Depends on:** WS-01 (Style Registry + head) · **Covers items:** 2, 3

> Owner's exact requirement: *"this column should stack on mobile, but this column shouldn't — some columns can still be side by side on mobile, others shouldn't."* So stacking is **per-column**, not all-or-nothing.

---

## Objective
Make rendered emails fluid and mobile-correct, with **per-column** control over whether a column stacks on small screens.

---

## Item 2 — Per-column mobile stacking

**Problem today:** `block-columns-container` emits a fixed-layout `<table tableLayout:fixed>` with side-by-side `<td>`s and **no media query** — three columns stay squashed on a 320px phone (`block-columns-container/src/index.tsx:39-152`). Capped at 2–3 columns.

**Design**
- Extend `ColumnsContainerPropsSchema` (in `block-kit` coordination / the block's schema) with a per-column flag. Backward-compatible (`.optional()`, default = stack):

```ts
// new optional field on columns-container props
columns: z.array(z.object({
  stackOnMobile: z.boolean().optional(),   // default true
})).optional()
// OR a parallel array: stackOnMobile?: boolean[]  — pick one, document it
```

- Render each `<td>` with a stable class: columns flagged to stack get `.ebw-col-stack`, others get `.ebw-col-fixed`.
- Register CSS via the Style Registry:

```css
@media (max-width:600px){
  .ebw-col-stack{ display:block !important; width:100% !important; }
  /* .ebw-col-fixed intentionally keeps its inline width */
}
```

- The `<table>` itself needs the **hybrid/spongy** pattern so stacked cells reflow: use `align`+inline-block fallback or the ghost-table pattern (coordinate the Outlook ghost table with WS-03 so they share the same wrapper). Recommended approach: **fluid hybrid** (`width:100%` table, `max-width` cells, `display:inline-block` on stack cells via class) which degrades correctly in Outlook (handled by WS-03 MSO ghost columns).

**Tasks**
- [ ] Add the per-column `stackOnMobile` schema field (optional, default true).
- [ ] Emit per-column stack/fixed classes; register the media-query CSS through the Style Registry.
- [ ] Verify a mixed config (col A stacks, col B fixed) renders correctly at 320px and 600px+.
- [ ] Add inspector control in the editor: a per-column "Stack on mobile" toggle in `ColumnsContainer` sidebar panel (coordinate file with WS-06).
- [ ] Update default sample(s) that use columns so they keep current visual behavior.

---

## Item 3 — Full responsive support

**Problem:** No `<meta viewport>` (WS-01 adds it), fixed pixel everything, only images get `maxWidth:100%`.

**Tasks**
- [ ] Container/body: ensure the 600px shell is **fluid** — `width:100%; max-width:600px` with the Outlook `width=600` ghost (WS-03). Already partly present in `EmailLayoutReader.tsx:56-78`; convert CSS-only max-width into the hybrid pattern.
- [ ] Register mobile CSS for fluid paddings where helpful (e.g. reduce large side paddings on `<600px`). Add an optional `mobilePadding` concept only if cheap; otherwise a global `@media` rule that tames oversized horizontal padding.
- [ ] Images: confirm `width:100%; height:auto; max-width:<intrinsic>` so they scale down but never up.
- [ ] Add a `@media (max-width:600px)` baseline rule set (font scaling optional, keep conservative).
- [ ] Snapshot tests for the generated `<style>` media block.

---

## Interface contracts
- **Consumes** WS-01 `useStyleRegistry().addClass(...)`. Do not write `<style>` directly.
- **Shares** the columns table wrapper with WS-03 (Outlook ghost). Agree on one DOM structure before both edit `block-columns-container`.

## Files
- `packages/block-columns-container/src/index.tsx`
- `packages/email-builder/.../EmailLayout/EmailLayoutReader.tsx`
- `examples/.../InspectorDrawer/ConfigurationPanel/ColumnsContainerSidebarPanel*.tsx` (per-column toggle)

## Acceptance / DoD
- [ ] Mixed-stack column config verified at 320 / 375 / 600+ px.
- [ ] Outlook ghost columns agreed with WS-03 and not broken by stacking classes.
- [ ] Existing column samples render unchanged on desktop.
- [ ] Snapshot + manual cross-client check logged in `testing.md` matrix.
