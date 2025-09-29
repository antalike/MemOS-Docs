<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const collectionName = inject<keyof Collections>('collectionName')
const { globalSecurity, securitySchemes } = useOpenApi(collectionName)
const fields = computed(() => {
  const securityKey = Object.keys(globalSecurity.value)
  return securityKey.map(key => securitySchemes.value[key])
})
</script>

<template>
  <div class="mdx-content relative mt-8">
    <ApiSectionHeader title="Authorizations" />
    <template
      v-for="(field, index) in fields"
      :key="index"
    >
      <div class="py-6">
        <div class="flex font-mono text-sm break-all relative">
          <div class="flex items-center flex-wrap gap-2">
            <div class="font-semibold text-primary dark:text-primary-light cursor-pointer overflow-wrap-anywhere">
              <span>{{ field.name }}</span>
            </div>
            <div class="inline items-center gap-2 text-xs font-medium [&_div]:inline [&_div]:mr-2 [&_div]:leading-5">
              <div class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-200 font-medium break-all">
                <span>string</span>
              </div>
              <div class="flex items-center px-2 py-0.5 rounded-md bg-gray-100/50 dark:bg-white/5 text-gray-600 dark:text-gray-200 font-medium break-all">
                <span>{{ field.in }}</span>
              </div>
              <div class="px-2 py-0.5 rounded-md bg-red-100/50 dark:bg-red-400/10 text-red-600 dark:text-red-300 font-medium whitespace-nowrap">
                <span>required</span>
              </div>
            </div>
          </div>
        </div>
        <template v-if="field?.description">
          <p
            class="mt-4 whitespace-pre-line text-gray-400 text-sm"
            v-html="field.description"
          />
        </template>
      </div>
    </template>
  </div>
</template>
