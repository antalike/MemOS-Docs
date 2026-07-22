import type { OperationItem } from 'fumadocs-openapi';
import openapiSpec from '../../openapi/opensource.json';

export interface ApiRefNavNode {
  title: string;
  link?: string;
  children?: ApiRefNavNode[];
}

// A single API operation resolved directly from the OpenAPI spec. The
// `api-reference` pages are rendered straight from this (no generated MDX):
// the spec (`openapi/opensource.json`) is the single source of truth.
export interface ApiOperation {
  slug: string;
  title: string;
  path: string;
  method: OperationItem['method'];
  description?: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;

function isHttpMethod(method: string): method is OperationItem['method'] {
  return (HTTP_METHODS as readonly string[]).includes(method);
}

function kebab(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((s) => s.toLowerCase())
    .join('-')
    .replace(/[^a-z0-9-]/g, '');
}

interface RawOp {
  summary?: string;
  operationId?: string;
  description?: string;
}

// All operations in spec declaration order (Search memories, Add memories, ...),
// so the sidebar and generated routes match the source OpenAPI document.
export function getApiOperations(): ApiOperation[] {
  const ops: ApiOperation[] = [];
  const paths =
    (openapiSpec as { paths?: Record<string, Record<string, RawOp>> }).paths ??
    {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!isHttpMethod(method)) continue;
      const title = op.summary || op.operationId || path;
      ops.push({
        slug: kebab(title),
        title,
        path,
        method,
        description: op.description,
      });
    }
  }
  return ops;
}

export function getApiOperation(slug: string): ApiOperation | undefined {
  return getApiOperations().find((op) => op.slug === slug);
}

// Builds the "API Reference" sidebar subtree as a single flat operation list,
// in spec order, mirroring the original standalone API docs (all endpoints
// under one "Product" group). Each entry links to the `/api-reference/<slug>`
// page rendered from the spec.
export function buildApiReferenceNav(baseLink: string): ApiRefNavNode[] {
  return getApiOperations().map(
    (op): ApiRefNavNode => ({ title: op.title, link: `${baseLink}/${op.slug}` }),
  );
}
