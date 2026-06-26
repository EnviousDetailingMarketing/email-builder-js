import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { Button, ButtonPropsSchema } from '.';

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

  // WS-07 (item 15-B): explicit overrides + URL validation + outline border.
  describe('WS-07 explicit controls', () => {
    it('applies a custom borderRadius over the buttonStyle preset', () => {
      const { container } = render(
        <Button props={{ text: 'Go', url: 'https://x.test', borderRadius: 12, buttonStyle: 'rectangle' }} />
      );
      // Even though buttonStyle=rectangle (preset radius undefined), the explicit
      // radius wins.
      expect(container.querySelector('a')?.getAttribute('style')).toContain('border-radius: 12px');
    });

    it('applies custom inner padding over the size preset', () => {
      const { container } = render(
        <Button props={{ text: 'Go', url: 'https://x.test', buttonPadding: { vertical: 7, horizontal: 21 }, size: 'medium' }} />
      );
      expect(container.querySelector('a')?.getAttribute('style')).toContain('padding: 7px 21px');
    });

    it('renders an outline border for an outline button', () => {
      const { container } = render(
        <Button
          props={{
            text: 'Outline',
            url: 'https://x.test',
            buttonBackgroundColor: 'transparent',
            border: { color: '#2563EB', width: 2, style: 'solid' },
          }}
        />
      );
      const style = container.querySelector('a')?.getAttribute('style') ?? '';
      // jsdom lowercases hex in serialized inline styles.
      expect(style.toLowerCase()).toContain('border: 2px solid #2563eb');
    });

    it('emits a VML stroke for an outline full-width rounded button (WS-03 VML intact)', () => {
      const { container } = render(
        <Button
          props={{
            text: 'Outline',
            url: 'https://x.test',
            fullWidth: true,
            buttonStyle: 'rounded',
            border: { color: '#2563EB', width: 2, style: 'solid' },
          }}
        />
      );
      const html = container.innerHTML;
      // WS-03 VML markers still present.
      expect(html).toContain('<v:roundrect');
      expect(html).toContain('mso-width-percent:1000;');
      expect(html).toContain('<w:anchorlock/>');
      // WS-07: the border now drives the VML stroke instead of stroke="f".
      expect(html).toContain('stroke="t"');
      expect(html).toContain('strokecolor="#2563EB"');
      expect(html).toContain('strokeweight="2px"');
    });

    it('keeps stroke="f" on a VML button with no border (no regression)', () => {
      const { container } = render(
        <Button props={{ text: 'Buy', url: 'https://x.test', fullWidth: true, buttonStyle: 'pill' }} />
      );
      expect(container.innerHTML).toContain('stroke="f"');
    });

    describe('url validation', () => {
      const ok = (url: string) => ButtonPropsSchema.safeParse({ props: { url } }).success;
      it('accepts http(s), mailto, tel, and relative urls', () => {
        expect(ok('https://example.com')).toBe(true);
        expect(ok('http://example.com/path?q=1')).toBe(true);
        expect(ok('mailto:hi@example.com')).toBe(true);
        expect(ok('tel:+15551234567')).toBe(true);
        expect(ok('/relative/path')).toBe(true);
        expect(ok('#anchor')).toBe(true);
        expect(ok('//cdn.example.com/x')).toBe(true);
      });
      it('rejects empty/whitespace and dangerous schemes', () => {
        expect(ok('')).toBe(false);
        expect(ok('   ')).toBe(false);
        expect(ok('javascript:alert(1)')).toBe(false);
        expect(ok('data:text/html,evil')).toBe(false);
        expect(ok('ftp://example.com')).toBe(false);
      });
      it('still accepts null/undefined url (optional)', () => {
        expect(ButtonPropsSchema.safeParse({ props: { url: null } }).success).toBe(true);
        expect(ButtonPropsSchema.safeParse({ props: {} }).success).toBe(true);
      });
    });

    it('renders a button with an rgba background (snapshot)', () => {
      // WS-07 (item 15-A): rgba color flows through the widened COLOR_SCHEMA.
      expect(
        render(
          <Button props={{ text: 'Go', url: 'https://x.test', buttonBackgroundColor: 'rgba(37, 99, 235, 0.85)' }} />
        ).asFragment()
      ).toMatchSnapshot();
    });
  });
});
