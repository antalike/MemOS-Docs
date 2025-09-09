<script setup lang="ts">
const props = defineProps<{
  anyOf: any[]
}>()

const { resolveSchemaRef } = useOpenApi()

const arrParams = computed(() => {
  return props.anyOf.filter((item) => {
    return item.type === 'array' && item.items?.$ref
  }).map((item) => {
    return resolveSchemaRef(item.items?.$ref)
  })
})
</script>

<template>
  <template
    v-for="(param, index) in arrParams"
    :key="index"
  >
    <ApiCollapse
      v-if="param"
      class="mt-4"
    >
      <ApiRequestBodyList
        :properties="param.properties"
        :required="param.required"
      />
    </ApiCollapse>
  </template>
</template>
