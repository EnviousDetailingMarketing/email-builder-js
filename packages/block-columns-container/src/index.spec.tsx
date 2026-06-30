import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';
import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import { ColumnsContainer } from '.';

describe('block-columns-container', () => {
  it('renders with default values', () => {
    expect(render(<ColumnsContainer />).asFragment()).toMatchSnapshot();
  });

  it('marks the layout table as role=presentation (item 20)', () => {
    const { container } = render(<ColumnsContainer />);
    expect(container.querySelector('table')!.getAttribute('role')).toBe('presentation');
  });

  // WS-03 (item 4): MSO ghost wrapper + explicit <td> width attributes for Outlook,
  // asserted with the WS-02 stacking classes + WS-08 role="presentation" so none
  // of the three can be dropped without this failing.
  it('wraps the fluid table in an MSO ghost and sets td width attrs, preserving WS-02/WS-08', () => {
    const cols = [<>a</>, <>b</>];
    const { container } = render(<ColumnsContainer props={{ columnsCount: 2 }} columns={cols} />);
    const html = container.innerHTML;
    // MSO ghost wrapper (opening + closing) around the fluid table.
    expect(html).toContain(
      '<!--[if mso]><table role="presentation" align="center" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td valign="top"><![endif]-->'
    );
    expect(html).toContain('<!--[if mso]></td></tr></table><![endif]-->');
    // Explicit width attribute on each cell (Outlook honors td width attrs).
    expect(container.querySelectorAll('td[width="50%"]')).toHaveLength(2);
    // Regression guard: WS-02 stacking classes + WS-08 role="presentation" survive.
    expect(html).toContain('class="ebw-col-stack"');
    expect(container.querySelector('table')!.getAttribute('role')).toBe('presentation');
  });

  it('uses fixed px width attrs when fixedWidths is set (item 4)', () => {
    const cols = [<>a</>, <>b</>];
    const { container } = render(
      <ColumnsContainer props={{ columnsCount: 2, fixedWidths: [200, 400, null] }} columns={cols} />
    );
    expect(container.querySelector('td[width="200"]')).not.toBeNull();
    expect(container.querySelector('td[width="400"]')).not.toBeNull();
  });

  // Regression: when only SOME columns are pinned, the un-pinned ones must stay
  // `auto` (no width attr) so they absorb the table's remaining space and the
  // pinned column renders at its exact px. Emitting the 50%/33.33% even-split
  // default here lets `table-layout:fixed` redistribute slack and inflate the
  // pinned column past its requested width.
  it('omits the width attr on un-pinned columns when a sibling is pinned', () => {
    const cols = [<>a</>, <>b</>];
    const { container } = render(
      <ColumnsContainer props={{ columnsCount: 2, fixedWidths: [5, null, null] }} columns={cols} />
    );
    const cells = container.querySelectorAll('td');
    expect(cells[0].getAttribute('width')).toBe('5');
    // The un-pinned sibling stays auto — no width attribute, no even-split default.
    expect(cells[1].getAttribute('width')).toBeNull();
    expect(container.querySelector('td[width="50%"]')).toBeNull();
  });

  describe('columnsCount 2', () => {
    it('renders column children', () => {
      const columns = [<>bread</>, <>tomato</>, <>lettuce</>];
      expect(render(<ColumnsContainer props={{ columnsCount: 2 }} columns={columns} />).asFragment()).toMatchSnapshot();
    });

    it('uses padding correctly', () => {
      const columns = [<>bread</>, <>tomato</>, <>lettuce</>];
      expect(
        render(
          <ColumnsContainer
            props={{
              columnsGap: 12,
              columnsCount: 2,
            }}
            columns={columns}
          />
        ).asFragment()
      ).toMatchSnapshot();
    });
  });

  describe('columnsCount 3', () => {
    it('renders column children', () => {
      const columns = [<>bread</>, <>tomato</>, <>lettuce</>];
      expect(render(<ColumnsContainer props={{ columnsCount: 3 }} columns={columns} />).asFragment()).toMatchSnapshot();
    });

    it('uses padding correctly', () => {
      const columns = [<>bread</>, <>tomato</>, <>lettuce</>];
      expect(
        render(
          <ColumnsContainer
            props={{
              columnsGap: 12,
              columnsCount: 3,
            }}
            columns={columns}
          />
        ).asFragment()
      ).toMatchSnapshot();
    });
  });
});

describe('ColumnsContainer — per-column mobile stacking (WS-02 item 2)', () => {
  const COLS = [<div key="a">A</div>, <div key="b">B</div>];

  function renderWithRegistry(node: React.ReactElement) {
    const registry = createStyleRegistry();
    const { container } = render(<StyleRegistryProvider registry={registry}>{node}</StyleRegistryProvider>);
    return { html: container.innerHTML, css: registry.renderCss(), registry };
  }

  it('defaults every column to stacking when stackOnMobile is omitted', () => {
    const { html } = renderWithRegistry(<ColumnsContainer props={{ columnsCount: 2 }} columns={COLS} />);
    expect(html.match(/class="ebw-col-stack"/g)).toHaveLength(2);
    expect(html).not.toContain('ebw-col-fixed');
  });

  it('emits .ebw-col-stack / .ebw-col-fixed per the per-column flags', () => {
    // Column 0 stacks, column 1 stays fixed/side-by-side on mobile.
    const { html } = renderWithRegistry(
      <ColumnsContainer props={{ columnsCount: 2, stackOnMobile: [true, false, null] }} columns={COLS} />
    );
    const stackIdx = html.indexOf('ebw-col-stack');
    const fixedIdx = html.indexOf('ebw-col-fixed');
    expect(stackIdx).toBeGreaterThanOrEqual(0);
    expect(fixedIdx).toBeGreaterThan(stackIdx); // the fixed cell is the second column
    expect(html.match(/class="ebw-col-stack"/g)).toHaveLength(1);
    expect(html.match(/class="ebw-col-fixed"/g)).toHaveLength(1);
  });

  it('registers a single deduped @media stacking rule (the generated <style> media block)', () => {
    const { css } = renderWithRegistry(
      <ColumnsContainer props={{ columnsCount: 2, stackOnMobile: [true, false, null] }} columns={COLS} />
    );
    expect(css).toMatchInlineSnapshot(
      `"@media (max-width:600px){.ebw-col-stack{display:block!important;width:100%!important;box-sizing:border-box!important;}}"`
    );
    // .ebw-col-fixed contributes no CSS — it keeps its inline width on mobile.
    expect(css).not.toContain('.ebw-col-fixed');
  });

  // WS-04 (dark mode, Option A): the wrapper background gets an auto-derived dark
  // override; the stacking classes stay layout-only.
  it('registers prefers-color-scheme + [data-ogsb] dark overrides for the wrapper background', () => {
    const { html, css } = renderWithRegistry(
      <ColumnsContainer style={{ backgroundColor: '#ffffff' }} props={{ columnsCount: 2 }} columns={COLS} />
    );
    expect(html).toContain('ebw-d-bg-ffffff');
    expect(css).toContain('@media (prefers-color-scheme: dark){.ebw-d-bg-ffffff{background-color:');
    expect(css).toContain('[data-ogsb] .ebw-d-bg-ffffff{background-color:');
    // The stacking rule still rides along.
    expect(css).toContain('.ebw-col-stack{display:block!important;');
  });

  it('adds no dark CSS when the wrapper has no background (no light-mode regression)', () => {
    const { html, css } = renderWithRegistry(<ColumnsContainer props={{ columnsCount: 2 }} columns={COLS} />);
    expect(html).not.toContain('ebw-d-');
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('dedups the stacking rule across multiple columns blocks into one copy', () => {
    const registry = createStyleRegistry();
    render(
      <StyleRegistryProvider registry={registry}>
        <div>
          <ColumnsContainer props={{ columnsCount: 2 }} columns={COLS} />
          <ColumnsContainer props={{ columnsCount: 3 }} columns={COLS} />
        </div>
      </StyleRegistryProvider>
    );
    expect(registry.size).toBe(1);
  });
});
