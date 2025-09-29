import type { Collections } from '@nuxt/content'
import type { RouteLocation } from 'vue-router'

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

const useOpenApi = (collectionName: keyof Collections = 'openapi', parentPath: string = 'api-reference') => {
  const openapi = useState<OpenApiProps | null>(collectionName, () => null)
  const server = useState<Record<string, unknown> | null>(`${collectionName}Server`, () => null)
  const schemas = useState<Record<string, SchemaProps>>(`${collectionName}Schemas`, () => ({}))
  const securitySchemes = useState<Record<string, SecurityProps>>(`${collectionName}SecuritySchemas`, () => ({}))
  const globalSecurity = useState<unknown[]>(`${collectionName}Security`, () => ([]))
  const paths = useState<FlatPathProps[]>(`${collectionName}OriginalPaths`, () => ([]))
  const apiNavData = computed<NavLink[]>(() => {
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
    const { data } = await useAsyncData(collectionName, async () => {
      return queryCollection(collectionName).all()
    })

    let doc

    if (collectionName === 'dashboardApi') {
      const targetPath = route.path.startsWith('/cn')
        ? 'cn/dashboard/api/api'
        : 'en/dashboard/api/api'
      doc = data.value?.find(item => item.stem === targetPath)
    } else {
      doc = data.value?.[0]
    }

    openapi.value = (doc as unknown as OpenApiProps) ?? null
    globalSecurity.value = (openapi.value?.meta.body.security?.[0] as unknown[]) ?? null
    server.value = (openapi.value?.meta.body.servers?.[0] as Record<string, unknown>) ?? null
    schemas.value = openapi.value?.components?.schemas ?? {}
    securitySchemes.value = openapi.value?.components?.securitySchemes ?? {}
    paths.value = flattenPaths(openapi.value?.paths ?? {}, parentPath, collectionName as unknown as CollectionName)
  }

  function getApiByRoute(route: RouteLocation): FlatPathProps | undefined | null {
    let normalizedPath = route.path.replace(/^\/cn/, '').replace(/\/$/, '') || '/'
    normalizedPath = normalizedPath.split('-').map(s => s.toLowerCase()).join('-')
    // Handle Schema
    const apiData = paths.value.find(path => path.routePath === normalizedPath)
    if (!apiData) return null

    const { requestBody, responses, ...rest } = apiData

    return {
      requestBody: resolveRequestSchema(requestBody),
      responses: resolveResponseSchema(responses),
      ...rest
    }
  }

  function getCurrentRouteIndex(route: RouteLocation): number {
    let normalizedPath = route.path.replace(/^\/cn/, '').replace(/\/$/, '') || '/'
    normalizedPath = normalizedPath.split('-').map(s => s.toLowerCase()).join('-')
    return paths.value.findIndex(path => path.routePath === normalizedPath)
  }

  function resolveSchemaRef(ref: string | undefined | null): unknown | null {
    if (!ref || !schemas.value) return null
    const key = ref.split('/').pop() as string | undefined
    if (!key) return null
    return (schemas.value[key] as unknown) || null
  }

  // 深度解析 schema 中任意位置的 $ref（包括 properties/items/anyOf/allOf/oneOf 等），并避免循环引用
  function deepResolveSchema(input: unknown, visited: Set<string> = new Set()): unknown {
    if (input == null) return input

    // 处理数组
    if (Array.isArray(input)) {
      return input.map(item => deepResolveSchema(item, visited))
    }

    // 处理对象
    if (typeof input === 'object') {
      const obj = input as Record<string, unknown>
      const maybeRef = (obj as { $ref?: unknown }).$ref
      if (typeof maybeRef === 'string') {
        const key = maybeRef.split('/').pop() || ''
        if (!key) return input
        const { $ref: _refIgnored, ...rest } = obj as Record<string, unknown>
        const resolvedRest = deepResolveSchema(rest, visited)

        if (visited.has(key)) {
          // 已解析过该 ref，避免死循环
          const already = resolveSchemaRef(maybeRef)
          if (already && typeof already === 'object' && resolvedRest && typeof resolvedRest === 'object') {
            return { ...(already as unknown as Record<string, unknown>), ...(resolvedRest as unknown as Record<string, unknown>) }
          }
          return already ?? input
        }

        visited.add(key)
        const target = resolveSchemaRef(maybeRef)
        const resolvedTarget = deepResolveSchema(target ?? input, visited)
        if (resolvedTarget && typeof resolvedTarget === 'object' && resolvedRest && typeof resolvedRest === 'object') {
          return { ...(resolvedTarget as unknown as Record<string, unknown>), ...(resolvedRest as unknown as Record<string, unknown>) }
        }
        return resolvedTarget
      }

      // 普通对象：递归解析所有字段
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(obj)) {
        out[k] = deepResolveSchema(v, visited)
      }
      return out
    }

    // 基础类型直接返回
    return input
  }

  // 通用方法：解析并替换 content 中的 schema.$ref
  function resolveContentSchemas(content?: ContentProps): ContentProps {
    if (!content) return {} as unknown as ContentProps
    const result: Record<string, unknown> = {}

    Object.entries(content).forEach(([contentType, value]) => {
      const rawSchema = value?.schema as { $ref?: string } | undefined
      if (rawSchema) {
        // 解析后直接返回找到的数据，不再包裹在 schema 属性下
        const resolvedDeep = deepResolveSchema(rawSchema)
        result[contentType] = resolvedDeep
      } else {
        // 若原本没有 schema，则保持为 undefined
        result[contentType] = undefined
      }
    })

    // 使用 unknown 再断言为 ContentProps，避免使用 any
    return result as unknown as ContentProps
  }

  function resolveRequestSchema(requestBody: RequestProps | undefined): RequestProps | undefined {
    if (!requestBody)
      return undefined

    const resolved: RequestProps = {
      ...requestBody,
      content: resolveContentSchemas(requestBody.content)
    } as unknown as RequestProps
    return resolved
  }

  function resolveResponseSchema(responses: Record<string, ResponseProps>): Record<string, ResponseProps> {
    const newResponses: Record<string, ResponseProps> = {}

    Object.entries(responses || {}).forEach(([statusCode, response]) => {
      const r = response as unknown as ResponseEnvelope
      const updated: ResponseEnvelope = {
        ...r,
        content: resolveContentSchemas(r?.content as ContentProps | undefined)
      }
      newResponses[statusCode] = updated as unknown as ResponseProps
    })

    return newResponses
  }

  // Extract schema from content
  function getContentSchema(content?: ContentProps) {
    const contentType = content ? Object.keys(content)[0] : undefined
    const value = contentType ? (content as unknown as Record<string, unknown>)[contentType] : undefined
    let schema: unknown | null = null
    if (value) {
      // 兼容两种形态：
      // 1) 旧结构：{ schema: {...} }
      // 2) 新结构：直接是 schema 对象
      const maybeSchema = (value as Record<string, unknown>)?.schema as unknown
      if (maybeSchema) {
        schema = deepResolveSchema(maybeSchema)
      } else {
        schema = deepResolveSchema(value)
      }
    }
    return { contentType, schema }
  }

  return {
    openapi,
    schemas,
    server,
    securitySchemes,
    globalSecurity,
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
