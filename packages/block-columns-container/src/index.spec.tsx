import React from 'react';

import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';
import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { ColumnsContainer } from '.';

describe('block-columns-container', () => {
  it('renders with default values', () => {
    expect(render(<ColumnsContainer />).asFragment()).toMatchSnapshot();
  });

  it('marks the layout table as role=presentation (item 20)', () => {
    const { container } = render(<ColumnsContainer />);
    expect(container.querySelector('table')!.getAttribute('role')).toBe('presentation');
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
