<script setup lang="ts">
interface CodeItem {
  label: string
  value: string
  icon?: string
  language: 'python' | 'bash'
}

const props = defineProps<{
  apiData?: FlatPathProps
}>()

const collectionName = inject<CollectionName>('collectionName')

const { openapi } = useOpenApi(collectionName)

const codeLang = ref('python-http')
const codeItems = ref<CodeItem[]>([
  {
    label: 'Python (HTTP)',
    value: 'python-http',
    icon: 'mdi:language-python',
    language: 'python'
  },
  {
    label: 'Python (SDK)',
    value: 'python-sdk',
    icon: 'mdi:language-python',
    language: 'python'
  },
  {
    label: 'cURL',
    value: 'curl',
    icon: 'devicon-plain:bash',
    language: 'bash'
  }
])
const activeItem = computed(() => {
  return codeItems.value?.find((i: CodeItem) => i.value === codeLang.value)
})

const snippets = computed<Record<string, string>>(() => {
  return {
    'curl': generateSnippet(openapi.value, props.apiData, 'curl'),
    'python-http': generateSnippet(openapi.value, props.apiData, 'python-http'),
    'python-sdk': generateSnippet(openapi.value, props.apiData, 'python-sdk')
  }
})

const codeText = computed(() => snippets.value[codeLang.value] || '')
const isCopy = ref<boolean>(false)
let timer: ReturnType<typeof setTimeout>

onUnmounted(() => {
  clearTimeout(timer)
})

async function handleCopy() {
  navigator.clipboard.writeText(codeText.value || '')
  isCopy.value = true
  timer = setTimeout(() => {
    isCopy.value = false
  }, 2000)
}
</script>

<template>
  <ApiCode class="mb-4">
    <template #header>
      <div class="flex items-center gap-1.5 text-xs font-medium min-w-0 py-2">
        <span class="truncate text-gray-950 dark:text-gray-50">
          {{ activeItem?.label }}
        </span>
      </div>
      <div class="flex gap-1.5">
        <USelect
          v-model="codeLang"
          color="neutral"
          variant="none"
          size="xs"
          trailing-icon="i-lucide:chevrons-up-down"
          :icon="activeItem?.icon"
          :items="codeItems"
          :ui="{
            content: 'min-w-[170px]',
            leadingIcon: 'w-3.5 h-3.5',
            trailingIcon: 'w-3.5 h-3.5'
          }"
        />
        <button
          class="cursor-pointer"
          @click="handleCopy"
        >
          <UIcon
            :name=" isCopy ? 'i-lucide-circle-check' : 'i-lucide-copy'"
            :class="isCopy ? 'text-primary' : 'text-gray-400'"
          />
        </button>
      </div>
    </template>
    <template #panel>
      <ApiCodeBlock
        :code="codeText"
        :language="activeItem?.language"
      />
    </template>
  </ApiCode>
</template>
