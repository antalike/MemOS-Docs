<script setup lang="ts">
const { locale, setLocale } = useI18n()

// 获取要切换到的语言代码
const targetLocale = computed(() => {
  return locale.value === 'cn' ? 'en' : 'cn'
})

// 切换语言
function switchLanguage() {
  window.setLocaleCookie(targetLocale.value)
  setLocale(targetLocale.value as 'cn' | 'en')
}
</script>

<template>
  <button
    class="group h-7 px-[9px] cursor-pointer border border-slate-600 rounded-md hover:border-slate-100 "
    @click="switchLanguage"
  >
    <LocaleSwitch class="size-4 group-hover:text-slate-100" />
  </button>
</template>
