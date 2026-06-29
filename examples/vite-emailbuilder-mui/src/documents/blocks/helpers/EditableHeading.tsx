import React from 'react';

import { Heading, HeadingProps } from '@usewaypoint/block-heading';

import { useCurrentBlockId } from '../../editor/EditorBlock';
import { setDocument } from '../../editor/EditorContext';

import InlineEditable from './block-wrappers/InlineEditable';

/**
 * WS-06 item 11 — inline-editable Heading block for the editor canvas.
 * Heading is always plain text, so inline editing is always enabled.
 */
export default function EditableHeading(props: HeadingProps) {
  const blockId = useCurrentBlockId();

  return (
    <InlineEditable
      enabled
      onChange={(nextText) =>
        setDocument({
          [blockId]: { type: 'Heading', data: { ...props, props: { ...props.props, text: nextText } } },
        })
      }
    >
      <Heading {...props} />
    </InlineEditable>
  );
}
