<script setup lang="ts">
import type { SchemaObject } from '~/utils/openapi'

const props = defineProps<{
  prop: string
  schema: SchemaObject
  required: string[] | undefined
  parentProp: string | undefined
  enableAnyOfSelect?: boolean
}>()

const selectedAnyOfIndex = ref(0)

// Initialize selected index to the first meaningful option (non-null) if possible
watch(() => props.schema.anyOf, (newVal) => {
  if (newVal && Array.isArray(newVal) && props.enableAnyOfSelect) {
    const index = newVal.findIndex((t: unknown) => (t as SchemaObject).type !== 'null')
    if (index !== -1) {
      selectedAnyOfIndex.value = index
    } else {
      selectedAnyOfIndex.value = 0
    }
  }
}, { immediate: true })

const onSelectAnyOf = (index: number) => {
  selectedAnyOfIndex.value = index
}

const properties = computed(() => {
  if (!props.schema) return null
  if ((props.schema as SchemaObject).properties) return (props.schema as SchemaObject).properties
  if (props.schema.anyOf) {
    if (props.enableAnyOfSelect) {
      const selected = props.schema.anyOf[selectedAnyOfIndex.value] as SchemaObject
      return (selected && selected.properties) ? selected.properties : null
    }
    return (props.schema.anyOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0] as SchemaObject)?.properties
  }
  if (props.schema.oneOf) {
    return (props.schema.oneOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0] as SchemaObject)?.properties
  }
  return null
})

const requiredList = computed(() => {
  if (!props.schema) return undefined
  if ((props.schema as SchemaObject).properties) return props.schema.required
  if (props.schema.anyOf) {
    if (props.enableAnyOfSelect) {
      const selected = props.schema.anyOf[selectedAnyOfIndex.value] as SchemaObject
      return (selected && selected.properties) ? selected.required : undefined
    }
    return (props.schema.anyOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0] as SchemaObject)?.required
  }
  if (props.schema.oneOf) {
    return (props.schema.oneOf.filter(item => Object.prototype.hasOwnProperty.call(item, 'properties'))?.[0] as SchemaObject)?.required
  }
  return undefined
})

const computedAnyOfForArray = computed(() => {
  if (props.enableAnyOfSelect && props.schema.anyOf) {
    const selected = props.schema.anyOf[selectedAnyOfIndex.value]
    return selected ? [selected as SchemaObject] : []
  }
  return props.schema.anyOf as SchemaObject[]
})

function isRequired(list: string[] | undefined | null, prop: string) {
  if (!list) return false
  return list.includes(prop)
}

const childParentProp = computed(() => {
  return props.parentProp ? `${props.parentProp}.${props.prop}` : props.prop
})
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
        :enable-any-of-select="enableAnyOfSelect"
        @select="onSelectAnyOf"
      />
      <div class="mt-2">
        <ApiParameterDetails
          :description="schema?.description"
          :schema="schema"
        />
        <!-- Handle anyOf -->
        <ApiPropertyArrayParam
          v-if="schema.anyOf?.length"
          :any-of="computedAnyOfForArray"
          :parent-prop="childParentProp"
          :enable-any-of-select="enableAnyOfSelect"
        />
        <!-- Handle oneOf -->
        <ApiPropertyArrayParam
          v-if="schema.oneOf?.length"
          :any-of="schema.oneOf as SchemaObject[]"
          :parent-prop="childParentProp"
          :enable-any-of-select="enableAnyOfSelect"
        />
        <!-- Handle Items -->
        <ApiPropertyArrayParam
          v-if="(schema as any).items"
          :items="(schema as any).items as SchemaObject"
          :parent-prop="childParentProp"
          :enable-any-of-select="enableAnyOfSelect"
        />
      </div>
      <template v-if="properties">
        <ApiCollapse class="mt-4">
          <ApiPropertyList
            :properties="properties as any"
            :required="requiredList"
            :parent-prop="childParentProp"
            :enable-any-of-select="enableAnyOfSelect"
          />
        </ApiCollapse>
      </template>
    </div>
  </div>
</template>
