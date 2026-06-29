import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { Container } from '.';

function renderWithRegistry(node: React.ReactElement) {
  const registry = createStyleRegistry();
  const { container } = render(<StyleRegistryProvider registry={registry}>{node}</StyleRegistryProvider>);
  return { html: container.innerHTML, css: registry.renderCss() };
}

describe('block-container', () => {
  it('renders with default values', () => {
    expect(render(<Container />).asFragment()).toMatchSnapshot();
  });

  // WS-04 (dark mode, Option A): auto-derived override for the background.
  it('registers prefers-color-scheme + [data-ogsb] dark overrides for its background', () => {
    const { html, css } = renderWithRegistry(<Container style={{ backgroundColor: '#ffffff' }} />);
    expect(html).toContain('class="ebw-d-bg-ffffff"');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-ffffff{background-color:');
    expect(css).toContain('[data-ogsb] .ebw-d-bg-ffffff{background-color:');
  });

  it('adds no dark class or CSS when no background is set (no light-mode regression)', () => {
    const { html, css } = renderWithRegistry(<Container />);
    expect(html).not.toContain('ebw-d-');
    expect(css).toBe('');
  });

  // WS-07 (item 15-C): optional border width/style; legacy `1px solid` preserved.
  describe('WS-07 border controls', () => {
    it('preserves the legacy 1px solid border when only borderColor is set', () => {
      const { container } = render(<Container style={{ borderColor: '#cccccc' }} />);
      expect(container.querySelector('div')?.getAttribute('style')).toContain('border: 1px solid #cccccc');
    });

    it('applies a custom borderWidth and borderStyle', () => {
      const { container } = render(
        <Container style={{ borderColor: '#cccccc', borderWidth: 3, borderStyle: 'dashed' }} />
      );
      expect(container.querySelector('div')?.getAttribute('style')).toContain('border: 3px dashed #cccccc');
    });

    it('renders no border when borderStyle is none', () => {
      const { container } = render(<Container style={{ borderColor: '#cccccc', borderStyle: 'none' }} />);
      const style = container.querySelector('div')?.getAttribute('style') ?? '';
      expect(style).not.toContain('border');
    });

    it('applies per-side border widths, filling missing sides from the scalar width', () => {
      const { container } = render(
        <Container
          style={{
            borderColor: '#222222',
            borderStyle: 'solid',
            borderWidth: 1,
            borderWidthPerSide: { top: 4, bottom: 2 },
          }}
        />
      );
      const style = container.querySelector('div')?.getAttribute('style') ?? '';
      expect(style).toContain('border-top-width: 4px');
      expect(style).toContain('border-bottom-width: 2px');
      expect(style).toContain('border-right-width: 1px');
      expect(style).toContain('border-left-width: 1px');
      expect(style).toContain('border-style: solid');
      expect(style).toContain('border-color: #222222');
    });

    it('composes border with backgroundColor', () => {
      const { container } = render(
        <Container style={{ backgroundColor: '#ffffff', borderColor: '#000000', borderWidth: 2 }} />
      );
      const style = container.querySelector('div')?.getAttribute('style') ?? '';
      // jsdom serializes hex backgrounds as rgb().
      expect(style).toContain('background-color: rgb(255, 255, 255)');
      expect(style.toLowerCase()).toContain('border: 2px solid #000000');
    });

    it('adds no border when no borderColor is set', () => {
      const { container } = render(<Container style={{ backgroundColor: '#ffffff' }} />);
      const style = container.querySelector('div')?.getAttribute('style') ?? '';
      expect(style).not.toContain('border:');
      expect(style).not.toContain('border-style');
    });

    it('renders an rgba background (widened COLOR_SCHEMA) as a snapshot', () => {
      expect(render(<Container style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} />).asFragment()).toMatchSnapshot();
    });
  });
});
