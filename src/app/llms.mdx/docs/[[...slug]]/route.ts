import {
  getAllPages,
  getLLMText,
  getPageMarkdownUrl,
  getSource,
  type Locale,
} from '@/lib/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  if (!slug || slug.length === 0) notFound();
  // slug = [locale, ...pageSlugs, 'content.md']
  const locale = slug[0] as Locale;
  const page = getSource(locale).getPage(slug.slice(1, -1));
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export function generateStaticParams() {
  return getAllPages().map(({ locale, page }) => ({
    slug: getPageMarkdownUrl(locale, page).segments,
  }));
}
