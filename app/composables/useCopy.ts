export function useCopy() {
  const isCopy = ref<boolean>(false)
  let timer: ReturnType<typeof setTimeout>

  onUnmounted(() => {
    clearTimeout(timer)
  })

  function handleCopy(text: string) {
    if (!text) return
    navigator.clipboard.writeText(text)
    isCopy.value = true
    timer = setTimeout(() => {
      isCopy.value = false
    }, 2000)
  }

  return {
    isCopy,
    handleCopy
  }
}
