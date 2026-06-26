import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, FONT_FAMILY_SCHEMA, getFontFamily, getPadding, PADDING_SCHEMA } from '@usewaypoint/block-kit';

export const HeadingPropsSchema = z.object({
  props: z
    .object({
      text: z.string().optional().nullable(),
      level: z.enum(['h1', 'h2', 'h3']).optional().nullable(),
    })
    .optional()
    .nullable(),
  style: z
    .object({
      color: COLOR_SCHEMA,
      backgroundColor: COLOR_SCHEMA,
      fontFamily: FONT_FAMILY_SCHEMA,
      fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
      textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;

export const HeadingPropsDefaults = {
  level: 'h2',
  text: '',
} as const;

export function Heading({ props, style }: HeadingProps) {
  const level = props?.level ?? HeadingPropsDefaults.level;
  const text = props?.text ?? HeadingPropsDefaults.text;
  const hStyle: CSSProperties = {
    color: style?.color ?? undefined,
    backgroundColor: style?.backgroundColor ?? undefined,
    fontWeight: style?.fontWeight ?? 'bold',
    textAlign: style?.textAlign ?? undefined,
    margin: 0,
    fontFamily: getFontFamily(style?.fontFamily),
    fontSize: getFontSize(level),
    padding: getPadding(style?.padding),
  };
  switch (level) {
    case 'h1':
      return <h1 style={hStyle}>{text}</h1>;
    case 'h2':
      return <h2 style={hStyle}>{text}</h2>;
    case 'h3':
      return <h3 style={hStyle}>{text}</h3>;
  }
}

function getFontSize(level: 'h1' | 'h2' | 'h3') {
  switch (level) {
    case 'h1':
      return 32;
    case 'h2':
      return 24;
    case 'h3':
      return 20;
  }
}
