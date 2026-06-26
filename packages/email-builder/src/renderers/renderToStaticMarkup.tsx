import React from 'react';
import { renderToStaticMarkup as baseRenderToStaticMarkup } from 'react-dom/server';

import { createStyleRegistry, StyleRegistryProvider } from '@usewaypoint/block-kit';

import Reader, { TReaderDocument } from '../Reader/core';

export type TRenderToStaticMarkupOptions = {
  rootBlockId: string;
  /** `lang` attribute on the root `<html>` element. Defaults to `"en"`. */
  lang?: string;
  /** Document `<title>`. Defaults to empty. */
  title?: string;
  /**
   * Hidden preview/preheader text shown by inbox clients in the message list
   * before the email is opened. Omitted from output when not provided.
   */
  preheader?: string;
};

// Conservative cross-client reset. Lives in the head <style>; per-block inline
// styles still win over it. Kept intentionally small — responsive/dark/hover
// rules are layered on top by blocks via the Style Registry.
//
// WS-03 (client-compat) appended the client-reset block below the original
// baseline: Outlook.com line-height (`#outlook a`, `.ExternalClass`), the iOS
// auto-link / data-detector neutralizer (`a[x-apple-data-detectors]`), and the
// Gmail blue-link fix (`u + #body a`, which is why <body> carries id="body").
const RESET_CSS =
  'body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}' +
  'table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}' +
  'img{border:0;line-height:100%;outline:none;text-decoration:none;display:block;-ms-interpolation-mode:bicubic;}' +
  'a{text-decoration:none;}' +
  // --- WS-03 client resets ---
  // Outlook.com / Windows line-height normalization.
  '#outlook a{padding:0;}' +
  '.ExternalClass{width:100%;}' +
  '.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{line-height:100%;}' +
  // iOS / Apple Mail auto-linking (dates, addresses, phone numbers): keep the
  // surrounding text styling instead of letting the client recolor/underline.
  'a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}' +
  // Gmail blue-link fix — Gmail injects a <u> and recolors links; this re-inherits.
  'u+#body a{color:inherit;text-decoration:none;}';

// MSO/Outlook (Word engine) conditional head, injected only for Outlook on
// Windows. `mso-table-lspace/rspace` kills Outlook's phantom table cell padding;
// `mso-line-height-rule:exactly` stops Outlook inflating line-height; the
// OfficeDocumentSettings xml pins rendering to 96dpi (otherwise Outlook scales
// everything up ~120%). The body font is a non-!important fallback only — every
// block emits its own inline web-safe font stack, so this never overrides a
// document's font choice; it just gives the bare <body> a sane default.
//
// WS-04 (dark mode): Outlook.com strips/rewrites colors via [data-ogsc]; add the
// `<!--[if mso]>`-scoped or [data-ogsc] dark overrides here — additive only.
const MSO_HEAD =
  '<!--[if mso]>' +
  '<xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>' +
  '<style type="text/css">' +
  'table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}' +
  'td,a,span,div{mso-line-height-rule:exactly;}' +
  'body{font-family:Arial,Helvetica,sans-serif;}' +
  '</style>' +
  '<![endif]-->';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPreheader(preheader: string | undefined): string {
  if (!preheader) {
    return '';
  }
  return (
    '<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">' +
    escapeHtml(preheader) +
    '</div>'
  );
}

export default function renderToStaticMarkup(
  document: TReaderDocument,
  { rootBlockId, lang = 'en', title = '', preheader }: TRenderToStaticMarkupOptions
) {
  // Single body render pass: blocks register head CSS into `registry` as a pure
  // side effect of rendering. The head (which contains the collected <style>)
  // is emitted *before* the body, so the body must be rendered first and the
  // document assembled as a string afterwards.
  const registry = createStyleRegistry();
  const body = baseRenderToStaticMarkup(
    <StyleRegistryProvider registry={registry}>
      <Reader document={document} rootBlockId={rootBlockId} />
    </StyleRegistryProvider>
  );
  const styleContent = RESET_CSS + registry.renderCss();

  return (
    '<!DOCTYPE html>' +
    // VML (v:) + Office (o:) namespaces let Outlook parse the OfficeDocumentSettings
    // xml in MSO_HEAD and any future <v:roundrect>/VML markup blocks emit.
    `<html lang="${escapeHtml(lang)}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">` +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<meta name="color-scheme" content="light dark">' +
    '<meta name="supported-color-schemes" content="light dark">' +
    `<title>${escapeHtml(title)}</title>` +
    // MSO/Outlook conditional head slot — WS-03 (client-compat) filled this in.
    MSO_HEAD +
    // WS-04 (dark mode) slot: the `color-scheme` metas above already opt the
    // document into dark rendering; layer the `@media (prefers-color-scheme:dark)`
    // overrides into this <style> (additive — must not remove RESET_CSS/registry
    // CSS, and the WS-02 `{ dark: … }` registry markers feed in via registry.renderCss()).
    `<style type="text/css">${styleContent}</style>` +
    '</head>' +
    // id="body" backs the Gmail blue-link fix (`u + #body a`) in RESET_CSS.
    '<body id="body">' +
    renderPreheader(preheader) +
    body +
    '</body>' +
    '</html>'
  );
}
