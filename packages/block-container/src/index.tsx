import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, getPadding, PADDING_SCHEMA, useStyleRegistry } from '@usewaypoint/block-kit';

import { registerDarkColor } from './darkColor';

export const ContainerPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      borderColor: COLOR_SCHEMA,
      borderRadius: z.number().optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
});

export type ContainerProps = {
  style?: z.infer<typeof ContainerPropsSchema>['style'];
  children?: JSX.Element | JSX.Element[] | null;
};

function getBorder(style: ContainerProps['style']) {
  if (!style || !style.borderColor) {
    return undefined;
  }
  return `1px solid ${style.borderColor}`;
}

export function Container({ style, children }: ContainerProps) {
  // WS-04 (dark mode, Option A): auto-derived dark override for the container
  // background, registered via the Style Registry and applied by class. The
  // border color is intentionally left as-authored.
  const registry = useStyleRegistry();
  const darkClass = registerDarkColor(registry, style?.backgroundColor, 'bg');
  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    border: getBorder(style),
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
