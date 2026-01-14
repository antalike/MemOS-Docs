<script setup lang="ts">
const { toggleOpen } = useAssistant()
</script>

<template>
  <UButton
    icon="i-lucide:stars"
    color="neutral"
    variant="outline"
    :ui="{
      base: 'rounded-lg cursor-pointer',
      leadingIcon: 'size-4'
    }"
    @click="toggleOpen"
  >
    Ask AI
  </UButton>
</template>
