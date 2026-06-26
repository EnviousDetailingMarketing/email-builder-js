# WS-06 — Editor Experience (Undo/Redo · Inline Editing · ID Fix · Perf)

**Team:** Editor-UX · **Phase:** 1 (items 8, 12) + Phase 2 (item 11) · **Covers items:** 8, 11, 12, 21
**Surface:** `examples/vite-emailbuilder-mui/` ONLY (no block/renderer changes).

> This team owns the editor app. Other teams add inspector controls for their new schema fields; WS-06 reviews them for consistency and owns the shared store.

---

## Item 12 — Fix block-ID collision (do this FIRST, it's tiny + a real bug)

**Problem:** `generateId()` returns `block-${Date.now()}` (`documents/blocks/helpers/EditorChildrenIds/index.tsx:14-16`). Two blocks created in the same millisecond (duplicate bursts, paste) collide and silently overwrite each other in the flat document map.

**Tasks**
- [ ] Replace with a collision-resistant id: `nanoid` (add dep) or `block-${Date.now()}-${counter++}` with a module-level monotonic counter, or `crypto.randomUUID()`. Prefer `nanoid` (short, URL-safe — keeps share-URLs sane).
- [ ] Audit other id-generation sites (`cloneDocumentBlock` duplicate path in `TuneMenu.tsx`) to use the same generator.
- [ ] Test: insert 1000 blocks in a tight loop → all ids unique.

---

## Item 8 — Undo / Redo

**Problem:** No history; every delete/move/import is irreversible. All mutations already funnel through `EditorContext.tsx` (`setDocument`, `resetDocument`), which makes this tractable.

**Design**
- Add `past: TEditorConfiguration[]` and `future: TEditorConfiguration[]` to the store.
- Wrap document-mutating setters so each commit pushes the previous document onto `past` and clears `future`. `undo()`/`redo()` move snapshots between stacks.
- Debounce/coalesce rapid edits (e.g. typing in a text field, color dragging) into one history entry — coalesce by `(blockId, field)` within ~500ms so undo isn't per-keystroke.
- Cap history depth (e.g. 50) to bound memory.

**Tasks**
- [ ] Extend store with `past`/`future` + `undo`/`redo`/`canUndo`/`canRedo`.
- [ ] Route `setDocument`/`resetDocument`/move/delete/duplicate through the history layer.
- [ ] Coalesce continuous edits (text typing, color picker drags).
- [ ] Toolbar buttons + keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z).
- [ ] Tests for push/undo/redo/branch-clear and coalescing.

---

## Item 11 — Inline canvas editing (Phase 2)

**Problem:** All text edits happen in the sidebar form; the canvas is select-only. Feels dated.

**Design**
- Make Text and Heading blocks editable in-place via `contentEditable` in `EditorBlockWrapper` (or a dedicated editable wrapper), writing back to the block's `props.text` via `setDocument` (debounced, routed through undo coalescing).
- **Markdown caveat:** Text supports a `markdown` mode. For v1, inline-edit the **plain** text value only; if `markdown` is on, either edit raw markdown source inline or keep those in the sidebar. Document the limitation; don't try to build a full rich-text editor now.
- Preserve selection/caret on re-render (key the contentEditable carefully; avoid React clobbering the caret — update state on blur or debounced, not every keystroke re-render).

**Tasks**
- [ ] Inline edit for Heading `text` and Text `text` (plain mode).
- [ ] Debounced write-back through the undo system (one history entry per edit session).
- [ ] Caret-stability handling.
- [ ] Decide markdown-mode behavior (raw inline vs sidebar) and document it.
- [ ] Tests / manual: type in canvas → JSON updates → undo restores.

---

## Item 21 — Performance (opportunistic, low priority)

**Problems:** every move/delete/duplicate rebuilds the whole document + `resetDocument` (full re-render); each add-button attaches a global `mousemove` listener (`DividerButton.tsx:31`).

**Tasks (only if cheap)**
- [ ] Replace per-button global `mousemove` listeners with a single delegated listener or CSS `:hover` reveal.
- [ ] Memoize block components / avoid full-document rebuild where a targeted update suffices.
- [ ] Skip if it risks destabilizing undo/redo work — note as deferred.

---

## Cross-team note
- WS-01 wants a **React error boundary** around the canvas (item 19) — implement it here.
- Provide a documented pattern for **inspector controls** so WS-02/04/07 can add fields (per-column stack toggle, dark override, color/button/container controls) consistently. Review their inspector PRs.

## Files
- `examples/.../documents/editor/EditorContext.tsx` (store: history, color-scheme field)
- `examples/.../documents/blocks/helpers/EditorChildrenIds/index.tsx` (id gen)
- `examples/.../documents/blocks/helpers/block-wrappers/{EditorBlockWrapper,TuneMenu,DividerButton}.tsx`
- `examples/.../App/TemplatePanel/index.tsx` (toolbar: undo/redo, preview toggles)

## DoD
- [ ] Unique ids guaranteed; undo/redo robust with coalescing + shortcuts; inline editing for text/heading; error boundary in place. Perf items done or explicitly deferred.
