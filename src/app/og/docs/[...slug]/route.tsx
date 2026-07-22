import {
  getAllPages,
  getPageImage,
  getSource,
  type Locale,
} from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';
import { appName } from '@/lib/shared';

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  // slug = [locale, ...pageSlugs, 'image.png']
  const locale = slug[0] as Locale;
  const page = getSource(locale).getPage(slug.slice(1, -1));
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site={appName}
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return getAllPages().map(({ locale, page }) => ({
    slug: getPageImage(locale, page).segments,
  }));
}
