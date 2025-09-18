<script setup lang="ts">
import type { NuxtError } from '#app'

const { locale } = useI18n()

const props = defineProps<{
  error: NuxtError
}>()

// Immediately redirect to /home/overview if it's a 404 error
if (props.error?.statusCode === 404) {
  navigateTo(getLangPath('/open_source/home/overview', locale.value))
}

useHead({
  htmlAttrs: {
    lang: 'en',
    class: 'dark'
  }
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'))
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
  server: false
})

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <AppHeader />

    <template v-if="error?.statusCode !== 404">
      <UError :error="error" />
    </template>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
      />
    </ClientOnly>
  </UApp>
</template>
