import type { ReactNode } from 'react';
import type { OperationItem, WebhookItem } from 'fumadocs-openapi';
import { openapi } from '@/lib/openapi';
import {
  ClientOpenAPIPage,
  ClientOpenAPIPageCurated,
} from '@/components/api-page';

interface OpenAPIPageProps {
  /** Schema ID registered in `createOpenAPI` (e.g. "opensource", "dashboard-en"). */
  document: string;
  operations?: OperationItem[];
  webhooks?: WebhookItem[];
  showTitle?: boolean;
  showDescription?: boolean;
}

// Server component bridging the generated `<APIPage document="..." />` markup
// (and our inline dashboard pages) to the client renderer. It resolves the
// bundled OpenAPI document on the server and hands it to the client component,
// keeping everything static-export friendly (no runtime schema fetching).
export async function OpenAPIPage({
  document,
  // The page title is rendered by the docs layout (`DocsTitle`), so suppress
  // the operation heading by default to avoid duplication.
  showTitle = false,
  ...rest
}: OpenAPIPageProps): Promise<ReactNode> {
  const schema = await openapi.getSchema(document);
  // Dashboard specs carry curated `x-codeSamples`; render only those (no
  // auto-generated language tabs). The open-source spec relies on the default
  // generators instead.
  const PageComponent = document.startsWith('dashboard')
    ? ClientOpenAPIPageCurated
    : ClientOpenAPIPage;
  return (
    <PageComponent
      payload={{ bundled: schema.bundled }}
      showTitle={showTitle}
      {...rest}
    />
  );
}
