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
    <div
      class="border-gray-100 dark:border-gray-800 border-b last:border-b-0 mt-4"
    >
      <div
        v-if="requestBody.description"
        class="space-y-4 whitespace-normal prose prose-sm prose-gray dark:prose-invert overflow-wrap-anywhere [&_*]:overflow-wrap-anywhere"
      >
        <ApiMarkdownRenderer
          v-if="requestBody.description"
          class="text-sm"
          :value="requestBody.description"
        />
      </div>
      <ApiPropertyList
        v-bind="(requestBody.body as any)?.schema"
        :enable-any-of-select="true"
      />
    </div>
  </div>
</template>
