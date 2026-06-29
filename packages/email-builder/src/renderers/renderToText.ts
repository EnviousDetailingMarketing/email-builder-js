import { marked, type Token, type Tokens } from 'marked';

import { htmlToText as sanitizeHtmlToText } from '@usewaypoint/block-kit';

import { TReaderDocument } from '../Reader/core';

export type TRenderToTextOptions = {
  /** Id of the block to start rendering from (usually the EmailLayout root). */
  rootBlockId: string;
  /**
   * Optional hard-wrap width in columns. When set (e.g. 78), long lines are
   * word-wrapped to at most this many characters. Disabled by default.
   */
  maxLineLength?: number;
};

/**
 * A loose view of a block. The document is a discriminated union keyed by
 * `type`, but for text generation we only ever read a handful of fields, so we
 * treat the payload structurally rather than fighting the union narrowing.
 */
type LooseBlock = {
  type?: string;
  data?: {
    props?: Record<string, unknown> | null;
    childrenIds?: string[] | null;
    // EmailLayout keeps childrenIds at the top of `data`, not under `props`.
    [key: string]: unknown;
  } | null;
};

/**
 * Render a document to a clean `text/plain` representation suitable for the
 * text part of a MIME multipart email.
 *
 * Pure function: it walks the same flat document tree the HTML reader uses
 * (root block -> childrenIds) but emits text instead of rendering React.
 */
export default function renderToText(document: TReaderDocument, options: TRenderToTextOptions): string {
  const { rootBlockId, maxLineLength } = options;
  const raw = renderBlock(document, rootBlockId);
  return cleanup(raw, maxLineLength);
}

function renderBlock(document: TReaderDocument, blockId: string): string {
  const block = document[blockId] as LooseBlock | undefined;
  // Null-guard: dangling/unknown ids contribute nothing (mirrors the renderer).
  if (!block || !block.type) {
    return '';
  }

  const data = block.data ?? {};
  const props = (data.props ?? {}) as {
    childrenIds?: string[] | null;
    columns?: Array<{ childrenIds?: string[] | null }>;
    text?: string | null;
    level?: string | null;
    markdown?: boolean | null;
    url?: string | null;
    alt?: string | null;
    linkHref?: string | null;
    contents?: string | null;
  };

  switch (block.type) {
    case 'EmailLayout':
      return renderChildren(document, (data.childrenIds as string[] | null | undefined) ?? []);

    case 'Container':
      return renderChildren(document, (props.childrenIds as string[] | null | undefined) ?? []);

    case 'ColumnsContainer': {
      const columns = (props.columns as Array<{ childrenIds?: string[] | null }> | undefined) ?? [];
      // Columns can't be represented side-by-side in plain text, so stack them
      // sequentially, top-to-bottom.
      return columns
        .map((column) => renderChildren(document, column?.childrenIds ?? []))
        .filter((s) => s.length > 0)
        .join('\n\n');
    }

    case 'Heading':
      return renderHeading(props.text ?? '', props.level ?? 'h2');

    case 'Text':
      return props.markdown ? markdownToText(String(props.text ?? '')) : normalizeNewlines(String(props.text ?? ''));

    case 'Button':
      return renderButton(props.text ?? '', props.url ?? '');

    case 'Image':
      return renderImage(props.alt ?? '', props.linkHref ?? null);

    case 'Avatar':
      // Avatars have no link target; fall back to the alt text only.
      return String(props.alt ?? '').trim();

    case 'Divider':
      return '---';

    case 'Spacer':
      // Vertical whitespace collapses away in plain text.
      return '';

    case 'Html':
      return htmlToText(String(props.contents ?? ''));

    default:
      return '';
  }
}

function renderChildren(document: TReaderDocument, childrenIds: string[]): string {
  return childrenIds
    .map((id) => renderBlock(document, id))
    .filter((s) => s.trim().length > 0)
    .join('\n\n');
}

function renderHeading(text: string, level: string): string {
  const value = text.trim();
  if (value.length === 0) {
    return '';
  }
  switch (level) {
    case 'h1':
      return `${value}\n${'='.repeat(value.length)}`;
    case 'h2':
      return `${value}\n${'-'.repeat(value.length)}`;
    default:
      // h3 (and anything else): just the text, no underline.
      return value;
  }
}

function renderButton(text: string, url: string): string {
  const label = text.trim();
  const href = url.trim();
  if (href.length === 0) {
    return label;
  }
  if (label.length === 0) {
    return href;
  }
  return `${label} (${href})`;
}

function renderImage(alt: string, linkHref: string | null): string {
  const altText = alt.trim();
  const href = (linkHref ?? '').trim();
  const base = altText.length > 0 ? altText : href.length > 0 ? '[image]' : '';
  if (base.length === 0) {
    // No alt and no link: skip silently.
    return '';
  }
  return href.length > 0 ? `${base} (${href})` : base;
}

// ---------------------------------------------------------------------------
// Markdown -> text
// ---------------------------------------------------------------------------

function markdownToText(markdown: string): string {
  const tokens = marked.lexer(normalizeNewlines(markdown));
  return blockTokensToText(tokens).trim();
}

function blockTokensToText(tokens: Token[]): string {
  const parts: string[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case 'space':
        break;
      case 'heading':
        parts.push(renderHeading(inlineTokensToText(asInline(token)), `h${(token as Tokens.Heading).depth}`));
        break;
      case 'paragraph':
        parts.push(inlineTokensToText(asInline(token)));
        break;
      case 'text':
        parts.push('tokens' in token && token.tokens ? inlineTokensToText(token.tokens) : (token as Tokens.Text).text);
        break;
      case 'code':
        parts.push((token as Tokens.Code).text);
        break;
      case 'blockquote': {
        const inner = blockTokensToText((token as Tokens.Blockquote).tokens ?? []);
        parts.push(
          inner
            .split('\n')
            .map((line) => (line.length > 0 ? `> ${line}` : '>'))
            .join('\n')
        );
        break;
      }
      case 'list': {
        const list = token as Tokens.List;
        const lines = list.items.map((item, index) => {
          const bullet = list.ordered ? `${Number(list.start || 1) + index}.` : '-';
          const itemText = blockTokensToText(item.tokens ?? []).trim();
          return `${bullet} ${itemText}`;
        });
        parts.push(lines.join('\n'));
        break;
      }
      case 'hr':
        parts.push('---');
        break;
      case 'html':
        parts.push(htmlToText((token as Tokens.HTML).text));
        break;
      default: {
        const fallback = (token as { text?: string }).text;
        if (fallback) {
          parts.push(fallback);
        }
      }
    }
  }
  return parts.filter((p) => p.trim().length > 0).join('\n\n');
}

function asInline(token: Token): Token[] {
  const tokens = (token as { tokens?: Token[] }).tokens;
  return tokens ?? [];
}

function inlineTokensToText(tokens: Token[]): string {
  let out = '';
  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        const t = token as Tokens.Text;
        out += t.tokens ? inlineTokensToText(t.tokens) : t.text;
        break;
      }
      case 'escape':
        out += (token as Tokens.Escape).text;
        break;
      case 'strong':
      case 'em':
      case 'del':
        out += inlineTokensToText(asInline(token));
        break;
      case 'codespan':
        out += (token as Tokens.Codespan).text;
        break;
      case 'br':
        out += '\n';
        break;
      case 'link': {
        const link = token as Tokens.Link;
        const label = inlineTokensToText(link.tokens ?? []) || link.text || '';
        out += link.href && link.href !== label ? `${label} (${link.href})` : label;
        break;
      }
      case 'image': {
        const image = token as Tokens.Image;
        out += image.text || image.title || '[image]';
        break;
      }
      case 'html':
        out += htmlToText((token as Tokens.HTML).text);
        break;
      default:
        out += (token as { text?: string }).text ?? '';
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// HTML -> text
//
// Delegates to the shared, sanitize-first `htmlToText` from
// `@usewaypoint/block-kit` (CR-1). We opt into link preservation and blank-line
// paragraph spacing so the plain-text part keeps `text (url)` links and stays
// readable — the behavior the previous local stripper provided.
// ---------------------------------------------------------------------------

function htmlToText(html: string): string {
  return sanitizeHtmlToText(html, { preserveLinks: true, blockSeparator: '\n\n' });
}

// ---------------------------------------------------------------------------
// Output normalization
// ---------------------------------------------------------------------------

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function cleanup(text: string, maxLineLength?: number): string {
  let lines = normalizeNewlines(text)
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '')); // trim trailing whitespace per line

  if (maxLineLength && maxLineLength > 0) {
    lines = lines.flatMap((line) => wrapLine(line, maxLineLength));
  }

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // collapse 3+ newlines (no triple blank lines)
    .trim();
}

function wrapLine(line: string, maxLineLength: number): string[] {
  if (line.length <= maxLineLength) {
    return [line];
  }
  const words = line.split(/(\s+)/);
  const out: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length > maxLineLength && current.trim().length > 0) {
      out.push(current.replace(/\s+$/, ''));
      current = word.replace(/^\s+/, '');
    } else {
      current += word;
    }
  }
  if (current.trim().length > 0) {
    out.push(current.replace(/\s+$/, ''));
  }
  return out.length > 0 ? out : [line];
}
