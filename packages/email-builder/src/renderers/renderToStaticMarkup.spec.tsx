/**
 * @jest-environment node
 */

import { describe, expect, it, jest } from '@jest/globals';

import renderToStaticMarkup from './renderToStaticMarkup';

describe('renderToStaticMarkup', () => {
  it('renders into a string', () => {
    const result = renderToStaticMarkup(
      {
        root: {
          type: 'Container',
          data: {
            props: {
              childrenIds: [],
            },
          },
        },
      },
      { rootBlockId: 'root' }
    );
    expect(result).toEqual('<!DOCTYPE html><html><body><div></div></body></html>');
  });

  it('skips a dangling child id instead of crashing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = renderToStaticMarkup(
      {
        root: {
          type: 'Container',
          data: {
            props: {
              childrenIds: ['does-not-exist'],
            },
          },
        },
      },
      { rootBlockId: 'root' }
    );
    // The missing child contributes nothing; the rest of the document still renders.
    expect(result).toEqual('<!DOCTYPE html><html><body><div></div></body></html>');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders nothing when the root block id is missing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = renderToStaticMarkup({}, { rootBlockId: 'root' });
    expect(result).toEqual('<!DOCTYPE html><html><body></body></html>');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
