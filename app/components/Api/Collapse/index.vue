<script setup lang="ts">
const isExpanded = ref<boolean>(false)

function onToggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="border-1 border-[#ffffff1a] rounded-xl">
    <div
      class="text-sm flex flex-row items-center gap-2 content-center w-full cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-200 py-3 px-3.5 hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-t-xl list-none [&::-webkit-details-marker]:hidden"
      @click="onToggle"
    >
      <UIcon
        name="i-lucide-chevron-down"
        class="ease-linear"
        :class="isExpanded ? '' : 'rotate-270'"
      />
      <span>{{ isExpanded ? 'Hide' : 'Show' }} child attributes</span>
    </div>
    <div
      v-show="isExpanded"
      class="mx-3 px-2 border-t border-gray-100 dark:border-white/10 ease-linear"
    >
      <slot />
    </div>
  </div>
</template>
