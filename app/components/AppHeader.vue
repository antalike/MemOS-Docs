<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { getHomePath } from '~/utils'

const route = useRoute()
const { t, locale, setLocale } = useI18n()
const { header } = useAppConfig()
const homePath = computed(() => {
  return getHomePath('/', locale.value)
})
// docs navigation for mobile
const navigation = inject<ContentNavigationItem[]>('navigation', [])
const localizedMenus = computed(() => {
  return [
    {
      to: getHomePath('/', locale.value),
      label: t('header.home')
    },
    {
      to: getLangPath('/overview/introduction', locale.value),
      label: t('header.docs'),
      active: !route.path.includes('/changelog')
    },
    {
      label: t('header.research'),
      target: '_blank',
      to: 'https://memos.openmem.net/paper_memos_v2'
    },
    {
      label: t('header.openmem'),
      target: '_blank',
      to: getHomePath('/openmem', locale.value)
    },
    {
      label: t('header.changelog'),
      to: getLangPath('/changelog', locale.value),
      active: route.path.includes('/changelog')
    }
  ]
})

function handleLocaleSwitch() {
  setLocale(locale.value === 'en' ? 'cn' : 'en')
}
</script>

<template>
  <UHeader
    :to="homePath"
  >
    <template
      #left
    >
      <NuxtLink :to="homePath">
        <LogoPro class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu :items="localizedMenus" class="justify-center">
      <template #item="{ item }">
        <div>{{ item.label }}</div>
      </template>
    </UNavigationMenu>

    <template #right>
      <UContentSearchButton
        v-if="header?.search"
        class="cursor-pointer"
      />

      <UButton
        color="neutral"
        variant="ghost"
        class="cursor-pointer"
        @click="handleLocaleSwitch"
      >
        <LocaleSwitch class="w-[20px] h-[20px]" />
      </UButton>

      <UModal>
        <UButton color="neutral" variant="ghost" icon="ri:wechat-fill" class="cursor-pointer"/>
        <template #content>
          <img
            src="https://statics.memtensor.com.cn/memos/contact-ui.png"
            alt="WeChat QR"
            class="object-contain"
          >
        </template>
      </UModal>

      <template v-if="header?.links">
        <UButton
          v-for="(link, index) of header.links"
          :key="index"
          v-bind="{ color: 'neutral', variant: 'ghost', ...link }"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu orientation="vertical" :items="localizedMenus" class="justify-center">
        <template #item="{ item }">
          <div>{{ item.label }}</div>
        </template>
      </UNavigationMenu>

      <USeparator type="dashed" class="mt-4 mb-6" />

      <UContentNavigation
        highlight
        :navigation="navigation"
      />
    </template>
  </UHeader>
</template>
