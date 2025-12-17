<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { useI18n } from 'vue-i18n'

const route = useRoute()

const { locale, defaultLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const normalizedPath = computed(() => switchLocalePath(defaultLocale))
const contentNavigation = useContentNavigation(locale)

const filteredNavigation = computed(() => {
  if (!contentNavigation.value) return []

  const nav = contentNavigation.value
  const path = route.path

  if (path.includes('/dashboard/api')) {
    return []
  }

  const getSegment = (p: string) => {
    const normalized = p.replace(/^\/(cn|en)(\/|$)/, '/')
    const parts = normalized.split('/').filter(Boolean)
    return parts[0]
  }

  const hasDescendantWithSegment = (item: ContentNavigationItem, segment: string): boolean => {
    if (item.path && getSegment(item.path) === segment) return true
    if (item.children) {
      return item.children.some((child: ContentNavigationItem) => hasDescendantWithSegment(child, segment))
    }
    return false
  }

  const currentSegment = getSegment(path)
  if (!currentSegment) return []

  const activeNode = nav.find(item => hasDescendantWithSegment(item, currentSegment))

  return activeNode ? activeNode.children || [] : []
})

const { data: files } = useLazyAsyncData(`search`, () => queryCollectionSearchSections('docs'), {
  server: false,
  watch: [locale]
})

// Process files to remove en language prefix
const processedFiles = computed(() => {
  if (!files.value) return []

  return files.value.filter(file => file.id.startsWith(`/${locale.value}`)).map(file => ({
    ...file,
    id: locale.value === 'en' ? file.id.replace(`/${locale.value}`, '') : file.id
  }))
})

const isSupportCssOklch = (): boolean => {
  return CSS.supports('color', 'oklch(0% 0 0)')
}

const htmlClass = computed(() => {
  if (import.meta.client) {
    if (!isSupportCssOklch()) {
      return 'compact'
    }
  }
  return 'dark'
})

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/icon.svg' }
  ],
  htmlAttrs: {
    lang: 'en',
    class: htmlClass
  }
})

function showContentNavigation() {
  return normalizedPath.value !== '/'
    && !isApiPage()
    && !normalizedPath.value.includes('changelog')
    && !normalizedPath.value.includes('/dashboard/api')
}

function isApiPage() {
  return route.path.startsWith('/docs/api')
    || route.path.startsWith('/cn/docs/api/')
    || route.path.startsWith('/api-reference')
    || route.path.startsWith('/cn/api-reference')
}

provide('navigation', filteredNavigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <AppHeader v-if="!isApiPage()" />

    <!-- Document pages -->
    <template v-if="showContentNavigation()">
      <UMain>
        <UContainer>
          <UPage>
            <!-- Document navigation -->
            <template #left>
              <UPageAside class="overflow-auto scrollbar-hide">
                <!-- Use keep-alive to maintain menu state -->
                <keep-alive>
                  <UContentNavigation
                    :navigation="filteredNavigation"
                    highlight
                    :ui="{
                      linkTrailingBadge: 'font-semibold uppercase',
                      linkLeadingIcon: 'hidden'
                    }"
                  >
                    <template #link-title="{ link }">
                      <UTooltip
                        :text="link.title"
                        :delay-duration="100"
                        class="w-full min-w-0"
                      >
                        <span class="inline-flex items-center gap-2 w-full min-w-0 max-w-full">
                          <UIcon
                            v-if="link.icon && typeof link.icon === 'string'"
                            :name="link.icon as string"
                            class="w-4 h-4 flex-shrink-0"
                          />
                          <span class="truncate flex-1 min-w-0">{{ link.title }}</span>
                          <UIcon
                            v-if="link.target === '_blank'"
                            name="i-ri-external-link-line"
                            class="w-3 h-3 flex-shrink-0 text-gray-400"
                          />
                        </span>
                      </UTooltip>
                    </template>
                  </UContentNavigation>
                </keep-alive>
              </UPageAside>
            </template>

            <!-- Document content -->
            <NuxtPage />
          </UPage>
        </UContainer>
      </UMain>
    </template>

    <!-- Changelog page -->
    <template v-if="!showContentNavigation()">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </template>

    <!-- Document footer -->
    <AppFooter
      v-if="!isApiPage()"
      class="mt-40"
    />

    <ClientOnly>
      <LazyUContentSearch
        :files="processedFiles"
        :navigation="contentNavigation"
      />
    </ClientOnly>
  </UApp>
</template>
