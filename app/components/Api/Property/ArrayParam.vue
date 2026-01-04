<script setup lang="ts">
const props = defineProps<{
  anyOf?: SchemaObject[]
  items?: SchemaObject
  parentProp?: string
  enableAnyOfSelect?: boolean
}>()

const arrParams = computed(() => {
  if (props.anyOf && Array.isArray(props.anyOf)) {
    return props.anyOf
      .filter((item) => {
        const obj = item as Record<string, unknown>
        return obj && obj.type === 'array' && obj.items
      })
      .map(item => (item as Record<string, unknown>).items as SchemaObject)
  }
  return props.items ? [props.items] : []
})
</script>

<template>
  <template
    v-for="(param, index) in arrParams"
    :key="index"
  >
    <ApiCollapse
      v-if="param && param.properties"
      class="mt-4"
    >
      <ApiPropertyList
        :properties="param.properties as Record<string, SchemaObject>"
        :required="param.required"
        :parent-prop="parentProp"
        :enable-any-of-select="enableAnyOfSelect"
      />
    </ApiCollapse>

    <template v-else-if="param && (param.anyOf || param.oneOf)">
      <ApiPropertyTabs
        :schemas="(param.anyOf || param.oneOf) as Record<string, unknown>[]"
        :parent-prop="parentProp"
      />
    </template>
  </template>
</template>
