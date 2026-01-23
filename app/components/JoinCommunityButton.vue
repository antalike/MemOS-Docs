<template>
  <UPopover
    :ui="{
      content: 'bg-[#080F21]'
    }"
  >
    <button class="flex items-center gap-2.5 h-7 px-2.5 cursor-pointer bg-white rounded-md">
      <span class="text-xs font-medium text-[#0F172B]">
        {{ $t('header.community.button') }}
      </span>
    </button>
    <template #content>
      <div class="py-4.5 px-4">
        <div class="mb-4 sm:text-xl text-base text-white leading-7 text-center">
          {{ $t('header.community.title') }}
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <img
              :src="useStaticCdnUrl(`/landing-v2/qrcode-wechat-v2.webp`)"
              class="size-30"
            >
            <div class="flex items-center justify-center gap-1.5">
              <UIcon
                name="i-ic:baseline-wechat"
                class="size-5"
              />
              <span class="text-slate-300 leading-5.5">{{ $t('header.community.wechat') }}</span>
            </div>
          </div>
          <div class="space-y-2">
            <img
              :src="useStaticCdnUrl(`/landing-v2/qrcode-discord-v2.webp`)"
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
