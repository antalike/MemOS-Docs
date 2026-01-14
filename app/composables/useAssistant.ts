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

  // 核心业务逻辑 - 发送消息
  async function sendMessage() {
    const input = userInput.value.trim()

    if (!input) return

    // 初始化会话状态
    initialize()

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createAt: new Date()
    }
    addMessage(userMessage)

    // 清空输入框
    setUserInput('')

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
      // 准备请求消息
      const requestMessages = messages.value
        .map(m => ({
          role: m.role,
          content: m.content || (m.role === 'assistant' ? ' ' : '')
        }))
        .slice(0, -1) // 移除最后的空助手消息

      // 开始流式请求
      currentController = new AbortController()
      const stream = await reqStream<{ content: string, error?: string }>('/api/chat', {
        method: 'POST',
        body: {
          model: 'deepseek-chat',
          messages: requestMessages
        },
        signal: currentController.signal
      })

      // 处理流式响应
      status.value = 'streaming'
      let assistantContent = ''

      for await (const chunk of stream) {
        if (chunk.content) {
          assistantContent += chunk.content

          // 直接更新最后一条消息，创建新数组以触发响应式更新和自动滚动
          const lastIndex = messages.value.length - 1
          const lastMessage = messages.value[lastIndex]
          if (lastMessage) {
            messages.value = [
              ...messages.value.slice(0, lastIndex),
              {
                id: lastMessage.id,
                role: lastMessage.role,
                content: assistantContent,
                createAt: lastMessage.createAt
              }
            ]
          }
        } else if (chunk.error) {
          throw new Error(chunk.error)
        }
      }

      // 完成
      status.value = 'ready'
    } catch (error) {
      // 错误处理
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
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
