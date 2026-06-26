import { marked, Renderer } from 'marked';
import React, { CSSProperties, useMemo } from 'react';

import { sanitizeEmailHtml } from '@usewaypoint/block-kit';

// Item 17: the markdown path now shares the single audited allow-list in
// `block-kit` (`sanitizeEmailHtml`) instead of carrying its own copy.

class CustomRenderer extends Renderer {
  table(header: string, body: string) {
    return `<table width="100%">
<thead>
${header}</thead>
<tbody>
${body}</tbody>
</table>`;
  }

  link(href: string, title: string | null, text: string) {
    if (!title) {
      return `<a href="${href}" target="_blank">${text}</a>`;
    }
    return `<a href="${href}" title="${title}" target="_blank">${text}</a>`;
  }
}

function renderMarkdownString(str: string): string {
  const html = marked.parse(str, {
    async: false,
    breaks: true,
    gfm: true,
    pedantic: false,
    silent: false,
    renderer: new CustomRenderer(),
  });
  if (typeof html !== 'string') {
    throw new Error('marked.parse did not return a string');
  }
  return sanitizeEmailHtml(html);
}

type Props = {
  style: CSSProperties;
  markdown: string;
  // WS-04 (dark mode): optional class hook so the markdown wrapper can carry the
  // auto-derived dark color overrides, same as the plain-text <p> path.
  className?: string;
};
export default function EmailMarkdown({ markdown, ...props }: Props) {
  const data = useMemo(() => renderMarkdownString(markdown), [markdown]);
  return <div {...props} dangerouslySetInnerHTML={{ __html: data }} />;
}
