<template>
  <img v-if="base64Src" :src="base64Src" :alt="alt" :class="imageClass" />
  <div v-else class="animate-pulse bg-gray-200 rounded" :class="imageClass">
    Loading...
  </div>
</template>

<script setup lang="ts">
interface Props {
  src: string
  alt: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: 'w-full max-w-4xl mx-auto rounded-lg shadow-lg'
})

const base64Src = ref('')
const imageClass = computed(() => props.class)

const convertToBase64 = async () => {
  try {
    const response = await fetch(props.src)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const blob = await response.blob()
    const reader = new FileReader()
    
    reader.onloadend = () => {
      base64Src.value = reader.result as string
    }
    
    reader.onerror = () => {
      console.error('Failed to convert image to base64')
    }
    
    reader.readAsDataURL(blob)
  } catch (error) {
    console.error('Error converting image to base64:', error)
  }
}

onMounted(() => {
  convertToBase64()
})
</script> 