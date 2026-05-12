// Item URL slug helpers. We standardise on kebab-case URLs (`/item/demon-armor`)
// instead of the legacy URL-encoded space form (`/item/demon%20armor`). The
// API still keys items by their space-separated name ("demon armor"), so we
// need bidirectional mapping between the two.
//
// For items in POPULAR_ITEMS, the mapping is exact (we round-trip through a
// lookup table built at module load). For ad-hoc items reached via search,
// we fall back to mechanical conversion — apostrophes and other punctuation
// are lost, which is fine because those items aren't prerendered and aren't
// indexed.

import { POPULAR_ITEMS } from '@/src/data/popularItems';

function mechanicalNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mechanicalSlugToName(slug: string): string {
  // Best-effort reverse: spaces back, lowercased. Apostrophes/punctuation
  // can't be recovered without a lookup.
  return slug.replace(/-/g, ' ');
}

const NAME_TO_SLUG: Record<string, string> = {};
const SLUG_TO_NAME: Record<string, string> = {};
for (const name of POPULAR_ITEMS) {
  const slug = mechanicalNameToSlug(name);
  NAME_TO_SLUG[name] = slug;
  SLUG_TO_NAME[slug] = name;
}

// Converts an API item name ("demon armor") into the kebab-case URL slug
// used in public URLs ("demon-armor"). Falls back to mechanical conversion
// for items not in POPULAR_ITEMS.
export function nameToSlug(name: string): string {
  return NAME_TO_SLUG[name] ?? mechanicalNameToSlug(name);
}

// Converts a kebab-case URL slug back to the API item name. For popular
// items we round-trip exactly via lookup; for others we replace dashes with
// spaces (lossy for apostrophes, acceptable for non-prerendered routes).
export function slugToName(slug: string): string {
  return SLUG_TO_NAME[slug] ?? mechanicalSlugToName(slug);
}

// Accepts either a slug ("demon-armor") or a legacy API name ("demon armor")
// and returns the canonical slug. Useful in code paths that receive a route
// segment from `usePathname()` (decoded by expo-router) which could be in
// either form depending on whether the visitor came via a new or legacy URL.
export function normalizeToSlug(input: string): string {
  if (/\s|[A-Z]/.test(input)) return nameToSlug(input);
  return input;
}

// The inverse — accepts either form and returns the API item name. Used
// when feeding the route param into market data fetches and SEO metadata
// lookups.
export function normalizeToName(input: string): string {
  if (/\s|[A-Z]/.test(input)) return input.toLowerCase();
  return slugToName(input);
}
