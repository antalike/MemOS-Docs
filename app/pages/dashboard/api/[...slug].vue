<script setup lang="ts">
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
const path = normalizedPath.replace(/-/g, '_')
const docsPath = locale.value === 'cn' ? path : `/en${path}`
const { data: page } = await useAsyncData(docsPath, () => {
  return queryCollection('docs').path(docsPath).first()
})

useHead({
  title: locale.value === 'cn' ? '云平台 API 文档' : 'Dashboard API Reference'
})
</script>

<template>
  <ApiPage
    api-name="dashboardApi"
    :data="apiData"
    :navigation="navigation"
    :show-request-code="true"
  >
    <template
      v-if="page"
      #markdown
    >
      <ContentRenderer
        class="wrap-break-word"
        :value="page"
      />
    </template>
  </ApiPage>
</template>
