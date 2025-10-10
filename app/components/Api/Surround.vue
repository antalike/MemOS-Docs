<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const route = useRoute()
const collectionName = inject<keyof Collections>('collectionName')
const { paths, getCurrentRouteIndex } = useOpenApi(collectionName)

const surround = computed(() => {
  const currentRouteIndex = getCurrentRouteIndex(route)
  const prevRoute = paths.value[currentRouteIndex - 1]
  const nextRoute = paths.value[currentRouteIndex + 1]
  const result = []

  if (prevRoute) {
    result.push({
      title: prevRoute.summary,
      path: prevRoute.routePath,
      description: prevRoute.description
    })
  } else {
    result.push(null)
  }
  if (nextRoute) {
    result.push({
      title: nextRoute.summary,
      path: nextRoute.routePath,
      description: nextRoute.description
    })
  }
  return result
})
</script>

<template>
  <div class="mt-14 mb-10">
    <UContentSurround
      prev-icon="i-lucide-chevron-left"
      next-icon="i-lucide-chevron-right"
      :surround="surround"
    />
  </div>
</template>
