import { z } from 'zod';

import { COLOR_SCHEMA, FONT_FAMILY_SCHEMA } from '@usewaypoint/block-kit';

export const EmailLayoutPropsSchema = z.object({
  backdropColor: COLOR_SCHEMA,
  borderColor: COLOR_SCHEMA,
  borderRadius: z.number().optional().nullable(),
  canvasColor: COLOR_SCHEMA,
  textColor: COLOR_SCHEMA,
  fontFamily: FONT_FAMILY_SCHEMA,
  childrenIds: z.array(z.string()).optional().nullable(),
});

export type EmailLayoutProps = z.infer<typeof EmailLayoutPropsSchema>;
