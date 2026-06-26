import { nanoid } from 'nanoid';

/**
 * Generates a collision-resistant, URL-safe block id.
 *
 * The previous implementation used `block-${Date.now()}`, which collides when
 * two blocks are created within the same millisecond (duplicate bursts, paste,
 * tight loops). `nanoid` gives us a short, URL-safe, collision-resistant suffix
 * so share-URLs stay sane while ids stay unique.
 *
 * This is the single source of truth for block-id generation — every insert /
 * clone / paste path must funnel through here.
 */
export default function generateId(): string {
  return `block-${nanoid(12)}`;
}
