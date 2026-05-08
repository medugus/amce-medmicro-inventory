// Helper for per-route head metadata. Produces a meta array that overrides
// the root route's title/description (and OG/Twitter equivalents) so each
// page is independently shareable and indexable.

const SUFFIX = "AMCE Lab Inventory";

export function pageHead(title: string, description: string) {
  const fullTitle = `${title} — ${SUFFIX}`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
    ],
  };
}
