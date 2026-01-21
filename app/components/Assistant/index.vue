<script setup lang="ts">
const {
  isOpen,
  messages,
  status,
  userInput,
  suggestions,
  toggleOpen,
  sendMessage,
  stopStreaming
} = useAssistant()

const onEnter = (e: KeyboardEvent) => {
  if (e.isComposing) {
    e.stopImmediatePropagation()
    return
  }
}

const handleFormSubmit = async () => {
  try {
    await sendMessage(userInput.value)
  } catch (error) {
    console.error('Failed to submit message:', error)
  }
}

const suggestionsRef = ref<HTMLElement | null>(null)

watch([suggestions, status], async () => {
  if (status.value === 'ready' && suggestions.value?.length > 0) {
    await nextTick()
    suggestionsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }
})
</script>

<template>
  <UDashboardSidebar
    v-if="isOpen"
    id="assistant"
    side="right"
    resizable
    :default-size="368"
    :min-size="368"
    :max-size="576"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <UIcon
          name="i-lucide:stars"
          class="text-primary"
        />
        <span class="font-medium">{{ $t('assistant.title') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="group flex items-center hover:bg-gray-100 dark:hover:bg-white/10 p-1.5 rounded-lg cursor-pointer"
          @click="toggleOpen"
        >
          <UIcon
            name="i-lucide:x"
            class="size-4"
          />
        </button>
      </div>
    </div>

    <UChatPalette
      :ui="{
        content: 'scrollbar-hide'
      }"
    >
      <UChatMessages
        :messages="messages"
        :status="status"
        should-auto-scroll
      >
        <template #content="{ message }">
          <MDCCached
            v-if="message.role === 'assistant'"
            :value="message.content"
            :cache-key="message.id"
            class="text-sm"
          />
          <p
            v-else-if="message.role === 'user'"
            class="text-sm whitespace-pre-wrap"
          >
            {{ message.content }}
          </p>
        </template>
      </UChatMessages>
      <div
        v-show="status === 'ready' && suggestions.length"
        ref="suggestionsRef"
        class="space-y-3 mb-4"
      >
        <div class="text-sm text-gray-300">
          {{ $t('assistant.suggestions') }}
        </div>
        <ul class="text-sm text-primary space-y-2">
          <li
            v-for="(item, index) in suggestions"
            :key="index"
            class="hover:text-primary/80 cursor-pointer"
            @click="sendMessage(item)"
          >
            {{ item }}
          </li>
        </ul>
      </div>
      <template #prompt>
        <UChatPrompt
          v-model="userInput"
          class="border border-white/10 px-2 rounded-t-lg"
          variant="soft"
          :placeholder="$t('assistant.inputPlaceholder')"
          :ui="{
            body: 'items-end'
          }"
          @keydown.enter.exact="onEnter"
          @submit="handleFormSubmit"
        >
          <UChatPromptSubmit
            size="sm"
            :status="status"
            @stop="stopStreaming"
          />
        </UChatPrompt>
      </template>
    </UChatPalette>
  </UDashboardSidebar>
</template>
