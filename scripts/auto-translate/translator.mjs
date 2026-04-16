import fetch from 'node-fetch'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry(fn, attempts, baseDelayMs) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt)
    } catch (err) {
      lastError = err
      if (attempt < attempts) await sleep(baseDelayMs * (2 ** (attempt - 1)))
    }
  }
  throw lastError
}

function normalizeModelOutput(content) {
  let value = content.trim()
  if (value.startsWith('```json')) {
    value = value.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (value.startsWith('```')) {
    value = value.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  return value
}

export function createTranslator(config) {
  async function requestLLM(systemPrompt, userContent) {
    const payload = {
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1
    }

    return withRetry(async () => {
      const response = await fetch(`${config.openaiApiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000)
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`API ${response.status}: ${text}`)
      }

      const data = await response.json()
      const rawContent = data?.choices?.[0]?.message?.content || ''
      return normalizeModelOutput(rawContent)
    }, config.retryAttempts, config.retryBaseDelayMs)
  }

  // 文件级批量行翻译：一次调用翻译整个文件中所有唯一的待翻译行
  // 超过 CHUNK_SIZE 时自动分块并发，保证大文件不超出上下文窗口
  async function translateLinesBatch(lines, targetLang, context = '') {
    if (lines.length === 0) return []

    const CHUNK_SIZE = 80
    const systemPrompt = `Translate the Chinese lines to ${targetLang} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK. Do not rephrase English-only portions.
Preserve: Markdown syntax (**, *, \`, [], ()), icon prefixes (ri:xxx), quoted text as plain text (never bold).
Capitalization: use Title Case for headings; preserve English term casing consistently.
Completeness: translate every Chinese character — never leave Chinese in output.
YAML lines (key: value): wrap translated value in single quotes; use double quotes if it contains a single quote.
Output: JSON array of strings, same count and order as input. No other text.`

    const chunks = []
    for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
      chunks.push(lines.slice(i, i + CHUNK_SIZE))
    }

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        let lastResult = null
        try {
          return await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(chunk))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            if (parsed.length === chunk.length) return parsed
            lastResult = parsed
            throw new Error(`Expected ${chunk.length} results, got ${parsed.length}`)
          }, config.retryAttempts, config.retryBaseDelayMs)
        } catch {
          console.warn(`    ⚠️  translateLinesBatch: length mismatch, falling back${context ? ` [${context}]` : ''}`)
          if (lastResult && Array.isArray(lastResult)) {
            return chunk.map((src, i) => lastResult[i] ?? src)
          }
          return chunk
        }
      })
    )

    return results.flat()
  }

  // 简单批量翻译：一次 API 调用翻译整批字符串，不走 review 步骤
  // 适用于 YAML 字符串、独立短文本等不需要格式审校的场景
  // 超过 CHUNK_SIZE 时自动分批（并发）
  // options.yamlMode: true 时，要求 LLM 返回带 YAML 引号的字符串
  async function translateStrings(strings, targetLang, options = {}, context = '') {
    if (strings.length === 0) return []

    const CHUNK_SIZE = 50
    const chunks = []
    for (let i = 0; i < strings.length; i += CHUNK_SIZE) {
      chunks.push(strings.slice(i, i + CHUNK_SIZE))
    }

    const yamlQuoteRule = options.yamlMode
      ? `\nWrap each string in YAML quotes: single quotes by default; double quotes if the string contains a single quote.\nPreserve icon prefixes like "(ri:xxx-line)" at the start of strings — keep them exactly as-is, only translate the Chinese text that follows.`
      : ''

    const systemPrompt = `Translate Chinese strings to ${targetLang} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK, NLI. Translate faithfully — no rephrasing.
Preserve capitalization of embedded English; use Title Case for multi-word titles.
Return ONLY a JSON array of strings, same length and order as input. No other text.${yamlQuoteRule}`

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        let lastResult = null
        try {
          return await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(chunk))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            if (parsed.length === chunk.length) return parsed
            lastResult = parsed
            throw new Error(`Expected ${chunk.length} results, got ${parsed.length}`)
          }, config.retryAttempts, config.retryBaseDelayMs)
        } catch {
          // 降级：多了截断，少了用原文补齐
          console.warn(`    ⚠️  translateStrings: length mismatch, falling back${context ? ` [${context}]` : ''}`)
          if (lastResult && Array.isArray(lastResult)) {
            return chunk.map((src, i) => lastResult[i] ?? src)
          }
          return chunk // 完全失败则返回原文
        }
      })
    )

    return results.flat()
  }

  // 新文件快速路径：整块（段落）翻译，保留完整 Markdown 上下文
  // 使用 {id, text} 格式请求，按 id 回填结果，LLM 多返或少返时仍可逐块恢复
  async function translateBlocksBatch(blocks, targetLang, context = '') {
    if (blocks.length === 0) return []

    const CHUNK_SIZE = 50
    const systemPrompt = `Translate Chinese markdown blocks to ${targetLang} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK, NLI. Translate faithfully — no rephrasing.
Preserve ALL markdown syntax exactly (**, *, \`, #, [], (), ---, MDC components).
Capitalization: use Title Case for headings; preserve English term casing consistently.
Completeness: translate every Chinese character — never leave Chinese in output.
Input: JSON array of {id, text} objects. Output: JSON array of {id, text} objects, same count and order, no other text.`

    const chunks = []
    for (let i = 0; i < blocks.length; i += CHUNK_SIZE)
      chunks.push(blocks.slice(i, i + CHUNK_SIZE))

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const payload = chunk.map((text, i) => ({ id: i, text }))
        try {
          return await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            // 按 id 回填：LLM 多返或少返时，缺失的 id 保留原文
            const idMap = new Map(parsed.map(item => [item.id, item.text]))
            const missing = chunk.filter((_, i) => !idMap.has(i))
            if (missing.length > 0) console.warn(`    ⚠️  translateBlocksBatch: ${missing.length} block(s) missing in response, using original${context ? ` [${context}]` : ''}`)
            return chunk.map((src, i) => idMap.has(i) ? idMap.get(i) : src)
          }, config.retryAttempts, config.retryBaseDelayMs)
        } catch {
          console.warn(`    ⚠️  translateBlocksBatch: failed, using original${context ? ` [${context}]` : ''}`)
          return chunk
        }
      })
    )

    return results.flat()
  }

  return { translateLinesBatch, translateStrings, translateBlocksBatch }
}
