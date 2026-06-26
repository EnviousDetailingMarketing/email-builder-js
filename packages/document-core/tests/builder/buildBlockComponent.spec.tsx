import React from 'react';
import { z } from 'zod';

import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react';

import buildBlockComponent from '../../src/builders/buildBlockComponent';

describe('builders/buildBlockComponent', () => {
  it('renders the specified component', () => {
    const BlockComponent = buildBlockComponent({
      SampleBlock: {
        schema: z.object({ text: z.string() }),
        Component: ({ text }) => <div>{text.toUpperCase()}</div>,
      },
    });
    expect(render(<BlockComponent type="SampleBlock" data={{ text: 'Test text!' }} />).asFragment()).toMatchSnapshot();
  });

  it('renders nothing for an unregistered block type instead of crashing', () => {
    const BlockComponent = buildBlockComponent({
      SampleBlock: {
        schema: z.object({ text: z.string() }),
        Component: ({ text }) => <div>{text.toUpperCase()}</div>,
      },
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    // `type` deliberately bypasses the keyof-T constraint to simulate malformed input.
    const props = { type: 'DoesNotExist', data: {} } as unknown as React.ComponentProps<typeof BlockComponent>;
    const { container } = render(<BlockComponent {...props} />);
    expect(container.innerHTML).toBe('');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
