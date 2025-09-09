<script setup lang="ts">
const { footer } = useAppConfig()
const route = useRoute()
const isHomePage = computed(() => route.path === '/')
const { t } = useI18n()
</script>

<template>
  <UFooter :class="{ 'fixed bottom-0 w-full': isHomePage }">
    <template #left>
      {{ t(`${footer.credits}`) }}
    </template>

    <template #right>
      <NuxtLink to="https://www.memtensor.com.cn/">
        <img src="https://statics.memtensor.com.cn/logo/memtensor-w.png" alt="Memtensor" class="w-5 h-5">
      </NuxtLink>
    </template>
  </UFooter>
</template>
