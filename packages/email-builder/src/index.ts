import { TReaderDocument } from './Reader/core';
import renderToStaticMarkupImpl from './renderers/renderToStaticMarkup';
import renderToTextImpl, { TRenderToTextOptions } from './renderers/renderToText';

export { default as renderToStaticMarkup } from './renderers/renderToStaticMarkup';
export type { TRenderToStaticMarkupOptions } from './renderers/renderToStaticMarkup';
export { default as renderToText, TRenderToTextOptions } from './renderers/renderToText';

export {
  ReaderBlockSchema,
  TReaderBlock,
  //
  ReaderDocumentSchema,
  TReaderDocument,
  //
  ReaderBlock,
  TReaderBlockProps,
  //
  TReaderProps,
  default as Reader,
} from './Reader/core';

/**
 * Convenience helper that renders both MIME parts of an email in one call,
 * so callers (e.g. a CRM) can drop them straight into a multipart message.
 * No transport — just the two payloads.
 */
export function renderEmail(document: TReaderDocument, options: TRenderToTextOptions): { html: string; text: string } {
  return {
    html: renderToStaticMarkupImpl(document, { rootBlockId: options.rootBlockId }),
    text: renderToTextImpl(document, options),
  };
}
