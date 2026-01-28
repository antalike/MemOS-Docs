<script setup lang="ts">
type Site = 'cn' | 'intl'
interface ItemProps {
  value: Site
  label: string
  description: string
  to: string
}

const { t, locale } = useI18n()
const { docsUrl, docsIntl } = useRuntimeConfig().public
const langPrefix = locale.value === 'cn' ? '/cn' : ''
const items = computed<ItemProps[]>(() => [
  {
    value: 'cn',
    label: t('sites.cn.label'),
    description: t('sites.cn.description'),
    to: docsUrl as string
  },
  {
    value: 'intl',
    label: t('sites.intl.label'),
    description: t('sites.intl.description'),
    to: docsIntl as string
  }
])
const value = ref<Site>(isIntl() ? 'intl' : 'cn')
const selected = computed<ItemProps | undefined>(() => items.value.find(item => item.value === value.value))

function onClick(item: ItemProps) {
  if (item.value === value.value) {
    return
  }
  value.value = item.value
  navigateTo(`${item.to}${langPrefix}/?site=${item.value}`, { external: true })
}
</script>

<template>
  <UPopover
    mode="hover"
    :content="{
      align: 'start'
    }"
    :ui="{
      content: 'min-w-46 p-2 bg-[#192337] border-1 border-white/10'
    }"
  >
    <button
      class="group flex items-center h-7 px-2.5 space-x-1.5 text-[#E2E8F0] text-xs font-medium cursor-pointer border border-slate-600 rounded-md hover:border-slate-100 data-[state=open]:border-slate-100"
    >
      <UIcon
        name="i-ri-earth-line"
        class="size-4"
      />
      <span>{{ selected?.label }}</span>
    </button>
    <template #content>
      <div
        v-for="item in items"
        :key="item.value"
        class="flex flex-col gap-0.5 p-1.5 hover:bg-white/10 rounded-md cursor-pointer"
        @click="onClick(item)"
      >
        <span class="text-sm leading-5 text-slate-50">{{ item.label }}</span>
        <span class="text-sm leading-5 text-[#6A7584]">{{ item.description }}</span>
      </div>
    </template>
  </UPopover>
</template>
