<script setup lang="ts">
useHead({
  title: 'API Reference'
})

const { t } = useI18n()
const { getOpenApi, getApiByRoute, apiNavData } = useOpenApi('openapi', 'api-reference')
await getOpenApi()

const route = useRoute()
const apiData = computed(() => getApiByRoute(route))
const navigation = computed(() => [
  {
    title: t('dashboard.nav.apiReference'),
    children: apiNavData.value
  }
])
</script>

<template>
  <ApiPage
    api-name="openapi"
    :data="apiData"
    :navigation="navigation"
  />
</template>
