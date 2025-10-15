<script setup lang="ts">
const props = defineProps<{
  name: string
}>()

const { locale } = useI18n()

const { data: snippet } = await useAsyncData(`snippet-${locale.value}-${props.name}`, () => {
  const snippetPath = locale.value === 'cn'
    ? `/cn/dashboard/snippets/${props.name}`
    : `/en/dashboard/snippets/${props.name}`

  return queryCollection('docs').path(snippetPath).first()
})
</script>

<template>
  <ContentRenderer
    v-if="snippet"
    :value="snippet"
  />
</template>
