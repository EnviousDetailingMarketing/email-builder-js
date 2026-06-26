import React from 'react';

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react';

import { Button } from '.';

describe('block-button', () => {
  it('renders with default values', () => {
    expect(render(<Button />).asFragment()).toMatchSnapshot();
  });

  // WS-03 (Outlook/MSO): the variable-width <a> keeps the bulletproof padding
  // spacers; a full-width rounded button additionally emits a VML <v:roundrect>.
  it('keeps the mso-text-raise padding spacers on the live link', () => {
    const { container } = render(<Button props={{ text: 'Go', url: 'https://x.test' }} />);
    const html = container.innerHTML;
    expect(html).toContain('mso-text-raise:');
    expect(html).toContain('mso-font-width:-100%');
    // No VML for an auto-width button (we cannot size a roundrect reliably).
    expect(html).not.toContain('v:roundrect');
  });

  it('emits a VML roundrect (and hides the live link from Outlook) for a full-width rounded button', () => {
    const { container } = render(
      <Button props={{ text: 'Buy now', url: 'https://x.test', fullWidth: true, buttonStyle: 'pill' }} />
    );
    const html = container.innerHTML;
    expect(html).toContain('<v:roundrect');
    expect(html).toContain('mso-width-percent:1000;');
    expect(html).toContain('arcsize=');
    expect(html).toContain('<w:anchorlock/>');
    // The live <a> is wrapped so Outlook ignores it and renders the VML instead.
    expect(html).toContain('<!--[if !mso]><!-->');
    expect(html).toContain('<!--<![endif]-->');
  });
});
