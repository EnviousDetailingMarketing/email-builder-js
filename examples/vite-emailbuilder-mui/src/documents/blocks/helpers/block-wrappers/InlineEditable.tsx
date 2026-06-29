import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * WS-06 item 11 — inline canvas editing.
 *
 * Wraps a rendered block (e.g. <Text/> or <Heading/>) and makes its text
 * editable in place via `contentEditable`. Edits write back to the document
 * (debounced) through the same `setDocument` path as the sidebar, so they
 * coalesce into a single undo entry per edit session.
 *
 * Caret stability: the classic React + contentEditable hazard is that a
 * re-render (here, the debounced write-back round-tripping through the store)
 * rewrites the DOM text node and drops the caret. We avoid it by FREEZING the
 * children element reference for the duration of an edit session — React skips
 * reconciling an unchanged element reference, so the browser keeps ownership of
 * the editable DOM (and the caret) while typing. When editing ends, the live
 * children re-take over and re-sync from the store value.
 *
 * Undo/redo: while editing, the wrapper element is `isContentEditable`, which
 * UndoRedoButtons' shortcut handler treats as a native-undo target — so Cmd/
 * Ctrl+Z does in-field undo while typing and document-level undo otherwise.
 */
const WRITE_DEBOUNCE_MS = 200;

type Props = {
  /** When false (e.g. Text markdown mode), inline editing is disabled; children render read-only. */
  enabled: boolean;
  /** Debounced write-back of the edited plain text. */
  onChange: (text: string) => void;
  /** The rendered block shown in the canvas — carries the current text and is the contentEditable target. */
  children: JSX.Element;
};

export default function InlineEditable({ enabled, onChange, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // While editing, hold the children element reference stable so React does not
  // reconcile (and clobber) the DOM the user is typing into. Refreshed every
  // render the wrapper is NOT editing, so it always re-enters edit mode current.
  const frozenChildren = useRef(children);
  if (!editing) {
    frozenChildren.current = children;
  }

  const flush = useCallback(() => {
    const el = ref.current;
    if (el) {
      onChange(el.textContent ?? '');
    }
  }, [onChange]);

  const handleInput = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(flush, WRITE_DEBOUNCE_MS);
  };

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    flush();
    setEditing(false);
  };

  const handlePaste = (ev: React.ClipboardEvent) => {
    // Plain-text only (v1): strip any rich formatting from pasted content.
    ev.preventDefault();
    const text = ev.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLDivElement>) => {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.currentTarget.blur();
    }
  };

  // Focus the element when entering edit mode so typing starts immediately.
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      role={enabled ? 'textbox' : undefined}
      aria-multiline={enabled ? true : undefined}
      contentEditable={editing}
      suppressContentEditableWarning
      onDoubleClick={enabled ? () => setEditing(true) : undefined}
      onInput={editing ? handleInput : undefined}
      onBlur={editing ? handleBlur : undefined}
      onPaste={editing ? handlePaste : undefined}
      onKeyDown={editing ? handleKeyDown : undefined}
      // While editing, stop clicks from re-triggering the wrapper's select/preventDefault
      // so the browser can place the caret freely.
      onClick={editing ? (ev) => ev.stopPropagation() : undefined}
      style={{ outline: 'none', cursor: editing ? 'text' : undefined }}
    >
      {editing ? frozenChildren.current : children}
    </div>
  );
}
