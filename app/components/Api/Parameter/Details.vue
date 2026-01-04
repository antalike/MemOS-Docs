<script setup lang="ts">
import type { SchemaObject } from '~/utils/openapi'

const props = defineProps<{
  description?: string
  schema?: SchemaObject
}>()

const enumValues = computed(() => {
  if (props.schema?.enum && props.schema.enum.length) {
    return props.schema.enum
  }
  // Handle array items enum
  if (
    props.schema?.type === 'array'
    && props.schema?.items
    && (props.schema.items as SchemaObject).enum
    && (props.schema.items as SchemaObject).enum?.length
  ) {
    return (props.schema.items as SchemaObject).enum
  }
  return []
})
</script>

<template>
  <div>
    <ApiMarkdownRenderer
      v-if="description"
      class="mt-4"
      :value="description"
    />
    <div>
      <div
        v-if="enumValues && enumValues.length"
        class="flex flex-wrap items-center gap-1.5 text-sm mt-6"
      >
        <span class="text-gray-500">Available options:</span>
        <span
          v-for="(val, i) in enumValues"
          :key="i"
          class="px-1.5 py-0.5 rounded bg-gray-100/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-medium"
        >
          {{ typeof val === 'string' ? `"${val}"` : val }}
        </span>
      </div>

      <div
        v-if="schema?.minimum !== undefined"
        class="flex flex-wrap items-center gap-1.5 mt-6"
      >
        <span class="text-gray-500 text-sm">Required range:</span>
        <span class="px-1.5 py-0.5 rounded bg-gray-100/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs">
          x >= {{ schema.minimum }}
        </span>
      </div>

      <!-- Display const value -->
      <div
        v-if="(schema as any)?.const !== undefined"
        class="flex flex-wrap items-center gap-1.5 text-sm"
      >
        <span class="text-gray-400">Allowed value:</span>
        <span class="px-1.5 py-0.5 rounded bg-gray-100/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-medium">
          {{ typeof (schema as any).const === 'string' ? `"${(schema as any).const}"` : (schema as any).const }}
        </span>
      </div>

      <!-- Display example value -->
      <div
        v-if="schema?.example !== undefined && schema?.example !== null"
        class="flex items-center mt-6 gap-1.5 text-sm text-gray-400"
      >
        <span>Example: </span>
        <div class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/10 text-gray-600 dark:text-gray-200 font-medium text-sm break-all">
          {{ typeof schema.example === 'string' ? `"${schema.example}"` : schema.example }}
        </div>
      </div>
    </div>
  </div>
</template>
