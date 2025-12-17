<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import { getHomePath } from '~/utils'

const route = useRoute()
const { t, locale } = useI18n()
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
</script>

<template>
  <UHeader
    :to="homePath"
    :ui="{
      root: 'border-0 h-(--ui-topbar-height)',
      container: 'lg:px-10'
    }"
  >
    <template #left>
      <NuxtLink :to="homePath">
        <LogoPro class="w-auto h-10 shrink-0" />
      </NuxtLink>
    </template>

    <UContentSearchButton
      v-if="header?.search"
      class="cursor-pointer"
      :collapsed="false"
      :kbds="[]"
      :label="$t('header.searchPlaceholder')"
      :ui="{
        base: 'w-90 h-10 text-[#94A3B8] rounded-lg ring-slate-600'
      }"
    />

    <template #right>
      <LanguageSwitcher />
      <JoinCommunityButton />
      <button class="flex items-center gap-1.5 h-7 px-2.5 bg-linear-270 from-15% from-primary to-118% to-primary-light rounded-md cursor-pointer">
        <UIcon
          name="ri:home-4-line"
          class="size-4"
        />
        <span class="text-xs font-medium">
          {{ $t('header.backToHome') }}
        </span>
      </button>
    </template>

    <template #body>
      <UNavigationMenu
        orientation="vertical"
        :items="localizedMenus"
        class="justify-center"
      >
        <template #item="{ item }">
          <div>{{ item.label }}</div>
        </template>
      </UNavigationMenu>

      <USeparator
        type="dashed"
        class="mt-4 mb-6"
      />

      <UContentNavigation
        highlight
        :navigation="navigation"
      />
    </template>
  </UHeader>
  <AppMenus class="sticky z-12 top-(--ui-topbar-height) pt-3 bg-default/75 backdrop-blur" />
</template>
