<script setup lang="ts">
const props = defineProps<{
  path: string
  method: HttpMethods
}>()

const collectionName = inject<CollectionName>('collectionName')
const {
  getResponseStatusCodes,
  getResponseContentTypes,
  generateResponseExample
} = useOpenApi(collectionName)

const currentCode = ref<string | number>('200')
const statusCodes = computed(() => {
  return getResponseStatusCodes(props.path, props.method)
})

const currentContentType = ref<string>('')

const contentTypes = computed(() => {
  return getResponseContentTypes(props.path, props.method, currentCode.value)
})

const responseOptions = computed(() => {
  const options: { code: string, contentType: string, label: string }[] = []

  for (const code of statusCodes.value) {
    const types = getResponseContentTypes(props.path, props.method, code)
    if (types.length > 0) {
      types.forEach((type) => {
        options.push({
          code: code.toString(),
          contentType: type,
          label: types.length > 1 ? `${code}(${type})` : code.toString()
        })
      })
    } else {
      options.push({
        code: code.toString(),
        contentType: '',
        label: code.toString()
      })
    }
  }
  return options
})

watch(contentTypes, (newTypes) => {
  if (newTypes.length > 0 && (!currentContentType.value || !newTypes.includes(currentContentType.value))) {
    currentContentType.value = newTypes[0]!
  }
}, { immediate: true })

const exampleObjects = computed(() => {
  const example = generateResponseExample(props.path, props.method, currentCode.value, currentContentType.value)
  return JSON.stringify(example, null, 2) ?? ''
})

function handleClick(code: string | number, type: string) {
  currentCode.value = code
  currentContentType.value = type
}

const isCopy = ref<boolean>(false)
let timer: ReturnType<typeof setTimeout>

onUnmounted(() => {
  clearTimeout(timer)
})

async function handleCopy() {
  navigator.clipboard.writeText(exampleObjects.value)
  isCopy.value = true
  timer = setTimeout(() => {
    isCopy.value = false
  }, 2000)
}
</script>

<template>
  <ApiCode>
    <template #header>
      <div class="flex-1 min-w-0 text-xs leading-6 rounded-tl-xl gap-1 flex overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-black/15 hover:scrollbar-thumb-black/20 active:scrollbar-thumb-black/20 dark:scrollbar-thumb-white/20 dark:hover:scrollbar-thumb-white/25 dark:active:scrollbar-thumb-white/25">
        <button
          v-for="option in responseOptions"
          :key="`${option.code}-${option.contentType}`"
          class="group flex items-center relative gap-1.5 py-1 pb-1.5 outline-none whitespace-nowrap font-medium text-gray-500 cursor-pointer dark:text-gray-400"
          :class="(currentCode === option.code && currentContentType === option.contentType) ? 'text-primary dark:text-primary-400' : ''"
          @click="handleClick(option.code, option.contentType)"
        >
          <div class="flex items-center gap-1.5 px-1.5 rounded-lg z-10 group-hover:bg-gray-200/50 dark:group-hover:bg-gray-700/70 group-hover:text-primary dark:group-hover:text-primary-light">
            {{ option.label }}
          </div>
          <div
            v-show="currentCode === option.code && currentContentType === option.contentType"
            class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary dark:bg-primary-light"
          />
        </button>
      </div>
      <button
        class="cursor-pointer"
        @click="handleCopy"
      >
        <UIcon
          :name=" isCopy ? 'i-lucide-circle-check' : 'i-lucide-copy'"
          :class="isCopy ? 'text-primary' : 'text-gray-400'"
        />
      </button>
    </template>
    <template #panel>
      <ApiCodeBlock
        v-if="exampleObjects"
        :code="exampleObjects"
        language="json"
      />
    </template>
  </ApiCode>
</template>
