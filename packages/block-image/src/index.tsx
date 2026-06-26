import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { COLOR_SCHEMA, getPadding, PADDING_SCHEMA } from '@usewaypoint/block-kit';

export const ImagePropsSchema = z.object({
  style: z
    .object({
      padding: PADDING_SCHEMA,
      backgroundColor: COLOR_SCHEMA,
      textAlign: z.enum(['center', 'left', 'right']).optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      width: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      url: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
      // Item 20 (a11y): mark an image as purely decorative. When true the image
      // is intentionally hidden from assistive tech (alt="" + role=presentation)
      // rather than accidentally missing a description. Optional so stored docs
      // still parse.
      decorative: z.boolean().optional().nullable(),
      linkHref: z.string().optional().nullable(),
      contentAlignment: z.enum(['top', 'middle', 'bottom']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ImageProps = z.infer<typeof ImagePropsSchema>;

export function Image({ style, props }: ImageProps) {
  const sectionStyle: CSSProperties = {
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
    textAlign: style?.textAlign ?? undefined,
  };

  const linkHref = props?.linkHref ?? null;
  const width = props?.width ?? undefined;
  const height = props?.height ?? undefined;

  // A decorative image is intentionally hidden from assistive technology.
  const decorative = props?.decorative ?? false;

  const imageElement = (
    <img
      alt={decorative ? '' : props?.alt ?? ''}
      role={decorative ? 'presentation' : undefined}
      src={props?.url ?? ''}
      width={width}
      height={height}
      style={{
        width,
        height,
        outline: 'none',
        border: 'none',
        textDecoration: 'none',
        verticalAlign: props?.contentAlignment ?? 'middle',
        display: 'inline-block',
        maxWidth: '100%',
      }}
    />
  );

  if (!linkHref) {
    return <div style={sectionStyle}>{imageElement}</div>;
  }

  return (
    <div style={sectionStyle}>
      <a href={linkHref} style={{ textDecoration: 'none' }} target="_blank">
        {imageElement}
      </a>
    </div>
  );
}
