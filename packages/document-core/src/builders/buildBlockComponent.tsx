import React from 'react';

import { BaseZodDictionary, BlockConfiguration, DocumentBlocksDictionary } from '../utils';

/**
 * @param blocks Main DocumentBlocksDictionary
 * @returns React component that can render a BlockConfiguration that is compatible with blocks
 */
export default function buildBlockComponent<T extends BaseZodDictionary>(blocks: DocumentBlocksDictionary<T>) {
  return function BlockComponent({ type, data }: BlockConfiguration<T>) {
    const block = blocks[type];
    if (!block) {
      // Defensive: a document may reference a block type that isn't registered in
      // this dictionary (e.g. a newer/older schema version, or hand-edited JSON).
      // Render nothing instead of crashing the whole document.
      // eslint-disable-next-line no-console
      console.warn(`Unknown block type "${String(type)}" — skipping.`);
      return null;
    }
    const Component = block.Component;
    return <Component {...data} />;
  };
}
