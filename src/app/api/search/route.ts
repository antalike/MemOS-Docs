import { cnSource, enSource } from '@/lib/source';
import { createSearchAPI } from 'fumadocs-core/search/server';

export const revalidate = false;

// Static search index covering both locale trees. `tag` carries the locale so
// the client can scope results per language. Chinese tokenization can be
// refined in Phase 5.
export const { staticGET: GET } = createSearchAPI('advanced', {
  indexes: [
    ...enSource.getPages().map((page) => ({ locale: 'en', page })),
    ...cnSource.getPages().map((page) => ({ locale: 'cn', page })),
  ].map(({ locale, page }) => ({
    id: page.url,
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    tag: locale,
    structuredData: page.data.structuredData,
  })),
});
