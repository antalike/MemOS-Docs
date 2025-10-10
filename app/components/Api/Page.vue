<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = withDefaults(defineProps<{
  data: FlatPathProps | undefined
  apiName?: keyof Collections
  navigation?: NavLink[] | undefined
  showRequestCode?: boolean
}>(), {
  apiName: 'openapi',
  showRequestCode: false
})

provide('collectionName', props.apiName)

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const homePath = computed(() => {
  return getHomePath('/', locale.value)
})

const localizedMenus = computed(() => {
  return [
    {
      to: getHomePath('/', locale.value),
      label: t('header.home')
    },
    {
      to: getLangPath('/home/overview', locale.value),
      label: t('header.docs'),
      active: !route.path.includes('/changelog')
    }
  ]
})

const isMarkdown = computed(() => {
  const normalizedPath = route.path.replace(/\/$/, '') || '/'
  return [localePath('/dashboard/api/overview'), localePath('/dashboard/api/error_code')].includes(normalizedPath)
})
</script>

<template>
  <div>
    <UHeader class="block lg:hidden">
      <template #left>
        <NuxtLink :to="homePath">
          <LogoPro class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>
      <template #body>
        <UNavigationMenu
          orientation="vertical"
          :items="localizedMenus"
          class="justify-center"
        >
          <template #item="{ item }">
            <div>{{ item.label }}</div>
          </template>
        </UNavigationMenu>
        <USeparator
          type="dashed"
          class="mt-4 mb-6"
        />
        <ApiNavigation
          class="pb-6"
          :navigation="navigation"
        />
      </template>
    </UHeader>
    <div class="flex">
      <div class="hidden lg:flex fixed flex-col left-0 top-0 bottom-0 w-[19rem] border-r border-gray-200/70 dark:border-white/[0.07]">
        <div class="flex-1 overflow-y-auto px-7 py-6">
          <NuxtLink>
            <LogoPro class="w-auto h-6 shrink-0" />
          </NuxtLink>
          <ApiNavigation
            class="mt-6"
            :navigation="navigation"
          />
        </div>
      </div>
      <div class="relative w-full lg:ml-[19rem] flex gap-x-8 min-h-screen pt-10 px-4 lg:pt-10 lg:pl-16 lg:pr-10">
        <ApiContent
          v-if="data"
          :api-data="data"
          :show-request-code="showRequestCode"
        >
          <template #markdown>
            <slot name="markdown" />
          </template>
        </ApiContent>
        <MarkdownPage v-else-if="isMarkdown" />
        <ApiNotFound v-else />
      </div>
    </div>
  </div>
</template>
