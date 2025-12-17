<script setup lang="ts">
withDefaults(defineProps<{
  data: FlatPathProps | undefined
  showRequestCode?: boolean
}>(), {
  showRequestCode: false
})
</script>

<template>
  <div class="relative w-full flex gap-x-8 min-h-screen pt-10 px-4 lg:pt-10 lg:pr-10">
    <ApiContent
      v-if="data"
      :api-data="data"
      :show-request-code="showRequestCode"
    >
      <template #markdown>
        <slot name="markdown" />
      </template>
    </ApiContent>
    <ApiNotFound v-else />
  </div>
</template>
