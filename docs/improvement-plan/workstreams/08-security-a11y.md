# WS-08 — Security & Accessibility

**Team:** Security-A11y · **Phase:** 1 (independent of the Style Registry) · **Covers items:** 17, 20

> For a CRM, untrusted template data must never produce an XSS sink, and emails must be accessible by default.

---

## Item 17 — Secure all raw-HTML handling

**Problem:** `block-html` injects `props.contents` via `dangerouslySetInnerHTML` with **zero sanitization** (`block-html/src/index.tsx`). The Text/markdown path *is* sanitized via `insane`, but the HTML block is a raw sink — an XSS / content-injection risk if `contents` ever comes from untrusted/CRM data.

**Tasks**
- [ ] Sanitize `block-html` output. Reuse the existing `insane` allow-list approach (already a dependency via `block-text/EmailMarkdown.tsx`) **or** adopt `DOMPurify`. Recommendation: a shared `sanitizeEmailHtml()` in `block-kit` so HTML block + markdown path use one audited config.
- [ ] Allow-list email-safe tags/attrs/schemes (`http`, `https`, `mailto`; consider `tel`). Strip `<script>`, event handlers (`on*`), `javascript:` URLs, `<style>`/`<link>` if they could break the doc, etc.
- [ ] **Decision to confirm with owner:** sanitize-by-default vs an opt-in "trusted raw HTML" escape hatch. For CRM use, **default = sanitize**. If a trusted raw mode is kept, gate it behind an explicit flag and document the risk loudly.
- [ ] Share an `htmlToText` stripper with WS-05 (plain text).
- [ ] Tests: known XSS vectors (`<img onerror>`, `<script>`, `javascript:` href, SVG payloads) are neutralized; benign formatting survives.

**Item 18 cross-link:** the shared sanitizer lives in `block-kit` (WS-01 created it). Coordinate.

---

## Item 20 — Accessibility

**Problems**
- Image/Avatar `alt` defaults to empty string and is fully optional (`block-image/src/index.tsx`, `block-avatar/src/index.tsx`) → silent non-descriptive images.
- Text content renders as `<div>` not `<p>` → weak semantics.
- ColumnsContainer table not `role="presentation"` (screen readers may announce a data table).
- No `lang` / `<title>` / `<meta viewport>` (WS-01 adds these — confirm).
- Heading levels user-chosen with no ordering guidance.

**Tasks**
- [ ] **Alt text:** keep optional in schema (don't break docs) but (a) **warn in the editor** when an image has no alt, and (b) consider a `decorative` boolean that sets `alt=""` + `role="presentation"` intentionally vs accidentally-empty. Inspector control via CR with WS-06.
- [ ] **Semantics:** render Text as `<p>` (or allow a semantic tag choice) instead of `<div>` where appropriate; ensure headings remain real `<h1/h2/h3>`.
- [ ] **Tables:** add `role="presentation"` to the columns layout table (CR with WS-02/WS-03 who also touch that file).
- [ ] **Document head a11y:** verify WS-01 added `lang`, `<title>`, viewport; add `aria`/`role` only where meaningful.
- [ ] **Editor a11y (lighter touch):** ensure inspector form controls have labels; keyboard focus visible. Full editor keyboard-nav is out of scope this round — note as future work.
- [ ] Tests: alt present on images in samples; columns table has `role=presentation`; rendered HTML has `lang` + `<title>`.

## Interface contracts
- **Shares** `block-image`/`block-avatar`/`block-columns-container` files with WS-03 (MSO) and WS-02 (stacking) — **open CRs**, sequence edits to avoid conflicts.
- **Shares** the sanitizer (`block-kit`) with WS-05 and WS-01.

## Files
- `packages/block-html/src/index.tsx`
- `packages/block-kit/src/sanitize.ts` (new, shared)
- `packages/block-text/src/EmailMarkdown.tsx` (route through shared sanitizer)
- `packages/block-image/src/index.tsx`, `block-avatar/src/index.tsx`
- `packages/block-columns-container/src/index.tsx` (role=presentation — CR)
- `examples/.../InspectorDrawer/...` (alt warning, decorative toggle)

## DoD
- [ ] HTML block sanitized; XSS test vectors neutralized; one shared audited sanitizer config.
- [ ] Images warn-on-missing-alt + decorative option; Text semantic; columns table role=presentation; head has lang/title/viewport.
- [ ] No regression in existing sample rendering.
