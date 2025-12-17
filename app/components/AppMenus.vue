<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    label: string
    to: string
  }>
}>()

const { defaultLocale } = useI18n()
const localeRoute = useLocaleRoute()
const switchLocalePath = useSwitchLocalePath()
const normalizedPath = computed(() => switchLocalePath(defaultLocale))

const active = ref<string>('0')

watch([() => props.items, normalizedPath], ([list, path]) => {
  const idx = list.findIndex((i) => {
    const itemRoute = localeRoute(i.to, defaultLocale)
    const currentRoute = localeRoute(path, defaultLocale)

    if (!itemRoute || !currentRoute) return false

    // Exact match for root path
    if (itemRoute.path === '/' && currentRoute.path === '/') return true
    if (itemRoute.path === '/') return false

    // Check if current path starts with the menu item's base path
    // e.g. /memos_cloud/overview matches /memos_cloud/features/...
    const baseSegment = itemRoute.path.split('/')[1]
    return currentRoute.path.startsWith(`/${baseSegment}`)
  })
  if (idx !== -1) active.value = String(idx)
}, { immediate: true })

function onChange(index: string | number) {
  const to = props.items?.[Number(index)]?.to
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
