export interface Message {
  id: string // Unique ID required by UChatMessages
  role: 'user' | 'assistant'
  content: string
  createAt?: Date
}

export type AssistantStatus = 'submitted' | 'streaming' | 'ready' | 'error'

// 直接声明每个状态变量 - 更简洁直观
const isOpen = ref(false)
const isMaximized = ref(false)
const messages = ref<Message[]>([])
const status = ref<AssistantStatus>('ready')
const error = ref<string | null>(null)
const userInput = ref('')
const suggestions = ref<string[]>([])

// 生成唯一的 Session ID
function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const sessionId = generateSessionId()

export const useAssistant = () => {
  // 派生状态
  const isStreaming = computed(() => status.value === 'streaming')
  const isReady = computed(() => status.value === 'ready')
  const hasError = computed(() => !!error.value)

  // 流控制
  let currentController: AbortController | null = null
  const { reqStream } = useStreamFetch()

  // 业务逻辑 - 窗口控制
  function toggleOpen() {
    isOpen.value = !isOpen.value
  }

  function toggleMaximize() {
    isMaximized.value = !isMaximized.value
  }

  // 业务逻辑 - 消息处理
  function setUserInput(value: string) {
    userInput.value = value
  }

  function setSuggestions(value: string[]) {
    suggestions.value = value
  }

  function addMessage(message: Message) {
    messages.value.push(message)
  }

  function setError(errorMessage: string | null) {
    error.value = errorMessage
    status.value = errorMessage ? 'error' : 'ready'
  }

  // 业务逻辑 - 流控制
  function stopStreaming() {
    if (currentController) {
      currentController.abort()
      currentController = null
      status.value = 'ready'
    }
  }

  // 会话初始化 - 确保干净的状态开始新对话
  function initialize() {
    // 1. 重置状态为准备就绪
    status.value = 'ready'
    error.value = null

    // 2. 清理残留的不完整消息
    if (messages.value.length > 0) {
      const lastMessage = messages.value[messages.value.length - 1]
      if (lastMessage?.role === 'assistant' && !lastMessage.content.trim()) {
        messages.value.pop()
      }
    }

    // 3. 确保控制器被清理
    if (currentController) {
      currentController.abort()
      currentController = null
    }
  }

  function updateLastMessage(content: string) {
    const lastIndex = messages.value.length - 1
    const lastMessage = messages.value[lastIndex]
    if (lastMessage) {
      messages.value = [
        ...messages.value.slice(0, lastIndex),
        {
          id: lastMessage.id,
          role: lastMessage.role,
          content: content,
          createAt: lastMessage.createAt
        }
      ]
    }
  }

  // 核心业务逻辑 - 发送消息
  async function sendMessage(input: string) {
    const query = input.trim()
    if (!query) return

    // 初始化会话状态
    initialize()

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      createAt: new Date()
    }
    addMessage(userMessage)

    // 清空输入框
    if (userInput.value) {
      setUserInput('')
    }

    // 添加助手占位消息
    const assistantId = (Date.now() + 1).toString()
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      createAt: new Date()
    })

    // 更新状态
    status.value = 'submitted'

    try {
      // 开始流式请求
      currentController = new AbortController()
      const stream = await reqStream<{ type: string, data: string | string[], error?: string }>('/memos-ai/kb_stream_chat', {
        method: 'POST',
        body: {
          user_id: sessionId,
          query
        },
        signal: currentController.signal
      })

      // 处理流式响应
      let assistantContent = ''

      for await (const chunk of stream) {
        if (status.value !== 'streaming') {
          status.value = 'streaming'
        }
        if (chunk.type === 'text' && chunk.data) {
          assistantContent += chunk.data

          // 直接更新最后一条消息，创建新数组以触发响应式更新和自动滚动
          updateLastMessage(assistantContent)
        } else if (chunk.type === 'suggestions' && Array.isArray(chunk.data)) {
          setSuggestions(chunk.data as string[])
        } else if (chunk.error) {
          throw new Error(chunk.error)
        }
      }

      // 完成
      status.value = 'ready'
    } catch (error) {
      status.value = 'ready'
      updateLastMessage('系统异常，请稍后再试')
      console.error('Failed to get assistant response:', error)
    } finally {
      currentController = null
    }
  }

  // 返回统一的API - 简洁直观
  return {
    // 状态变量 - 直接暴露，支持v-model
    isOpen,
    isMaximized,
    userInput,
    messages,
    status,
    error,
    suggestions,

    // 派生状态 - 便于使用
    isStreaming,
    isReady,
    hasError,

    // 业务方法 - 状态修改的唯一入口
    toggleOpen,
    toggleMaximize,
    setUserInput,
    sendMessage,
    stopStreaming,
    setError
  }
}
