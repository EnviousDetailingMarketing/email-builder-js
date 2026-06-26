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
    // Structure: doctype, html(lang + VML/Office namespaces for Outlook) > head > body
    expect(
      result.startsWith(
        '<!DOCTYPE html><html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head>'
      )
    ).toBe(true);
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(result).toContain('<meta name="color-scheme" content="light dark">');
    expect(result).toContain('<meta name="supported-color-schemes" content="light dark">');
    expect(result).toContain('<title></title>');
    expect(result).toContain('<style type="text/css">');
    // WS-03: body carries id="body" to back the Gmail blue-link fix.
    expect(result).toContain('</head><body id="body"><div></div></body></html>');
  });

  // WS-03 (client compat, item 4): MSO/Outlook head + cross-client reset CSS.
  it('emits the MSO conditional head (Word engine fixes + 96dpi) in the <head>', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, { rootBlockId: 'root' });
    // Conditional comment wrapper so only Outlook on Windows parses it.
    expect(result).toContain('<!--[if mso]>');
    // 96dpi pin (otherwise Outlook scales the whole document up).
    expect(result).toContain('<o:PixelsPerInch>96</o:PixelsPerInch>');
    // Phantom-padding + line-height fixes scoped to the MSO style block.
    expect(result).toContain('mso-table-lspace:0pt;mso-table-rspace:0pt');
    expect(result).toContain('mso-line-height-rule:exactly');
  });

  it('emits the cross-client reset CSS (Gmail/iOS/Outlook.com fixes)', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, { rootBlockId: 'root' });
    // iOS / Apple Mail auto-link (data-detector) neutralizer.
    expect(result).toContain('a[x-apple-data-detectors]');
    // Gmail blue-link fix (paired with <body id="body">).
    expect(result).toContain('u+#body a{');
    // Outlook.com line-height + the webkit text-size lock.
    expect(result).toContain('.ExternalClass');
    expect(result).toContain('-webkit-text-size-adjust:100%');
  });

  it('applies lang, title and preheader options and escapes them', () => {
    const result = renderToStaticMarkup(SINGLE_CONTAINER, {
      rootBlockId: 'root',
      lang: 'fr',
      title: 'Hi <b>there</b> & "you"',
      preheader: 'Preview & <text>',
    });
    expect(result).toContain('<html lang="fr" xmlns:v=');
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
    expect(result).toContain('</head><body id="body"><div></div></body></html>');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('renders an empty body when the root block id is missing', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = renderToStaticMarkup({}, { rootBlockId: 'root' });
    expect(result).toContain('</head><body id="body"></body></html>');
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
    const body = result.slice(result.indexOf('<body id="body">'));
    expect(body).toContain('class="ebw-col-stack"');
    expect(body).toContain('class="ebw-col-fixed"');
  });

  // WS-03 (item 4): the shell MSO ghost table is emitted by email-builder's own
  // EmailLayoutReader, asserted here alongside the WS-02 responsive classes/media
  // block and WS-08 role="presentation" so a future change cannot silently drop
  // one while keeping the others. (The per-columns MSO ghost + td width attrs live
  // in @usewaypoint/block-columns-container and are asserted in that package's own
  // unit spec — this integration test resolves that package via its published
  // dist, so it guards the shell + cross-package WS-02/WS-08 contract instead.)
  it('wraps the shell in an MSO ghost table without dropping WS-02/WS-08 markers', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    const body = result.slice(result.indexOf('<body id="body">'));
    // Shell ghost pins Outlook to 600px, then closes after the fluid table.
    expect(body).toContain('<!--[if mso]><table role="presentation" align="center" width="600"');
    expect(body).toContain('<!--[if mso]></td></tr></table><![endif]-->');
    // Regression guard: WS-02 responsive classes + media block survive.
    expect(body).toContain('class="ebw-col-stack"');
    expect(body).toContain('class="ebw-col-fixed"');
    expect(result).toContain(
      '@media (max-width:600px){.ebw-col-stack{display:block!important;width:100%!important;box-sizing:border-box!important;}}'
    );
    // Regression guard: WS-08 role="presentation" survives on the layout tables.
    expect(body).toContain('role="presentation"');
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

  // WS-04 (dark mode, Option A): the shell registers prefers-color-scheme + the
  // Outlook.com [data-ogsc]/[data-ogsb] hooks for the page background/text and
  // the inner canvas, derived from the document's own (or default) colors.
  it('injects shell dark-mode overrides + Outlook.com hooks without dropping WS-02/03/08', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    const body = result.slice(result.indexOf('<body id="body">'));

    // prefers-color-scheme dark overrides on the stable shell classes.
    expect(result).toContain('@media (prefers-color-scheme: dark){.ebw-email-body{background-color:');
    expect(result).toContain('@media (prefers-color-scheme: dark){.ebw-email-canvas{background-color:');
    // Inline styles win specificity → the dark overrides are !important.
    expect(result).toContain('color:#d9d9d9!important;');
    // Outlook.com / Windows dark hooks (media queries are stripped there).
    expect(result).toContain('[data-ogsc] .ebw-email-body{color:');
    expect(result).toContain('[data-ogsb] .ebw-email-body{background-color:');
    expect(result).toContain('[data-ogsb] .ebw-email-canvas{background-color:');
    // The canvas table carries the stable dark hook class.
    expect(body).toContain('class="ebw-email-canvas"');

    // Regression guard: WS-02 responsive media block survives.
    expect(result).toContain('@media (max-width:600px){.ebw-email-body{padding:16px 0!important;}}');
    expect(result).toContain(
      '@media (max-width:600px){.ebw-col-stack{display:block!important;width:100%!important;box-sizing:border-box!important;}}'
    );
    // Regression guard: WS-03 MSO ghost + reset CSS survive.
    expect(body).toContain('<!--[if mso]><table role="presentation" align="center" width="600"');
    expect(result).toContain('a[x-apple-data-detectors]');
    // Regression guard: WS-08 role="presentation" survives.
    expect(body).toContain('role="presentation"');
  });

  it('keeps the head <style> deterministic across renders (snapshot)', () => {
    const result = renderToStaticMarkup(MIXED_STACK_DOC, { rootBlockId: 'root' });
    // The main reset+registry <style> is the *last* one — MSO_HEAD emits its own
    // `<style>` inside the `[if mso]` comment ahead of it.
    const style = result.slice(result.lastIndexOf('<style type="text/css">'), result.lastIndexOf('</style>'));
    expect(style).toMatchSnapshot();
  });
});
