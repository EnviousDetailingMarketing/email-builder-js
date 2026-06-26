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
});
