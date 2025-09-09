import type { PathsProps, FlatPathProps } from '@/utils/openapi'
import type { RouteLocation } from 'vue-router'

interface OpenApiProps {
  components?: {
    schemas?: Record<string, SchemaProps>
  }
  paths?: Record<string, PathsProps>
}

const useOpenApi = () => {
  const openapi = useState<OpenApiProps | null>('openapi', () => null)
  const schemas = useState<Record<string, SchemaProps>>('openapiSchemas', () => ({}))
  const paths = useState<FlatPathProps[]>('openapiPaths', () => ([]))

  // Fetch OpenAPI data
  async function getOpenApi() {
    const { data } = await useAsyncData('openapi', async () => {
      return queryCollection('openapi').first()
    })

    const doc = data.value as unknown as OpenApiProps | null | undefined
    openapi.value = doc ?? null
    schemas.value = openapi.value?.components?.schemas ?? {}
    paths.value = flattenPaths(openapi.value?.paths ?? {})
  }

  function getApiByRoute(route: RouteLocation) {
    let normalizedPath = route.path.replace(/^\/cn/, '').replace(/\/$/, '') || '/'
    normalizedPath = normalizedPath.split('-').map(s => s.toLowerCase()).join('-')
    return paths.value.find(path => path.routePath === normalizedPath)
  }

  function getCurrentRouteIndex(route: RouteLocation): number {
    let normalizedPath = route.path.replace(/^\/cn/, '').replace(/\/$/, '') || '/'
    normalizedPath = normalizedPath.split('-').map(s => s.toLowerCase()).join('-')
    return paths.value.findIndex(path => path.routePath === normalizedPath)
  }

  function resolveSchemaRef(ref: string | undefined | null) {
    if (!ref || !schemas.value) return null
    const key = ref.split('/').pop() as string | undefined
    if (!key) return null
    return schemas.value[key] || null
  }

  // Extract schema from content
  function getContentSchema(content?: ContentProps) {
    const contentType = content ? Object.keys(content)[0] : undefined
    const rawSchema = contentType ? content?.[contentType]?.schema : undefined
    let schema: Record<string, unknown> | null = null
    if (rawSchema) {
      if ('$ref' in rawSchema && rawSchema.$ref) {
        schema = resolveSchemaRef(rawSchema.$ref, schemas.value)
      } else {
        schema = rawSchema
      }
    }
    return { contentType, schema }
  }

  return {
    openapi,
    schemas,
    paths,
    getOpenApi,
    getApiByRoute,
    getCurrentRouteIndex,
    resolveSchemaRef,
    getContentSchema
  }
}

export { useOpenApi }
