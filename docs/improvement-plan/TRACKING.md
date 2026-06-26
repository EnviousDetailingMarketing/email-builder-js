# Improvement Plan — Tracking Board

Live status for all workstreams. Update the status column and tick the master checklist as work lands. Log any cross-team change requests at the bottom.

**Status legend:** ⬜ Not started · 🟦 In progress · 🟨 In review · ✅ Done · ⛔ Blocked

---

## Workstream status

| WS | Team | Items | Phase | Status | Owner/Agent | Notes |
|----|------|-------|-------|--------|-------------|-------|
| WS-01 | Foundation | 18, 19, head+registry, base a11y | 0 | ⬜ | — | **Blocks WS-02/03/04/07** |
| WS-02 | Responsive | 2, 3 | 1 | ⬜ | — | needs WS-01 registry |
| WS-03 | Client-Compat | 4 | 1 | ⬜ | — | shares columns w/ WS-02 |
| WS-04 | Dark-Mode | 5 | 1 | ⬜ | — | needs WS-01 registry |
| WS-05 | Plain-Text | 6 | 1 | ⬜ | — | independent — can start now |
| WS-06 | Editor-UX | 8, 11, 12, 21 | 1/2 | ⬜ | — | independent — start w/ 12 then 8 |
| WS-07 | Block-Styling | 15 | 1 | ⬜ | — | needs WS-01 block-kit |
| WS-08 | Security-A11y | 17, 20 | 1 | ⬜ | — | independent — can start now |

---

## Master checklist (by item)

### Tier 1
- [ ] **2** — Per-column mobile stacking (WS-02)
- [ ] **3** — Full responsive support (WS-02 + WS-01 head)
- [ ] **4** — Outlook & client compatibility (WS-03)
- [ ] **5** — Dark mode preview + output (WS-04)
- [ ] **6** — Plain-text fallback (WS-05)

### Tier 2
- [ ] **8** — Undo / redo (WS-06)
- [ ] **11** — Inline canvas editing (WS-06, Phase 2)
- [ ] **12** — Block-ID collision fix (WS-06, do first)

### Tier 3
- [ ] **15** — Better color / button / container styling (WS-07)

### Tier 4
- [ ] **17** — Secure raw-HTML handling (WS-08)
- [ ] **18** — Shared `block-kit`, remove duplication (WS-01)
- [ ] **19** — Renderer null-guard / graceful errors (WS-01)
- [ ] **20** — Accessibility (WS-08 + WS-01 head)
- [ ] **21** — Performance smells (WS-06, opportunistic)

### Infrastructure (enabling)
- [x] Git repo already configured (fork: `EnviousDetailingMarketing/email-builder-js`, branch `main`)
- [ ] `upstream` remote added to sync with original `usewaypoint/email-builder-js` (optional)
- [ ] Style Registry API frozen + documented (WS-01)
- [ ] `<head>` / meta / viewport / color-scheme infra (WS-01)
- [ ] Cross-client QA matrix established (`testing.md`)

---

## Change-request log

When a team needs to edit a file owned by another team (per the ownership matrix in README §5), log it here.

| Date | Requesting WS | File | Owner WS | Reason | Resolved? |
|------|---------------|------|----------|--------|-----------|
| — | — | — | — | — | — |
