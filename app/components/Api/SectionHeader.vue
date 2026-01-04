<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="flex items-baseline border-b pb-2.5 border-gray-800  w-full">
    <h4 class="flex-1 font-semibold text-lg mt-8">
      {{ title }}
    </h4>
    <slot name="right" />
  </div>
</template>
