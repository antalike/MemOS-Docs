<script setup lang="ts">
const props = defineProps<{
  src: string
  alt?: string
  width?: string | number
  height?: string | number
}>()

const config = useRuntimeConfig()
const staticCdnUrl = config.public.staticCdnUrl

const computedSrc = computed(() => {
  if (!props.src) return ''
  if (props.src.startsWith('http') || props.src.startsWith('data:')) {
    return props.src
  }
  const cleanSrc = props.src.startsWith('/') ? props.src : `/${props.src}`
  return `${staticCdnUrl}${cleanSrc}`
})
</script>

<template>
  <img
    :src="computedSrc"
    :alt="alt"
    :width="width"
    :height="height"
  >
</template>
