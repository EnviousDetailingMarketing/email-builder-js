/**
 * @jest-environment node
 *
 * Runs under the node environment so jest resolves `nanoid` to its CommonJS
 * build (the jsdom resolver prefers nanoid's ESM browser entry, which jest can't
 * load without extra transform config). generateId has no DOM dependency, so the
 * node environment is correct here. The Vite app bundles the ESM build normally.
 */
import generateId from './generateId';

describe('generateId', () => {
  it('produces a block- prefixed, URL-safe id', () => {
    const id = generateId();
    expect(id.startsWith('block-')).toBe(true);
    // nanoid alphabet is URL-safe (A-Za-z0-9_-).
    expect(id).toMatch(/^block-[A-Za-z0-9_-]+$/);
  });

  it('generates 1000 unique ids in a tight loop (no Date.now() collisions)', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });
});
