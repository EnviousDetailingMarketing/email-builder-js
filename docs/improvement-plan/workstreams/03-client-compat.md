# WS-03 — Outlook & Email-Client Compatibility

**Team:** Client-Compat · **Phase:** 1 · **Depends on:** WS-01 (head + MSO block placeholder) · **Covers item:** 4

> Outlook on Windows uses the **Word rendering engine**: it ignores `max-width`, `border-radius`, many padding forms, `display:inline-block` reliability, and background images without VML. This workstream makes the output survive it.

---

## Objective

Make rendered emails render correctly in Outlook (Windows/Word), and improve robustness in Gmail, Apple Mail, Yahoo, HEY, Superhuman.

---

## Current state

- Layout is mostly `<div>`-based (opposite of email best practice).
- `EmailLayout` centers via a `<table>` but uses CSS `max-width:600px`, **not** the MSO `width=600` ghost-table pattern (`EmailLayoutReader.tsx:56-78`) → can render full-bleed in Outlook.
- The **only** existing Outlook accommodation is the Button's MSO `mso-text-raise` hack (`block-button/src/index.tsx:158-168`).

## Tasks

### Layout shell

- [ ] Wrap the 600px body container in an **MSO ghost table**:
  ```html
  <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
  … fluid container (width:100%;max-width:600px) …
  <!--[if mso]></td></tr></table><![endif]-->
  ```
  Inject the MSO conditional comments via the head MSO block (WS-01) + inline conditional spans where needed (`dangerouslySetInnerHTML`, same technique block-button already uses).
- [ ] Add MSO-specific CSS in the head conditional block: `table,td{ mso-table-lspace:0; mso-table-rspace:0 }`, force fonts for `mso`.

### Columns (coordinate with WS-02)

- [ ] Wrap each column group in MSO ghost columns so Outlook lays them out as a real table while modern clients use the hybrid/fluid version. Agree on ONE DOM structure with WS-02 before editing `block-columns-container`.

### Buttons

- [ ] Keep/extend the VML/`mso-text-raise` bulletproof-button pattern (`block-button`). Verify padding-based buttons render with correct height in Outlook; consider full VML `<v:roundrect>` for pill/rounded buttons (radius is ignored by Outlook otherwise).

### Images

- [ ] Add `border=0`, `display:block`, explicit `width`/`height` attributes (not just CSS) on `<img>` for Outlook sizing. Coordinate file edits with WS-08 (a11y owns `block-image`/`block-avatar`).

### General resets

- [ ] Add the client-reset stylesheet content (WS-01 created the slot): Gmail blue-link fix, iOS auto-link styling, `-webkit-text-size-adjust:100%`, `ms-text-size-adjust`, Outlook line-height fix.

## Verification

- [ ] Test matrix MUST include **Outlook 2016/2019/365 (Windows)** and Outlook.com. Use Litmus/Email on Acid if available; otherwise document a manual Windows-Outlook check.
- [ ] Confirm 600px width holds, columns lay out, buttons are correct height, images sized.

## Interface contracts

- **Consumes** WS-01 MSO head slot + inline-conditional technique.
- **Shares** `block-columns-container` table structure with WS-02 and `block-image`/`block-avatar` with WS-08 — open CRs before editing.

## Files

- `packages/email-builder/.../EmailLayout/EmailLayoutReader.tsx`
- `packages/block-columns-container/src/index.tsx` (CR w/ WS-02)
- `packages/block-button/src/index.tsx` (CR w/ WS-07)
- `packages/block-image/src/index.tsx`, `block-avatar/src/index.tsx` (CR w/ WS-08)

## DoD

- [ ] Body + columns + buttons + images verified in Outlook Windows.
- [ ] No regression in Gmail/Apple Mail snapshots.
- [ ] QA matrix rows filled in `testing.md`.
