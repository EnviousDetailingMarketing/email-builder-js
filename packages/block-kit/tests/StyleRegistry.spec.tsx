import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import {
  createStyleRegistry,
  StyleRegistry,
  StyleRegistryProvider,
  useStyleRegistry,
} from '../src/StyleRegistry';

describe('block-kit/StyleRegistry', () => {
  it('renders an empty string when nothing is registered', () => {
    const registry = createStyleRegistry();
    expect(registry.renderCss()).toBe('');
    expect(registry.size).toBe(0);
  });

  it('dedupes rules by key (first write wins)', () => {
    const registry = createStyleRegistry();
    registry.addRule('a', '.a{color:red}');
    registry.addRule('a', '.a{color:blue}');
    expect(registry.size).toBe(1);
    expect(registry.renderCss()).toBe('.a{color:red}');
  });

  it('emits rules in deterministic key-sorted order regardless of insertion order', () => {
    const registry = createStyleRegistry();
    registry.addRule('zebra', '.z{}');
    registry.addRule('alpha', '.a{}');
    registry.addRule('mango', '.m{}');
    expect(registry.renderCss()).toBe('.a{}.m{}.z{}');
  });

  it('wraps addClass variants in the right media queries', () => {
    const registry = createStyleRegistry();
    registry.addClass('stack', {
      base: 'display:block',
      mobile: 'width:100%!important',
      dark: 'background:#000',
    });
    expect(registry.renderCss()).toBe(
      '.stack{display:block}' +
        '@media (prefers-color-scheme: dark){.stack{background:#000}}' +
        '@media (max-width:600px){.stack{width:100%!important}}'
    );
  });

  it('only emits the variants that are provided', () => {
    const registry = createStyleRegistry();
    registry.addClass('m', { mobile: 'width:100%' });
    expect(registry.size).toBe(1);
    expect(registry.renderCss()).toBe('@media (max-width:600px){.m{width:100%}}');
  });

  it('dedupes a shared class registered by many block instances', () => {
    const registry = createStyleRegistry();
    for (let i = 0; i < 5; i++) {
      registry.addClass('col', { mobile: 'width:100%!important' });
    }
    expect(registry.size).toBe(1);
  });

  it('useStyleRegistry returns the provided registry inside a provider', () => {
    const registry = createStyleRegistry();
    function Block() {
      const r: StyleRegistry = useStyleRegistry();
      r.addClass('probe', { mobile: 'width:100%' });
      return null;
    }
    render(
      <StyleRegistryProvider registry={registry}>
        <Block />
      </StyleRegistryProvider>
    );
    expect(registry.renderCss()).toBe('@media (max-width:600px){.probe{width:100%}}');
  });

  it('useStyleRegistry is a safe no-op outside a provider', () => {
    function Block() {
      const r = useStyleRegistry();
      // Must not throw without a surrounding provider (e.g. live editor preview).
      r.addClass('probe', { mobile: 'width:100%' });
      r.addRule('x', '.x{}');
      return <span>ok</span>;
    }
    const { container } = render(<Block />);
    expect(container.textContent).toBe('ok');
  });
});
