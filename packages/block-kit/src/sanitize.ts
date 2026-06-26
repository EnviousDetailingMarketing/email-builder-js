import insane, { AllowedSchemes, AllowedTags, SanitizeOptions } from 'insane';

//
// Shared, audited HTML sanitizer for all @usewaypoint/block-* packages.
//
// WS-08 (item 17): `block-html` previously injected raw `contents` via
// `dangerouslySetInnerHTML` with ZERO sanitization, and `block-text`'s markdown
// path carried its own private copy of an `insane` config. Both now route
// through this single module so there is exactly one audited allow-list to
// reason about.
//
// Library choice — `insane` (not DOMPurify):
//   * `insane` is already a dependency (it backed the markdown path), so this
//     introduces no new supply-chain surface.
//   * It is a pure string-in/string-out tokenizer with NO DOM dependency, so it
//     runs identically under `ReactDOMServer.renderToStaticMarkup` (Node, no
//     jsdom) — DOMPurify would require a DOM/jsdom shim on the server render
//     path used to produce email HTML.
//   * Reusing the exact allow-list the markdown path already shipped keeps the
//     sanitized output byte-for-byte stable for existing stored documents.
//

// Email-safe element allow-list. Intentionally excludes <script>, <style>,
// <link>, <iframe>, <object>, <embed>, <form>, <input>, etc. — `insane` drops
// any tag (and the content of raw-text tags such as <script>/<style>) that is
// not on this list.
const ALLOWED_TAGS: AllowedTags[] = [
  'a',
  'article',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'del',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'ins',
  'kbd',
  'li',
  'main',
  'ol',
  'p',
  'pre',
  'section',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

// Attributes allowed on every tag. Note `on*` event handlers are NOT here, so
// `onerror`/`onload`/`onclick`/etc. are stripped from every element.
const GENERIC_ALLOWED_ATTRIBUTES = ['style', 'title'];

// URL-bearing schemes we permit. `javascript:`, `data:`, `vbscript:`, `file:`,
// etc. are rejected, so `javascript:`/`data:text/html` payloads in href/src are
// dropped. (`tel` is valid at runtime but missing from `@types/insane`'s
// narrower union, hence the cast.)
const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel'] as unknown as AllowedSchemes[];

const SANITIZE_OPTIONS: SanitizeOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedSchemes: ALLOWED_SCHEMES,
  allowedAttributes: {
    ...ALLOWED_TAGS.reduce<Record<string, string[]>>((res, tag) => {
      res[tag] = [...GENERIC_ALLOWED_ATTRIBUTES];
      return res;
    }, {}),
    img: ['src', 'alt', 'width', 'height', ...GENERIC_ALLOWED_ATTRIBUTES],
    table: ['width', ...GENERIC_ALLOWED_ATTRIBUTES],
    td: ['align', 'width', ...GENERIC_ALLOWED_ATTRIBUTES],
    th: ['align', 'width', ...GENERIC_ALLOWED_ATTRIBUTES],
    a: ['href', 'target', ...GENERIC_ALLOWED_ATTRIBUTES],
    ol: ['start', ...GENERIC_ALLOWED_ATTRIBUTES],
    ul: ['start', ...GENERIC_ALLOWED_ATTRIBUTES],
  },
  filter: (token) => {
    // `insane` leaves an `undefined` value when an attribute is present without
    // a value (e.g. `<a href>`); normalize to an empty string so the renderer
    // does not emit a dangling attribute or throw.
    if (token.tag === 'a' && 'href' in token.attrs && token.attrs.href === undefined) {
      token.attrs.href = '';
    }
    if (token.tag === 'img' && 'src' in token.attrs && token.attrs.src === undefined) {
      token.attrs.src = '';
    }
    return true;
  },
};

/**
 * Sanitize an untrusted HTML string for safe inclusion in an email body.
 *
 * Neutralizes the common XSS vectors: `<script>` (tag + content removed),
 * `<style>`/`<link>`/`<iframe>`, `on*` event handlers, and `javascript:` /
 * `data:` URLs in href/src. Benign formatting markup (paragraphs, lists,
 * links, images, tables, inline emphasis) survives.
 *
 * For CRM use this is the DEFAULT and only path — there is intentionally no
 * "trusted raw HTML" escape hatch. If one is ever needed it must be added as an
 * explicit, separately-named, loudly-documented opt-in.
 */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  return insane(html, SANITIZE_OPTIONS);
}

const BLOCK_LEVEL_CLOSE_TAGS = /<\/\s*(p|div|h[1-6]|li|tr|blockquote|pre|table|ul|ol|section|article)\s*>/gi;
const BR_TAGS = /<\s*br\s*\/?\s*>/gi;
const ANY_TAG = /<[^>]+>/g;

/**
 * Convert an HTML string to plain text. Shared with WS-05 (plain-text
 * fallback). Runs the input through {@link sanitizeEmailHtml} first so that
 * `<script>`/`<style>` content can never leak into the text output, then strips
 * the remaining markup, turning block-level boundaries and `<br>` into
 * newlines and decoding the basic HTML entities.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  const sanitized = sanitizeEmailHtml(html);
  const withBreaks = sanitized.replace(BR_TAGS, '\n').replace(BLOCK_LEVEL_CLOSE_TAGS, '\n');
  const withoutTags = withBreaks.replace(ANY_TAG, '');
  const decoded = withoutTags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    // Decode `&amp;` last so an encoded entity like `&amp;lt;` does not turn
    // into a `<`.
    .replace(/&amp;/gi, '&');
  return decoded
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
