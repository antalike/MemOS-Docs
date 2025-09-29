<script setup lang="ts">
import { codeToHtml } from 'shiki'

const props = defineProps<{
  code: string
  language: 'python' | 'bash'
}>()

const highlightCode = ref<string>('')

watch(() => props.code, async (value) => {
  if (value) {
    const highlightHtml = await codeToHtml(value, {
      lang: props.language,
      theme: 'github-dark'
    })
    highlightCode.value = highlightHtml
  }
}, {
  immediate: true
})
</script>

<template>
  <div v-html="highlightCode" />
</template>

<style lang="css" scoped>
:deep(.shiki.github-dark) {
  background-color: transparent !important;
}
:deep(.shiki span.line) {
  display: inline-block !important;
}
</style>
