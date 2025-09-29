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

export interface SecurityProps {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  name: string
  in?: 'query' | 'header' | 'cookie'
  description?: string
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
export function flattenPaths(
  paths: Record<string, PathsProps>,
  parentPath?: string,
  collectionName?: keyof Collections
) {
  const results: FlatPathProps[] = []

  Object.entries(paths).forEach(([apiUrl, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const path = collectionName === 'openapi' ? operation.summary : operation.operationId
      const separator = collectionName === 'openapi' ? ' ' : '_'
      const routePath = path.split(separator).map(s => s.toLowerCase()).join('-')

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

type LangType = 'curl' | 'python-sdk' | 'python-http'

export function generateSnippet(openapi: OpenApiProps, apiData: FlatPathProps, lang: LangType) {
  if (lang === 'curl') return generateCurlSnippet(openapi, apiData)
  if (lang === 'python-http') return generatePythonHttpSnippet(openapi, apiData)
  if (lang === 'python-sdk') return generatePythonSdkSnippet(openapi, apiData)
  return lang
}

function getContentInfo(content: Record<string, unknown> | undefined) {
  const contentType = content ? Object.keys(content)[0] : undefined
  const data = contentType ? content?.[contentType] : undefined
  return { contentType, data }
}

function getAuth(security, schemas) {
  return Object.keys(security).map(key => schemas[key])
}

function getValue(prop) {
  if (prop.type === 'string') return '"<string>"'
  if (prop.type === 'array') return '[]'
  if (prop.type === 'integer') return prop.default ?? '"<integer>"'
  if (prop.type === 'number') return '"<number>"'
  return 'undefined'
}

function generateCurlSnippet(openapi: OpenApiProps, apiData: FlatPathProps) {
  const method = (apiData?.method || 'get').toUpperCase()
  const baseUrl = openapi.meta.body.servers?.[0]?.url ?? ''
  const { contentType, data } = getContentInfo(apiData?.requestBody?.content)
  const auth = getAuth(openapi.meta.body.security?.[0], openapi.components?.securitySchemes)

  // cURL
  const curlLines: string[] = []
  curlLines.push(`curl -request ${method}`)
  curlLines.push(`  --url ${baseUrl}${apiData.apiUrl}`)

  if (auth) {
    auth.forEach(s => {
      if (s.type === 'apiKey') {
        if (s.in === 'header') {
          curlLines.push(`  --header '${s.name}: Token YOUR_API_KEY'`)
        }
      }
    })
  }
  if (contentType) {
    curlLines.push(`  --header 'Content-Type: ${contentType}'`)
  }
  if (data) {
    const dataLines = []
    dataLines.push(`  --data '{`)
    Object.entries(data.properties).forEach(([key, prop]) => {
      dataLines.push(`    "${key}": ${getValue(prop)}`)
    })
    dataLines.push(`  '}`)
    curlLines.push(dataLines.join('\n'))
  }
  return curlLines.join(' \\\n')
}

function generatePythonHttpSnippet(openapi: OpenApiProps, apiData: FlatPathProps) {
  const baseUrl = openapi.meta.body.servers?.[0]?.url ?? ''
  const auth = getAuth(openapi.meta.body.security?.[0], openapi.components?.securitySchemes)
  const { contentType, data } = getContentInfo(apiData?.requestBody?.content)

  const pyLines: string[] = []
  pyLines.push('import os')
  pyLines.push('import requests')
  pyLines.push('import json')
  pyLines.push('')
  if (auth) {
    pyLines.push(`os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"`)
  }
  pyLines.push(`os.environ["MEMOS_BASE_URL"] = "${baseUrl}${apiData.apiUrl}"`)
  pyLines.push('')
  // data
  if (data) {
    pyLines.push('data = {')
    Object.entries(data.properties).forEach(([key, prop]) => {
      pyLines.push(`    "${key}": ${getValue(prop)}`)
    })
    pyLines.push('}')
  }
  // header
  pyLines.push('headers = {')
  if (contentType) {
    pyLines.push(`  "Content-Type": "${contentType}"`)
  }
  if (auth) {
    auth.forEach(s => {
      if (s.type === 'apiKey') {
        if (s.in === 'header') {
          pyLines.push(`  "${s.name}": f"Token {os.environ['MEMOS_API_KEY']}"`)
        }
      }
    })
  }
  pyLines.push('}')
  pyLines.push('')
  pyLines.push(`url = f"{os.environ['MEMOS_BASE_URL']}${apiData.apiUrl}"`)
  pyLines.push('requests.post(url=url, headers=headers, data=json.dumps(data))')
  return pyLines.join('\n')
}

function generatePythonSdkSnippet(openapi: OpenApiProps, apiData: FlatPathProps) {
  const { data } = getContentInfo(apiData?.requestBody?.content)

  const pyLines: string[] = []
  pyLines.push('from memos.api.client import MemOSClient')
  pyLines.push('')
  pyLines.push('client = MemOSClient(api_key=YOUR_API_KEY)')
  pyLines.push('')
  // data
  if (data) {
    Object.entries(data.properties).forEach(([key, prop]) => {
      pyLines.push(`${key} = ${getValue(prop)}`)
    })
  }
  pyLines.push('')
  pyLines.push('client.add_message(messages=messages, user_id=user_id, conversation_id=conversation_id)')
  return pyLines.join('\n')
}
