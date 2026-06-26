import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { Heading } from '.';

function renderWithRegistry(node: React.ReactElement) {
  const registry = createStyleRegistry();
  const { container } = render(<StyleRegistryProvider registry={registry}>{node}</StyleRegistryProvider>);
  return { html: container.innerHTML, css: registry.renderCss() };
}

describe('Heading', () => {
  it('renders with default values', () => {
    expect(render(<Heading />).asFragment()).toMatchSnapshot();
  });

  it('renders with style', () => {
    const style = {
      backgroundColor: '#444333',
      color: '#101010',
      fontFamily: 'HEAVY_SANS' as const,
      fontWeight: 'normal' as const,
      padding: {
        top: 15,
        bottom: 10,
        left: 24,
        right: 8,
      },
      textAlign: 'center' as const,
    };
    const props = {
      text: 'Hello world!',
      level: 'h1' as const,
    };
    expect(render(<Heading style={style} props={props} />).asFragment()).toMatchSnapshot();
  });

  // WS-04 (dark mode, Option A): auto-derived overrides for color + background.
  it('registers prefers-color-scheme + [data-ogsc]/[data-ogsb] dark overrides for its colors', () => {
    const { html, css } = renderWithRegistry(
      <Heading style={{ color: '#101010', backgroundColor: '#dddddd' }} props={{ text: 'Hi', level: 'h2' }} />
    );
    expect(html).toContain('class="ebw-d-fg-101010 ebw-d-bg-dddddd"');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-fg-101010{color:');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-dddddd{background-color:');
    expect(css).toContain('[data-ogsc] .ebw-d-fg-101010{color:');
    expect(css).toContain('[data-ogsb] .ebw-d-bg-dddddd{background-color:');
  });

  it('adds no dark class or CSS when no colors are set (no light-mode regression)', () => {
    const { html, css } = renderWithRegistry(<Heading props={{ text: 'Hi' }} />);
    expect(html).not.toContain('ebw-d-');
    expect(css).toBe('');
  });
});
