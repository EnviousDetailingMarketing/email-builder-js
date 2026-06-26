import React from 'react';

import { deriveDarkColor, getFontFamily, useStyleRegistry } from '@usewaypoint/block-kit';

import { ReaderBlock } from '../../Reader/core';

import { EmailLayoutProps } from './EmailLayoutPropsSchema';

// WS-02 (item 3): a conservative responsive baseline registered through the Style
// Registry (never a raw <style>). Stable class hooks on the email shell so the
// rules dedup to a single copy regardless of document size.
const EMAIL_BODY_CLASS = 'ebw-email-body';
// WS-04 (dark mode): stable hook on the inner canvas table so its dark override
// can target a class instead of fighting the inline backgroundColor.
const EMAIL_CANVAS_CLASS = 'ebw-email-canvas';

function getBorder({ borderColor }: EmailLayoutProps) {
  if (!borderColor) {
    return undefined;
  }
  return `1px solid ${borderColor}`;
}

export default function EmailLayoutReader(props: EmailLayoutProps) {
  const childrenIds = props.childrenIds ?? [];

  const registry = useStyleRegistry();
  // Images scale DOWN to fit their container but never UP past their intrinsic
  // size (no `width:100%`), so small images are not blown up on mobile.
  registry.addRule('ws02-img-fluid', 'img{max-width:100%;height:auto;}');
  // Mobile baseline: tame the generous desktop body padding on small screens.
  // Kept deliberately conservative — block-level paddings are left untouched so
  // existing documents render identically on desktop.
  registry.addClass(EMAIL_BODY_CLASS, { mobile: 'padding:16px 0!important;' });

  // WS-04 (dark mode, Option A — auto-derived palette). The page background +
  // body text and the inner canvas card each get a `prefers-color-scheme: dark`
  // override (Apple Mail / iOS / supported Gmail), plus the equivalent
  // [data-ogsc]/[data-ogsb] hooks for Outlook.com / Windows, which strips media
  // queries. `!important` because the inline backgroundColor/color win on
  // specificity. Colors are derived from the document's own backdrop/text/canvas
  // (or the light defaults) — authors configure nothing. Option B (per-element
  // `darkModeColor` overrides) is a documented WS-07 follow-up.
  const darkBackdrop = deriveDarkColor(props.backdropColor ?? '#F5F5F5', 'bg');
  const darkText = deriveDarkColor(props.textColor ?? '#262626', 'fg');
  const darkCanvas = deriveDarkColor(props.canvasColor ?? '#FFFFFF', 'bg');
  registry.addClass(EMAIL_BODY_CLASS, {
    dark: `background-color:${darkBackdrop}!important;color:${darkText}!important;`,
  });
  registry.addRule(
    `${EMAIL_BODY_CLASS}::ogs`,
    `[data-ogsc] .${EMAIL_BODY_CLASS}{color:${darkText}!important;}` +
      `[data-ogsb] .${EMAIL_BODY_CLASS}{background-color:${darkBackdrop}!important;}`
  );
  registry.addClass(EMAIL_CANVAS_CLASS, { dark: `background-color:${darkCanvas}!important;` });
  registry.addRule(
    `${EMAIL_CANVAS_CLASS}::ogs`,
    `[data-ogsb] .${EMAIL_CANVAS_CLASS}{background-color:${darkCanvas}!important;}`
  );

  return (
    <div
      className={EMAIL_BODY_CLASS}
      style={{
        backgroundColor: props.backdropColor ?? '#F5F5F5',
        color: props.textColor ?? '#262626',
        fontFamily: getFontFamily(props.fontFamily ?? 'MODERN_SANS'),
        fontSize: '16px',
        fontWeight: '400',
        letterSpacing: '0.15008px',
        lineHeight: '1.5',
        margin: '0',
        padding: '32px 0',
        minHeight: '100%',
        width: '100%',
      }}
    >
      {/*
        WS-03 (Outlook/MSO): the MSO ghost table below pins the shell to 600px in
        Outlook (Word engine ignores max-width), while the fluid width:100% /
        max-width:600px table drives every other client. Both standardize on the
        same 600px value. Emitted via dangerouslySetInnerHTML so React keeps the
        conditional comment verbatim (same technique block-button uses for MSO).
      */}
      <span
        dangerouslySetInnerHTML={{
          __html:
            '<!--[if mso]><table role="presentation" align="center" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;"><tr><td><![endif]-->',
        }}
      />
      <table
        align="center"
        width="100%"
        className={EMAIL_CANVAS_CLASS}
        style={{
          margin: '0 auto',
          // Fluid shell: full width on small screens, capped at 600px elsewhere.
          width: '100%',
          maxWidth: '600px',
          backgroundColor: props.canvasColor ?? '#FFFFFF',
          borderRadius: props.borderRadius ?? undefined,
          border: getBorder(props),
        }}
        role="presentation"
        cellSpacing="0"
        cellPadding="0"
        border={0}
      >
        <tbody>
          <tr style={{ width: '100%' }}>
            <td>
              {childrenIds.map((childId) => (
                <ReaderBlock key={childId} id={childId} />
              ))}
            </td>
          </tr>
        </tbody>
      </table>
      <span
        dangerouslySetInnerHTML={{
          __html: '<!--[if mso]></td></tr></table><![endif]-->',
        }}
      />
    </div>
  );
}
