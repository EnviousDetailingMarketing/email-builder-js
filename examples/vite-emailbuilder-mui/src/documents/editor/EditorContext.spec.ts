import { TEditorConfiguration } from './core';
import {
  editorStateStore,
  redo,
  resetDocument,
  setDocument,
  setSelectedColorScheme,
  undo,
} from './EditorContext';

// Minimal fake documents — the history layer is schema-agnostic.
function makeDoc(label: string): TEditorConfiguration {
  return { root: { type: 'EmailLayout', data: { childrenIds: [], backdropColor: label } } } as unknown as TEditorConfiguration;
}

const state = () => editorStateStore.getState();

beforeEach(() => {
  jest.useRealTimers();
  // Reset to a known baseline with empty history. resetDocument also clears the
  // module-level coalesce key, so the next edit always starts a fresh entry.
  resetDocument(makeDoc('base'));
  editorStateStore.setState({ past: [], future: [] });
});

describe('EditorContext history', () => {
  it('pushes the previous document onto the undo stack on each discrete commit', () => {
    resetDocument(makeDoc('A'));
    resetDocument(makeDoc('B'));
    expect(state().past).toHaveLength(2);
    expect(state().future).toHaveLength(0);
  });

  it('undo restores the previous document and moves it onto the redo stack', () => {
    resetDocument(makeDoc('A'));
    resetDocument(makeDoc('B'));
    undo();
    expect((state().document.root.data as any).backdropColor).toBe('A');
    expect(state().future).toHaveLength(1);
    expect(state().past).toHaveLength(1);
  });

  it('redo re-applies an undone document', () => {
    resetDocument(makeDoc('A'));
    resetDocument(makeDoc('B'));
    undo();
    redo();
    expect((state().document.root.data as any).backdropColor).toBe('B');
    expect(state().future).toHaveLength(0);
    expect(state().past).toHaveLength(2);
  });

  it('a new edit after an undo clears the redo branch', () => {
    resetDocument(makeDoc('A'));
    resetDocument(makeDoc('B'));
    undo(); // future = [B]
    expect(state().future).toHaveLength(1);
    resetDocument(makeDoc('C')); // branching commit
    expect(state().future).toHaveLength(0);
    expect((state().document.root.data as any).backdropColor).toBe('C');
  });

  // WS-04: the light/dark preview toggle is a view preference, not a document
  // mutation — it must never push onto the undo/redo stacks (mirrors screen size).
  it('setSelectedColorScheme does not touch the undo/redo history', () => {
    resetDocument(makeDoc('A'));
    editorStateStore.setState({ past: [], future: [] });
    const docBefore = state().document;
    setSelectedColorScheme('dark');
    expect(state().selectedColorScheme).toBe('dark');
    expect(state().past).toHaveLength(0);
    expect(state().future).toHaveLength(0);
    expect(state().document).toBe(docBefore);
    setSelectedColorScheme('light');
    expect(state().selectedColorScheme).toBe('light');
    expect(state().past).toHaveLength(0);
  });

  it('undo / redo are no-ops on empty stacks', () => {
    const before = state().document;
    undo();
    expect(state().document).toBe(before);
    redo();
    expect(state().document).toBe(before);
  });

  it('caps the undo stack depth at 50', () => {
    for (let i = 0; i < 60; i++) {
      resetDocument(makeDoc(`d${i}`));
    }
    expect(state().past.length).toBeLessThanOrEqual(50);
  });

  describe('coalescing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
      resetDocument(makeDoc('base'));
      editorStateStore.setState({ past: [], future: [] });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('folds rapid edits to the same block into one history entry', () => {
      jest.setSystemTime(0);
      setDocument({ root: { type: 'EmailLayout', data: { backdropColor: '1' } } } as any);
      jest.setSystemTime(100);
      setDocument({ root: { type: 'EmailLayout', data: { backdropColor: '2' } } } as any);
      jest.setSystemTime(200);
      setDocument({ root: { type: 'EmailLayout', data: { backdropColor: '3' } } } as any);
      // Only the first commit of the burst pushed a history entry.
      expect(state().past).toHaveLength(1);
      undo();
      expect((state().document.root.data as any).backdropColor).toBe('base');
    });

    it('does not coalesce edits separated by more than the coalesce window', () => {
      jest.setSystemTime(0);
      setDocument({ root: { type: 'EmailLayout', data: { backdropColor: '1' } } } as any);
      jest.setSystemTime(1000); // > 500ms window
      setDocument({ root: { type: 'EmailLayout', data: { backdropColor: '2' } } } as any);
      expect(state().past).toHaveLength(2);
    });

    it('does not coalesce edits targeting different blocks', () => {
      jest.setSystemTime(0);
      setDocument({ a: { type: 'Text' } } as any);
      jest.setSystemTime(50);
      setDocument({ b: { type: 'Text' } } as any);
      expect(state().past).toHaveLength(2);
    });
  });
});
