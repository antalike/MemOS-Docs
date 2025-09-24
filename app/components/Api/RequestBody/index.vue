<script setup lang="ts">
import type { Collections } from '@nuxt/content';
import type { RequestProps } from '~/utils/openapi'

const props = withDefaults(defineProps<{
  data: RequestProps
  apiName?: keyof Collections
}>(), {
  apiName: 'openapi'
})

const { getContentSchema } = useOpenApi(props.apiName)
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
        :api-name="apiName"
      />
    </div>
  </div>
</template>
