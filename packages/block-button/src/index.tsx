import React, { CSSProperties } from 'react';
import { z } from 'zod';

import {
  COLOR_SCHEMA,
  FONT_FAMILY_SCHEMA,
  getFontFamily,
  getPadding,
  joinClasses,
  PADDING_SCHEMA,
  registerDarkColor,
  useStyleRegistry,
} from '@usewaypoint/block-kit';

//
// WS-07 (item 15-B): button URL validation. We accept absolute http(s), mailto:,
// tel:, and relative URLs (anchors, paths, protocol-relative), but reject empty /
// whitespace-only strings and obviously dangerous schemes like `javascript:`.
// Kept `.optional().nullable()` so existing/unset documents are unaffected; the
// refinement only runs when a non-null string is present.
//
const URL_SCHEMA = z
  .string()
  .refine(
    (value) => {
      const v = value.trim();
      if (v.length === 0) {
        return false;
      }
      // Reject dangerous inline schemes outright.
      if (/^(?:javascript|data|vbscript):/i.test(v)) {
        return false;
      }
      // Explicitly-allowed schemes.
      if (/^(?:https?|mailto|tel):/i.test(v)) {
        return true;
      }
      // Anything else must be relative (no scheme). A bare `word:` style scheme
      // we did not allow above is rejected.
      return !/^[a-z][a-z0-9+.-]*:/i.test(v);
    },
    { message: 'Must be an http(s)/mailto/tel or relative URL' }
  )
  .optional()
  .nullable();

// WS-07 (item 15-B): optional outline/border for the button surface. Presets
// remain the default (border unset == no border, unchanged markup).
const BUTTON_BORDER_SCHEMA = z
  .object({
    color: COLOR_SCHEMA,
    width: z.number().min(0).optional().nullable(),
    style: z.enum(['solid', 'dashed', 'dotted', 'none']).optional().nullable(),
  })
  .optional()
  .nullable();

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
      url: URL_SCHEMA,
      // WS-07 (item 15-B): explicit overrides. When unset, the size/style presets
      // above still supply the defaults, so existing documents render unchanged.
      // `borderRadius` overrides the preset corner radius (px).
      borderRadius: z.number().min(0).optional().nullable(),
      // `buttonPadding` overrides the size preset's inner padding (px).
      buttonPadding: z
        .object({
          vertical: z.number().min(0),
          horizontal: z.number().min(0),
        })
        .optional()
        .nullable(),
      // `border` draws an outline around the button surface (outline buttons).
      border: BUTTON_BORDER_SCHEMA,
    })
    .optional()
    .nullable(),
});

export type ButtonProps = z.infer<typeof ButtonPropsSchema>;

function getRoundedCorners(props: ButtonProps['props']) {
  // WS-07: an explicit borderRadius wins over the buttonStyle preset.
  if (typeof props?.borderRadius === 'number') {
    return props.borderRadius;
  }
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

function getButtonSizePadding(props: ButtonProps['props']): readonly [number, number] {
  // WS-07: explicit inner padding wins over the size preset. Tuple is
  // [vertical, horizontal] to match the existing preset shape.
  if (props?.buttonPadding) {
    return [props.buttonPadding.vertical, props.buttonPadding.horizontal] as const;
  }
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

// WS-07: resolve the optional outline border into a CSS shorthand. Returns
// `undefined` when no border is configured so unset documents are unchanged.
function getButtonBorder(props: ButtonProps['props']): string | undefined {
  const border = props?.border;
  if (!border) {
    return undefined;
  }
  const style = border.style ?? 'solid';
  if (style === 'none') {
    return undefined;
  }
  const width = typeof border.width === 'number' ? border.width : 1;
  const color = border.color ?? '#000000';
  return `${width}px ${style} ${color}`;
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
  const registry = useStyleRegistry();
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
  // WS-04 (dark mode, Option A): auto-derived dark overrides for the color-bearing
  // spots — the wrapper background plus the link's text + background — registered
  // via the Style Registry and applied by class. A light label (e.g. the default
  // white text) is kept; a light button/wrapper background is darkened.
  const wrapperDarkClass = registerDarkColor(registry, style?.backgroundColor, 'bg');
  const linkDarkClass = joinClasses(
    registerDarkColor(registry, buttonTextColor, 'fg'),
    registerDarkColor(registry, buttonBackgroundColor, 'bg')
  );
  const wrapperStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    textAlign: style?.textAlign ?? undefined,
    padding: getPadding(style?.padding),
  };
  const border = getButtonBorder(props);
  const linkStyle: CSSProperties = {
    color: buttonTextColor,
    fontSize,
    fontFamily,
    fontWeight,
    backgroundColor: buttonBackgroundColor,
    borderRadius: cornerRadius,
    border,
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
  // WS-07: keep the VML roundrect coherent with the optional outline border.
  // Word/VML draws strokes via attributes, not CSS, so map the border onto
  // stroke/strokecolor/strokeweight. With no border we preserve WS-03's
  // `stroke="f"` (stroke off) so existing output is byte-identical.
  const vmlStrokeAttrs =
    props?.border && (props.border.style ?? 'solid') !== 'none'
      ? `stroke="t" strokecolor="${escapeAttr(props.border.color ?? '#000000')}" strokeweight="${
          typeof props.border.width === 'number' ? props.border.width : 1
        }px"`
      : 'stroke="f"';
  const vmlButton = useVml
    ? '<!--[if mso]>' +
      `<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeAttr(url)}" style="height:${vmlHeight}px;v-text-anchor:middle;mso-width-percent:1000;" arcsize="${arcsize}%" ${vmlStrokeAttrs} fillcolor="${escapeAttr(buttonBackgroundColor)}">` +
      '<w:anchorlock/>' +
      `<center style="color:${escapeAttr(buttonTextColor)};font-family:${escapeAttr(fontFamily ?? 'Arial,Helvetica,sans-serif')};font-size:${fontSize}px;font-weight:${fontWeight};">${escapeHtml(text)}</center>` +
      '</v:roundrect>' +
      '<![endif]-->'
    : null;

  const link = (
    <a className={linkDarkClass} href={url} style={linkStyle} target="_blank">
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
    <div className={wrapperDarkClass} style={wrapperStyle}>
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
