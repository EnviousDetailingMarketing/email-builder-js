# Improvement Plan — Tracking Board

Live status for all workstreams. Update the status column and tick the master checklist as work lands. Log any cross-team change requests at the bottom.

**Status legend:** ⬜ Not started · 🟦 In progress · 🟨 In review · ✅ Done · ⛔ Blocked

---

## Workstream status

| WS    | Team          | Items                            | Phase | Status | Owner/Agent | Notes                                                                                         |
| ----- | ------------- | -------------------------------- | ----- | ------ | ----------- | --------------------------------------------------------------------------------------------- |
| WS-01 | Foundation    | 18, 19, head+registry, base a11y | 0     | 🟨     | Claude      | 18 + 19 ✅; registry + head ✅ FROZEN; base a11y ✅                                           |
| WS-02 | Responsive    | 2, 3                             | 1     | ✅     | Claude      | per-column stackOnMobile + fluid shell via registry ✅; 600px contract + WS-03/04 markers set |
| WS-03 | Client-Compat | 4                                | 1     | ✅     | Claude      | MSO ghost shell+cols, VML buttons, client resets ✅; WS-02/08 markers preserved               |
| WS-04 | Dark-Mode     | 5                                | 1     | ✅     | Claude      | auto-derived dark palette via registry + ogsc/ogsb + editor preview toggle ✅; CR-4 dedupe darkColor |
| WS-05 | Plain-Text    | 6                                | 1     | ✅     | Claude      | renderToText + renderEmail ✅; CR-1 stopgap stripper                                          |
| WS-06 | Editor-UX     | 8, 11, 12, 21                    | 1/2   | 🟨     | Claude      | 12 ✅ 8 ✅ + error-boundary(19) ✅; 11 & 21 deferred (Phase 2); CR-2/CR-3 inbox               |
| WS-07 | Block-Styling | 15                               | 1     | ⬜     | —           | needs WS-01 block-kit                                                                         |
| WS-08 | Security-A11y | 17, 20                           | 1     | ✅     | Claude      | 17 ✅ (shared sanitizeEmailHtml) 20 ✅; inspector controls CR'd to WS-06                      |

---

## Master checklist (by item)

### Tier 1

- [x] **2** — Per-column mobile stacking (WS-02)
- [x] **3** — Full responsive support (WS-02 + WS-01 head)
- [x] **4** — Outlook & client compatibility (WS-03)
- [x] **5** — Dark mode preview + output (WS-04)
- [x] **6** — Plain-text fallback (WS-05)

### Tier 2

- [x] **8** — Undo / redo (WS-06)
- [ ] **11** — Inline canvas editing (WS-06, Phase 2)
- [x] **12** — Block-ID collision fix (WS-06, do first)

### Tier 3

- [ ] **15** — Better color / button / container styling (WS-07)

### Tier 4

- [x] **17** — Secure raw-HTML handling (WS-08)
- [x] **18** — Shared `block-kit`, remove duplication (WS-01)
- [x] **19** — Renderer null-guard / graceful errors (WS-01); canvas error boundary added (WS-06)
- [x] **20** — Accessibility (WS-08 + WS-01 head)
- [ ] **21** — Performance smells (WS-06, opportunistic) — deferred, untouched

### Infrastructure (enabling)

- [x] Git repo already configured (fork: `EnviousDetailingMarketing/email-builder-js`, branch `main`)
- [x] Style Registry API frozen + documented (WS-01)
- [x] `<head>` / meta / viewport / color-scheme infra (WS-01)
- [ ] Cross-client QA matrix established (`testing.md`)

---

## Change-request log

When a team needs to edit a file owned by another team (per the ownership matrix in README §5), log it here.

| Date       | Requesting WS | File                                                                   | Owner WS            | Reason                                                                                                                                                                                                | Resolved?      |
| ---------- | ------------- | ---------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 2026-06-26 | WS-05         | `email-builder/src/renderers/renderToText.ts`                          | WS-08 (`block-kit`) | **CR-1:** replace WS-05's stopgap local HTML tag-stripper with the shared `htmlToText` now exported from `@usewaypoint/block-kit/sanitize`. Low-risk follow-up.                                       | ⬜ open        |
| 2026-06-26 | WS-05         | `examples/.../App/TemplatePanel/`                                      | WS-06               | **CR-2:** wire `renderToText` into a new editor "Text" tab beside HTML/JSON.                                                                                                                          | ⬜ open        |
| 2026-06-26 | WS-08         | `examples/.../InspectorDrawer/.../ImageSidebarPanel.tsx`, Avatar panel | WS-06               | **CR-3:** add inspector control for the new `decorative` boolean (Image/Avatar) + warn when an image has no `alt` and isn't decorative. Schema field + render behavior already shipped in the blocks. | ⬜ open        |
| 2026-06-26 | WS-08         | `block-columns-container`, `block-image`, `block-avatar`               | WS-02 / WS-03       | **Heads-up (not a CR):** these files changed in batch 1 (`role="presentation"`, optional `decorative` field). WS-02 (stacking) / WS-03 (MSO) must rebase on batch 1 before editing them.              | ✅ done (WS-02/03 built on it) |
| 2026-06-26 | WS-04         | `packages/*/src/darkColor.ts` (6 copies)                               | WS-07 (`block-kit`) | **CR-4:** WS-04 copied `darkColor.ts` (auto-derive dark palette) into 6 packages because block-kit's shared export was invisible to worktree unit specs. Now that dists rebuild together, collapse into one `@usewaypoint/block-kit` export.                                                              | ⬜ open        |
| 2026-06-26 | WS-04         | color-bearing block schemas                                            | WS-07 (`block-kit`) | **CR-5 (follow-up hook):** Option B `darkModeColor` per-block overrides left as documented hook (comments in `EmailLayoutReader` + `darkColor.ts`); needs `.optional()` schema fields coordinated with block-kit when WS-07 runs.                                                                         | ⬜ open        |
