# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Interaction

- Start every reply with the user's name: Brett.

## Commands

This is an npm **workspaces monorepo** (`npm@10.4.0`, Node 20). Run all commands from the repo root.

```bash
npm ci                         # install all workspace deps
npm run build                  # root `tsc` pass
npm run build --workspaces     # build each publishable package via tsup (what CI runs)
npm test                       # run all jest tests
npx tsc --noEmit               # type-check only
npx eslint .                   # lint
npx prettier . --check         # format check (CI fails on violations; use --write to fix)
```

Run a single test file or test by name:

```bash
npx jest packages/email-builder/src/renderers/renderToText.spec.tsx
npx jest -t 'renders a heading'      # filter by test name
npx jest -u                          # update snapshots (renderers rely on jest snapshots)
```

Run the example builder app (the interactive editor UI):

```bash
cd examples/vite-emailbuilder-mui && npm run dev
```

CI (`.github/workflows/ci.yaml`) runs, in order: `npm run build --workspaces`, `eslint .`, `prettier . --check`, `tsc --noEmit`, `npm test`. Match that locally before considering work done.

## Architecture

### Monorepo layout

- `packages/block-*` — each email block (Avatar, Button, Divider, Heading, Html, Image, Spacer, Text, Container, ColumnsContainer) is its own publishable package exporting a `Component` + a zod `*PropsSchema`.
- `packages/block-kit` — **shared single source of truth** for primitives previously copy-pasted into every block: `COLOR_SCHEMA`, `PADDING_SCHEMA`, `FONT_FAMILY_SCHEMA` and their helpers, plus `sanitizeEmailHtml`/`htmlToText`, the `StyleRegistry`, and `deriveDarkColor`. Changes here must keep block output **byte-for-byte identical** unless intentionally changing rendered HTML.
- `packages/document-core` — block-agnostic builders that turn a _dictionary_ of blocks into runtime machinery: `buildBlockConfigurationDictionary`, `buildBlockConfigurationSchema` (→ a discriminated-union zod schema), and `buildBlockComponent` (→ a React component that dispatches on `type`).
- `packages/email-builder` — the publishable `@usewaypoint/email-builder`: the read-only `Reader`, plus `renderToStaticMarkup`, `renderToText`, and `renderEmail` (returns `{ html, text }`).
- `examples/vite-emailbuilder-mui` — the full no-code editor (MUI + zustand). Not published; it's the reference host app.

### The two-dictionary pattern (central concept)

`document-core` defines _how_ to render a dictionary of blocks but registers **no blocks itself**. Two consumers each build their own dictionary over the same block set:

- **Reader dictionary** (`packages/email-builder/src/Reader/core.tsx`) maps each `type` → its static `Component` + schema. This produces the email output.
- **Editor dictionary** (`examples/.../src/documents/editor/core.tsx`) maps each `type` → an _editable_ wrapper of the same block.

A document is a **flat `Record<blockId, { type, data }>`** (not a nested tree). Parents reference children by id (`childrenIds`); rendering starts from a `rootBlockId` (an `EmailLayout`) and walks ids. Both the React reader (`ReaderBlock`) and the text renderer (`renderToText`) walk this same flat structure. Both are **defensively null-guarded**: unknown block types or dangling child ids `console.warn` and render nothing rather than throwing.

To add a new block: create/extend a `block-*` package (Component + PropsSchema using `block-kit` primitives), then register it in **both** dictionaries.

### Style Registry — how non-inline CSS is possible

Email output is primarily **inline styles** via `ReactDOMServer.renderToStaticMarkup`. Media queries, `:hover`, and `prefers-color-scheme` cannot be expressed inline, so `block-kit`'s **StyleRegistry** (a React context) lets blocks push class names + CSS rules _during render_; after the body renders, collected CSS is flushed into a single `<style>` in a real document `<head>`. This registry is a **frozen integration contract** — responsive (WS-02), client-compat/MSO (WS-03), and dark-mode (WS-04) all depend on it. Inline styles remain the base layer; registry CSS is additive.

### Editor state (example app)

`documents/editor/EditorContext.tsx` is a single **zustand** store. All document mutations go through `commitDocument`, the only history-aware path: it manages undo/redo stacks (`past`/`future`, `HISTORY_LIMIT` = 50) and **coalesces** rapid commits sharing a `coalesceKey` within `COALESCE_WINDOW_MS` (so typing/dragging is one undo entry). View-only preferences (screen size, light/dark preview) use plain `setState` and must **not** create history.

## Project context: the improvement-plan workstreams

`docs/improvement-plan/` drives the current work. The fork is being hardened into an embeddable email builder for a CRM; **personalization/merge-variables/Liquid and backend persistence are explicitly out of scope.** Work is organized into workstreams **WS-01…WS-08** with live status in `docs/improvement-plan/TRACKING.md`. Code comments reference these IDs (e.g. `WS-04`, `WS-07`) and cross-team change requests (`CR-1`…`CR-6`); when you see them, the corresponding `workstreams/*.md` charter and `TRACKING.md` explain the intent and constraints. Update `TRACKING.md` when landing workstream items.

## Conventions

- TypeScript strict; `@typescript-eslint/no-explicit-any` is an **error** (relaxed only in `*.spec` files). `noUnusedLocals`/`noImplicitReturns` on.
- ESLint enforces single quotes, semicolons, `curly: all`, no implicit coercion, and `simple-import-sort` import grouping. Don't hand-reorder imports against the configured groups.
- Email-client caveats matter and are documented inline (e.g. Outlook/MSO ignores CSS alpha; see the color schema in `block-kit/src/index.ts`). Preserve these notes when editing nearby code.
