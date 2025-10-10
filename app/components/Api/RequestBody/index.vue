<script setup lang="ts">
const props = defineProps<{
  path: string
  method: HttpMethods
}>()

const collectionName = inject<CollectionName>('collectionName')
const { getRequestBody } = useOpenApi(collectionName)

const requestBody = computed(() => {
  return getRequestBody(props.path, props.method)
})
</script>

<template>
  <div
    v-if="requestBody && requestBody.body"
    class="mdx-content relative mt-8"
  >
    <ApiSectionHeader :title="$t('api.body')">
      <template #right>
        <div class="font-mono px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          {{ requestBody.contentType }}
        </div>
      </template>
    </ApiSectionHeader>
    <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
      <ApiRequestBodyList v-bind="requestBody.body?.schema" />
    </div>
  </div>
</template>
