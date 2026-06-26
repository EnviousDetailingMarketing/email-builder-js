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
const RESET_CSS =
  'body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}' +
  'table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}' +
  'img{border:0;line-height:100%;outline:none;text-decoration:none;display:block;-ms-interpolation-mode:bicubic;}' +
  'a{text-decoration:none;}';

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
    `<html lang="${escapeHtml(lang)}">` +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="x-apple-disable-message-reformatting">' +
    '<meta name="color-scheme" content="light dark">' +
    '<meta name="supported-color-schemes" content="light dark">' +
    `<title>${escapeHtml(title)}</title>` +
    // MSO/Outlook conditional head slot — WS-03 (client-compat) fills this in.
    '<!--[if mso]><![endif]-->' +
    `<style type="text/css">${styleContent}</style>` +
    '</head>' +
    '<body>' +
    renderPreheader(preheader) +
    body +
    '</body>' +
    '</html>'
  );
}
