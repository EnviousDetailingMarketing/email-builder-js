import { create } from 'zustand';

import getConfiguration from '../../getConfiguration';

import { TEditorConfiguration } from './core';

type TValue = {
  document: TEditorConfiguration;

  /** Undo stack: snapshots of `document` prior to the most recent commits (oldest → newest). */
  past: TEditorConfiguration[];
  /** Redo stack: snapshots undone from the present, most-recently-undone first. */
  future: TEditorConfiguration[];

  selectedBlockId: string | null;
  selectedSidebarTab: 'block-configuration' | 'styles';
  selectedMainTab: 'editor' | 'preview' | 'html' | 'text' | 'json';
  selectedScreenSize: 'desktop' | 'mobile';
  /**
   * WS-04: light/dark preview toggle. A pure VIEW preference (like
   * `selectedScreenSize`) — set with a plain `setState`, never routed through
   * `commitDocument`, so toggling preview does NOT create undo/redo history.
   */
  selectedColorScheme: 'light' | 'dark';

  inspectorDrawerOpen: boolean;
  samplesDrawerOpen: boolean;
};

/** Cap on undo depth — bounds memory for large documents. */
const HISTORY_LIMIT = 50;
/**
 * Window (ms) during which consecutive commits that share a coalesce key are
 * merged into a single history entry, so undo isn't per-keystroke / per-drag.
 */
const COALESCE_WINDOW_MS = 500;

export const editorStateStore = create<TValue>(() => ({
  document: getConfiguration(window.location.hash),
  past: [],
  future: [],
  selectedBlockId: null,
  selectedSidebarTab: 'styles',
  selectedMainTab: 'editor',
  selectedScreenSize: 'desktop',
  selectedColorScheme: 'light',

  inspectorDrawerOpen: true,
  samplesDrawerOpen: true,
}));

// Coalescing bookkeeping (module-level: not part of the reactive store).
let lastCoalesceKey: string | null = null;
let lastCommitAt = 0;

type CommitOptions = {
  /**
   * When two consecutive commits share a non-null key within COALESCE_WINDOW_MS,
   * the second is folded into the first history entry (e.g. typing in one block's
   * text field, dragging a color picker). `null` always creates a discrete entry.
   */
  coalesceKey?: string | null;
  /** Structural edits (import, move, delete, sample-load) reset the selection. */
  resetSelection?: boolean;
};

/**
 * The single history-aware mutation path. Pushes the previous document onto the
 * undo stack (unless coalescing), clears the redo branch, and caps depth.
 */
function commitDocument(nextDocument: TEditorConfiguration, { coalesceKey = null, resetSelection = false }: CommitOptions = {}) {
  const state = editorStateStore.getState();
  const previousDocument = state.document;
  const now = Date.now();

  const canCoalesce =
    coalesceKey !== null && coalesceKey === lastCoalesceKey && now - lastCommitAt < COALESCE_WINDOW_MS && state.past.length > 0;

  let past = state.past;
  if (!canCoalesce) {
    past = [...state.past, previousDocument];
    if (past.length > HISTORY_LIMIT) {
      past = past.slice(past.length - HISTORY_LIMIT);
    }
  }

  lastCoalesceKey = coalesceKey;
  lastCommitAt = now;

  editorStateStore.setState({
    document: nextDocument,
    past,
    future: [], // any new edit clears the redo branch
    ...(resetSelection ? { selectedBlockId: null, selectedSidebarTab: 'styles' as const } : {}),
  });
}

export function useDocument() {
  return editorStateStore((s) => s.document);
}

export function useSelectedBlockId() {
  return editorStateStore((s) => s.selectedBlockId);
}

export function useSelectedScreenSize() {
  return editorStateStore((s) => s.selectedScreenSize);
}

export function useSelectedMainTab() {
  return editorStateStore((s) => s.selectedMainTab);
}

export function setSelectedMainTab(selectedMainTab: TValue['selectedMainTab']) {
  return editorStateStore.setState({ selectedMainTab });
}

export function useSelectedSidebarTab() {
  return editorStateStore((s) => s.selectedSidebarTab);
}

export function useInspectorDrawerOpen() {
  return editorStateStore((s) => s.inspectorDrawerOpen);
}

export function useSamplesDrawerOpen() {
  return editorStateStore((s) => s.samplesDrawerOpen);
}

export function setSelectedBlockId(selectedBlockId: TValue['selectedBlockId']) {
  const selectedSidebarTab = selectedBlockId === null ? 'styles' : 'block-configuration';
  const options: Partial<TValue> = {};
  if (selectedBlockId !== null) {
    options.inspectorDrawerOpen = true;
  }
  return editorStateStore.setState({
    selectedBlockId,
    selectedSidebarTab,
    ...options,
  });
}

export function setSidebarTab(selectedSidebarTab: TValue['selectedSidebarTab']) {
  return editorStateStore.setState({ selectedSidebarTab });
}

/**
 * Replaces the whole document (import, sample-load, structural edits from
 * TuneMenu). Always a discrete, non-coalesced history entry and resets selection.
 */
export function resetDocument(document: TValue['document']) {
  commitDocument(document, { coalesceKey: null, resetSelection: true });
}

/**
 * Merges a partial document (typically a single block's new config) into the
 * current document. Consecutive edits to the same block(s) within the coalesce
 * window collapse into one undo entry, so undo isn't per-keystroke.
 */
export function setDocument(document: TValue['document']) {
  const originalDocument = editorStateStore.getState().document;
  // Coalesce by the set of block ids being changed — continuous edits (typing,
  // color drags) target the same block, so they fold into one history entry.
  const coalesceKey = Object.keys(document).sort().join(',');
  commitDocument(
    {
      ...originalDocument,
      ...document,
    },
    { coalesceKey }
  );
}

export function undo() {
  const { past, future, document } = editorStateStore.getState();
  if (past.length === 0) {
    return;
  }
  const previous = past[past.length - 1];
  // Break any in-flight coalescing so the next edit starts a fresh entry.
  lastCoalesceKey = null;
  editorStateStore.setState({
    document: previous,
    past: past.slice(0, past.length - 1),
    future: [document, ...future],
    selectedBlockId: null,
    selectedSidebarTab: 'styles',
  });
}

export function redo() {
  const { past, future, document } = editorStateStore.getState();
  if (future.length === 0) {
    return;
  }
  const next = future[0];
  lastCoalesceKey = null;
  editorStateStore.setState({
    document: next,
    past: [...past, document],
    future: future.slice(1),
    selectedBlockId: null,
    selectedSidebarTab: 'styles',
  });
}

export function useCanUndo() {
  return editorStateStore((s) => s.past.length > 0);
}

export function useCanRedo() {
  return editorStateStore((s) => s.future.length > 0);
}

export function toggleInspectorDrawerOpen() {
  const inspectorDrawerOpen = !editorStateStore.getState().inspectorDrawerOpen;
  return editorStateStore.setState({ inspectorDrawerOpen });
}

export function toggleSamplesDrawerOpen() {
  const samplesDrawerOpen = !editorStateStore.getState().samplesDrawerOpen;
  return editorStateStore.setState({ samplesDrawerOpen });
}

export function setSelectedScreenSize(selectedScreenSize: TValue['selectedScreenSize']) {
  return editorStateStore.setState({ selectedScreenSize });
}

export function useSelectedColorScheme() {
  return editorStateStore((s) => s.selectedColorScheme);
}

// WS-04: view-only preference — plain setState, intentionally NOT through
// commitDocument, so it leaves past/future (undo/redo) untouched.
export function setSelectedColorScheme(selectedColorScheme: TValue['selectedColorScheme']) {
  return editorStateStore.setState({ selectedColorScheme });
}
