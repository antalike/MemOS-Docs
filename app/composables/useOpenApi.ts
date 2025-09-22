import type { PathsProps, FlatPathProps } from '@/utils/openapi'
import type { Collections } from '@nuxt/content'
import type { RouteLocation } from 'vue-router'

interface OpenApiProps {
  components?: {
    schemas?: Record<string, SchemaProps>
  }
  paths?: Record<string, PathsProps>
}

type NavLink = {
  title: string
  path?: string
  method?: 'get' | 'post' | 'put' | 'delete'
  children?: NavLink[]
}

function prettifyGroupTitle(key: string) {
  const base = key.replace(/^\//, '')
  if (!base) return '/'
  return base
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const useOpenApi = (apiName: keyof Collections = 'openapi', parentPath: string = 'api-reference') => {
  const openapi = useState<OpenApiProps | null>(apiName, () => null)
  const schemas = useState<Record<string, SchemaProps>>(`${apiName}Schemas`, () => ({}))
  const paths = useState<FlatPathProps[]>(`${apiName}Paths`, () => ([]))
  const apiNavData = computed(() => {
    // Group by first-level segment of apiUrl
    const groupMap = new Map<string, FlatPathProps[]>()
    paths.value.forEach((item: FlatPathProps) => {
      const firstSegment = item.apiUrl.split('/').filter(Boolean)[0] ?? ''
      const groupKey = firstSegment ? `/${firstSegment}` : '/'

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, [])
      }
      groupMap.get(groupKey)!.push(item)
    })

    const items: NavLink[] = []
    const singleItems: NavLink[] = []

    groupMap.forEach((groupItems, groupKey) => {
      if (groupItems.length === 1) {
        const item = groupItems[0]
        if (item) {
          singleItems.push({
            title: item.summary,
            path: item.routePath,
            method: item.method
          })
        }
      } else {
        const groupTitle = prettifyGroupTitle(groupKey)
        items.push({
          title: groupTitle,
          children: groupItems
            .map(p => ({
              title: p.summary,
              path: p.routePath,
              method: p.method
            }))
        })
      }
    })

    return singleItems.concat(items)
  })
  const route = useRoute()

  // Fetch OpenAPI data
  async function getOpenApi() {
    const { data } = await useAsyncData(apiName, async () => {
      return queryCollection(apiName).all()
    })

    let doc

    if (apiName === 'dashboardApi') {
      const targetPath = route.path.startsWith('/cn')
        ? 'cn/dashboard/api/api'
        : 'en/dashboard/api/api'
      doc = data.value?.find(item => item.stem === targetPath)
    } else {
      doc = data.value?.[0]
    }

    openapi.value = doc ?? null
    schemas.value = openapi.value?.components?.schemas ?? {}
    paths.value = flattenPaths(openapi.value?.paths ?? {}, parentPath)
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
    apiNavData,
    getOpenApi,
    getApiByRoute,
    getCurrentRouteIndex,
    resolveSchemaRef,
    getContentSchema
  }
}

export { useOpenApi }
