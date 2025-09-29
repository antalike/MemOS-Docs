<script setup lang="ts">
import type { FlatResponse } from '~/utils/openapi'

const props = defineProps<{
  data: FlatResponse[]
}>()

const firstCode = props.data?.[0]?.statusCode ?? ''
const currentCode = ref<string>(String(firstCode))
const selectedResponse = computed<FlatResponse | undefined>(() => {
  return props.data?.find(item => String(item.statusCode) === currentCode.value)
})
</script>

<template>
  <div class="api-section">
    <div class="flex flex-col gap-y-4 w-full">
      <ApiSectionHeader :title="$t('api.response')">
        <template #right>
          <div class="flex items-center gap-4 font-mono px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
            <USelect
              v-model="currentCode"
              label-key="statusCode"
              value-key="statusCode"
              :items="data"
            />
            <span>{{ selectedResponse?.contentType }}</span>
          </div>
        </template>
      </ApiSectionHeader>
      <div
        v-if="selectedResponse"
        class="text-sm prose prose-gray dark:prose-invert mb-2"
      >
        <p class="whitespace-pre-line text-gray-400">
          {{ selectedResponse?.description }}
        </p>
      </div>
    </div>
    <div v-if="selectedResponse && selectedResponse.data">
      <div
        v-if="selectedResponse?.data?.description"
        class="pt-6 pb-4"
      >
        <p class="whitespace-pre-line text-gray-400 text-sm">
          {{ selectedResponse?.data?.description }}
        </p>
      </div>
      <template v-if="selectedResponse?.data?.properties">
        <template
          v-for="(item, prop) in selectedResponse.data.properties"
          :key="prop"
        >
          <div class="border-gray-100 dark:border-gray-800 border-b last:border-b-0">
            <div class="py-6">
              <ApiParameterLine
                :name="prop"
                :required="selectedResponse?.data?.required?.includes(prop)"
                :default-value="item.default"
                :param="item"
              />
              <div class="mt-4">
                <ApiResponseSubItem
                  v-if="item.properties"
                  :item="item"
                />
                <template v-else>
                  <p
                    v-if="item.description"
                    class="whitespace-pre-line text-gray-400 text-sm"
                    v-html="item.description"
                  />
                  <div
                    v-if="item.example !== undefined && item.example !== null"
                    class="flex mt-6 gap-1.5 text-sm text-gray-400"
                  >
                    <span>Example: </span>
                    <span class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-200 font-medium text-sm break-all">
                      {{ typeof item.example === 'string' ? `"${item.example}"` : item.example }}
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
