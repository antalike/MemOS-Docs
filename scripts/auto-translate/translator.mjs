import fetch from 'node-fetch'

// 将语言代码转为 LLM 能明确理解的全名，降低模型输出错误语言的概率
const LANG_NAMES = {
  en: 'English', zh: 'Chinese', ko: 'Korean', ja: 'Japanese',
  fr: 'French',  de: 'German',  es: 'Spanish', pt: 'Portuguese',
  ru: 'Russian', ar: 'Arabic',  hi: 'Hindi',   it: 'Italian',
}
function langName(code) {
  return LANG_NAMES[code?.toLowerCase()] ?? code
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 粗略估算文本 token 数：汉字约 1.5 chars/token，其余约 4 chars/token
function estimateTokens(text) {
  const hanCount = (text.match(/[\u4e00-\u9fff]/g) ?? []).length
  return Math.ceil(hanCount / 1.5 + (text.length - hanCount) / 4)
}

// 按 token 预算 + 条数上限分块，两个条件任一触发即换块
// token 预算：防止单个超大块成为并发瓶颈
// 条数上限：防止小块堆积导致 JSON 体积过大，LLM 返回格式错误概率上升
// 单块超出 token 预算时单独成一块，不强制拆分块内容
function chunkByTokenBudget(items, budget, maxItems = 50, getText = (x) => x) {
  const chunks = []
  let cur = [], curTokens = 0
  for (const item of items) {
    const t = estimateTokens(getText(item))
    if (cur.length > 0 && (curTokens + t > budget || cur.length >= maxItems)) {
      chunks.push(cur)
      cur = []
      curTokens = 0
    }
    cur.push(item)
    curTokens += t
  }
  if (cur.length > 0) chunks.push(cur)
  return chunks
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

  // 1. Try direct parsing first
  try {
    const directParsed = JSON.parse(value)
    // If OpenAI wraps the array in an object (e.g. {"items": [...]}), extract it
    if (!Array.isArray(directParsed) && typeof directParsed === 'object' && directParsed !== null) {
      const arrays = Object.values(directParsed).filter(v => Array.isArray(v))
      if (arrays.length === 1) return JSON.stringify(arrays[0])
    }
    return value
  } catch {
    // Ignore direct parse failure, proceed to robust extraction
  }

  // 2. Robust regex extraction: Find the outermost valid JSON array
  // This avoids indexOf('[') being broken by markdown links like [text](url)
  const arrayMatch = value.match(/\[\s*\{[\s\S]*\}\s*\]/)
  if (arrayMatch) {
    try {
      JSON.parse(arrayMatch[0])
      return arrayMatch[0]
    } catch {
      // Ignore
    }
  }

  // 3. Fallback object extraction
  const objectMatch = value.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    try {
      JSON.parse(objectMatch[0])
      return objectMatch[0]
    } catch {
      // Ignore
    }
  }

  return value
}

export function createTranslator(config) {
  async function requestLLM(systemPrompt, userContent) {
    // response_format: json_object forces an object wrapper, breaking array responses on strict models (e.g. gpt-3.5-turbo).
    // Rely on prompt-level instructions instead, which works across all models.
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

  // 单行降级翻译：不要求 JSON array，直接返回翻译后的纯文本
  // 用于 translateLinesBatch 批量失败后的逐行兜底，避免原文残留
  async function translateSingleLine(line, targetLang) {
    const systemPrompt = `Translate the Chinese text in the following line to ${langName(targetLang)} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK. Do not rephrase English-only portions.
Preserve ALL non-Chinese content exactly as-is (JSON keys, code syntax, punctuation, escape sequences like \\n).
Return ONLY the translated line. No explanation, no extra text, no wrapping.`

    try {
      return await withRetry(async () => {
        return await requestLLM(systemPrompt, line)
      }, config.retryAttempts, config.retryBaseDelayMs)
    } catch (err) {
      console.warn(`    ⚠️  translateSingleLine: all retries failed, keeping original. Error: ${err?.message ?? err}`)
      return line
    }
  }

  // 文件级批量行翻译：一次调用翻译整个文件中所有唯一的待翻译行
  // 超过 CHUNK_SIZE 时自动分块并发，保证大文件不超出上下文窗口
  // 批量失败（长度不匹配）时降级为逐行翻译，保证每行都能翻译
  async function translateLinesBatch(lines, targetLang, context = '') {
    if (lines.length === 0) return []

    // gpt-3.5-turbo has limited output tokens; use token-based chunking to prevent truncated JSON.
    // TOKEN_BUDGET bounds input tokens; MAX_ITEMS caps line count independently because many short
    // lines can still produce large output (Russian/Cyrillic output is 1.5-2x longer than Chinese input).
    const TOKEN_BUDGET = config.model?.includes('gpt-3.5') ? 400 : 2000
    const MAX_ITEMS = config.model?.includes('gpt-3.5') ? 15 : 50
    const systemPrompt = `Translate the Chinese lines to ${langName(targetLang)} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK. Do not rephrase English-only portions.
Preserve: Markdown syntax (**, *, \`, [], ()), icon prefixes (ri:xxx), quoted text as plain text (never bold).
Capitalization: use Title Case for headings; preserve English term casing consistently.
Completeness: translate every Chinese character — never leave Chinese in output.
YAML lines (key: value): if the translated value needs quotes, include them INSIDE the JSON string (e.g., {"id": 0, "text": "key: 'value'"}).
Input: JSON array of {id, text} objects. Output MUST be a valid JSON array of {id, text} objects, using double quotes for JSON syntax, same count and order as input. No other text.
IMPORTANT: You must properly escape all internal double quotes (\\") and newlines (\\n) within the text values.`

    const chunks = chunkByTokenBudget(lines, TOKEN_BUDGET, MAX_ITEMS)

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const payload = chunk.map((text, i) => ({ id: i, text }))
        try {
          const idMap = await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            return new Map(parsed.map(item => [item.id, item.text]))
          }, config.retryAttempts, config.retryBaseDelayMs)

          // 按 id 回填；缺失的 id 逐条降级翻译，不保留原文
          const missingIds = chunk.map((_, i) => i).filter(i => !idMap.has(i))
          if (missingIds.length > 0) {
            console.warn(`    ⚠️  translateLinesBatch: ${missingIds.length} item(s) missing, retrying individually${context ? ` [${context}]` : ''}`)
            await Promise.all(missingIds.map(async (i) => {
              idMap.set(i, await translateSingleLine(chunk[i], targetLang))
            }))
          }
          return chunk.map((src, i) => idMap.get(i) ?? src)
        } catch (err) {
          console.warn(`    ⚠️  translateLinesBatch: batch failed (${err?.message || err}), falling back to line-by-line${context ? ` [${context}]` : ''}`)
          return Promise.all(chunk.map(line => translateSingleLine(line, targetLang)))
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
      ? `\nIf the string is a YAML value, you may wrap the translated value in quotes INSIDE the JSON string (e.g., {"id": 0, "text": "'translated'"}).\nPreserve icon prefixes like "(ri:xxx-line)" at the start of strings — keep them exactly as-is, only translate the Chinese text that follows.`
      : ''

    const systemPrompt = `Translate Chinese strings to ${langName(targetLang)} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK, NLI. Translate faithfully — no rephrasing.
Preserve capitalization of embedded English; use Title Case for multi-word titles.
Output MUST be a valid JSON array of {id, text} objects, using double quotes for JSON syntax, same order as input. No other text.${yamlQuoteRule}`

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const payload = chunk.map((text, i) => ({ id: i, text }))
        try {
          const idMap = await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            return new Map(parsed.map(item => [item.id, item.text]))
          }, config.retryAttempts, config.retryBaseDelayMs)

          // 按 id 回填；缺失的 id 逐条降级翻译，不保留原文
          const missingIds = chunk.map((_, i) => i).filter(i => !idMap.has(i))
          if (missingIds.length > 0) {
            console.warn(`    ⚠️  translateStrings: ${missingIds.length} item(s) missing, retrying individually${context ? ` [${context}]` : ''}`)
            await Promise.all(missingIds.map(async (i) => {
              idMap.set(i, await translateSingleLine(chunk[i], targetLang))
            }))
          }
          return chunk.map((src, i) => idMap.get(i) ?? src)
        } catch {
          // 整批失败：逐条降级翻译
          console.warn(`    ⚠️  translateStrings: batch failed, falling back to line-by-line${context ? ` [${context}]` : ''}`)
          return Promise.all(chunk.map(line => translateSingleLine(line, targetLang)))
        }
      })
    )

    return results.flat()
  }

  // 单块降级翻译：translateBlocksBatch 批量失败后的逐块兜底
  async function translateSingleBlock(block, targetLang) {
    const systemPrompt = `Translate the following Chinese markdown block to ${langName(targetLang)} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK, NLI. Translate faithfully — no rephrasing.
Preserve ALL markdown syntax exactly (**, *, \`, #, [], (), ---, MDC components).
Return ONLY the translated block. No explanation, no extra text, no wrapping.`
    try {
      return await withRetry(async () => {
        return await requestLLM(systemPrompt, block)
      }, config.retryAttempts, config.retryBaseDelayMs)
    } catch (err) {
      console.warn(`    ⚠️  translateSingleBlock: all retries failed, keeping original. Error: ${err?.message ?? err}`)
      return block
    }
  }

  // 新文件快速路径：整块（段落）翻译，保留完整 Markdown 上下文
  // 使用 {id, text} 格式请求，按 id 回填结果，LLM 多返或少返时仍可逐块恢复
  // 按 token 预算分块而非固定条数，避免超大块成为并发瓶颈
  async function translateBlocksBatch(blocks, targetLang, context = '') {
    if (blocks.length === 0) return []

    // gpt-3.5-turbo has limited output tokens; use a smaller budget to avoid truncated JSON
    const TOKEN_BUDGET = config.model?.includes('gpt-3.5') ? 800 : 2000
    const systemPrompt = `Translate Chinese markdown blocks to ${langName(targetLang)} for technical docs.
Do NOT translate: MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, SDK, NLI. Translate faithfully — no rephrasing.
Preserve ALL markdown syntax exactly (**, *, \`, #, [], (), ---, MDC components).
Capitalization: use Title Case for headings; preserve English term casing consistently.
Completeness: translate every Chinese character — never leave Chinese in output.
Output MUST be a strictly valid JSON array of {id, text} objects, same count and order as input.
IMPORTANT: You must properly escape all internal double quotes (\\") and newlines (\\n) within the text values to ensure valid JSON syntax.`

    const chunks = chunkByTokenBudget(blocks, TOKEN_BUDGET)

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
        } catch (err) {
          console.warn(`    ⚠️  translateBlocksBatch: failed (${err?.message || err}), falling back to block-by-block${context ? ` [${context}]` : ''}`)
          return Promise.all(chunk.map(block => translateSingleBlock(block, targetLang)))
        }
      })
    )

    return results.flat()
  }

  return { translateLinesBatch, translateStrings, translateBlocksBatch }
}
