<script setup lang="ts">
const props = defineProps<{
  prop: string
  schema: SchemaObject
  required: string[] | undefined
  parentProp: string | undefined
}>()

const properties = computed(() => {
  if (!props.schema) return null
  if (props.schema?.properties) return props.schema.properties
  if (props.schema.anyOf) {
    return props.schema.anyOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0]?.properties
  }
  return null
})

function isRequired(list: string[] | undefined | null, prop: string) {
  if (!list) return false
  return list.includes(prop)
}
</script>

<template>
  <div
    v-if="schema"
    class="border-gray-100 dark:border-gray-800 border-b last:border-b-0"
  >
    <div class="py-6">
      <ApiParameterLine
        :name="prop"
        :parent-name="parentProp"
        :default-value="schema.default"
        :schema="schema"
        :required="isRequired(required, prop)"
      />
      <div class="mt-4">
        <p
          v-if="schema.description"
          class="whitespace-pre-line text-gray-400 text-sm"
        >
          {{ schema.description }}
        </p>
        <div
          v-if="schema.enum && schema.enum.length"
          class="flex flex-wrap gap-1.5 mt-2 text-xs"
        >
          <span class="text-gray-500">Enum:</span>
          <span
            v-for="(val, i) in schema.enum"
            :key="i"
            class="px-1.5 py-0.5 rounded bg-gray-100/50 dark:bg-white/5 text-gray-700 dark:text-gray-200"
          >
            {{ typeof val === 'string' ? `"${val}"` : val }}
          </span>
        </div>
        <!-- Handle anyOf -->
        <ApiRequestBodyArrayParam
          v-if="schema.anyOf?.length"
          :any-of="schema.anyOf"
        />
        <!-- Handle Items -->
        <ApiRequestBodyArrayParam
          v-if="schema.items"
          :items="schema.items"
        />
        <ApiParameterExample :value="schema.example" />
      </div>
      <template v-if="properties">
        <ApiCollapse class="mt-4">
          <ApiRequestBodyList
            :properties="properties"
            :required="schema.required"
            :parent-prop="prop"
          />
        </ApiCollapse>
      </template>
    </div>
  </div>
</template>
