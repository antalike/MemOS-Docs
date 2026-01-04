<script setup lang="ts">
const props = defineProps<{
  path: string
  method: HttpMethods
}>()

const collectionName = inject<CollectionName>('collectionName')
const {
  getResponseByStatusCode,
  getResponseAsJSONSchema
} = useOpenApi(collectionName)

const {
  statusCodes,
  currentCode,
  currentContentType,
  contentTypes
} = useApiResponse(toRef(props, 'path'), toRef(props, 'method'))

const selectedResponse = computed(() => {
  if (!currentCode.value) return null
  return getResponseByStatusCode(props.path, props.method, currentCode.value)
})

const selectedSchema = computed(() => {
  if (!currentCode.value) return null
  return getResponseAsJSONSchema(props.path, props.method, currentCode.value, currentContentType.value)
})
</script>

<template>
  <div
    v-if="statusCodes.length > 0"
    class="api-section"
  >
    <div class="flex flex-col gap-y-4 w-full">
      <ApiSectionHeader :title="$t('api.response')">
        <template #right>
          <div class="flex items-center gap-4 font-mono px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            <USelect
              v-model="currentCode"
              :items="statusCodes"
              :ui="{
                base: 'text-xs',
                item: 'text-xs'
              }"
            />
            <USelect
              v-if="contentTypes.length > 1"
              v-model="currentContentType"
              :items="contentTypes"
              :ui="{
                base: 'text-xs'
              }"
            />
            <span v-else>{{ currentContentType }}</span>
          </div>
        </template>
      </ApiSectionHeader>
      <ApiMarkdownRenderer
        v-if="selectedResponse?.description"
        :key="currentCode"
        class="text-sm mb-2"
        :value="selectedResponse.description"
      />
    </div>
    <div v-if="selectedSchema">
      <ApiMarkdownRenderer
        v-if="selectedSchema?.description"
        :value="selectedSchema?.description"
      />
      <template v-if="selectedSchema.properties">
        <ApiPropertyList
          :properties="selectedSchema.properties as any"
          :required="selectedSchema.required"
        />
      </template>
    </div>
  </div>
</template>
