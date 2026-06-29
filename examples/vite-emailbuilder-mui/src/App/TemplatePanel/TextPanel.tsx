import React, { useMemo } from 'react';

import { renderToText } from '@usewaypoint/email-builder';

import { useDocument } from '../../documents/editor/EditorContext';

export default function TextPanel() {
  const document = useDocument();
  const text = useMemo(() => renderToText(document, { rootBlockId: 'root' }), [document]);
  return (
    <pre
      style={{ margin: 0, padding: 16, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      onClick={(ev) => {
        const s = window.getSelection();
        if (s === null) {
          return;
        }
        s.selectAllChildren(ev.currentTarget);
      }}
    >
      {text}
    </pre>
  );
}
