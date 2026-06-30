import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, registerDarkColor, useStyleRegistry } from '@usewaypoint/block-kit';

export const SpacerPropsSchema = z.object({
  props: z
    .object({
      height: z.number().gte(0).optional().nullish(),
      // WS-07: optional background color. Unset == the previous transparent
      // spacer, so existing documents render byte-for-byte identically.
      backgroundColor: COLOR_SCHEMA,
    })
    .optional()
    .nullable(),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;

export const SpacerPropsDefaults = {
  height: 16,
};

export function Spacer({ props }: SpacerProps) {
  // WS-04 (dark mode, Option A): auto-derived dark override for the spacer
  // background (only registered when a background color is set), matching the
  // container's treatment.
  const registry = useStyleRegistry();
  const darkClass = registerDarkColor(registry, props?.backgroundColor, 'bg');
  const style: CSSProperties = {
    height: props?.height ?? SpacerPropsDefaults.height,
    backgroundColor: props?.backgroundColor ?? undefined,
  };
  return <div className={darkClass} style={style} />;
}
