<script setup lang="ts">
const { t, defaultLocale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localePath = useLocalePath()
const normalizedPath = computed(() => switchLocalePath(defaultLocale))

const active = ref<string>('0')

const items = computed(() => {
  const menus = [
    { label: t('header.menus.welcome'), to: '/' },
    { label: t('header.menus.cloud'), to: '/memos_cloud/overview' },
    { label: t('header.menus.openSource'), to: '/open_source/getting_started/installation' },
    { label: t('header.menus.mcpAgent'), to: '/mcp_agent/mcp/guide' },
    { label: t('header.menus.apiDocs'), to: '/api_docs/start/overview' },
    { label: t('header.menus.samples'), to: '/usecase/financial_assistant' },
    { label: t('header.menus.changelog'), to: '/changelog' }
  ]
  return menus.map(m => ({ ...m, toLocale: localePath(m.to) }))
})

watch([items, normalizedPath], ([list, path]) => {
  const idx = list.findIndex((i) => {
    // Exact match for root path
    if (i.to === '/' && path === '/') return true
    if (i.to === '/') return false

    // Check if current path starts with the menu item's base path
    // e.g. /memos_cloud/overview matches /memos_cloud/features/...
    const baseSegment = i.to.split('/')[1]
    return path.startsWith(`/${baseSegment}`)
  })
  if (idx !== -1) active.value = String(idx)
}, { immediate: true })

function onChange(index: string | number) {
  const to = items.value?.[Number(index)]?.toLocale
  if (to) {
    navigateTo(to)
  }
}
</script>

<template>
  <UTabs
    v-model="active"
    :items="items"
    variant="link"
    :ui="{
      root: 'gap-0',
      list: 'p-0 justify-center',
      indicator: 'h-0.5',
      trigger: 'w-auto px-9 py-4.5 text-base leading-5.5 cursor-pointer'
    }"
    @update:model-value="onChange"
  >
    <template #default="{ item, index }">
      <span :class="`${index === Number(active) ? 'bg-linear-270 from-15% from-primary to-118% to-primary-light bg-clip-text text-transparent' : 'text-slate-300'}`">
        {{ item.label }}
      </span>
    </template>
  </UTabs>
</template>
