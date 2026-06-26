import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, getPadding, PADDING_SCHEMA, useStyleRegistry } from '@usewaypoint/block-kit';

const FIXED_WIDTHS_SCHEMA = z
  .tuple([z.number().nullish(), z.number().nullish(), z.number().nullish()])
  .optional()
  .nullable();

// WS-02: per-column mobile-stacking flags, parallel to `fixedWidths` and keyed by
// the same column index. `undefined`/`null` for a column means "use the default"
// (= stack). Set `false` to keep that column side-by-side on mobile. Optional +
// nullable so documents stored before this field existed still parse unchanged.
const STACK_ON_MOBILE_SCHEMA = z
  .tuple([z.boolean().nullish(), z.boolean().nullish(), z.boolean().nullish()])
  .optional()
  .nullable();

export const ColumnsContainerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      fixedWidths: FIXED_WIDTHS_SCHEMA,
      stackOnMobile: STACK_ON_MOBILE_SCHEMA,
      columnsCount: z
        .union([z.literal(2), z.literal(3)])
        .optional()
        .nullable(),
      columnsGap: z.number().optional().nullable(),
      contentAlignment: z.enum(['top', 'middle', 'bottom']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

// Stable per-column class hooks. The SAME class name is reused across every
// columns block, so the Style Registry dedups them to a single rule regardless of
// how many columns blocks the document contains.
//   .ebw-col-stack — collapses to full width below the mobile breakpoint.
//   .ebw-col-fixed — intentionally has no responsive rule: it keeps its inline
//                    width and stays side-by-side on mobile.
export const STACK_COLUMN_CLASS = 'ebw-col-stack';
export const FIXED_COLUMN_CLASS = 'ebw-col-fixed';

// By default (no flag, or flag === true) a column stacks on mobile.
const DEFAULT_STACK_ON_MOBILE = true;

type TColumn = JSX.Element | JSX.Element[] | null;
export type ColumnsContainerProps = z.infer<typeof ColumnsContainerPropsSchema> & {
  columns?: TColumn[];
};

const ColumnsContainerPropsDefaults = {
  columnsCount: 2,
  columnsGap: 0,
  contentAlignment: 'middle',
} as const;

export function ColumnsContainer({ style, columns, props }: ColumnsContainerProps) {
  const registry = useStyleRegistry();
  // Register the per-column stacking CSS through the Style Registry — never as a
  // raw <style>. Deduped by class name, so this is a no-op after the first
  // columns block. `.ebw-col-fixed` deliberately registers nothing: fixed columns
  // keep their inline width and stay side-by-side at every viewport.
  registry.addClass(STACK_COLUMN_CLASS, {
    // Fluid-hybrid stacking: at <=600px the cell drops to a full-width block so
    // the columns reflow vertically. border-box keeps the inline gap padding from
    // pushing the cell past 100% and triggering horizontal scroll.
    mobile: 'display:block!important;width:100%!important;box-sizing:border-box!important;',
  });
  // WS-04 (dark mode) hook: register dark variants for these same column classes
  // here via registry.addClass(STACK_COLUMN_CLASS, { dark: '…' }) — additive, no
  // structural change required.

  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    padding: getPadding(style?.padding),
  };

  const blockProps = {
    columnsCount: props?.columnsCount ?? ColumnsContainerPropsDefaults.columnsCount,
    columnsGap: props?.columnsGap ?? ColumnsContainerPropsDefaults.columnsGap,
    contentAlignment: props?.contentAlignment ?? ColumnsContainerPropsDefaults.contentAlignment,
    fixedWidths: props?.fixedWidths,
    stackOnMobile: props?.stackOnMobile,
  };

  return (
    <div style={wStyle}>
      {/*
        WS-03 (Outlook/MSO) hook: wrap this fluid <table> in an `<!--[if mso]>`
        ghost table (fixed-width <td>s sized from `fixedWidths`) so Outlook keeps
        columns side-by-side while the live table below drives every other client.
        Keep the .ebw-col-stack / .ebw-col-fixed classes intact when adding it.
      */}
      <table
        align="center"
        width="100%"
        cellPadding="0"
        border={0}
        role="presentation"
        style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}
      >
        <tbody style={{ width: '100%' }}>
          <tr style={{ width: '100%' }}>
            <TableCell index={0} props={blockProps} columns={columns} />
            <TableCell index={1} props={blockProps} columns={columns} />
            <TableCell index={2} props={blockProps} columns={columns} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  props: {
    fixedWidths: z.infer<typeof FIXED_WIDTHS_SCHEMA>;
    stackOnMobile: z.infer<typeof STACK_ON_MOBILE_SCHEMA>;
    columnsCount: 2 | 3;
    columnsGap: number;
    contentAlignment: 'top' | 'middle' | 'bottom';
  };
  index: number;
  columns?: TColumn[];
};
function TableCell({ index, props, columns }: Props) {
  const contentAlignment = props?.contentAlignment ?? ColumnsContainerPropsDefaults.contentAlignment;
  const columnsCount = props?.columnsCount ?? ColumnsContainerPropsDefaults.columnsCount;

  if (columnsCount === 2 && index === 2) {
    return null;
  }

  // Default = stack. Only an explicit `false` opts a column out of stacking.
  const stacks = props.stackOnMobile?.[index] ?? DEFAULT_STACK_ON_MOBILE;
  const className = stacks ? STACK_COLUMN_CLASS : FIXED_COLUMN_CLASS;

  const style: CSSProperties = {
    boxSizing: 'content-box',
    verticalAlign: contentAlignment,
    paddingLeft: getPaddingBefore(index, props),
    paddingRight: getPaddingAfter(index, props),
    width: props.fixedWidths?.[index] ?? undefined,
  };
  const children = (columns && columns[index]) ?? null;
  return (
    <td className={className} style={style}>
      {children}
    </td>
  );
}

function getPaddingBefore(index: number, { columnsGap, columnsCount }: Props['props']) {
  if (index === 0) {
    return 0;
  }
  if (columnsCount === 2) {
    return columnsGap / 2;
  }
  if (index === 1) {
    return columnsGap / 3;
  }
  return (2 * columnsGap) / 3;
}

function getPaddingAfter(index: number, { columnsGap, columnsCount }: Props['props']) {
  if (columnsCount === 2) {
    if (index === 0) {
      return columnsGap / 2;
    }
    return 0;
  }

  if (index === 0) {
    return (2 * columnsGap) / 3;
  }
  if (index === 1) {
    return columnsGap / 3;
  }
  return 0;
}
