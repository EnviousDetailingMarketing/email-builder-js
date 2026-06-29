# WS-05 — Plain-Text Fallback Generation

**Team:** Plain-Text · **Phase:** 1 (can start immediately — only depends on the document schema) · **Covers item:** 6

> Missing a `text/plain` part hurts deliverability and accessibility. This adds a first-class `renderToText` alongside `renderToStaticMarkup`.

---

## Objective

Generate a clean, readable `text/plain` representation of any document, suitable for the text part of a MIME multipart email.

---

## Current state

- `renderToStaticMarkup` returns HTML only. No text generation, no MIME helper. Callers must hand-roll it.

## Design

Add `renderToText(document, { rootBlockId }): string` in `packages/email-builder/src/renderers/`. It traverses the **same flat document tree** (root `EmailLayout` → `childrenIds`) but emits text instead of HTML. Pure function, no React render needed — walk the schema directly.

### Per-block text mapping

- [ ] **EmailLayout / Container / ColumnsContainer:** recurse children; separate blocks with blank lines; columns rendered sequentially top-to-bottom (stacked) with a separator.
- [ ] **Heading:** text, uppercased or underlined with `===`/`---` by level; blank line after.
- [ ] **Text:** if `markdown`, strip to plain text (reuse `marked` token walk or a markdown-to-text pass — links become `text (url)`); if plain, pass through with newline normalization.
- [ ] **Button:** `LABEL (https://url)`.
- [ ] **Image / Avatar:** use `alt`; if a `linkHref`, append `(url)`; skip silently if no alt and no link, or emit `[image]`.
- [ ] **Divider:** a line of `---` (or `────`).
- [ ] **Spacer:** blank line.
- [ ] **Html:** strip tags to text (use the same sanitizer/`insane` then strip, or a minimal tag stripper). Coordinate with WS-08 on a shared `htmlToText` helper.
- [ ] Collapse 3+ blank lines to 2; trim trailing whitespace per line; wrap long lines optionally at ~78 cols (configurable, default off).

### Optional MIME helper (nice-to-have, low cost)

- [ ] `renderEmail(document, opts)` returning `{ html, text }` so the CRM gets both in one call. Keep it tiny; no transport.

## Tasks

- [ ] Implement `renderToText` + per-block mapping.
- [ ] Export from `email-builder/src/index.ts`.
- [ ] Unit tests for every block type + the provided sample documents (snapshot the text output).
- [ ] (Optional) editor: a **"Text" tab** next to HTML/JSON showing the text output (CR with WS-06).

## Interface contracts

- Depends only on `ReaderDocumentSchema` / `TReaderDocument`. **No dependency on WS-01 registry** — can run in parallel from day one.
- Share an `htmlToText` util with WS-08 (security owns the HTML sanitizer).

## Files

- New: `packages/email-builder/src/renderers/renderToText.ts`
- `packages/email-builder/src/index.ts` (export)
- (Optional) `examples/.../TemplatePanel/` new Text tab

## DoD

- [ ] Every block type has a sensible text mapping; links preserved as `text (url)`.
- [ ] Snapshot tests for all sample docs.
- [ ] Output is clean (no stray markup, no triple blank lines).
