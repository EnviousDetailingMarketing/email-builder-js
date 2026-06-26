import React, { CSSProperties } from 'react';
import { z } from 'zod';

import {
  COLOR_SCHEMA,
  FONT_FAMILY_SCHEMA,
  getFontFamily,
  getPadding,
  PADDING_SCHEMA,
  useStyleRegistry,
} from '@usewaypoint/block-kit';

import { joinClasses, registerDarkColor } from './darkColor';
import EmailMarkdown from './EmailMarkdown';

export const TextPropsSchema = z.object({
  style: z
    .object({
      color: COLOR_SCHEMA,
      backgroundColor: COLOR_SCHEMA,
      fontSize: z.number().gte(0).optional().nullable(),
      fontFamily: FONT_FAMILY_SCHEMA,
      fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
      textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      markdown: z.boolean().optional().nullable(),
      text: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type TextProps = z.infer<typeof TextPropsSchema>;

export const TextPropsDefaults = {
  text: '',
};

export function Text({ style, props }: TextProps) {
  // WS-04 (dark mode, Option A): auto-derived dark overrides for the text color
  // and any background, registered through the Style Registry and applied via a
  // class (inline styles win specificity, so the dark rules use !important).
  const registry = useStyleRegistry();
  const darkClass = joinClasses(
    registerDarkColor(registry, style?.color, 'fg'),
    registerDarkColor(registry, style?.backgroundColor, 'bg')
  );

  const wStyle: CSSProperties = {
    color: style?.color ?? undefined,
    backgroundColor: style?.backgroundColor ?? undefined,
    fontSize: style?.fontSize ?? undefined,
    fontFamily: getFontFamily(style?.fontFamily),
    fontWeight: style?.fontWeight ?? undefined,
    textAlign: style?.textAlign ?? undefined,
    padding: getPadding(style?.padding),
  };

  const text = props?.text ?? TextPropsDefaults.text;
  if (props?.markdown) {
    return <EmailMarkdown className={darkClass} style={wStyle} markdown={text} />;
  }
  // Item 20 (a11y): render plain text as a semantic <p> rather than a <div>.
  // `margin: 0` neutralizes the browser/client default paragraph margin so the
  // rendered email layout is unchanged from the previous <div>.
  return (
    <p className={darkClass} style={{ margin: 0, ...wStyle }}>
      {text}
    </p>
  );
}
