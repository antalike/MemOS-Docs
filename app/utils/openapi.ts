import type { Collections } from '@nuxt/content'

export type MethodType = 'post' | 'get' | 'delete' | 'put'

// Parameter information
export interface ParametersProp {
  name: string
  in: 'path' | 'query'
  required: boolean
  schema: Record<string, string>
}

export interface PropertyProps {
  type?: string
  anyOf?: { type: string }[]
  title: string
  description: string
  example?: string
  default?: string
  properties? : Record<string, unknown>
}

export interface SchemaProps {
  properties: Record<string, PropertyProps>
  required?: string[]
  title: string
  type: string
}

export interface ContentProps {
  [contentType: string]: {
    schema?: {
      $ref?: string
    }
  }
}

// Request body information
export interface RequestProps {
  required: boolean
  content: ContentProps
}

// Response information
export interface ResponseProps {
  [key: string]: {
    description: string
    content: ContentProps
  }
}

// OpenAPI path information
export interface PathProps {
  description: string
  operationId: string
  parameters?: ParametersProp[]
  requestBody?: RequestProps
  responses: Record<string, ResponseProps>
  summary: string
}

export interface PathsProps {
  [key: string]: PathProps
}

// Flattened path
export interface FlatPathProps extends PathProps {
  method: MethodType
  apiUrl: string
  routePath: string
}

export type NavLink = {
  title: string
  path?: string
  method?: 'get' | 'post' | 'put' | 'delete'
  children?: NavLink[]
}

// Response component types
export interface ArrayItemType {
  $ref?: string
  anyOf?: VariantDescriptor[]
  oneOf?: VariantDescriptor[]
  type?: string
  title?: string
  description?: string
  properties?: Record<string, SchemaItem>
  required?: string[]
  enum?: unknown[]
  items?: ArrayItemType
  default?: unknown
  [key: string]: unknown
}

export type VariantDescriptor = {
  type?: string
  title?: string
  $ref?: string
  [key: string]: unknown
}

export interface SchemaItem {
  type?: string
  title?: string
  description?: string
  default?: unknown
  example?: unknown
  items?: ArrayItemType
  $ref?: string
  [key: string]: unknown
}

export interface ResponseSchema {
  description?: string
  required?: string[]
  properties?: Record<string, SchemaItem>
}

export interface FlatResponse {
  statusCode: string
  description?: string
  contentType?: string
  data?: ResponseSchema
}

export type CollectionName = keyof Collections

export interface OpenApiProps {
  components?: {
    schemas?: Record<string, SchemaProps>
    securitySchemes?: Record<string, SecurityProps>
  }
  paths?: Record<string, PathsProps>
  meta: {
    body: {
      security: any[]
      servers: any[]
    }
  }
}

export type ResponseEnvelope = {
  description?: string
  content?: ContentProps
}

// Flatten OpenAPI paths
export interface OasRoutePath {
  path: string
  method: HttpMethods
  routePath: string
  [key: string]: unknown
}

export interface OasRequestBody {
  contentType?: string
  body: MediaTypeObject | null
}

export function flattenOasPaths(
  oas: SimpleOAS,
  parentPath?: string,
  collectionName?: keyof Collections
): OasRoutePath[] {
  const paths = oas.getPaths()
  const results: OasRoutePath[] = []

  Object.entries(paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const separator = collectionName === 'openapi' ? ' ' : '_'
      let routePath = collectionName === 'openapi' ? operation.summary : operation.operationId

      routePath = routePath.split(separator).map(s => s.toLowerCase()).join('-')
      results.push({
        path,
        method,
        routePath: `/${parentPath}/${routePath}`,
        ...operation
      })
    })
  })

  return results
}
