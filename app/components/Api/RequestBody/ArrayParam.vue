<script setup lang="ts">
const props = defineProps<{
  anyOf?: any[]
  items?: Record<string, any>
}>()

const arrParams = computed(() => {
  if (props.anyOf && Array.isArray(props.anyOf)) {
    return props.anyOf
      .filter(item => item && item.type === 'array' && item.items)
      .map(item => item.items)
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
      <ApiRequestBodyList
        :properties="param.properties"
        :required="param.required"
      />
    </ApiCollapse>
  </template>
</template>
