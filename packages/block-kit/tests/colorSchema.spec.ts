import { describe, expect, it } from '@jest/globals';

import { COLOR_SCHEMA } from '../src/index';

// WS-07 (item 15-A): COLOR_SCHEMA was widened past the WS-01 freeze to accept
// more CSS color forms while still rejecting garbage.
describe('block-kit/COLOR_SCHEMA', () => {
  const accepts = (v: unknown) => COLOR_SCHEMA.safeParse(v).success;

  it('still accepts 6-digit hex (legacy)', () => {
    expect(accepts('#FFFFFF')).toBe(true);
    expect(accepts('#000000')).toBe(true);
    expect(accepts('#aabbcc')).toBe(true);
  });

  it('accepts 3-digit hex', () => {
    expect(accepts('#fff')).toBe(true);
    expect(accepts('#0A0')).toBe(true);
  });

  it('accepts 4-digit hex (RGBA shorthand)', () => {
    expect(accepts('#fff8')).toBe(true);
  });

  it('accepts 8-digit hex (#RRGGBBAA)', () => {
    expect(accepts('#11223344')).toBe(true);
    expect(accepts('#FFFFFF80')).toBe(true);
  });

  it('accepts rgb() with comma syntax', () => {
    expect(accepts('rgb(255, 0, 128)')).toBe(true);
    expect(accepts('rgb(0,0,0)')).toBe(true);
  });

  it('accepts rgb() with space syntax', () => {
    expect(accepts('rgb(255 0 128)')).toBe(true);
  });

  it('accepts rgba() with decimal and percentage alpha', () => {
    expect(accepts('rgba(255, 0, 0, 0.5)')).toBe(true);
    expect(accepts('rgba(0,0,0,1)')).toBe(true);
    expect(accepts('rgba(10, 20, 30, .25)')).toBe(true);
    expect(accepts('rgba(255, 0, 0, 50%)')).toBe(true);
  });

  it('accepts the transparent keyword (case-insensitive)', () => {
    expect(accepts('transparent')).toBe(true);
    expect(accepts('TRANSPARENT')).toBe(true);
  });

  it('accepts null/undefined (optional + nullable)', () => {
    expect(accepts(null)).toBe(true);
    expect(accepts(undefined)).toBe(true);
  });

  it('rejects garbage and non-color strings', () => {
    expect(accepts('')).toBe(false);
    expect(accepts('red')).toBe(false); // named colors other than transparent are out of scope
    expect(accepts('#12')).toBe(false);
    expect(accepts('#12345')).toBe(false); // 5 digits
    expect(accepts('#1234567')).toBe(false); // 7 digits
    expect(accepts('#zzzzzz')).toBe(false);
    expect(accepts('rgb()')).toBe(false);
    expect(accepts('rgb(1,2)')).toBe(false);
    expect(accepts('javascript:alert(1)')).toBe(false);
    expect(accepts('not a color')).toBe(false);
    expect(accepts('#fff;background:url(x)')).toBe(false);
  });
});
