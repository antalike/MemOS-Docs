<script setup lang="ts">
import { resolveSchemaRef } from '@/utils/openapi'

const props = defineProps<{
  name: string
  parentName?: string | undefined
  required?: boolean
  defaultValue?: unknown
  schema?: Record<string, unknown>
}>()

const { schemas } = useOpenApi()

function mapSimpleType(t?: string): string {
  if (!t) return 'any'
  if (t === 'integer') return 'number'
  if (t === 'null') return 'null'
  if (t === 'array') return 'any[]'
  return t
}

function normalizeTypeFromSchema(s: any): string {
  if (!s) return 'any'
  // $ref
  if (s.$ref) {
    const ref = resolveSchemaRef(s.$ref as string, schemas.value) as any
    if (!ref) return 'object'
    if (ref.type) return mapSimpleType(ref.type)
    if (ref.properties) return 'object'
    return 'object'
  }
  // anyOf
  if (Array.isArray(s.anyOf)) {
    return s.anyOf.map((t: any) => normalizeTypeFromSchema(t)).join(' | ')
  }
  // array
  if (s.type === 'array') {
    // best-effort derive item type
    const item = s.items || {}
    if (item.$ref) {
      const ref = resolveSchemaRef(item.$ref as string, schemas.value) as any
      const base = ref?.type ? mapSimpleType(ref.type) : 'object'
      return `${base}[]`
    }
    const base = mapSimpleType(item.type as string)
    return `${base.replace('[]','')}[]`
  }
  // primitives / object
  if (s.type) return mapSimpleType(s.type as string)
  if (s.properties) return 'object'
  return 'any'
}

const computedType = computed(() => {
  if (props.schema)
    return normalizeTypeFromSchema(props.schema)
  return 'any'
})

function extractRefName(s: any): string | undefined {
  if (!s) return undefined
  const pickRef = (node: any): string | undefined => {
    if (!node) return undefined
    if (node.$ref) return String(node.$ref).split('/').pop()
    if (node.items && node.items.$ref) return String(node.items.$ref).split('/').pop()
    return undefined
  }
  if (s.$ref) return pickRef(s)
  if (Array.isArray(s.anyOf)) {
    for (const opt of s.anyOf) {
      const r = pickRef(opt)
      if (r) return r
    }
  }
  if (s.items) return pickRef(s)
  return undefined
}

const refLabel = computed(() => extractRefName(props.schema))
</script>

<template>
  <div class="flex font-mono text-sm break-all relative">
    <div class="flex items-center flex-wrap gap-2">
      <div class="font-semibold text-primary dark:text-primary-light cursor-pointer overflow-wrap-anywhere">
        <span
          v-if="parentName"
          class="text-gray-500 dark:text-[#9ea3a2]"
        >
          {{ parentName }}.</span><span>{{ name }}</span>
      </div>
      <div class="inline items-center gap-2 text-xs font-medium [&_div]:inline [&_div]:mr-2 [&_div]:leading-5">
        <div
          v-if="computedType"
          class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-200 font-medium break-all"
        >
          <template v-if="refLabel">
            <span class="font-semibold">{{ refLabel }}</span>
            <span class="mx-1">·</span>
            <span>{{ computedType }}</span>
          </template>
          <template v-else>
            {{ computedType }}
          </template>
        </div>
        <div
          v-if="defaultValue !== undefined"
          class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-200 font-medium break-all"
        >
          <span class="text-gray-400 dark:text-[#707473]">default: </span>
          <span>{{ defaultValue }}</span>
        </div>
        <div
          v-if="required"
          class="px-2 py-0.5 rounded-md bg-red-100/50 dark:bg-red-400/10 text-red-600 dark:text-red-300 font-medium whitespace-nowrap"
        >
          <span>required</span>
        </div>
      </div>
    </div>
  </div>
</template>
