import hljs from 'highlight.js';
import jsonHighlighter from 'highlight.js/lib/languages/json';
import xmlHighlighter from 'highlight.js/lib/languages/xml';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import prettierPluginHtml from 'prettier/plugins/html';
import { format } from 'prettier/standalone';

hljs.registerLanguage('json', jsonHighlighter);
hljs.registerLanguage('html', xmlHighlighter);

export async function html(value: string): Promise<string> {
  // Prettier's HTML parser corrupts Outlook/MSO downlevel-hidden conditional
  // comments (`<!--[if mso]>…<![endif]-->`): because they wrap real tags inside
  // a comment, it emits stray `>` characters and a malformed `</span` in the
  // formatted source (e.g. the WS-03 ghost-table spans in EmailLayout and the
  // block-button MSO spacers). Mask each conditional comment behind an opaque
  // placeholder, let prettier format the rest, then restore it verbatim. This is
  // display-only — `renderToStaticMarkup` output is already correct; this keeps
  // the HTML *preview* faithful to what is actually exported.
  const preserved: string[] = [];
  const masked = value.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, (match) => {
    const token = `<!--mso-preserve-${preserved.length}-->`;
    preserved.push(match);
    return token;
  });
  const prettyValue = await format(masked, {
    parser: 'html',
    plugins: [prettierPluginHtml],
  });
  const restored = prettyValue.replace(/<!--mso-preserve-(\d+)-->/g, (_, index) => preserved[Number(index)]);
  return hljs.highlight(restored, { language: 'html' }).value;
}

export async function json(value: string): Promise<string> {
  const prettyValue = await format(value, {
    parser: 'json',
    printWidth: 0,
    trailingComma: 'all',
    plugins: [prettierPluginBabel, prettierPluginEstree],
  });
  return hljs.highlight(prettyValue, { language: 'javascript' }).value;
}
