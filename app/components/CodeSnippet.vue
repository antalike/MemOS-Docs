<script setup lang="ts">
const props = defineProps<{
  name: string
}>()

const { locale } = useI18n()

const { data: snippet } = await useAsyncData(`snippet-${locale.value}-${props.name}`, () => {
  const snippetPath = locale.value === 'cn'
    ? `/cn/api_docs/snippets/${props.name}`
    : `/en/api_docs/snippets/${props.name}`

  return queryCollection('docs').path(snippetPath).first()
})
</script>

<template>
  <ContentRenderer
    v-if="snippet"
    :value="snippet"
  />
</template>
