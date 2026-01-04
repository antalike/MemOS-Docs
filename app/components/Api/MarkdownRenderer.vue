<script setup lang="ts">
import { parseMarkdown } from '@nuxtjs/mdc/runtime'

const props = defineProps<{
  value: string
}>()

const { data: ast, error } = await useAsyncData(
  `markdown-${hash(props.value)}`,
  () => parseMarkdown(props.value)
)
</script>

<template>
  <div v-if="error">
    Error parsing markdown
  </div>
  <ContentRenderer
    v-else-if="ast"
    :value="ast"
    class="api-markdown text-gray-400"
  />
</template>

<script lang="ts">
function hash(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
</script>

<style lang="css">
.api-markdown p {
  margin: 0;
  font-size: 14px;
}

.api-markdown code {
  font-size: 12px;
  border: 1px solid rgb(var(--gray-800));
  background-color: rgb(255 255 255 / .1);
  color: rgb(var(--gray-200)) !important;
}

.api-markdown pre {
  padding: 12px;
}

.api-markdown pre code {
  background-color: transparent;
}

.api-markdown a {
  color: #fff;
  border-bottom: 1px solid #01C6FA;
}
.api-markdown a:hover {
  border-bottom-width: 2px;
}

.api-markdown__title p {
  margin: 16px 0;
  font-size: 18px;
}
.api-markdown__title p:first-child {
  margin-top: 0;
}
.api-markdown__title p:last-child {
  margin-bottom: 0;
}
</style>
