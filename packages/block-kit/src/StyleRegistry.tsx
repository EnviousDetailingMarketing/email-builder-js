import React, { createContext, useContext } from 'react';

//
// Style Registry — the mechanism by which block components emit CSS that cannot
// live in an inline `style` attribute: `@media` (responsive), `prefers-color-
// scheme` (dark mode), and `:hover`/pseudo rules.
//
// A block calls `useStyleRegistry()` during render and registers CSS; the
// top-level renderer (`renderToStaticMarkup`) collects every rule and injects a
// single deduped, deterministically-ordered `<style>` into the document
// `<head>`. The downstream responsive / dark-mode / client-compat workstreams
// all build on this — treat the public `StyleRegistry` shape as a FROZEN
// contract. Add capabilities; do not break what is here.
//

/**
 * Public registry API consumed by block components. Frozen.
 */
export interface StyleRegistry {
  /**
   * Register a complete, raw CSS string appended verbatim to the head <style>.
   * Deduped by `key` (first write wins): registering the same key twice keeps a
   * single copy, so N instances of the same block contribute exactly one rule.
   * Rules are emitted in deterministic, key-sorted order for stable snapshots.
   */
  addRule(key: string, css: string): void;
  /**
   * Convenience over `addRule` for the common "one class, three variants" case.
   * Each provided variant becomes its own deduped, self-contained rule:
   *   base   -> `.className { … }`
   *   mobile -> `@media (max-width:600px) { .className { … } }`
   *   dark   -> `@media (prefers-color-scheme: dark) { .className { … } }`
   * Reuse the same `className` across blocks that share a setting (e.g. every
   * column that stacks on mobile) so the stylesheet stays small — one shared
   * class instead of one class per block instance.
   */
  addClass(className: string, opts: { base?: string; mobile?: string; dark?: string }): void;
}

/**
 * A {@link StyleRegistry} that can also render everything it collected. The
 * renderer creates one of these via {@link createStyleRegistry}; block
 * components only ever see the narrower {@link StyleRegistry}.
 */
export interface CollectingStyleRegistry extends StyleRegistry {
  /** All registered rules as a single deterministic, key-sorted CSS string. */
  renderCss(): string;
  /** Count of unique rules registered (diagnostics / tests). */
  readonly size: number;
}

const MOBILE_MEDIA = '@media (max-width:600px)';
const DARK_MEDIA = '@media (prefers-color-scheme: dark)';

/**
 * Create a fresh collecting registry for a single render pass.
 */
export function createStyleRegistry(): CollectingStyleRegistry {
  const rules = new Map<string, string>();
  const addRule = (key: string, css: string): void => {
    // First write wins — repeated registrations of the same key are no-ops, so
    // identical blocks dedup to one rule.
    if (!rules.has(key)) {
      rules.set(key, css);
    }
  };
  return {
    addRule,
    addClass(className, opts) {
      if (opts.base !== undefined) {
        addRule(`${className}::base`, `.${className}{${opts.base}}`);
      }
      if (opts.mobile !== undefined) {
        addRule(`${className}::mobile`, `${MOBILE_MEDIA}{.${className}{${opts.mobile}}}`);
      }
      if (opts.dark !== undefined) {
        addRule(`${className}::dark`, `${DARK_MEDIA}{.${className}{${opts.dark}}}`);
      }
    },
    renderCss() {
      return Array.from(rules.keys())
        .sort()
        .map((key) => rules.get(key))
        .join('');
    },
    get size() {
      return rules.size;
    },
  };
}

// Used as the context default so blocks rendered outside a provider (e.g. the
// live <Reader/> in the editor preview) can call addRule/addClass without
// crashing or branching. Registrations simply go nowhere.
const NOOP_REGISTRY: StyleRegistry = {
  addRule() {},
  addClass() {},
};

const StyleRegistryContext = createContext<StyleRegistry>(NOOP_REGISTRY);

export function StyleRegistryProvider({
  registry,
  children,
}: {
  registry: StyleRegistry;
  children: React.ReactNode;
}) {
  return <StyleRegistryContext.Provider value={registry}>{children}</StyleRegistryContext.Provider>;
}

/**
 * Hook for block components. Outside a {@link StyleRegistryProvider} this
 * returns a no-op registry, so blocks may call addClass/addRule unconditionally.
 */
export function useStyleRegistry(): StyleRegistry {
  return useContext(StyleRegistryContext);
}
