/**
 * @jest-environment node
 */

import { describe, expect, it, jest } from '@jest/globals';

import renderToStaticMarkup from './renderToStaticMarkup';

const SINGLE_CONTAINER: Parameters<typeof renderToStaticMarkup>[0] = {
  root: {
    type: 'Container',
    data: {
      props: {
        childrenIds: [],
      },
    },
  },
};

describe('renderToStaticMarkup', () => {
  it('renders a full document with head and body', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, { rootBlockId: 'root' });
    // Structure: doctype, html(lang) > head(...metas, style) > body(content)
    expect(result.startsWith('<!DOCTYPE html><html lang="en"><head>')).toBe(true);
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(result).toContain('<meta name="color-scheme" content="light dark">');
    expect(result).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(result).toContain('<title></title>');
    expect(result).toContain('<style type="text/css">');
    // MSO conditional head slot for WS-03.
    expect(result).toContain('<!--[if mso]><![endif]-->');
    // Body content is unchanged from a bare render.
    expect(result).toContain('</head><body><div></div></body></html>');
  });

  it('applies lang, title and preheader options and escapes them', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, {
      rootBlockId: 'root',
      lang: 'fr',
      title: 'Hi <b>there</b> & "you"',
      preheader: 'Preview & <text>',
    });
    expect(result).toContain('<html lang="fr">');
    expect(result).toContain('<title>Hi &lt;b&gt;there&lt;/b&gt; &amp; &quot;you&quot;</title>');
    // Hidden preheader span with escaped content.
    expect(result).toContain('mso-hide:all;">Preview &amp; &lt;text&gt;</div>');
  });

  it('omits the preheader span when no preheader is given', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, { rootBlockId: 'root' });
    expect(result).not.toContain('mso-hide:all;');
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
    expect(result).toContain('</head><body><div></div></body></html>');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders an empty body when the root block id is missing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = renderToStaticMarkup({}, { rootBlockId: 'root' });
    expect(result).toContain('</head><body></body></html>');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
