/**
 * @jest-environment node
 */

import { describe, expect, it } from '@jest/globals';

import { TReaderDocument } from '../Reader/core';

import renderToText from './renderToText';
import { KITCHEN_SINK, WELCOME } from './renderToText.fixtures';

/** Wrap a single leaf block under a Container root so we can render it. */
function renderLeaf(block: TReaderDocument[string]): string {
  const document: TReaderDocument = {
    root: { type: 'Container', data: { props: { childrenIds: ['leaf'] } } } as TReaderDocument[string],
    leaf: block,
  };
  return renderToText(document, { rootBlockId: 'root' });
}

describe('renderToText — per block', () => {
  it('Heading h1 underlines with =', () => {
    expect(renderLeaf({ type: 'Heading', data: { props: { text: 'Big title', level: 'h1' } } } as any)).toBe(
      'Big title\n========='
    );
  });

  it('Heading h2 underlines with -', () => {
    expect(renderLeaf({ type: 'Heading', data: { props: { text: 'Subhead', level: 'h2' } } } as any)).toBe(
      'Subhead\n-------'
    );
  });

  it('Heading h3 is plain text', () => {
    expect(renderLeaf({ type: 'Heading', data: { props: { text: 'Minor', level: 'h3' } } } as any)).toBe('Minor');
  });

  it('Text (plain) passes through with normalized newlines', () => {
    expect(renderLeaf({ type: 'Text', data: { props: { text: 'Line one\r\nLine two' } } } as any)).toBe(
      'Line one\nLine two'
    );
  });

  it('Text (markdown) strips formatting and preserves links as text (url)', () => {
    const out = renderLeaf({
      type: 'Text',
      data: {
        props: {
          markdown: true,
          text: 'Hello **world**. See [our docs](https://example.com/docs) now.',
        },
      },
    } as any);
    expect(out).toBe('Hello world. See our docs (https://example.com/docs) now.');
  });

  it('Text (markdown) renders lists and headings', () => {
    const out = renderLeaf({
      type: 'Text',
      data: {
        props: {
          markdown: true,
          text: '## Steps\n\n- one\n- two\n\n1. first\n2. second',
        },
      },
    } as any);
    expect(out).toBe('Steps\n-----\n\n- one\n- two\n\n1. first\n2. second');
  });

  it('Button renders LABEL (url)', () => {
    expect(
      renderLeaf({ type: 'Button', data: { props: { text: 'Click me', url: 'https://example.com' } } } as any)
    ).toBe('Click me (https://example.com)');
  });

  it('Button with no url renders the label only', () => {
    expect(renderLeaf({ type: 'Button', data: { props: { text: 'Click me' } } } as any)).toBe('Click me');
  });

  it('Image with alt and link renders alt (url)', () => {
    expect(
      renderLeaf({
        type: 'Image',
        data: { props: { url: 'https://cdn/x.png', alt: 'A photo', linkHref: 'https://example.com' } },
      } as any)
    ).toBe('A photo (https://example.com)');
  });

  it('Image with alt only renders alt', () => {
    expect(
      renderLeaf({ type: 'Image', data: { props: { url: 'https://cdn/x.png', alt: 'A photo' } } } as any)
    ).toBe('A photo');
  });

  it('Image with link but no alt renders [image] (url)', () => {
    expect(
      renderLeaf({
        type: 'Image',
        data: { props: { url: 'https://cdn/x.png', alt: '', linkHref: 'https://example.com' } },
      } as any)
    ).toBe('[image] (https://example.com)');
  });

  it('Image with no alt and no link is skipped', () => {
    expect(renderLeaf({ type: 'Image', data: { props: { url: 'https://cdn/x.png', alt: '' } } } as any)).toBe('');
  });

  it('Avatar renders its alt text', () => {
    expect(
      renderLeaf({ type: 'Avatar', data: { props: { imageUrl: 'https://cdn/a.png', alt: 'Jane' } } } as any)
    ).toBe('Jane');
  });

  it('Divider renders a rule', () => {
    expect(renderLeaf({ type: 'Divider', data: { props: {} } } as any)).toBe('---');
  });

  it('Spacer renders nothing', () => {
    expect(renderLeaf({ type: 'Spacer', data: { props: { height: 24 } } } as any)).toBe('');
  });

  it('Html strips tags, keeps links and decodes entities', () => {
    const out = renderLeaf({
      type: 'Html',
      data: {
        props: {
          contents: '<p>Hello &amp; welcome. <a href="https://example.com">Visit us</a>.</p><p>Second &lt;para&gt;.</p>',
        },
      },
    } as any);
    expect(out).toBe('Hello & welcome. Visit us (https://example.com).\n\nSecond <para>.');
  });
});

describe('renderToText — containers and structure', () => {
  it('ColumnsContainer stacks columns top-to-bottom', () => {
    const document: TReaderDocument = {
      root: {
        type: 'ColumnsContainer',
        data: { props: { columns: [{ childrenIds: ['a'] }, { childrenIds: ['b'] }, { childrenIds: [] }] } },
      } as any,
      a: { type: 'Text', data: { props: { text: 'Column A' } } } as any,
      b: { type: 'Text', data: { props: { text: 'Column B' } } } as any,
    };
    expect(renderToText(document, { rootBlockId: 'root' })).toBe('Column A\n\nColumn B');
  });

  it('ignores dangling/unknown block ids', () => {
    const document: TReaderDocument = {
      root: { type: 'Container', data: { props: { childrenIds: ['missing', 'real'] } } } as any,
      real: { type: 'Text', data: { props: { text: 'Still here' } } } as any,
    };
    expect(renderToText(document, { rootBlockId: 'root' })).toBe('Still here');
  });

  it('collapses 3+ blank lines and trims output', () => {
    const document: TReaderDocument = {
      root: { type: 'Text', data: { props: { text: '\n\nHello\n\n\n\n\nWorld\n\n' } } } as any,
    };
    expect(renderToText(document, { rootBlockId: 'root' })).toBe('Hello\n\nWorld');
  });

  it('optionally word-wraps at maxLineLength', () => {
    const document: TReaderDocument = {
      root: {
        type: 'Text',
        data: { props: { text: 'one two three four five six seven eight nine ten' } },
      } as any,
    };
    const out = renderToText(document, { rootBlockId: 'root', maxLineLength: 20 });
    expect(out.split('\n').every((line) => line.length <= 20)).toBe(true);
    expect(out.replace(/\n/g, ' ')).toBe('one two three four five six seven eight nine ten');
  });
});

describe('renderToText — sample documents (snapshots)', () => {
  it('kitchen-sink document', () => {
    expect(renderToText(KITCHEN_SINK, { rootBlockId: 'root' })).toMatchSnapshot();
  });

  it('welcome sample document', () => {
    expect(renderToText(WELCOME, { rootBlockId: 'root' })).toMatchSnapshot();
  });
});
