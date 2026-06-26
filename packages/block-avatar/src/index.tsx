import React, { CSSProperties } from 'react';
import { z } from 'zod';

import { getPadding, PADDING_SCHEMA } from '@usewaypoint/block-kit';

export const AvatarPropsSchema = z.object({
  style: z
    .object({
      textAlign: z.enum(['left', 'center', 'right']).optional().nullable(),
      padding: PADDING_SCHEMA,
    })
    .optional()
    .nullable(),
  props: z
    .object({
      size: z.number().gt(0).optional().nullable(),
      shape: z.enum(['circle', 'square', 'rounded']).optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
      // Item 20 (a11y): mark the avatar as purely decorative (alt="" +
      // role=presentation). Optional so stored docs still parse.
      decorative: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type AvatarProps = z.infer<typeof AvatarPropsSchema>;

function getBorderRadius(shape: 'circle' | 'square' | 'rounded', size: number): number | undefined {
  switch (shape) {
    case 'rounded':
      return size * 0.125;
    case 'circle':
      return size;
    case 'square':
    default:
      return undefined;
  }
}

export const AvatarPropsDefaults = {
  size: 64,
  imageUrl: '',
  alt: '',
  shape: 'square',
} as const;

export function Avatar({ style, props }: AvatarProps) {
  const size = props?.size ?? AvatarPropsDefaults.size;
  const imageUrl = props?.imageUrl ?? AvatarPropsDefaults.imageUrl;
  const decorative = props?.decorative ?? false;
  const alt = decorative ? '' : props?.alt ?? AvatarPropsDefaults.alt;
  const shape = props?.shape ?? AvatarPropsDefaults.shape;

  const sectionStyle: CSSProperties = {
    textAlign: style?.textAlign ?? undefined,
    padding: getPadding(style?.padding),
  };
  return (
    <div style={sectionStyle}>
      <img
        alt={alt}
        role={decorative ? 'presentation' : undefined}
        src={imageUrl}
        height={size}
        width={size}
        // WS-03 (Outlook): suppress the link-border the Word engine draws around
        // linked images via the `border` HTML attribute (not just CSS).
        border={0}
        style={{
          outline: 'none',
          border: 'none',
          textDecoration: 'none',
          objectFit: 'cover',
          height: size,
          width: size,
          maxWidth: '100%',
          display: 'inline-block',
          verticalAlign: 'middle',
          textAlign: 'center',
          borderRadius: getBorderRadius(shape, size),
        }}
      />
    </div>
  );
}
