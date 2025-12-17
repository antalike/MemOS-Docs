<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string
  target?: string
  type?: 'primary' | 'default' | 'success' | 'ghost' | undefined
  leadingIcon?: string
  trailingIcon?: string
}>(), {
  type: 'default'
})

const bgClasses = computed(() => {
  if (props.type === 'primary') {
    return 'inset-shadow-default bg-linear-270 from-15% from-[#1D4ED8] to-118% to-[#01C6FA]'
  }
  if (props.type === 'success') {
    return 'inset-shadow-default bg-linear-270 from-15% from-[#219C5F] to-118% to-[#29EB8B]'
  }
  if (props.type === 'ghost') {
    return 'border border-[#1E40AF]'
  }
  return 'inset-shadow-default bg-[#232E60] bg-linear-249 -from-5% from-black/42 to-100% to-white bg-blend-soft-light'
})

function handleClick() {
  if (!props.to) {
    return
  }

  if (props.to.startsWith('http')) {
    return props.target === '_blank' ? window.open(props.to, props.target) : navigateTo(props.to, { external: true })
  }

  navigateTo(props.to)
}
</script>

<template>
  <button
    :class="`flex items-center justify-center gap-1.5 h-9.5 px-5 text-base font-medium rounded-[48px] cursor-pointer ${bgClasses} sm:h-11 sm:px-7`"
    @click="handleClick"
  >
    <UIcon
      v-if="leadingIcon"
      class="size-5"
      :name="leadingIcon"
    />
    <template v-if="type === 'ghost'">
      <span class="bg-linear-270 from-15% from-primary to-118 to-primary-light bg-clip-text text-transparent">
        <slot />
      </span>
    </template>
    <slot v-else />
    <UIcon
      v-if="trailingIcon"
      class="size-5"
      :name="trailingIcon"
    />
  </button>
</template>
