import type { InternalScreenKey } from '../../contracts/admin-contracts';

export interface GeniusTarget {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly hint: string;
  readonly to: string;
  readonly screenKey?: InternalScreenKey;
  readonly sectionId?: string;
  readonly external?: boolean;
  readonly keywords?: readonly string[];
  readonly source?: 'navigation' | 'settings';
}

export interface GeniusArticleLike {
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly summary?: string | null;
  readonly category_name?: string | null;
}

export interface GeniusContextSuggestions {
  readonly title: string;
  readonly ids: readonly string[];
}

export const GENIUS_NAVIGATION_TARGETS: readonly GeniusTarget[];
export const GENIUS_SETTINGS_TARGETS: readonly GeniusTarget[];

export function resolveContextSuggestions(pathname: string): GeniusContextSuggestions;
export function normalizeSearchText(value: unknown): string;
export function rankGeniusTargets(
  query: string,
  options?: { isTargetAvailable?: (target: GeniusTarget) => boolean; limit?: number },
): GeniusTarget[];
export function rankGeniusArticles<T extends GeniusArticleLike>(
  query: string,
  articles: readonly T[] | null | undefined,
  options?: { limit?: number },
): T[];
