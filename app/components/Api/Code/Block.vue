<script setup lang="ts">
import { codeToHtml } from 'shiki'

const props = defineProps<{
  code: string
  language: 'python' | 'bash' | 'json' | undefined
}>()

const highlightCode = ref<string>('')
await generateHighlight()

watchEffect(() => {
  generateHighlight()
})

async function generateHighlight() {
  if (props.code && props.language) {
    const highlightHtml = await codeToHtml(props.code, {
      lang: props.language,
      theme: 'material-theme-palenight'
    })

    highlightCode.value = highlightHtml
  }
}
</script>

<template>
  <div v-html="highlightCode" />
</template>

<style lang="css" scoped>
:deep(.shiki.material-theme-palenight) {
  background-color: #0e1219 !important;
}
:deep(.shiki span.line) {
  display: inline-block !important;
}
</style>
