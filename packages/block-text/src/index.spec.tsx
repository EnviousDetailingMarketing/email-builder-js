import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { Text } from '.';

// WS-04: render a block under a real Style Registry and return both the markup
// and the CSS it registered, so dark-mode rules can be asserted.
function renderWithRegistry(node: React.ReactElement) {
  const registry = createStyleRegistry();
  const { container } = render(<StyleRegistryProvider registry={registry}>{node}</StyleRegistryProvider>);
  return { html: container.innerHTML, css: registry.renderCss() };
}

describe('block-text', () => {
  it('renders with default values', () => {
    expect(render(<Text />).asFragment()).toMatchSnapshot();
  });

  it('sanitizes HTML', () => {
    expect(
      render(
        <Text
          props={{
            markdown: true,
            text: `
<script>alert(1)</script>
<img src=x onerror=alert(1) />

[a](javascript:prompt(document.cookie))
[Basic](javascript:alert('Basic'))
[Local Storage](javascript:alert(JSON.stringify(localStorage)))
[CaseInsensitive](JaVaScRiPt:alert('CaseInsensitive'))
[URL](javascript://www.google.com%0Aalert('URL'))

[In Quotes]('javascript:alert("InQuotes")')
[a](j a v a s c r i p t:prompt(document.cookie))
[a](data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4K)
[a](javascript:window.onerror=alert;throw%201)
![Uh oh...]("onerror="alert('XSS'))
![Uh oh...](https://www.example.com/image.png"onload="alert('XSS'))
![Escape SRC - onload](https://www.example.com/image.png"onload="alert('ImageOnLoad'))
![Escape SRC - onerror]("onerror="alert('ImageOnError'))

<div>
<img src />
<a>link 1</a>
<a href>link 2</a>
<a href="">link 3</a>
<a title>link 4</a>
<a title="">link 5</a>
<a href="ftp://domain.name">link 6</a>
<a href="javascript:alert('hello world')">link 7</a>
</div>
`,
          }}
        />
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders with safe markdown', () => {
    expect(
      render(
        <Text
          props={{
            text: `This <span onClick="alert('!')">text</span> block has the **Markdown** option *turned on*.

- One
- Two
- Three

Powered by [Waypoint](https://usewaypoint.com)`,
            markdown: true,
          }}
        />
      ).asFragment()
    ).toMatchSnapshot();
  });

  it('renders without markdown', () => {
    expect(
      render(
        <Text
          props={{
            text: `## This is not <span>markdown</span>`,
          }}
        />
      ).asFragment()
    ).toMatchSnapshot();
  });

  // WS-04 (dark mode, Option A): auto-derived overrides for color + background.
  it('registers prefers-color-scheme + [data-ogsc]/[data-ogsb] dark overrides for its colors', () => {
    const { html, css } = renderWithRegistry(
      <Text style={{ color: '#333333', backgroundColor: '#eeeeee' }} props={{ text: 'hi' }} />
    );
    // Classes are applied to the rendered element …
    expect(html).toContain('class="ebw-d-fg-333333 ebw-d-bg-eeeeee"');
    // … and the registry carries both the @media dark rule and the Outlook.com hooks.
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-fg-333333{color:');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-eeeeee{background-color:');
    expect(css).toContain('[data-ogsc] .ebw-d-fg-333333{color:');
    expect(css).toContain('[data-ogsb] .ebw-d-bg-eeeeee{background-color:');
    // Inline styles win specificity, so the dark overrides are !important.
    expect(css).toContain('!important');
  });

  it('adds no dark class or CSS when no colors are set (no light-mode regression)', () => {
    const { html, css } = renderWithRegistry(<Text props={{ text: 'hi' }} />);
    expect(html).not.toContain('ebw-d-');
    expect(css).toBe('');
  });
});
