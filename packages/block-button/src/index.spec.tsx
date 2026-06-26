import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { Button } from '.';

function renderWithRegistry(node: React.ReactElement) {
  const registry = createStyleRegistry();
  const { container } = render(<StyleRegistryProvider registry={registry}>{node}</StyleRegistryProvider>);
  return { html: container.innerHTML, css: registry.renderCss() };
}

describe('block-button', () => {
  it('renders with default values', () => {
    expect(render(<Button />).asFragment()).toMatchSnapshot();
  });

  // WS-03 (Outlook/MSO): the variable-width <a> keeps the bulletproof padding
  // spacers; a full-width rounded button additionally emits a VML <v:roundrect>.
  it('keeps the mso-text-raise padding spacers on the live link', () => {
    const { container } = render(<Button props={{ text: 'Go', url: 'https://x.test' }} />);
    const html = container.innerHTML;
    expect(html).toContain('mso-text-raise:');
    expect(html).toContain('mso-font-width:-100%');
    // No VML for an auto-width button (we cannot size a roundrect reliably).
    expect(html).not.toContain('v:roundrect');
  });

  it('emits a VML roundrect (and hides the live link from Outlook) for a full-width rounded button', () => {
    const { container } = render(
      <Button props={{ text: 'Buy now', url: 'https://x.test', fullWidth: true, buttonStyle: 'pill' }} />
    );
    const html = container.innerHTML;
    expect(html).toContain('<v:roundrect');
    expect(html).toContain('mso-width-percent:1000;');
    expect(html).toContain('arcsize=');
    expect(html).toContain('<w:anchorlock/>');
    // The live <a> is wrapped so Outlook ignores it and renders the VML instead.
    expect(html).toContain('<!--[if !mso]><!-->');
    expect(html).toContain('<!--<![endif]-->');
  });

  // WS-04 (dark mode, Option A): darken a light button background; keep a light
  // (e.g. white) label as-is; emit prefers-color-scheme + [data-ogsb] hooks.
  it('registers a dark override for a light button background and keeps a light label', () => {
    const { html, css } = renderWithRegistry(
      <Button props={{ text: 'Go', url: 'https://x.test', buttonBackgroundColor: '#cccccc', buttonTextColor: '#ffffff' }} />
    );
    // The link carries the darkened-background class; white text needs no override.
    expect(html).toContain('ebw-d-bg-cccccc');
    expect(html).not.toContain('ebw-d-fg-ffffff');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-cccccc{background-color:');
    expect(css).toContain('[data-ogsb] .ebw-d-bg-cccccc{background-color:');
  });

  it('darkens a dark button label so it stays legible on a dark surface', () => {
    const { html, css } = renderWithRegistry(
      <Button props={{ text: 'Go', url: 'https://x.test', buttonBackgroundColor: '#222222', buttonTextColor: '#111111' }} />
    );
    // Dark bg is left as-is; dark text is lightened.
    expect(html).toContain('ebw-d-fg-111111');
    expect(html).not.toContain('ebw-d-bg-222222');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-fg-111111{color:');
    expect(css).toContain('[data-ogsc] .ebw-d-fg-111111{color:');
  });
});
