import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { OpenAPIPage } from '@/components/api';
import { getApiOperation, getApiOperations } from '@/lib/api-reference-nav';

type Params = { slug: string[] };

// The API Reference is rendered straight from the OpenAPI spec
// (`openapi/opensource.json`) — there are no per-operation MDX files. Each slug
// maps to one operation, which `<OpenAPIPage>` renders from the bundled spec.
export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const op = getApiOperation(slug.join('/'));
  if (!op) notFound();

  return (
    <DocsPage full>
      <DocsTitle>{op.title}</DocsTitle>
      {op.description ? (
        <DocsDescription className="mb-0">{op.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <OpenAPIPage
          document="opensource"
          operations={[{ path: op.path, method: op.method }]}
          showTitle={false}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return getApiOperations().map((op) => ({ slug: [op.slug] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const op = getApiOperation(slug.join('/'));
  if (!op) return {};

  return {
    title: op.title,
    description: op.description,
  };
}
