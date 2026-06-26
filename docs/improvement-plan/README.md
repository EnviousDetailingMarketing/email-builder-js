# EmailBuilder.js — Improvement Plan (Master)

> **Goal:** Harden this fork into a **rock-solid, embeddable email builder** for our CRM.
> We are **not** adding personalization/templating (merge variables, loops, conditionals) right now — that is explicitly out of scope. We are making the *output* production-grade across email clients and the *editor* genuinely usable.

This plan is organized into **workstreams**, each owned by an **agent team**. It is designed so multiple teams can work in parallel after a shared foundation lands. Each workstream has its own charter file in [`workstreams/`](./workstreams/) with a detailed checklist, file targets, and acceptance criteria. Live status lives in [`TRACKING.md`](./TRACKING.md).

---

## 1. Scope

### In scope (from owner's prioritized list)

| # | Item | Workstream |
|---|------|-----------|
| 2 | Per-column mobile stacking (some columns stack, some stay side-by-side) | WS-02 Responsive |
| 3 | Full responsive support (head, viewport, media queries, fluid layout) | WS-02 Responsive |
| 4 | Outlook & broad email-client compatibility | WS-03 Client Compat |
| 5 | Dark mode — both editor **preview** and rendered-output **support** | WS-04 Dark Mode |
| 6 | Extensive plain-text fallback generation | WS-05 Plain Text |
| 8 | Undo / redo | WS-06 Editor UX |
| 11 | Inline canvas editing | WS-06 Editor UX |
| 12 | Fix block-ID collision bug | WS-06 Editor UX |
| 15 | Better color, button, and container styling controls | WS-07 Block Styling |
| 17 | Secure all raw-HTML handling | WS-08 Security & A11y |
| 18 | Eliminate duplicated block code (shared kit) | WS-01 Foundation |
| 19 | Renderer null-guard / graceful missing-block handling | WS-01 Foundation |
| 20 | Accessibility (alt text, semantics, lang, roles) | WS-08 Security & A11y |
| 21 | Performance smells (lower priority, opportunistic) | WS-06 Editor UX |

### Explicitly OUT of scope (for now)
- Personalization / merge variables / Liquid / loops / conditionals.
- Backend persistence, auth, multi-user collaboration, versioning (the host CRM owns persistence).
- AMP for Email.
- Drag-and-drop reordering (not requested in this round; cross-container move stays manual).

---

## 2. The one architectural decision everything depends on

Today the renderer is **pure inline styles** through `ReactDOMServer.renderToStaticMarkup` with **no `<head>` and no `<style>` block**. That makes media queries, `:hover`, and `prefers-color-scheme` **structurally impossible**. Items **2, 3, 4, and 5 cannot be built on the current pipeline.**

**Decision — introduce a Style Registry + a real document `<head>`.** WS-01 builds this once; WS-02/03/04 consume it.

- Keep **inline styles** as the base layer (email-safe default appearance — unchanged philosophy).
- Add a **React-context "Style Registry"** that blocks can push CSS rules + class names into *during render*. After the body renders, the collected CSS is flushed into a single `<style>` block in `<head>`.
- The renderer emits a proper document head: `<!DOCTYPE html>`, `lang`, `<meta charset>`, `<meta viewport>`, `<meta name="color-scheme">`, `<title>`, MSO conditional CSS, and a client-reset stylesheet.

```
                ┌─────────────────────────────────────────┐
                │  renderToStaticMarkup(document, opts)     │
                │  ┌─────────────────────────────────────┐ │
   blocks  ───► │  │ StyleRegistry (React context)        │ │ ───► <head><style>…media/dark/hover…</style></head>
  push rules    │  │  .add(className, cssRules)           │ │
                │  └─────────────────────────────────────┘ │
                │  inline styles stay on the elements       │ ───► <body> … inline-styled, class-tagged blocks …
                └─────────────────────────────────────────┘
```

**This registry is the integration contract** between WS-01 (provider) and WS-02/03/04 (consumers). Its API is frozen and documented in [`workstreams/01-foundation.md`](./workstreams/01-foundation.md) before downstream teams start.

---

## 3. Phases & dependency graph

```
PHASE 0 — FOUNDATION (WS-01)  ─────────────────────────────  must land first
   • shared block-kit (18)   • Style Registry + <head> infra
   • renderer null-guard (19)  • base a11y scaffold (lang/title/viewport)
        │
        ├──────────────┬──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
PHASE 1 — PARALLEL WORKSTREAMS (after the registry API is frozen)
   WS-02 Responsive   WS-03 Client    WS-04 Dark     WS-07 Block
   (2, 3)             Compat (4)      Mode (5)       Styling (15)
        │              │              │
        └──────────────┴──────────────┘
   WS-05 Plain Text (6)      ─ independent, depends only on the document schema
   WS-08 Security & A11y (17, 20)  ─ independent of the registry
   WS-06 Editor UX (8, 12)   ─ editor-app only, independent
        │
        ▼
PHASE 2 — INTEGRATION
   WS-06 inline editing (11) + perf (21)   ─ after editor state is stable
   Cross-client QA pass (all teams)        ─ Litmus/EoA or manual matrix
```

**Hard rule:** No Phase-1 team modifies the shared `block-kit` schemas or the Style Registry API after WS-01 freezes them, without a documented change request (see §5).

---

## 4. Agent team roster

| Team | Workstream | Charter | Primary surfaces |
|------|-----------|---------|------------------|
| **Foundation** | WS-01 | [01-foundation.md](./workstreams/01-foundation.md) | new `packages/block-kit`, `email-builder/src/renderers`, `Reader/core` |
| **Responsive** | WS-02 | [02-responsive.md](./workstreams/02-responsive.md) | `block-columns-container`, `EmailLayout`, registry consumers |
| **Client-Compat** | WS-03 | [03-client-compat.md](./workstreams/03-client-compat.md) | `EmailLayout`, `block-button`, `block-image`, columns |
| **Dark-Mode** | WS-04 | [04-dark-mode.md](./workstreams/04-dark-mode.md) | renderer head, all color-bearing blocks, editor preview |
| **Plain-Text** | WS-05 | [05-plain-text.md](./workstreams/05-plain-text.md) | new `renderToText` in `email-builder` |
| **Editor-UX** | WS-06 | [06-editor-ux.md](./workstreams/06-editor-ux.md) | `examples/vite-emailbuilder-mui` only |
| **Block-Styling** | WS-07 | [07-block-styling.md](./workstreams/07-block-styling.md) | `block-kit` color, `block-button`, `block-container` |
| **Security-A11y** | WS-08 | [08-security-a11y.md](./workstreams/08-security-a11y.md) | `block-html`, `block-image`, `block-avatar`, `block-text`, headings |

---

## 5. Coordination protocol (how teams avoid stepping on each other)

1. **File-ownership matrix** (below) is authoritative. If you need to edit a file another team owns, open a *change request* note in [`TRACKING.md`](./TRACKING.md) and tag that team's lead before editing.
2. **Schema changes are coordinated.** All Zod schema changes funnel through `block-kit` (WS-01/WS-07). Adding a field to a block's `data` is backward-compatible only if it is `.optional()`. **Never** rename or remove an existing field without a migration note — existing CRM-stored documents must still parse.
3. **Registry API is frozen after WS-01.** Changes require sign-off from WS-02/03/04 leads (the consumers).
4. **Every workstream ships with tests** (unit/snapshot) and updates the cross-client QA matrix. A workstream is not "done" until WS-01's `renderToStaticMarkup` snapshot tests still pass.
5. **Branch-per-workstream**, small PRs, rebase on `main` after WS-01 merges. The repo is already a configured git fork (`origin` → `EnviousDetailingMarketing/email-builder-js`) at `email-builder-js/email-builder-js/` — work inside that inner folder, not the outer container.

### File-ownership matrix (primary owner)

| Path | Owner |
|------|-------|
| `packages/block-kit/**` (new) | WS-01 (schemas), WS-07 (color/style additions via CR) |
| `packages/email-builder/src/renderers/**` | WS-01, then WS-05 adds `renderToText` |
| `packages/email-builder/src/Reader/core.tsx` | WS-01 |
| `packages/email-builder/.../EmailLayout/**` | WS-01 head infra; WS-02/03/04 add CSS via registry |
| `packages/block-columns-container/**` | WS-02 |
| `packages/block-button/**` | WS-07 styling; WS-03 MSO; coordinate via CR |
| `packages/block-html/**` | WS-08 |
| `packages/block-image/**`, `block-avatar/**` | WS-08 (a11y), WS-03 (MSO img) via CR |
| `packages/block-container/**` | WS-07 |
| `examples/vite-emailbuilder-mui/**` | WS-06 (UX); other teams add inspector controls for their new fields via CR |

> Note the **inspector panels** in the editor (`examples/.../InspectorDrawer/ConfigurationPanel/*SidebarPanel.tsx`) must gain a control for every new schema field. Each team that adds a field also adds its inspector control; WS-06 reviews for consistency.

---

## 6. Global Definition of Done

A workstream is complete when **all** of the following hold:

- [ ] Functionality implemented per its charter checklist.
- [ ] New schema fields are `.optional()` and existing sample documents still parse + render unchanged.
- [ ] Unit/snapshot tests added; `npm test` green at repo root.
- [ ] If it adds a configurable field: matching **inspector control** added in the editor.
- [ ] Output verified in the **cross-client QA matrix** (see [`testing.md`](./testing.md)) — at minimum Gmail (web + iOS/Android), Apple Mail, Outlook (Windows/Word engine), and dark-mode variants.
- [ ] No regression in `renderToStaticMarkup` baseline snapshots.
- [ ] Charter checklist boxes ticked + status updated in `TRACKING.md`.

---

## 7. How to run this with agent teams

Each workstream charter is written to be handed to a dedicated agent (or a small agent team: one implementer + one reviewer). Suggested dispatch order:

1. **Run WS-01 solo to completion first.** It is the dependency for half the plan. Freeze the Style Registry API and `block-kit` exports.
2. **Fan out Phase 1** — WS-02, WS-03, WS-04, WS-05, WS-07, WS-08, and the WS-06 (8/12) subset can run concurrently. WS-05/06/08 don't even need the registry, so they can start alongside WS-01.
3. **Phase 2** — WS-06 inline editing + a final all-hands cross-client QA pass.

> When you're ready to execute, say the word and I can drive this as a multi-agent workflow (one agent per workstream, with a reviewer pass), or step through them one at a time.

---

## 8. Index

- [TRACKING.md](./TRACKING.md) — live status board + master checklist + change-request log
- [testing.md](./testing.md) — cross-client QA matrix & verification strategy
- [workstreams/01-foundation.md](./workstreams/01-foundation.md)
- [workstreams/02-responsive.md](./workstreams/02-responsive.md)
- [workstreams/03-client-compat.md](./workstreams/03-client-compat.md)
- [workstreams/04-dark-mode.md](./workstreams/04-dark-mode.md)
- [workstreams/05-plain-text.md](./workstreams/05-plain-text.md)
- [workstreams/06-editor-ux.md](./workstreams/06-editor-ux.md)
- [workstreams/07-block-styling.md](./workstreams/07-block-styling.md)
- [workstreams/08-security-a11y.md](./workstreams/08-security-a11y.md)
