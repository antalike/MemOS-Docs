type MethodType = 'post' | 'get' | 'delete' | 'put'

// Parameter information
interface ParametersProp {
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
interface ResponseProps {
  [key: string]: {
    description: string
    content: ContentProps
  }
}

// OpenAPI path information
interface PathProps {
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

// Resolve schema $ref
export function resolveSchemaRef(
  ref: string | undefined | null,
  schemas: Record<string, unknown> | undefined | null
): Record<string, unknown> | null {
  if (!ref || !schemas) return null
  const key = ref.split('/').pop() as string | undefined
  if (!key) return null
  return (schemas[key] as Record<string, unknown>) || null
}

// Flatten OpenAPI paths
export function flattenPaths(paths: Record<string, PathsProps>, parentPath?: string) {
  const results: FlatPathProps[] = []

  Object.entries(paths).forEach(([apiUrl, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const routePath = operation.operationId.split('_').map(s => s.toLowerCase()).join('-')

      results.push({
        apiUrl,
        method: method as MethodType,
        routePath: `/${parentPath}/${routePath}`,
        ...operation
      })
    })
  })

  return results
}
