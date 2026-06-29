import { TReaderDocument } from '../Reader/core';

/**
 * Kitchen-sink document exercising every block type the renderer supports,
 * including nesting (Container, ColumnsContainer) and edge cases (image with
 * no alt/link, plain vs markdown text).
 */
export const KITCHEN_SINK: TReaderDocument = {
  root: {
    type: 'EmailLayout',
    data: {
      backdropColor: '#F2F5F7',
      canvasColor: '#FFFFFF',
      textColor: '#242424',
      fontFamily: 'MODERN_SANS',
      childrenIds: ['h1', 'text-plain', 'text-md', 'divider', 'button', 'image-link', 'spacer', 'columns', 'html'],
    },
  },
  h1: {
    type: 'Heading',
    data: { props: { text: 'Welcome aboard', level: 'h1' } },
  },
  'text-plain': {
    type: 'Text',
    data: { props: { text: 'Thanks for signing up.\nWe are glad to have you.' } },
  },
  'text-md': {
    type: 'Text',
    data: {
      props: {
        markdown: true,
        text: '**Get started** by visiting [your dashboard](https://example.com/dashboard).\n\n- First, confirm your email\n- Then, invite your team\n\n## Tips\n\nReach us at `support@example.com`.',
      },
    },
  },
  divider: {
    type: 'Divider',
    data: { props: {} },
  },
  button: {
    type: 'Button',
    data: { props: { text: 'Open dashboard', url: 'https://example.com/dashboard' } },
  },
  'image-link': {
    type: 'Image',
    data: { props: { url: 'https://cdn.example.com/logo.png', alt: 'Company logo', linkHref: 'https://example.com' } },
  },
  spacer: {
    type: 'Spacer',
    data: { props: { height: 32 } },
  },
  columns: {
    type: 'ColumnsContainer',
    data: {
      props: {
        columns: [
          { childrenIds: ['col-heading', 'col-avatar'] },
          { childrenIds: ['col-text'] },
          { childrenIds: ['col-image-noalt'] },
        ],
      },
    },
  },
  'col-heading': {
    type: 'Heading',
    data: { props: { text: 'Left column', level: 'h3' } },
  },
  'col-avatar': {
    type: 'Avatar',
    data: { props: { imageUrl: 'https://cdn.example.com/face.png', alt: 'Jane Doe', shape: 'circle' } },
  },
  'col-text': {
    type: 'Text',
    data: { props: { text: 'Middle column body copy.' } },
  },
  'col-image-noalt': {
    type: 'Image',
    data: { props: { url: 'https://cdn.example.com/decoration.png', alt: '', linkHref: null } },
  },
  html: {
    type: 'Html',
    data: {
      props: {
        contents:
          '<p>Custom <strong>HTML</strong> block with a <a href="https://example.com/terms">terms link</a>.</p>',
      },
    },
  },
};

/**
 * A near-verbatim copy of the editor's "Welcome" sample document (images, text,
 * button) so the text output is snapshotted against a realistic template.
 */
export const WELCOME: TReaderDocument = {
  root: {
    type: 'EmailLayout',
    data: {
      backdropColor: '#F2F5F7',
      canvasColor: '#FFFFFF',
      textColor: '#242424',
      fontFamily: 'MODERN_SANS',
      childrenIds: [
        'block-1709571212684',
        'block-1709571228545',
        'block-1709571234315',
        'block-1709571247550',
        'block-1709571258507',
        'block-1709571281151',
        'block-1709571302968',
        'block-1709571282795',
      ],
    },
  },
  'block-1709571212684': {
    type: 'Image',
    data: {
      props: {
        url: 'https://example.com/marketbase.png',
        alt: 'Marketbase',
        linkHref: 'https://marketbase.app',
        contentAlignment: 'middle',
      },
    },
  },
  'block-1709571228545': {
    type: 'Text',
    data: { props: { text: 'Hi Anna 👋,' } },
  },
  'block-1709571234315': {
    type: 'Text',
    data: {
      props: {
        text: 'Welcome to Marketbase! Marketbase is how teams within fast growing marketplaces effortlessly monitor conversations.',
      },
    },
  },
  'block-1709571247550': {
    type: 'Text',
    data: { props: { text: 'Best of all, you can connect your existing messaging services in minutes:' } },
  },
  'block-1709571258507': {
    type: 'Image',
    data: {
      props: {
        url: 'https://example.com/screenshot.png',
        alt: 'Video thumbnail',
        linkHref: 'https://capture.dropbox.com/NBQEmoCKKP9RGBWr',
        contentAlignment: 'middle',
      },
    },
  },
  'block-1709571281151': {
    type: 'Text',
    data: {
      props: { text: 'If you ever need help, just reply to this email and one of us will get back to you shortly.' },
    },
  },
  'block-1709571302968': {
    type: 'Button',
    data: {
      props: {
        buttonBackgroundColor: '#0079cc',
        buttonStyle: 'rectangle',
        text: 'Open dashboard',
        url: 'https://www.usewaypoint.com',
      },
    },
  },
  'block-1709571282795': {
    type: 'Image',
    data: {
      props: {
        url: 'https://example.com/illustration.png',
        alt: 'Illustration',
        linkHref: null,
        contentAlignment: 'middle',
      },
    },
  },
};
