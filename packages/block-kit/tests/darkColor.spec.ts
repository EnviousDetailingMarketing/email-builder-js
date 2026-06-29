import { describe, expect, it } from '@jest/globals';

import { deriveDarkColor, joinClasses, registerDarkColor } from '../src/darkColor';
import { createStyleRegistry } from '../src/StyleRegistry';

// WS-07 (CR-4): darkColor was deduped out of 6 block packages into block-kit.
// This spec proves the moved behavior locally (consumers can only see the new
// import path after the orchestrator rebuilds all dists).
describe('block-kit/darkColor', () => {
  describe('deriveDarkColor', () => {
    it('lightens a dark foreground color', () => {
      // #111111 (very dark) as fg should be lightened (lightness flipped).
      const out = deriveDarkColor('#111111', 'fg');
      expect(out).not.toBe('#111111');
      expect(out.toLowerCase()).toBe('#eeeeee');
    });

    it('leaves an already-light foreground unchanged', () => {
      expect(deriveDarkColor('#ffffff', 'fg')).toBe('#ffffff');
    });

    it('darkens a light background color', () => {
      const out = deriveDarkColor('#ffffff', 'bg');
      expect(out).not.toBe('#ffffff');
      expect(out.toLowerCase()).toBe('#000000');
    });

    it('leaves an already-dark background unchanged', () => {
      expect(deriveDarkColor('#222222', 'bg')).toBe('#222222');
    });
  });

  describe('registerDarkColor', () => {
    it('registers prefers-color-scheme + [data-ogsb] rules for a light bg', () => {
      const registry = createStyleRegistry();
      const cls = registerDarkColor(registry, '#ffffff', 'bg');
      expect(cls).toBe('ebw-d-bg-ffffff');
      const css = registry.renderCss();
      expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-ffffff{background-color:');
      expect(css).toContain('[data-ogsb] .ebw-d-bg-ffffff{background-color:');
    });

    it('returns undefined and registers nothing when no override is needed', () => {
      const registry = createStyleRegistry();
      expect(registerDarkColor(registry, '#ffffff', 'fg')).toBeUndefined();
      expect(registry.renderCss()).toBe('');
    });

    it('returns undefined for missing or non-6-hex colors', () => {
      const registry = createStyleRegistry();
      expect(registerDarkColor(registry, null, 'bg')).toBeUndefined();
      expect(registerDarkColor(registry, undefined, 'bg')).toBeUndefined();
      expect(registerDarkColor(registry, 'rgba(0,0,0,0.5)', 'bg')).toBeUndefined();
      expect(registerDarkColor(registry, 'transparent', 'bg')).toBeUndefined();
      expect(registry.renderCss()).toBe('');
    });
  });

  describe('joinClasses', () => {
    it('joins defined names and drops undefined', () => {
      expect(joinClasses('a', undefined, 'b')).toBe('a b');
    });
    it('returns undefined when nothing remains', () => {
      expect(joinClasses(undefined, undefined)).toBeUndefined();
    });
  });
});
