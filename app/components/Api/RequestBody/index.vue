<script setup lang="ts">
const props = defineProps<{
  data: RequestProps
}>()

const collectionName = inject<CollectionName>('collectionName')
const { getContentSchema } = useOpenApi(collectionName)
const { schema, contentType } = getContentSchema(props.data.content)
</script>

<template>
  <div
    v-if="schema"
    class="mdx-content relative mt-8"
  >
    <ApiSectionHeader :title="$t('api.body')">
      <template #right>
        <div class="font-mono px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
          {{ contentType }}
        </div>
      </template>
    </ApiSectionHeader>
    <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
      <ApiRequestBodyList
        :properties="schema.properties"
        :required="schema.required"
      />
    </div>
  </div>
</template>
