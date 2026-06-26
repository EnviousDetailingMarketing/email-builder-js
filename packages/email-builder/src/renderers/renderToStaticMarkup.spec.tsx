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

  // WS-02 — responsive layout & per-column stacking.
  const MIXED_STACK_DOC: Parameters<typeof renderToStaticMarkup>[0] = {
    root: {
      type: 'EmailLayout',
      data: { childrenIds: ['cols'] },
    },
    cols: {
      type: 'ColumnsContainer',
      data: {
        props: {
          columnsCount: 2,
          // Column 0 stacks on mobile; column 1 stays side-by-side.
          stackOnMobile: [true, false, null],
          columns: [{ childrenIds: [] }, { childrenIds: [] }, { childrenIds: [] }],
        },
      },
    },
  };

  it('injects the per-column stacking media block into the head <style> (item 2)', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    expect(result).toContain(
      '@media (max-width:600px){.ebw-col-stack{display:block!important;width:100%!important;box-sizing:border-box!important;}}'
    );
  });

  it('tags the columns with stack/fixed classes for a mixed config (item 2)', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    const body = result.slice(result.indexOf('<body>'));
    expect(body).toContain('class="ebw-col-stack"');
    expect(body).toContain('class="ebw-col-fixed"');
  });

  it('registers the responsive baseline: fluid images + mobile body padding (item 3)', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    // Images scale down (max-width) but are never blown up past intrinsic size.
    expect(result).toContain('img{max-width:100%;height:auto;}');
    // Conservative mobile body-padding reduction.
    expect(result).toContain('@media (max-width:600px){.ebw-email-body{padding:16px 0!important;}}');
    // Fluid 600px shell.
    expect(result).toContain('max-width:600px');
  });

  it('keeps the head <style> deterministic across renders (snapshot)', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    const style = result.slice(result.indexOf('<style type="text/css">'), result.indexOf('</style>'));
    expect(style).toMatchSnapshot();
  });
});
