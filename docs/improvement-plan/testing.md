# Cross-Client QA & Verification Strategy

Email rendering cannot be trusted from a DOM snapshot alone — it must be checked in real clients. This is the shared verification bar every workstream signs off against.

---

## 1. Automated (per-PR, fast)

- **Snapshot tests** of `renderToStaticMarkup` output for every sample document (`packages/email-builder`). WS-01 establishes the baselines; each workstream updates them intentionally.
- **Schema parse tests:** every existing sample document still `safeParse`s after any schema change (backward-compat guarantee).
- **`renderToText` snapshot tests** (WS-05).
- **Security tests:** XSS vector corpus against `sanitizeEmailHtml` (WS-08).
- `npm test` at repo root must be green before merge.

## 2. Cross-client matrix (per-workstream sign-off)

Use Litmus or Email on Acid if available. Otherwise do the manual checks noted. Fill a row when your workstream touches rendering.

| Client | Light | Dark | Mobile | Notes / owner |
|--------|:----:|:----:|:------:|---------------|
| Gmail (web) | ⬜ | ⬜ | — | dark = forced invert |
| Gmail (iOS app) | ⬜ | ⬜ | ⬜ | |
| Gmail (Android app) | ⬜ | ⬜ | ⬜ | |
| Apple Mail (macOS) | ⬜ | ⬜ | — | best dark-mode support |
| Apple Mail (iOS) | ⬜ | ⬜ | ⬜ | |
| **Outlook (Windows, Word engine)** | ⬜ | ⬜ | — | **critical — WS-03** |
| Outlook.com (web) | ⬜ | ⬜ | — | `[data-ogsc]` dark |
| Yahoo Mail | ⬜ | ⬜ | — | |
| HEY | ⬜ | — | — | |
| Superhuman | ⬜ | — | — | |

## 3. Scenario checklist (the things that historically break)

- [ ] 600px body holds width and stays centered in Outlook (ghost table).
- [ ] Columns: mixed stack/fixed config behaves at 320 / 375 / 600+ px.
- [ ] Columns don't squash in Outlook (ghost columns).
- [ ] Buttons are the correct height in Outlook (MSO/VML); rounded/pill shapes acceptable.
- [ ] Images scale down (never up), have alt text, sized via attributes for Outlook.
- [ ] Dark mode: text legible, no invisible-on-invisible, logos not broken.
- [ ] Plain-text part is readable; links preserved as `text (url)`.
- [ ] Preheader/preview text shows the intended snippet, hidden in body.
- [ ] Malformed document (dangling child / unknown type) renders without crashing.

## 4. Editor verification (WS-06)

- [ ] Undo/redo across delete/move/duplicate/import + edit coalescing.
- [ ] 1000-block insertion → all unique ids.
- [ ] Inline edit text/heading → JSON updates → undo restores.
- [ ] Light/dark preview toggle matches rendered output.
- [ ] A bad block does not white-screen the editor (error boundary).

## 5. Tooling notes

- Local preview: `cd examples/vite-emailbuilder-mui && npx vite` → http://localhost:5173/email-builder-js/
- For real-client testing without Litmus: send via the CRM's transport (or nodemailer to a test inbox) and open in actual clients, especially a Windows Outlook install.
