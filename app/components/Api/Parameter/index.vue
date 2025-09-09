<script lang="ts">
export interface ParametersProp {
  name: string
  in: 'path' | 'query'
  required: boolean
  schema: Record<string, string>
}
</script>

<script setup lang="ts">
const props = defineProps<{
  data: ParametersProp[]
}>()

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
    />
    <ApiParameterList
      v-if="queryParameters.length"
      title="Query Parameters"
      :data="queryParameters"
    />
  </div>
</template>
