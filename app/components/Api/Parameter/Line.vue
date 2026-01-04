<script setup lang="ts">
import { normalizeTypeFromSchema, type SchemaObject } from '~/utils/openapi'

const props = defineProps<{
  name: string
  parentName?: string
  required?: boolean
  defaultValue?: unknown
  schema?: SchemaObject
  enableAnyOfSelect?: boolean
}>()

const computedType = computed(() => normalizeTypeFromSchema(props.schema, false))

const anyOfOptions = computed(() => {
  if (props.schema?.anyOf && Array.isArray(props.schema.anyOf)) {
    return props.schema.anyOf.map((t: unknown, i: number) => ({
      label: normalizeTypeFromSchema(t, false),
      value: i
    }))
  }
  return []
})

const selectedAnyOf = ref<number>(0)
const emit = defineEmits<{
  (e: 'select', index: number): void
}>()

watch(selectedAnyOf, (val) => {
  emit('select', val)
})

watch(anyOfOptions, (newVal) => {
  if (newVal && newVal.length > 0) {
    selectedAnyOf.value = 0
  }
}, { immediate: true })

const hasComplexTypes = computed(() => {
  if (!props.schema?.anyOf) return false

  const meaningfulOptions = props.schema.anyOf.filter((t: unknown) => {
    const s = t as SchemaObject
    return s.type !== 'null'
  })

  // If we only have 1 or fewer meaningful options, we don't need a select
  if (meaningfulOptions.length <= 1) return false

  return props.schema.anyOf.some((t: unknown) => {
    const s = t as SchemaObject
    if (s.properties) return true
    if (s.type === 'object' || s.type === 'array') return true
    if ('items' in s) return true
    return false
  })
})
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
          v-if="enableAnyOfSelect && hasComplexTypes && anyOfOptions.length > 0"
          class="flex items-center rounded-md bg-gray-100/50 dark:bg-white/10 text-gray-600 dark:text-gray-200 font-medium break-all"
        >
          <USelect
            v-model="selectedAnyOf"
            :items="anyOfOptions"
            variant="none"
            size="xs"
            color="neutral"
            class="min-w-[200px] max-w-96"
            :ui="{
              base: 'text-inherit font-medium py-1.5 pl-2 pr-8',
              color: {
                neutral: {
                  none: 'bg-transparent focus:ring-0'
                }
              }
            }"
          />
        </div>
        <div
          v-else-if="computedType"
          class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/10 text-gray-600 dark:text-gray-200 font-medium break-all"
        >
          {{ computedType }}
        </div>
        <div
          v-if="defaultValue !== undefined"
          class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/10 text-gray-600 dark:text-gray-200 font-medium break-all"
        >
          <span class="text-gray-500">default: </span>
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
