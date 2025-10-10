<script setup lang="ts">
import { codeToHtml } from 'shiki'

const props = defineProps<{
  code: string
  language: 'python' | 'bash' | 'json' | undefined
}>()

const highlightCode = ref<string>('')

watch(() => props.code, async (value) => {
  if (value && props.language) {
    const highlightHtml = await codeToHtml(value, {
      lang: props.language,
      theme: 'material-theme-palenight'
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
:deep(.shiki.material-theme-palenight) {
  background-color: #1e2939 !important;
}
:deep(.shiki span.line) {
  display: inline-block !important;
}
</style>
