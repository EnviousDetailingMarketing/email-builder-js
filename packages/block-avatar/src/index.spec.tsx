import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { Avatar } from '.';

describe('block-avatar', () => {
  describe('Avatar', () => {
    it('renders with default values', () => {
      expect(render(<Avatar />).asFragment()).toMatchSnapshot();
    });

    it('renders provided alt text (a11y)', () => {
      const { container } = render(<Avatar props={{ imageUrl: 'https://e.com/a.png', alt: 'Jane Doe' }} />);
      const img = container.querySelector('img')!;
      expect(img.getAttribute('alt')).toBe('Jane Doe');
      expect(img.getAttribute('role')).toBeNull();
    });

    it('decorative avatars get empty alt + role=presentation (item 20)', () => {
      const { container } = render(
        <Avatar props={{ imageUrl: 'https://e.com/a.png', alt: 'ignored', decorative: true }} />
      );
      const img = container.querySelector('img')!;
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('role')).toBe('presentation');
    });
  });
});
