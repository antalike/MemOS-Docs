export default function remarkVariables(options = {}) {
  const variables = options.variables || {}

  function replace(text) {
    if (typeof text !== 'string') return text
    let newText = text
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      newText = newText.replace(regex, variables[key])
    })
    return newText
  }

  return (tree) => {
    function visit(node) {
      if (node.value && typeof node.value === 'string') {
        if (node.type !== 'code' && node.type !== 'inlineCode') {
          node.value = replace(node.value)
        }
      }

      if (node.url && typeof node.url === 'string') {
        node.url = replace(node.url)
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(visit)
      }
    }

    visit(tree)
  }
}
