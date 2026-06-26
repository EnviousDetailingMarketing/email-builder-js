import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, FONT_FAMILY_SCHEMA, getFontFamily, getPadding, PADDING_SCHEMA } from '@usewaypoint/block-kit';

export const ButtonPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: COLOR_SCHEMA,
      fontSize: z.number().min(0).optional().nullable(),
      fontFamily: FONT_FAMILY_SCHEMA,
      fontWeight: z.enum(['bold', 'normal']).optional().nullable(),
      textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      buttonBackgroundColor: COLOR_SCHEMA,
      buttonStyle: z.enum(['rectangle', 'pill', 'rounded']).optional().nullable(),
      buttonTextColor: COLOR_SCHEMA,
      fullWidth: z.boolean().optional().nullable(),
      size: z.enum(['x-small', 'small', 'large', 'medium']).optional().nullable(),
      text: z.string().optional().nullable(),
      url: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

function getRoundedCorners(props: ButtonProps['props']) {
  const buttonStyle = props?.buttonStyle ?? ButtonPropsDefaults.buttonStyle;

  switch (buttonStyle) {
    case 'rectangle':
      return undefined;
    case 'pill':
      return 64;
    case 'rounded':
    default:
      return 4;
  }
}

function getButtonSizePadding(props: ButtonProps['props']) {
  const size = props?.size ?? ButtonPropsDefaults.size;
  switch (size) {
    case 'x-small':
      return [4, 8] as const;
    case 'small':
      return [8, 12] as const;
    case 'large':
      return [16, 32] as const;
    case 'medium':
    default:
      return [12, 20] as const;
  }
}

export const ButtonPropsDefaults = {
  text: '',
  url: '',
  fullWidth: false,
  size: 'medium',
  buttonStyle: 'rounded',
  buttonTextColor: '#FFFFFF',
  buttonBackgroundColor: '#999999',
} as const;

export function Button({ style, props }: ButtonProps) {
  const text = props?.text ?? ButtonPropsDefaults.text;
  const url = props?.url ?? ButtonPropsDefaults.url;
  const fullWidth = props?.fullWidth ?? ButtonPropsDefaults.fullWidth;
  const buttonTextColor = props?.buttonTextColor ?? ButtonPropsDefaults.buttonTextColor;
  const buttonBackgroundColor = props?.buttonBackgroundColor ?? ButtonPropsDefaults.buttonBackgroundColor;

  const padding = getButtonSizePadding(props);
  const textRaise = (padding[1] * 2 * 3) / 4;
  const cornerRadius = getRoundedCorners(props);
  const fontSize = style?.fontSize ?? 16;
  const fontFamily = getFontFamily(style?.fontFamily);
  const fontWeight = style?.fontWeight ?? 'bold';
  const wrapperStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    textAlign: style?.textAlign ?? undefined,
    padding: getPadding(style?.padding),
  };
  const linkStyle: CSSProperties = {
    color: buttonTextColor,
    fontSize,
    fontFamily,
    fontWeight,
    backgroundColor: buttonBackgroundColor,
    borderRadius: cornerRadius,
    display: fullWidth ? 'block' : 'inline-block',
    padding: `${padding[0]}px ${padding[1]}px`,
    textDecoration: 'none',
  };

  // WS-03 (Outlook/MSO): two complementary techniques.
  //  (1) The live <a> below stays the universal renderer. Its `<i>` spacers
  //      (letter-spacing + mso-font-width:-100% + mso-text-raise) reproduce the
  //      CSS padding inside Outlook's Word engine, since Word ignores padding on
  //      inline-block links. This is the standard variable-width bulletproof
  //      button; its only Outlook compromise is square corners (Word ignores
  //      border-radius).
  //  (2) For a full-width rounded/pill button we can size a VML <v:roundrect>
  //      unambiguously (mso-width-percent:1000 == 100% of the container), so we
  //      emit one to give Outlook *actual* rounded corners and hide the live <a>
  //      from Outlook via `[if !mso]`. Auto-width buttons keep technique (1) only
  //      (a VML roundrect needs a fixed width we don't collect; square corners in
  //      Outlook is the documented, non-breaking degradation).
  //  WS-04 (dark mode): button bg/text colors are the color-bearing spots — layer
  //  [data-ogsc]/`@media (prefers-color-scheme:dark)` overrides keyed off these.
  const useVml = fullWidth && cornerRadius !== undefined;
  // Approximate the button box height from the line box + vertical padding so the
  // VML roundrect matches the live <a>. arcsize is the corner radius as a percent
  // of the shorter side (capped at 50% = a full pill).
  const vmlHeight = Math.round(fontSize * 1.2 + padding[0] * 2);
  const arcsize = useVml ? Math.min(50, Math.round(((cornerRadius as number) / vmlHeight) * 100)) : 0;
  const vmlButton = useVml
    ? '<!--[if mso]>' +
      `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeAttr(url)}" style="height:${vmlHeight}px;v-text-anchor:middle;mso-width-percent:1000;" arcsize="${arcsize}%" stroke="f" fillcolor="${escapeAttr(buttonBackgroundColor)}">` +
      '<w:anchorlock/>' +
      `<center style="color:${escapeAttr(buttonTextColor)};font-family:${escapeAttr(fontFamily ?? 'Arial,Helvetica,sans-serif')};font-size:${fontSize}px;font-weight:${fontWeight};">${escapeHtml(text)}</center>` +
      '</v:roundrect>' +
      '<![endif]-->'
    : null;

  const link = (
    <a href={url} style={linkStyle} target="_blank">
      <span
        dangerouslySetInnerHTML={{
          __html: `<!--[if mso]><i style="letter-spacing: ${padding[1]}px;mso-font-width:-100%;mso-text-raise:${textRaise}" hidden>&nbsp;</i><![endif]-->`,
        }}
      />
      <span>{text}</span>
      <span
        dangerouslySetInnerHTML={{
          __html: `<!--[if mso]><i style="letter-spacing: ${padding[1]}px;mso-font-width:-100%" hidden>&nbsp;</i><![endif]-->`,
        }}
      />
    </a>
  );

  return (
    <div style={wrapperStyle}>
      {vmlButton && <span dangerouslySetInnerHTML={{ __html: vmlButton }} />}
      {useVml ? (
        // Hide the live <a> from Outlook; the VML roundrect renders there instead.
        <>
          <span dangerouslySetInnerHTML={{ __html: '<!--[if !mso]><!-->' }} />
          {link}
          <span dangerouslySetInnerHTML={{ __html: '<!--<![endif]-->' }} />
        </>
      ) : (
        link
      )}
    </div>
  );
}

// Minimal escapers for the VML conditional-comment string (emitted raw, so React
// does not escape it for us). URLs/colors land in attributes; text in markup.
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
