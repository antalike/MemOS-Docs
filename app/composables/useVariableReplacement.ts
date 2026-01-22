export const useVariableReplacement = () => {
  const config = useRuntimeConfig()

  const replaceVariables = (text: string) => {
    if (!text) return text

    return text.replace(/{{(\w+)}}/g, (match, key) => {
      return (config.public as unknown as Record<string, string>)[key] || match
    })
  }

  return {
    replaceVariables
  }
}
