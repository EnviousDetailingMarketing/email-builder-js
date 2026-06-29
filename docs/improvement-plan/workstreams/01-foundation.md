# WS-01 — Foundation (Shared Kit · Style Registry · Head Infra · Null-Guard)

**Team:** Foundation · **Phase:** 0 (must land first) · **Blocks:** WS-02, WS-03, WS-04, WS-07
**Covers items:** 18 (dedup), 19 (null-guard), + the rendering infrastructure that 2/3/4/5 require, + base a11y scaffold (part of 20).

> This is the keystone. Nothing in Phase 1 that touches rendering can start until the **Style Registry API and `block-kit` exports are frozen**. Run this to completion before fanning out.

---

## Objective

1. Stop the copy-paste: create a shared `block-kit` package and route every block through it.
2. Give the renderer a real document `<head>` and a **Style Registry** so downstream teams can emit `@media` / dark-mode / `:hover` CSS.
3. Make the renderer robust against malformed documents.

---

## Item 18 — Shared `block-kit` package

**Problem:** `COLOR_SCHEMA`, `PADDING_SCHEMA`, `FONT_FAMILY_SCHEMA`, `getPadding`, `getFontFamily` are duplicated verbatim across ~8 `block-*` packages (e.g. `block-button/src/index.tsx:4-60` ≡ `block-text/src/index.tsx:6-62` ≡ `block-heading/src/index.tsx:4-60`).

**Tasks**

- [ ] Create `packages/block-kit` (`@usewaypoint/block-kit`) exporting:
  - `COLOR_SCHEMA`, `PADDING_SCHEMA`, `FONT_FAMILY_SCHEMA`
  - `getPadding(padding)`, `getFontFamily(name)`
  - shared CSS-property helpers
  - `StyleRegistry` (see below) + hooks
- [ ] Add as dependency to every `block-*` package + `email-builder`; add to root workspace list in `package.json`.
- [ ] Refactor each block to import from `block-kit` instead of re-declaring. Delete the duplicates.
- [ ] Snapshot the output of one sample document **before** and confirm **byte-identical** after the refactor (pure refactor, zero behavior change).

**Acceptance:** grep for `0-9a-fA-F]{6}` across `packages/block-*/src` returns only `block-kit`. All existing tests pass; sample render snapshots unchanged.

---

## Item 19 — Renderer null-guard

**Problem:** `BaseReaderBlock`/`buildBlockComponent` does `blocks[type].Component` with no guard — a missing `document[id]` or unknown `type` throws an opaque React crash. `BlockNotFoundError` is _defined but never thrown_ (`document-core/src/utils.ts:18-24`, dead code).

**Tasks**

- [ ] In `buildBlockComponent.tsx`, guard unknown `type` → render `null` (or a dev-only visible placeholder) and `console.warn` once. Wire up the existing `BlockNotFoundError`.
- [ ] In `Reader/core.tsx` `ReaderBlock`, guard missing `document[id]` → `null` + warn; never pass `undefined` into a component.
- [ ] Add a React error boundary around the editor canvas (`examples/` side — coordinate with WS-06) so a bad block doesn't white-screen the editor.
- [ ] Tests: render a document with a dangling `childrenId` and an unknown `type`; assert no throw.

**Acceptance:** malformed document renders gracefully (skips bad node, logs warning) in both `renderToStaticMarkup` and `<Reader/>`.

---

## Rendering infrastructure — the Style Registry + `<head>` (enables 2/3/4/5)

**Problem:** `renderToStaticMarkup.tsx` emits only `<!DOCTYPE html><html><body>…`. No head, no `<style>`, so media queries / dark mode / hover are impossible.

### Tasks — document head

- [x] Rewrite `renderToStaticMarkup` to emit a full head:
  - `<html lang="…">` (default `"en"`, overridable via opts)
  - `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`
  - `<meta name="color-scheme" content="light dark">` + `<meta name="supported-color-schemes" content="light dark">`
  - `<title>` (from opts, default empty-safe)
  - MSO conditional block placeholder (WS-03 fills) and a **client reset** stylesheet (Gmail/iOS link normalization, `-webkit-text-size-adjust`, image `display:block` defaults, `table{border-collapse}`).
  - **Preheader/preview-text** hidden span hook (opts.preheader) — cheap win, add it here.
- [x] Add `renderToStaticMarkup` options: `{ rootBlockId, lang?, title?, preheader? }`. Keep `rootBlockId` working exactly as today (backward compatible). Type exported as `TRenderToStaticMarkupOptions` from `@usewaypoint/email-builder`.

### Tasks — Style Registry (the frozen contract) ✅ FROZEN

- [x] Implement a React-context registry. **Frozen API** (implemented in `packages/block-kit/src/StyleRegistry.tsx`):

```ts
// from @usewaypoint/block-kit
interface StyleRegistry {
  /** Register raw CSS appended verbatim into the head <style>. Deduped by `key`. */
  addRule(key: string, css: string): void;
  /** Convenience: register a class with base + responsive + dark variants. */
  addClass(
    className: string,
    opts: {
      base?: string; // always-applied rules (usually keep inline instead)
      mobile?: string; // wrapped in @media (max-width:600px)
      dark?: string; // wrapped in @media (prefers-color-scheme: dark)
    }
  ): void;
}
function useStyleRegistry(): StyleRegistry; // hook for block components
```

- [x] During `renderToStaticMarkup`, use a **collecting context**: a mutable registry is passed via `StyleRegistryProvider`; the body renders once (blocks register rules as a pure side effect), then the head — containing the single collected `<head><style>` — is assembled as a string before the already-rendered body. No async, no double render.
- [x] Rules must be **deterministic / order-stable** (sorted by key in `renderCss()`) so snapshots are stable.
- [x] Stable class-name convention: reuse the same `className` across instances that share a setting (e.g. every stacking column) so they dedup to one class — `addRule`/`addClass` are first-write-wins per key. Documented in `StyleRegistry.tsx`.
- [x] Tests: `block-kit/tests/StyleRegistry.spec.tsx` covers dedup, key-sorted ordering, `@media` wrappers, variant selection, shared-class dedup, and the no-op-outside-provider fallback.

**Acceptance:** A block can register a class with mobile/dark variants and it appears once, deterministically, in `<head>`. ✅ The registry API is documented here and **frozen** — additive changes only.

> **Note on scope:** `addClass.base` is supported but emits a top-level `.className{…}` rule; prefer inline styles for always-on properties (clients strip `<style>`). The registry is for what inline styles _cannot_ express: `@media` and pseudo-selectors. The live editor `<Reader/>` has no provider, so `useStyleRegistry()` returns a no-op there — head-injected CSS only materializes through `renderToStaticMarkup`. Wiring the editor preview to a registry (so responsive/dark previews work in-canvas) is deferred to the consuming workstream.

---

## Base accessibility scaffold (part of item 20; rest is WS-08)

- [x] `lang` on `<html>`, `<title>`, `<meta viewport>` (above).
- [x] `EmailLayout` centering table marked `role="presentation"` (already present). Columns table left to WS-02 (it owns that file).

---

## Files

- New: `packages/block-kit/{package.json,tsconfig.json,src/index.ts,src/StyleRegistry.tsx}`
- `packages/email-builder/src/renderers/renderToStaticMarkup.tsx`
- `packages/email-builder/src/Reader/core.tsx`
- `packages/document-core/src/builders/buildBlockComponent.tsx`, `src/utils.ts`
- All `packages/block-*/src/index.tsx` (import swap)
- Root `package.json` (workspaces)

## Risks

- **Two-pass render** must not double-execute side effects — blocks are pure, so safe; verify no `Date.now()`/random in block render paths (there aren't).
- Refactor (18) is wide-reaching; do it as its own commit with snapshot proof before touching the renderer.

## Definition of done

All boxes above ticked, registry API frozen + documented, `npm test` green, sample snapshots stable (except intentional head additions, which get fresh baselines).
