import { api } from '../lib/api';
import type { BadgeDefinition } from '@mathmagic/types';

/** Shown when a badge's own SVG file is missing from /images/badges/. */
export const BADGE_FALLBACK_ICON = '/images/badges/_fallback.svg';

let cached: BadgeDefinition[] | null = null;
let inFlight: Promise<BadgeDefinition[]> | null = null;

/**
 * Fetches the static badge catalogue. Definitions never change at runtime, so
 * the result is cached for the lifetime of the page and concurrent callers
 * share a single request.
 */
export async function fetchBadgeDefinitions(): Promise<BadgeDefinition[]> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = api
    .get<{ badges: BadgeDefinition[] }>('/badges')
    .then((res) => {
      cached = res.badges;
      return cached;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Synchronous peek at the cache — lets consumers render loaded data on their first frame. */
export function getCachedBadgeDefinitions(): BadgeDefinition[] | null {
  return cached;
}
