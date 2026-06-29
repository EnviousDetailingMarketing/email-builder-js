import { describe, expect, it } from '@jest/globals';

import { htmlToText, sanitizeEmailHtml } from '../src/sanitize';

describe('block-kit/sanitizeEmailHtml', () => {
  it('returns an empty string for nullish input', () => {
    expect(sanitizeEmailHtml(undefined)).toBe('');
    expect(sanitizeEmailHtml(null)).toBe('');
    expect(sanitizeEmailHtml('')).toBe('');
  });

  describe('XSS vectors are neutralized', () => {
    it('strips <script> tags and their content', () => {
      const out = sanitizeEmailHtml('<p>hi</p><script>alert(document.cookie)</script>');
      expect(out).not.toContain('<script');
      expect(out).not.toContain('alert');
      expect(out).toContain('<p>hi</p>');
    });

    it('strips on* event handlers (img onerror / onload)', () => {
      const out = sanitizeEmailHtml('<img src="x" onerror="alert(1)" onload="alert(2)" />');
      expect(out).not.toContain('onerror');
      expect(out).not.toContain('onload');
      expect(out).not.toContain('alert');
      expect(out).toContain('<img');
    });

    it('drops javascript: URLs in href', () => {
      const out = sanitizeEmailHtml('<a href="javascript:alert(1)">x</a>');
      expect(out).not.toContain('javascript:');
      expect(out).not.toContain('alert');
    });

    it('drops case-insensitive / obfuscated javascript: URLs', () => {
      const out = sanitizeEmailHtml('<a href="JaVaScRiPt:alert(1)">x</a>');
      expect(out.toLowerCase()).not.toContain('javascript:');
    });

    it('drops data: URLs (base64 html payloads)', () => {
      const out = sanitizeEmailHtml(
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>'
      );
      expect(out).not.toContain('data:');
    });

    it('removes <style> and <link> elements', () => {
      const out = sanitizeEmailHtml('<style>body{display:none}</style><link rel="x" href="http://e.com"><p>ok</p>');
      expect(out).not.toContain('<style');
      expect(out).not.toContain('<link');
      expect(out).toContain('<p>ok</p>');
    });

    it('removes <iframe> and form controls', () => {
      const out = sanitizeEmailHtml('<iframe src="http://evil.com"></iframe><input value="x"><p>ok</p>');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<input');
      expect(out).toContain('<p>ok</p>');
    });

    it('neutralizes an SVG onload payload', () => {
      const out = sanitizeEmailHtml('<svg/onload=alert(1)><p>ok</p>');
      expect(out).not.toContain('<svg');
      expect(out).not.toContain('onload');
      expect(out).not.toContain('alert');
    });
  });

  describe('benign formatting survives', () => {
    it('keeps paragraphs, emphasis and lists', () => {
      const out = sanitizeEmailHtml('<p><strong>Hi</strong> <em>there</em></p><ul><li>One</li></ul>');
      expect(out).toContain('<strong>Hi</strong>');
      expect(out).toContain('<em>there</em>');
      expect(out).toContain('<li>One</li>');
    });

    it('keeps http/https/mailto/tel links', () => {
      expect(sanitizeEmailHtml('<a href="https://example.com">x</a>')).toContain('href="https://example.com"');
      expect(sanitizeEmailHtml('<a href="mailto:a@b.com">x</a>')).toContain('href="mailto:a@b.com"');
      expect(sanitizeEmailHtml('<a href="tel:+15551234">x</a>')).toContain('href="tel:+15551234"');
    });

    it('keeps img with src/alt/width/height', () => {
      const out = sanitizeEmailHtml('<img src="https://e.com/a.png" alt="A photo" width="10" height="20" />');
      expect(out).toContain('src="https://e.com/a.png"');
      expect(out).toContain('alt="A photo"');
    });
  });
});

describe('block-kit/htmlToText', () => {
  it('returns an empty string for nullish input', () => {
    expect(htmlToText(undefined)).toBe('');
    expect(htmlToText(null)).toBe('');
  });

  it('strips tags and keeps the visible text', () => {
    expect(htmlToText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('turns <br> and block boundaries into newlines', () => {
    expect(htmlToText('<p>a</p><p>b</p>')).toBe('a\nb');
    expect(htmlToText('a<br>b')).toBe('a\nb');
  });

  it('never leaks <script>/<style> content into the text', () => {
    expect(htmlToText('<p>safe</p><script>alert(1)</script><style>x{}</style>')).toBe('safe');
  });

  it('decodes the basic HTML entities', () => {
    expect(htmlToText('<p>Tom &amp; Jerry &lt;3</p>')).toBe('Tom & Jerry <3');
  });

  it('drops link URLs by default', () => {
    expect(htmlToText('Read <a href="https://example.com">our docs</a>.')).toBe('Read our docs.');
  });

  it('preserves link URLs as `text (url)` when asked', () => {
    expect(htmlToText('Read <a href="https://example.com">our docs</a>.', { preserveLinks: true })).toBe(
      'Read our docs (https://example.com).'
    );
  });

  it('collapses a link to just its url when the text equals the href', () => {
    expect(htmlToText('<a href="https://example.com">https://example.com</a>', { preserveLinks: true })).toBe(
      'https://example.com'
    );
  });

  it('honors a custom block separator for paragraph spacing', () => {
    expect(htmlToText('<p>a</p><p>b</p>', { blockSeparator: '\n\n' })).toBe('a\n\nb');
    // <br>, <li> and <tr> stay single-newline regardless of the block separator.
    expect(htmlToText('a<br>b', { blockSeparator: '\n\n' })).toBe('a\nb');
  });
});
