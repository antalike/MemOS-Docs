<script setup lang="ts">
const {
  isOpen,
  messages,
  status,
  userInput,
  toggleOpen,
  sendMessage,
  stopStreaming
} = useAssistant()

const onEnter = (e: KeyboardEvent) => {
  e.stopImmediatePropagation()
}

const handleFormSubmit = async () => {
  try {
    await sendMessage()
  } catch (error) {
    console.error('Failed to submit message:', error)
  }
}
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
      <template #prompt>
        <UChatPrompt
          v-model="userInput"
          class="border border-white/10 px-2 rounded-t-lg"
          variant="soft"
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
