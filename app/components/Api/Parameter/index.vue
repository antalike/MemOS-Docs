<script setup lang="ts">
const props = defineProps<{
  path: string
  method: HttpMethods
}>()

const collectionName = inject<CollectionName>('collectionName')
const { getParameters } = useOpenApi(collectionName)

const parameters = computed<ParameterObject[]>(() => {
  return getParameters(props.path, props.method)
})

const pathParameters = computed(() => {
  return parameters.value.filter(item => item.in === 'path')
})
const queryParameters = computed(() => {
  return parameters.value.filter(item => item.in === 'query')
})
const headerParameters = computed(() => {
  return parameters.value.filter(item => item.in === 'header')
})
const cookieParameters = computed(() => {
  return parameters.value.filter(item => item.in === 'cookie')
})
</script>

<template>
  <div
    v-if="parameters && parameters.length"
    class="api-section"
  >
    <ApiParameterList
      v-if="pathParameters.length"
      title="Path Parameters"
      :params="pathParameters"
    />
    <ApiParameterList
      v-if="queryParameters.length"
      title="Query Parameters"
      :params="queryParameters"
    />
    <ApiParameterList
      v-if="headerParameters.length"
      title="Header Parameters"
      :params="headerParameters"
    />
    <ApiParameterList
      v-if="cookieParameters.length"
      title="Cookie Parameters"
      :params="cookieParameters"
    />
  </div>
</template>
