<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = withDefaults(defineProps<{
  anyOf?: any[]
  items?: Record<string, any>
  apiName?: keyof Collections
}>(), {
  apiName: 'openapi'
})

const { resolveSchemaRef } = useOpenApi(props.apiName)

const arrParams = computed(() => {
  if (props.anyOf) {
    return props.anyOf.filter((item) => {
      return item.type === 'array' && item.items?.$ref
    }).map((item) => {
      return resolveSchemaRef(item.items?.$ref)
    })
  } else {
    return [resolveSchemaRef(props.items?.$ref)]
  }
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
        :api-name="apiName"
      />
    </ApiCollapse>
  </template>
</template>
