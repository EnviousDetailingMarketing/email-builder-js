import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { Image } from '.';

describe('block-image', () => {
  it('renders with default values', () => {
    expect(render(<Image />).asFragment()).toMatchSnapshot();
  });

  it('renders provided alt text (a11y)', () => {
    const { container } = render(<Image props={{ url: 'https://e.com/a.png', alt: 'A cat' }} />);
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('A cat');
    expect(img.getAttribute('role')).toBeNull();
  });

  it('decorative images get empty alt + role=presentation (item 20)', () => {
    const { container } = render(
      <Image props={{ url: 'https://e.com/a.png', alt: 'ignored when decorative', decorative: true }} />
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('role')).toBe('presentation');
  });
});
