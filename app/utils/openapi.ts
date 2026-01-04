import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject

export type HttpMethods = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options' | 'trace'
export type MethodType = 'post' | 'get' | 'delete' | 'put'

export type OASDocument = OpenAPIV3_1.Document | OpenAPIV3.Document
export type OperationObject = OpenAPIV3_1.OperationObject | OpenAPIV3.OperationObject
export type ParameterObject = OpenAPIV3_1.ParameterObject | OpenAPIV3.ParameterObject
export type RequestBodyObject = OpenAPIV3_1.RequestBodyObject | OpenAPIV3.RequestBodyObject
export type ResponseObject = OpenAPIV3_1.ResponseObject | OpenAPIV3.ResponseObject
export type SecurityRequirementObject = OpenAPIV3_1.SecurityRequirementObject | OpenAPIV3.SecurityRequirementObject
export type SecuritySchemeObject = OpenAPIV3_1.SecuritySchemeObject | OpenAPIV3.SecuritySchemeObject
export type MediaTypeObject = OpenAPIV3_1.MediaTypeObject | OpenAPIV3.MediaTypeObject
export type ServerObject = OpenAPIV3_1.ServerObject | OpenAPIV3.ServerObject
export type ServerVariableObject = OpenAPIV3_1.ServerVariableObject | OpenAPIV3.ServerVariableObject

/**
 * Code generation language options
 */
export type LangType = 'curl' | 'python-sdk' | 'python-http'

/**
 * Server variable definition
 */
export type ServerVariable = Record<
  string,
  { default?: number | string }[] | Record<string, never> | number | string | { default?: number | string }
>

/**
 * Security requirement properties with scheme details
 */
export interface SecurityProps {
  name: string
  type: string
  scheme?: SecuritySchemeObject
  requirements: string[]
}

/**
 * Property details for schema display
 */
export interface PropertyProps {
  type?: string
  anyOf?: { type: string }[]
  title: string
  description: string
  example?: string
  default?: unknown
  properties?: Record<string, unknown>
}

/**
 * Schema structure for UI display
 */
export interface SchemaProps {
  properties: Record<string, PropertyProps>
  required?: string[]
  title: string
  type: string
}

/**
 * Map complex types to simple display strings
 * @param t Type string from schema
 * @returns Simplified type string
 */
export function mapSimpleType(t?: string): string {
  if (!t) return 'any'
  if (t === 'integer') return 'integer'
  if (t === 'null') return 'null'
  if (t === 'array') return 'any[]'
  return t
}

/**
 * Normalize type definition from schema to readable string
 * @param s Schema object or reference
 * @param ignoreTitle Whether to ignore the title property in schema
 * @returns Normalized type string
 */
export function normalizeTypeFromSchema(s: SchemaObject | ReferenceObject | undefined | unknown, ignoreTitle: boolean = false): string {
  if (!s) return 'any'
  const schema = s as SchemaObject

  const resolveWithTitle = (typeStr: string) => {
    if (!ignoreTitle && schema.title && typeStr === 'object') {
      return `${schema.title} · ${typeStr}`
    }
    return typeStr
  }

  // Handle anyOf
  if (Array.isArray(schema.anyOf)) {
    const combined = schema.anyOf.map((t: unknown) => normalizeTypeFromSchema(t, false)).join(' | ')
    return resolveWithTitle(combined)
  }
  // Handle oneOf
  if (Array.isArray(schema.oneOf)) {
    const combined = schema.oneOf.map((t: unknown) => normalizeTypeFromSchema(t, false)).join(' | ')
    return resolveWithTitle(combined)
  }
  // Handle array
  if (schema.type === 'array') {
    const item = schema.items || {}
    let itemType = normalizeTypeFromSchema(item, false)
    if (itemType.includes('|')) {
      itemType = `(${itemType})`
    }
    return resolveWithTitle(`${itemType}[]`)
  }
  // Handle primitives / object
  if (schema.properties) return resolveWithTitle('object')

  if (schema.enum && schema.enum.length) {
    const type = schema.type ? mapSimpleType(schema.type as string) : 'any'
    return resolveWithTitle(`enum<${type}>`)
  }

  if (schema.type) return resolveWithTitle(mapSimpleType(schema.type as string))

  return resolveWithTitle('any')
}

// Response component types helpers
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

export type SchemaItem = {
  type?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  items?: ArrayItemType
  [key: string]: unknown
}
