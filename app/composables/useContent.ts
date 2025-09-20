export function useContent(pageValue: { body: { value: Array<[string, object]> }, path: string }) {
  try {
    const { body, path } = pageValue

    if (path.includes('open_source')) {
      return pageValue
    }

    const newBodyValue: Array<[string, object]> = []
    body.value.forEach((item: [string, object], index: number) => {
      if (index === 0) {
        newBodyValue.push(item)
      } else {
        const preValue = body.value[index - 1]
        if (['h2', 'h3', 'h4'].includes(item[0]) && !['h2', 'h3', 'h4'].includes(preValue[0])) {
          newBodyValue.push(['br', {}])
        }

        newBodyValue.push(item)
      }
    })

    pageValue.body.value = newBodyValue

    return pageValue
  } catch (error) {
    console.error('Error in useContent:', error)
    return pageValue
  }
}
