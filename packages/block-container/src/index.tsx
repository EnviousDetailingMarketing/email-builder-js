import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, getPadding, PADDING_SCHEMA, registerDarkColor, useStyleRegistry } from '@usewaypoint/block-kit';

// WS-07 (item 15-C): optional border controls. Historically the container border
// was hardcoded to `1px solid <borderColor>`. These additive, optional fields let
// authors set the width/style globally or per side. All-unset == the previous
// `1px solid` behavior, so existing documents render unchanged.
const BORDER_STYLE_SCHEMA = z.enum(['solid', 'dashed', 'dotted', 'none']).optional().nullable();
const BORDER_WIDTH_SCHEMA = z.number().min(0).optional().nullable();

const PER_SIDE_BORDER_WIDTH_SCHEMA = z
  .object({
    top: BORDER_WIDTH_SCHEMA,
    right: BORDER_WIDTH_SCHEMA,
    bottom: BORDER_WIDTH_SCHEMA,
    left: BORDER_WIDTH_SCHEMA,
  })
  .optional()
  .nullable();

export const ContainerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      borderColor: COLOR_SCHEMA,
      borderRadius: z.number().optional().nullable(),
      // WS-07: optional border width (px). When a number, applies to all sides;
      // `borderWidthPerSide` (below) takes precedence when set for a given side.
      borderWidth: BORDER_WIDTH_SCHEMA,
      borderWidthPerSide: PER_SIDE_BORDER_WIDTH_SCHEMA,
      // WS-07: optional border style. Defaults to `solid` (the legacy behavior)
      // whenever a border is drawn.
      borderStyle: BORDER_STYLE_SCHEMA,
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
});

export type ContainerProps = {
  style?: z.infer<typeof ContainerPropsSchema>['style'];
  children?: JSX.Element | JSX.Element[] | null;
};

// Returns the CSS border declarations for the container. Legacy behavior: when
// only `borderColor` is set, emits the original `1px solid <color>` shorthand so
// existing documents are byte-identical. When the WS-07 width/style fields are
// present, composes them (per-side widths win over the scalar `borderWidth`).
function getBorderStyles(style: ContainerProps['style']): CSSProperties {
  if (!style || !style.borderColor) {
    return {};
  }
  const borderColor = style.borderColor;
  const borderStyle = style.borderStyle ?? 'solid';
  if (borderStyle === 'none') {
    return {};
  }

  const perSide = style.borderWidthPerSide;
  const scalarWidth = typeof style.borderWidth === 'number' ? style.borderWidth : undefined;

  // Legacy fast-path: no width fields at all -> the original `1px solid <color>`
  // shorthand, unchanged.
  if (!perSide && scalarWidth === undefined && (style.borderStyle === undefined || style.borderStyle === null)) {
    return { border: `1px solid ${borderColor}` };
  }

  const defaultWidth = scalarWidth ?? 1;
  if (!perSide) {
    return { border: `${defaultWidth}px ${borderStyle} ${borderColor}` };
  }

  // Per-side: resolve each side, falling back to the scalar width (or 1px).
  const w = (v: number | null | undefined) => (typeof v === 'number' ? v : defaultWidth);
  return {
    borderStyle,
    borderColor,
    borderTopWidth: w(perSide.top),
    borderRightWidth: w(perSide.right),
    borderBottomWidth: w(perSide.bottom),
    borderLeftWidth: w(perSide.left),
  };
}

export function Container({ style, children }: ContainerProps) {
  // WS-04 (dark mode, Option A): auto-derived dark override for the container
  // background, registered via the Style Registry and applied by class. The
  // border color is intentionally left as-authored.
  const registry = useStyleRegistry();
  const darkClass = registerDarkColor(registry, style?.backgroundColor, 'bg');
  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    ...getBorderStyles(style),
    borderRadius: style?.borderRadius ?? undefined,
    padding: getPadding(style?.padding),
  };
  if (!children) {
    return <div className={darkClass} style={wStyle} />;
  }
  return (
    <div className={darkClass} style={wStyle}>
      {children}
    </div>
  );
}
