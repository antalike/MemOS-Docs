<script setup lang="ts">
import { checkIsMobile } from '@/utils/index'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const isMobile = ref(Boolean(checkIsMobile()))
const columns = computed(() => [
  {
    label: t('footer.product'),
    children: [
      {
        label: t('footer.memosCloud'),
        to: useDashboardUrl('/quickstart/', locale.value),
        target: '_blank'
      },
      {
        label: t('footer.memoryAssistant'),
        to: 'https://alidocs.dingtalk.com/i/nodes/wva2dxOW4YreyQ6rI7ylgy6LVbkz3BRL',
        target: '_blank'
      },
      {
        label: t('footer.mcpService'),
        to: localePath('/mcp_agent/mcp/guide'),
        target: '_blank'
      },
      {
        label: t('footer.githubProject'),
        to: useGithubUrl(),
        target: '_blank'
      }
    ]
  },
  {
    label: t('footer.apiDocs'),
    children: [
      {
        label: t('footer.apiDocs'),
        to: localePath('/'),
        target: '_blank'
      },
      // {
      //   label: t('footer.blog'),
      //   to: '',
      // },
      {
        label: t('footer.pricing'),
        to: useHomeUrl('/pricing', locale.value),
        target: '_blank'
      }
    ]
  },
  {
    label: t('footer.aboutUs'),
    children: [
      {
        label: t('footer.memtensor'),
        to: 'https://www.memtensor.com.cn/',
        target: '_blank'
      },
      ...(!isMobile.value ? [{
        label: t('footer.openmem'),
        to: useOpenMemUrl(),
        target: '_blank',
      }] : []),
      {
        label: t('footer.community'),
        key: 'footer.community'
      },
      {
        label: t('footer.joinUs'),
        to: 'https://www.memtensor.com.cn/h-col-250.html',
        target: '_blank',
        trailingIcon: false
      }
    ]
  }
])
</script>

<template>
  <div class="w-full max-w-(--ui-max-container) mx-auto px-4 sm:px-9 lg:px-0 py-10 lg:py-20">
    <UFooterColumns
      :columns="columns"
      :ui="{
        center: 'sm:gap-8 gap-6',
        label: 'text-base leading-5.5',
        item: 'mb-4',
        list: 'mt-4',
        linkLabelExternalIcon: 'hidden',
        left: 'sm:mb-10 mb-6',
        link: 'text-sm lg:text-base leading-5.5 text-[#94A3B8] hover:text-white/80! cursor-pointer'
      }"
    >
      <template #left>
        <div class="flex flex-col">
          <div class="flex flex-col w-fit items-center">
            <img
              src="https://statics.memtensor.com.cn/logo/memtensor-w.png"
              class="sm:w-20 w-15"
            >
            <p class="sm:mt-1.5 text-[28px] leading-10 font-semibold bg-linear-180 from-8% from-white to-100% to-white/60 bg-clip-text text-transparent">
              {{ $t('footer.memtensor') }}
            </p>
          </div>
          <p class="text-copyright sm:text-base text-xs leading-5.5 sm:mt-6 mt-3">
            {{ $t('footer.icpFilingNumber') }}
          </p>
          <p class="text-copyright sm:text-base text-xs leading-5.5 sm:mt-3 mt-1">
            {{ $t('footer.filingNumber') }}
          </p>
        </div>
      </template>

      <template #link="{ link }">
        <template v-if="link.key === 'footer.community'">
          <UPopover
            :ui="{
              content: 'bg-[#080F21]'
            }"
          >
            <div class="text-sm sm:text-base leading-5.5 text-[#94A3B8] hover:text-white/80! cursor-pointer">
              {{ t('header.community.button') }}
            </div>
            <template #content>
              <div class="py-4.5 px-4">
                <div class="mb-4 text-xl text-white leading-7 text-center">
                  {{ t('header.community.title') }}
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <img
                      src="https://statics.memtensor.com.cn/landing-v2/qrcode-wechat-v2.webp"
                      class="size-30"
                    >
                    <div class="flex items-center justify-center gap-1.5">
                      <UIcon
                        name="i-ic:baseline-wechat"
                        class="size-5"
                      />
                      <span class="text-slate-300 leading-5.5">{{ t('header.community.wechat') }}</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <img
                      src="https://statics.memtensor.com.cn/landing-v2/qrcode-discord-v2.webp"
                      class="size-30"
                    >
                    <div class="flex items-center justify-center gap-1.5">
                      <UIcon
                        name="ic:baseline-discord"
                        class="size-5"
                      />
                      <span class="text-slate-300 leading-5.5">Discord</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </UPopover>
        </template>
        <template v-else>
          {{ link.label }}
        </template>
      </template>
    </UFooterColumns>
  </div>
</template>
