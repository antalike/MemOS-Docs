export type JSONPrimitive = string | number | boolean | null
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function renderHighlightedJson(value: JSONValue, indent = 0): string {
  const pad = '  '.repeat(indent)
  const nextPad = '  '.repeat(indent + 1)

  if (value === null) return '<span class="text-[#9cdcfe]">null</span>'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value
      .map((v, i) => `${nextPad}${renderHighlightedJson(v as JSONValue, indent + 1)}${i < value.length - 1 ? '<span class="text-[#f3f7f6]">,</span>' : ''}`)
      .join('\n')
    return `[
${items}
${pad}]`
  }
  const type = typeof value
  if (type === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    const inner = entries
      .map(([k, v], i) => `${nextPad}<span class="text-[#9CDCFE]">"${escapeHtml(k)}"</span><span class="text-[#f3f7f6]">: </span>${renderHighlightedJson(v as JSONValue, indent + 1)}${i < entries.length - 1 ? '<span class=\\"text-[#f3f7f6]\\">,</span>' : ''}`)
      .join('\n')
    return `{
${inner}
${pad}}`
  }
  if (type === 'number') return `<span class="text-[#B5CEA8]">${value}</span>`
  if (type === 'boolean') return `<span class="text-[#B5CEA8]">${value}</span>`
  return `<span class="text-[#CE9178]">"${escapeHtml(String(value))}"</span>`
}
