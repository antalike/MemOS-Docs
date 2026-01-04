export function useApiResponse(
  path: Ref<string> | string,
  method: Ref<HttpMethods> | HttpMethods,
  collectionName?: CollectionName
) {
  const _collectionName = collectionName || inject<CollectionName>('collectionName')
  const {
    getResponseStatusCodes,
    getResponseContentTypes
  } = useOpenApi(_collectionName)

  const _path = toRef(path)
  const _method = toRef(method)

  const currentCode = ref<string | number>('200')
  const currentContentType = ref<string>('')

  const statusCodes = computed(() => {
    return getResponseStatusCodes(_path.value, _method.value)
  })

  const contentTypes = computed(() => {
    return getResponseContentTypes(_path.value, _method.value, currentCode.value)
  })

  watch(contentTypes, (newTypes) => {
    if (newTypes.length > 0 && (!currentContentType.value || !newTypes.includes(currentContentType.value))) {
      currentContentType.value = newTypes[0]!
    }
  }, { immediate: true })

  return {
    currentCode,
    currentContentType,
    statusCodes,
    contentTypes
  }
}
