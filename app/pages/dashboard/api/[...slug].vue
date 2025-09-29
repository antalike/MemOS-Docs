<script setup lang="ts">
useHead({
  title: 'Dashboard API Reference'
})

const { t, locale } = useI18n()
const { getOpenApi, getApiByRoute, apiNavData } = useOpenApi('dashboardApi', 'dashboard/api')
await getOpenApi()

const route = useRoute()
const apiData = computed(() => getApiByRoute(route))
const navigation = computed(() => {
  return [
    {
      title: t('dashboard.nav.apiReference'),
      children: [
        {
          title: t('dashboard.nav.overview'),
          path: '/dashboard/api/overview',
          icon: 'i-lucide:info'
        },
        ...apiNavData.value.map((nav: NavLink) => {
          const { path, ...rest } = nav
          const title = path
            ?.slice(path?.lastIndexOf('/') + 1)
            .split('-')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ')
          return {
            ...rest,
            title,
            path
          }
        }),
        {
          title: t('dashboard.nav.errorcode'),
          path: '/dashboard/api/error_code'
        }
      ]
    }
  ]
})

const normalizedPath = route.path.replace(/\/$/, '') || '/'
const { data: page } = await useAsyncData(normalizedPath, () => {
  const path = normalizedPath.replace(/-/g, '_')
  const docsPath = locale.value === 'cn' ? path : `/en${path}`
  return queryCollection('docs').path(docsPath).first()
})
</script>

<template>
  <ApiPage
    api-name="dashboardApi"
    :data="apiData"
    :navigation="navigation"
  >
    <template
      v-if="page"
      #markdown
    >
      <ContentRenderer :value="page" />
    </template>
  </ApiPage>
</template>
