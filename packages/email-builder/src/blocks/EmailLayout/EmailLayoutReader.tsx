import React from 'react';

import { getFontFamily, useStyleRegistry } from '@usewaypoint/block-kit';

import { ReaderBlock } from '../../Reader/core';

import { EmailLayoutProps } from './EmailLayoutPropsSchema';

// WS-02 (item 3): a conservative responsive baseline registered through the Style
// Registry (never a raw <style>). Stable class hooks on the email shell so the
// rules dedup to a single copy regardless of document size.
const EMAIL_BODY_CLASS = 'ebw-email-body';

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
  // WS-04 (dark mode) hook: register the page-level dark background/text here via
  // registry.addClass(EMAIL_BODY_CLASS, { dark: '…' }) — additive only.

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
        WS-03 (Outlook/MSO) hook: wrap this centering table in an
        `<!--[if mso]><table width="600" ...>` ghost so Outlook pins the shell to
        600px. The fluid width:100% / max-width:600px below already drives every
        other client; keep both in sync on the same 600px value.
      */}
      <table
        align="center"
        width="100%"
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
    </div>
  );
}
