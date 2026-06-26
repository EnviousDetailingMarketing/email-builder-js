import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { Html } from '.';

describe('block-html', () => {
  it('renders with default values', () => {
    expect(render(<Html />).asFragment()).toMatchSnapshot();
  });

  it('sanitizes raw contents (item 17): strips script/onerror/javascript: but keeps formatting', () => {
    const { container } = render(
      <Html
        props={{
          contents: `<p>Hello <strong>world</strong></p>
<script>alert(document.cookie)</script>
<img src="x" onerror="alert(1)" />
<a href="javascript:alert(2)">click</a>`,
        }}
      />
    );
    const html = container.innerHTML;
    // XSS vectors neutralized.
    expect(html).not.toContain('<script');
    expect(html).not.toContain('alert(document.cookie)');
    expect(html).not.toContain('onerror');
    expect(html.toLowerCase()).not.toContain('javascript:');
    // Benign formatting survives.
    expect(html).toContain('<strong>world</strong>');
    expect(html).toContain('<img');
  });
});
