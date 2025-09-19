export function useContent(pageValue: { body: { value: Array<[string, object]> }, path: string }) {
  const { body, path } = pageValue

  if (path.includes('open_source')) {
    return pageValue
  }

  const newBodyValue: Array<[string, object]> = []
  body.value.forEach((item: [string, object], index: number) => {
    if (index === 0) {
      newBodyValue.push(item)
    } else {
      if (['h2', 'h3', 'h4'].includes(item[0])) {
        newBodyValue.push(['br', {}])
      }

      newBodyValue.push(item)
    }
  })

  pageValue.body.value = newBodyValue

  return pageValue
}
