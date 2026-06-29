import React from 'react';

import { Text, TextProps } from '@usewaypoint/block-text';

import { useCurrentBlockId } from '../../editor/EditorBlock';
import { setDocument } from '../../editor/EditorContext';

import InlineEditable from './block-wrappers/InlineEditable';

/**
 * WS-06 item 11 — inline-editable Text block for the editor canvas.
 *
 * Markdown caveat: when `props.markdown` is on, the rendered output is parsed
 * markdown, so editing the rendered text in place would be lossy. For v1 we
 * disable inline editing in markdown mode and keep those edits in the sidebar.
 */
export default function EditableText(props: TextProps) {
  const blockId = useCurrentBlockId();
  const markdown = props.props?.markdown ?? false;

  return (
    <InlineEditable
      enabled={!markdown}
      onChange={(nextText) =>
        setDocument({
          [blockId]: { type: 'Text', data: { ...props, props: { ...props.props, text: nextText } } },
        })
      }
    >
      <Text {...props} />
    </InlineEditable>
  );
}
