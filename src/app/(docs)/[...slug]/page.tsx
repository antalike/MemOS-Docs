import type { Metadata } from 'next';
import {
  DocPageContent,
  docPageMetadata,
  docStaticParams,
} from '@/lib/doc-page';

type Params = { slug: string[] };

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  return <DocPageContent locale="en" slug={slug} />;
}

export function generateStaticParams() {
  return docStaticParams('en');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return docPageMetadata({ locale: 'en', slug });
}
