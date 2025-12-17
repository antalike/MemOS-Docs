<script setup lang="ts">
interface ItemProps {
  title: string
  description: string
}

const { rt, tm } = useI18n()
const localeItems = computed(() => tm('homepage.items') as ItemProps[])
const icons = [
  'ri:file-cloud-fill',
  'ri:open-source-fill',
  'material-symbols:switch-access-3',
  'ant-design:api-filled',
  'ri:book-read-fill'
]
const items = computed(() => localeItems.value.map((item, index) => ({
  title: rt(item.title),
  description: rt(item.description),
  icon: icons[index]
})))
</script>

<template>
  <UMain class="max-w-(--ui-max-container) mx-auto">
    <UPageHero
      :title="$t('homepage.title')"
      :description="$t('homepage.description')"
      :ui="{
        container: 'lg:pt-25 lg:pb-20',
        title: 'text-2xl sm:text-4xl font-black leading-12.5',
        description: 'text-sm sm:text-lg leading-[25px] mt-4',
        footer: 'mt-12'
      }"
    >
      <template #links>
        <BaseButton
          type="primary"
          trailing-icon="ri:arrow-right-line"
          to="/dashboard/overview"
        >
          {{ $t('homepage.buttonText') }}
        </BaseButton>
      </template>
    </UPageHero>
    <div class="grid gap-12 sm:grid-cols-2 xl:grid-cols-12">
      <UPageCard
        v-for="(item, index) in items"
        :key="index"
        spotlight
        spotlight-color="primary"
        :class="[
          'xl:col-span-4',
          index === items.length - 2 ? 'xl:col-start-3' : '',
          index === items.length - 1 ? 'xl:col-start-7' : ''
        ]"
        :ui="{
          root: 'rounded-[20px]',
          container: 'gap-y-0'
        }"
      >
        <div class="flex items-center justify-center h-40 bg-[#171823] rounded-xl mb-8">
          <UIcon
            :name="item.icon!"
            class="size-14 bg-linear-270 from-15% from-primary to-118% to-primary-light"
          />
        </div>
        <div class="text-slate-50 text-2xl font-bold leading-8 mb-6">
          {{ item.title }}
          <div class="h-1 w-15 mt-3 bg-linear-270 from-15% from-primary to-118% to-primary-light" />
        </div>
        <div class="text-slate-400 leading-7">
          {{ item.description }}
        </div>
      </UPageCard>
    </div>
  </UMain>
</template>
