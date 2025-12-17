<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

defineProps<{
  data: FlatPathProps | undefined
}>()
</script>

<template>
  <div class="relative w-full flex gap-x-8 min-h-screen pt-10 lg:pt-10">
    <ApiContent
      v-if="data"
      v-bind="$attrs"
      :api-data="data"
    >
      <template #markdown>
        <slot name="markdown" />
      </template>
    </ApiContent>
    <ApiNotFound v-else />
  </div>
</template>
