<script lang="ts">
export interface ParametersProp {
  name: string
  in: 'path' | 'query'
  required: boolean
  schema: Record<string, string>
}
</script>

<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = withDefaults(defineProps<{
  data: ParametersProp[]
  apiName?: keyof Collections
}>(), {
  apiName: 'openapi'
})

const pathParameters = computed(() => {
  return props.data.filter(item => item.in === 'path')
})
const queryParameters = computed(() => {
  return props.data.filter(item => item.in === 'query')
})
</script>

<template>
  <div class="api-section">
    <ApiParameterList
      v-if="pathParameters.length"
      title="Path Parameters"
      :data="pathParameters"
      :api-name="apiName"
    />
    <ApiParameterList
      v-if="queryParameters.length"
      title="Query Parameters"
      :data="queryParameters"
      :api-name="apiName"
    />
  </div>
</template>
