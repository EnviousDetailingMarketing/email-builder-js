import React, { useEffect } from 'react';

import { RedoOutlined, UndoOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

import { redo, undo, useCanRedo, useCanUndo } from '../../documents/editor/EditorContext';

/**
 * Returns true if the event originated inside a text-entry control, where the
 * browser's own undo/redo should win (e.g. editing a URL field in the sidebar).
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export default function UndoRedoButtons() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      const mod = ev.metaKey || ev.ctrlKey;
      if (!mod || ev.key.toLowerCase() !== 'z') {
        return;
      }
      // Let native undo/redo handle text inputs the user is actively editing.
      if (isEditableTarget(ev.target)) {
        return;
      }
      ev.preventDefault();
      if (ev.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <Tooltip title="Undo (⌘/Ctrl+Z)">
        <span>
          <IconButton size="small" disabled={!canUndo} onClick={() => undo()}>
            <UndoOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo (⌘/Ctrl+Shift+Z)">
        <span>
          <IconButton size="small" disabled={!canRedo} onClick={() => redo()}>
            <RedoOutlined fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
