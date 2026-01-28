export default function remarkReplaceDomains(options = {}) {
  const imageDomains = options.imageDomains || {}
  const linkDomains = options.linkDomains || {}

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  return (tree) => {
    function visit(node) {
      // Handle standard markdown images: ![alt](url)
      if (node.type === 'image' && node.url && typeof node.url === 'string') {
        Object.keys(imageDomains).forEach((key) => {
          if (node.url.startsWith(key)) {
            node.url = node.url.replace(key, imageDomains[key])
          }
        })
      }

      // Handle standard markdown links: [text](url)
      if (node.type === 'link' && node.url && typeof node.url === 'string') {
        Object.keys(linkDomains).forEach((key) => {
          if (node.url.startsWith(key)) {
            node.url = node.url.replace(key, linkDomains[key])
          }
        })
      }

      // Handle code blocks
      if (node.type === 'code' && node.value && typeof node.value === 'string') {
        Object.keys(linkDomains).forEach((key) => {
          const regex = new RegExp(escapeRegExp(key), 'g')
          node.value = node.value.replace(regex, linkDomains[key])
        })
      }

      // Handle HTML nodes for both images and links
      if (node.type === 'html' && node.value && typeof node.value === 'string') {
        // Replace image sources
        Object.keys(imageDomains).forEach((key) => {
          const regex = new RegExp(`(<img\\s+(?:[^>]*?\\s+)?src=["'])(${escapeRegExp(key)})([^"']*["'][^>]*>)`, 'gi')
          node.value = node.value.replace(regex, (match, p1, p2, p3) => {
            return `${p1}${imageDomains[key]}${p3}`
          })
        })

        // Replace link hrefs
        Object.keys(linkDomains).forEach((key) => {
          const regex = new RegExp(`(<a\\s+(?:[^>]*?\\s+)?href=["'])(${escapeRegExp(key)})([^"']*["'][^>]*>)`, 'gi')
          node.value = node.value.replace(regex, (match, p1, p2, p3) => {
            return `${p1}${linkDomains[key]}${p3}`
          })
        })
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(visit)
      }
    }

    visit(tree)
  }
}
