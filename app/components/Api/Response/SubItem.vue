<script setup lang="ts">
import { resolveSchemaRef } from '@/utils/openapi'
import type { Collections } from '@nuxt/content'

type VariantDescriptor = { type?: string, title?: string, $ref?: string }

interface ArrayItemType {
  $ref?: string
  anyOf?: VariantDescriptor[]
  oneOf?: VariantDescriptor[]
  type?: string
  title?: string
  description?: string
  properties?: Record<string, unknown>
  required?: string[]
  enum?: unknown[]
}

const props = withDefaults(defineProps<{
  items: ArrayItemType
  apiName?: keyof Collections
}>(), {
  apiName: 'openapi'
})

const { schemas } = useOpenApi(props.apiName)

function resolveRef(ref?: string) {
  return resolveSchemaRef(ref, schemas.value)
}

const refSchema = computed(() => resolveRef(props.items?.$ref))

const variantList = computed(() => props.items?.anyOf || props.items?.oneOf || null)
const selectedVariantIndex = ref<number>(0)
const selectedVariant = computed(() => {
  const list = variantList.value
  if (!list || !list.length) return null
  const raw = list[selectedVariantIndex.value] || list[0]
  return raw?.$ref ? resolveRef(raw.$ref) : raw
})

const displaySchema = computed(() => {
  if (variantList.value) return selectedVariant.value
  if (props.items?.$ref) return refSchema.value
  return null
})
</script>

<template>
  <ApiCollapse class="mt-4">
    <!-- anyOf / oneOf selector -->
    <template v-if="variantList && variantList.length">
      <div class="py-6">
        <div class="relative font-mono text-xs font-medium !inline-block !leading-4 items-center rounded-md space-x-1.5 text-gray-600 dark:text-gray-200 py-0.5 bg-gray-100/50 dark:bg-white/5">
          <select
            v-model.number="selectedVariantIndex"
            class="flex bg-transparent focus:outline-0 cursor-pointer text-start appearance-none pl-2 pr-6 hover:text-gray-950 dark:hover:text-white"
          >
            <option
              v-for="(opt, idx) in variantList"
              :key="idx"
              :value="idx"
            >
              {{ (opt.title || opt.type || (opt.$ref && opt.$ref.split('/').pop())) ?? `Option ${idx + 1}` }}
            </option>
          </select>
          <UIcon
            name="i-lucide-chevron-down"
            class="absolute top-1/2 -translate-y-1/2 right-4 shrink-0 bg-gray-500 dark:bg-gray-400 pointer-events-none"
          />
        </div>
      </div>
    </template>
    <!-- Resolved schema (from $ref or selected anyOf/oneOf) -->
    <template v-if="displaySchema && displaySchema.properties">
      <template
        v-for="(subitem, prop) in displaySchema.properties"
        :key="prop"
      >
        <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
          <div class="py-6">
            <ApiParameterLine
              :name="prop"
              :required="displaySchema?.required?.includes(prop)"
              :default-value="subitem.default"
              :schema="subitem"
              :api-name="apiName"
            />
            <div class="mt-3">
              <p
                v-if="subitem.description"
                class="whitespace-pre-line text-gray-400 text-sm"
              >
                {{ subitem.description }}
              </p>
              <div
                v-if="subitem.enum && subitem.enum.length"
                class="flex flex-wrap gap-1.5 mt-2 text-xs"
              >
                <span class="text-gray-500">Enum:</span>
                <span
                  v-for="(val, i) in subitem.enum"
                  :key="i"
                  class="px-1.5 py-0.5 rounded bg-gray-100/50 dark:bg-white/5 text-gray-700 dark:text-gray-200"
                >
                  {{ typeof val === 'string' ? `"${val}"` : val }}
                </span>
              </div>
            </div>
            <template v-if="subitem.items">
              <ApiResponseSubItem
                :items="subitem.items"
                :api-name="apiName"
              />
            </template>
          </div>
        </div>
      </template>
    </template>

    <!-- Primitive schema fallback -->
    <template v-else-if="displaySchema">
      <div class="py-6">
        <div class="text-sm text-gray-400">
          <span>Type: </span>
          <span class="font-mono">{{ displaySchema.type }}</span>
        </div>
        <p
          v-if="displaySchema.description"
          class="mt-2 whitespace-pre-line text-gray-400 text-sm"
        >
          {{ displaySchema.description }}
        </p>
      </div>
    </template>
  </ApiCollapse>
</template>
