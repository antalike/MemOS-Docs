import fetch from 'node-fetch'

// 将语言代码转为 LLM 能明确理解的全名，降低模型输出错误语言的概率
const LANG_NAMES = {
  en: 'English', zh: 'Chinese', ko: 'Korean', ja: 'Japanese',
  fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese',
  ru: 'Russian', ar: 'Arabic', hi: 'Hindi', it: 'Italian'
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
function chunkByTokenBudget(items, budget, maxItems = 50, getText = x => x) {
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

const NO_TRANSLATE_TERMS = 'MemOS, MemCube, MOS, KV Cache, LoRA, LLM, API, API Key, SDK, token, tokens, Prompt, Agent, Schema, Trajectory'
const NO_TRANSLATE_TERMS_WITH_NLI = `${NO_TRANSLATE_TERMS}, NLI`

// 跨文件一致性词汇表：源语言词条 → 各目标语言的指定译法
// 用于需要固定译名的内部标签（如记忆元数据标记），避免同一术语在不同文件中出现不同译法
const TERM_GLOSSARY = {
  en: [
    { src: '[assistant观点]',  tgt: '[assistant view]'          },
    { src: '[模型总结]',       tgt: '[model summary]'            },
    { src: '激活记忆',         tgt: 'Activation Memory'          },
    { src: '明文记忆',         tgt: 'Plaintext Memory'           },
    { src: 'KV 缓存',          tgt: 'KV Cache'                   },
    { src: 'KV缓存',           tgt: 'KV Cache'                   },
    { src: '原始的对话记录',   tgt: 'original conversation records' },
    { src: '自动抽象加工并保存为记忆', tgt: 'automatically abstract, process, and save them as memories' },
    { src: '智能体',           tgt: 'Agent'                      },
    { src: '记忆库',           tgt: 'memory store'               },
    { src: '严禁',             tgt: 'Never'                      }
  ],
  ja: [
    { src: '[assistant观点]',  tgt: '[assistant観点]'            },
    { src: '[模型总结]',       tgt: '[モデルの要約]'              },
    { src: '激活记忆',         tgt: '活性化記憶'                  },
    { src: '明文记忆',         tgt: '平文記憶'                    },
    { src: 'KV 缓存',          tgt: 'KV Cache'                   },
    { src: 'KV缓存',           tgt: 'KV Cache'                   },
    { src: '原始的对话记录',   tgt: '生の会話記録'                },
    { src: '自动抽象加工并保存为记忆', tgt: '自動的に抽象化・加工し、記憶として保存'  },
    { src: 'RAG',              tgt: '検索拡張生成'                },
    { src: '核心概念',          tgt: 'コアコンセプト'              }
  ]
}

// 根据实际文本内容动态检测需要注入的翻译规则
// inCodeContext=true 表示文本本身就是代码块内容（如从代码块逐行提取的行），不需要再检测 fence 边界
// targetLang 用于注入词汇表规则（可选）
function detectContentRules(text, inCodeContext = false, targetLang = null) {
  const rules = []

  // 收集代码块内文本
  let codeText = ''
  if (inCodeContext) {
    codeText = text
  } else {
    const fenceRe = /```[^\n]*\n([\s\S]*?)```/g
    let m
    while ((m = fenceRe.exec(text)) !== null) codeText += m[1] + '\n'
  }

  // JSON 属性值为中文 → 翻译 value，保留 key
  if (codeText && /:\s*"[^"\n]*[一-鿿][^"\n]*"/.test(codeText)) {
    const jsonValueExample = targetLang === 'ja'
      ? '{"scene":"账单"} → {"scene":"請求"}'
      : '{"scene":"账单"} → {"scene":"billing"}'
    rules.push(`JSON string value that is Chinese MUST be translated — translate the quoted value after the colon, keep the key exactly as-is (e.g., ${jsonValueExample}).`)
  }

  // 代码块注释为中文 → 翻译注释
  if (codeText && /^\s*(?:#|\/\/)[^\n]*[一-鿿]/m.test(codeText)) {
    rules.push('Chinese comment lines inside code (starting with # or //) MUST be translated.')
  }

  // YAML key: value 且 value 含中文 → 必须翻译，并说明引号处理
  if (/^[^\s:#][^:\n]*:\s+[^\n]*[一-鿿]/m.test(text)) {
    rules.push('YAML line (key: value): the Chinese text in the value MUST be translated — do NOT leave Chinese characters in any YAML value (including title, desc, and other fields). If the translated value contains special characters that require quoting, include the quotes inside the output string (e.g., key: \'value\').')
  }

  // markdown 锚点链接 → 分类处理 #fragment
  // 跨文档锚点 [text](./path#fragment)：fragment 完整保留，不得翻译（目标页 heading 是否翻译未知）
  // 纯页内锚点 [text](#fragment)：fragment 中的英文前缀和符号不变；但如果 fragment 中含中文，
  //   应将该中文翻译为目标语言并重新生成 slug（小写，空格转连字符），以保证页内跳转有效
  if (/\[[^\]]*\]\([^)]*#[^)]+\)/.test(text)) {
    const hasCrossDoc = /\[[^\]]*\]\([^)#]+#[^)]+\)/.test(text)
    const hasPageLocal = /\[[^\]]*\]\(#[^)]+\)/.test(text)
    if (hasCrossDoc) {
      rules.push('Cross-document link [...](path#fragment): copy the ENTIRE href string (path and fragment) character-for-byte from the source — do NOT translate, modify, or romanize any character inside the parentheses.')
    }
    if (hasPageLocal) {
      rules.push('Page-internal link [...](#fragment): if the fragment contains only ASCII/Latin characters and hyphens (e.g. #api-reference), copy it verbatim. If the fragment contains Chinese characters mixed with an ASCII prefix (e.g. #generaltextmemory-通用文本记忆), keep the ASCII prefix exactly and translate ONLY the Chinese suffix into the target language, then slugify it (lowercase, spaces → hyphens). Example: #generaltextmemory-通用文本记忆 in a Japanese translation → #generaltextmemory-汎用テキスト記憶. The translated link text and the fragment suffix must refer to the same concept.')
    }
  }

  // 占位符存在时 → 说明 <phN/> token 的用途（实际内容在发送前已替换为 <ph0/> 等 token）
  if (/\{[a-zA-Z0-9_]+\}/.test(text)) {
    rules.push('The input contains <phN/> tokens (e.g. <ph0/>, <ph1/>) that represent protected placeholders substituted before translation. Copy each token verbatim to its original position in the output. Do NOT translate, rename, move, split, or omit them.')
  }

  // 独立 :: / ::: 行（callout / code-group 关闭标记）→ 必须原样保留
  // 这类行不含中文，LLM 容易将末尾的 :: 视为多余内容而省略
  if (!inCodeContext && /^:{2,3}\s*$/m.test(text)) {
    rules.push('Lines that consist only of `::` or `:::` are callout/code-group closing markers — output them as a standalone line in exactly the same position as in the source. Do NOT omit, merge, or move them.')
  }

  // 行内代码（backtick span）含中文 → 翻译中文内容但必须保持整个 span 在一对反引号内
  // 典型场景：`stream=true 或者 false` → `stream=true or false`（不能拆成两个 span）
  if (/`[^`]*[一-鿿][^`]*`/.test(text)) {
    rules.push('Inline code spans (backtick-wrapped) that contain Chinese text: translate ONLY the Chinese portion inside the backticks, but keep the entire content within a SINGLE backtick span. Do NOT split one backtick span into multiple spans or add extra backticks. Example: `stream=true 或者 false` → `stream=true or false` (one span, not two).')
  }

  // 版本号含 + 后缀 → 禁止翻译为自然语言（如 以上、以降）
  if (/\b\w[\w.]*\d\+/.test(text)) {
    rules.push('Version strings with a "+" suffix (e.g., Python 3.10+, v2.0+) must be reproduced exactly as-is, including the "+" character. Do NOT convert "+" to natural language equivalents such as "以上", "以降", "or later", or "and above".')
  }

  // JA 专项：KV Cache 禁止音译为片假名
  if (targetLang === 'ja' && /KV\s*[Cc]ache/i.test(text)) {
    rules.push('The term "KV Cache" must be output as the Latin string "KV Cache" in Japanese — do NOT transliterate to katakana (e.g., do NOT write "KV キャッシュ").')
  }

  // 词汇表：对指定术语注入固定译法，确保跨文件一致性
  if (targetLang) {
    const entries = (TERM_GLOSSARY[targetLang] ?? []).filter(e => text.includes(e.src))
    if (entries.length > 0) {
      const pairs = entries.map(e => `"${e.src}" → "${e.tgt}"`).join(', ')
      rules.push(`Term glossary — translate these exactly as specified, including inside code blocks: ${pairs}.`)
    }
  }

  return rules
}

function buildPrompt(targetLang, mode, options = {}) {
  const target = langName(targetLang)
  const BASE_STYLE = `write in professional technical-documentation style in ${target}: clear, precise, concise, and objective. Prefer natural technical phrasing over word-for-word literal translation, preserve logical relations and modality, and keep terminology consistent across the document.`
  const JA_TONE_RULE = targetLang === 'ja'
    ? 'Japanese tone: use plain/neutral style (だ・である体) throughout — NOT polite style (です・ます体). Example: ✅「考慮する必要がある」❌「考慮する必要があります」.'
    : null
  const BASE_ENGLISH_RULE = 'Do not rephrase English-only portions.'
  const BASE_PRESERVE_RULE = 'Preserve non-Chinese content exactly as-is, including Markdown syntax, code syntax, JSON keys, punctuation, capitalization, icon prefixes (ri:xxx), and quoted text formatting. Preserve line breaks semantically; in JSON strings use \\n and do NOT double-escape as \\\\n. Inline code spans (text wrapped in backticks `` ` ``) that contain only non-Chinese content must be reproduced verbatim. If a backtick span contains Chinese, translate the Chinese but keep the surrounding backticks.'
  const URL_RULES = {
    plain: 'copy every URL character-for-character. Never modify underscores, hyphens, or casing inside a URL.',
    markdown: 'copy every URL and markdown link target character-for-character. Never modify underscores, hyphens, casing, or any character inside a URL or link href.'
  }
  const OUTPUT_RULES = {
    linesBatch: `Input: JSON array of {id, text} objects. Output MUST be a valid JSON array of {id, text} objects, using double quotes for JSON syntax, same count and order as input. No other text.
IMPORTANT: Use valid JSON escaping. Escape internal double quotes as \\". Represent line breaks as \\n in JSON strings (these become real newlines after JSON.parse). Do NOT double-escape line breaks as \\\\n.`,
    stringsBatch: 'Output MUST be a valid JSON array of {id, text} objects, using double quotes for JSON syntax, same order as input. No other text.',
    blocksBatch: `Output MUST be a strictly valid JSON array of {id, text} objects, same count and order as input.
IMPORTANT: Use valid JSON escaping. Escape internal double quotes as \\". Represent line breaks as \\n in JSON strings (these become real newlines after JSON.parse). Do NOT double-escape line breaks as \\\\n.`,
    singleLine: 'Return ONLY the translated line. No explanation, no extra text, no wrapping.',
    singleBlock: 'Return ONLY the translated block. No explanation, no extra text, no wrapping.'
  }

  const modeProfiles = {
    singleLine: {
      task: `Translate the Chinese text in the following line to ${target}.`,
      terms: NO_TRANSLATE_TERMS,
      url: URL_RULES.plain,
      output: OUTPUT_RULES.singleLine
    },
    linesBatch: {
      task: `Translate the Chinese lines to ${target}.`,
      terms: NO_TRANSLATE_TERMS,
      url: URL_RULES.markdown,
      output: OUTPUT_RULES.linesBatch
    },
    stringsBatch: {
      task: `Translate Chinese strings to ${target}.`,
      terms: NO_TRANSLATE_TERMS_WITH_NLI,
      url: URL_RULES.plain,
      extraRule: options.yamlMode
        ? `If the string is a YAML value, you may wrap the translated value in quotes INSIDE the JSON string (e.g., {"id": 0, "text": "'translated'"}).
Preserve icon prefixes like "(ri:xxx-line)" at the start of strings — keep them exactly as-is, only translate the Chinese text that follows.`
        : null,
      output: OUTPUT_RULES.stringsBatch
    },
    singleBlock: {
      task: `Translate the following Chinese markdown block to ${target}.`,
      terms: NO_TRANSLATE_TERMS_WITH_NLI,
      url: URL_RULES.markdown,
      output: OUTPUT_RULES.singleBlock
    },
    blocksBatch: {
      task: `Translate Chinese markdown blocks to ${target}.`,
      terms: NO_TRANSLATE_TERMS_WITH_NLI,
      url: URL_RULES.markdown,
      output: OUTPUT_RULES.blocksBatch
    }
  }

  const profile = modeProfiles[mode]
  if (!profile) throw new Error(`Unknown prompt mode: ${mode}`)

  return [
    `You are a professional technical documentation translator. ${profile.task}`,
    `Style: ${BASE_STYLE}`,
    JA_TONE_RULE,
    `Do NOT translate proper nouns: ${profile.terms}. ${BASE_ENGLISH_RULE}`,
    `URLs and link targets: ${profile.url}`,
    BASE_PRESERVE_RULE,
    profile.capitalization ? `Capitalization: ${profile.capitalization}` : null,
    profile.completeness ? `Completeness: ${profile.completeness}` : null,
    profile.extraRule,
    ...(options.dynamicRules ?? []),
    profile.output
  ].filter(Boolean).join('\n')
}

// Pre-translation token substitution for {identifier} placeholders.
// Replaces each unique {placeholder} with an opaque XML-void token <phN/> so the LLM
// never sees the identifier name and cannot rename or "correct" it.
// Returns { text: protectedText, restore: fn } where restore() maps tokens back.
function protectPlaceholders(text) {
  const pattern = /\{[a-zA-Z0-9_]+\}/g
  const matches = [...String(text).matchAll(pattern)]
  if (matches.length === 0) return { text, restore: t => t }

  const seen = new Map() // placeholder → token index
  const reverseMap = [] // index → original placeholder
  let nextId = 0
  let protected_ = ''
  let lastIndex = 0

  for (const match of matches) {
    if (!seen.has(match[0])) {
      seen.set(match[0], nextId)
      reverseMap.push(match[0])
      nextId += 1
    }
    const token = `<ph${seen.get(match[0])}/>`
    protected_ += text.slice(lastIndex, match.index) + token
    lastIndex = match.index + match[0].length
  }
  protected_ += text.slice(lastIndex)

  return {
    text: protected_,
    restore: (translated) => {
      let result = String(translated)
      for (let i = 0; i < reverseMap.length; i++) {
        result = result.split(`<ph${i}/>`).join(reverseMap[i])
      }
      return result
    }
  }
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
        ...(typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(120000) } : {})
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
    const protection = protectPlaceholders(line)
    const dynamicRules = detectContentRules(line, true, targetLang)
    const systemPrompt = buildPrompt(targetLang, 'singleLine', { dynamicRules })

    try {
      const result = await withRetry(async () => {
        return await requestLLM(systemPrompt, protection.text)
      }, config.retryAttempts, config.retryBaseDelayMs)
      return protection.restore(result)
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
    const dynamicRules = detectContentRules(lines.join('\n'), true, targetLang)
    const systemPrompt = buildPrompt(targetLang, 'linesBatch', { dynamicRules })

    const chunks = chunkByTokenBudget(lines, TOKEN_BUDGET, MAX_ITEMS)

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const protections = chunk.map(line => protectPlaceholders(line))
        const payload = protections.map((p, i) => ({ id: i, text: p.text }))
        try {
          const idMap = await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            return new Map(parsed.map(item => [item.id, item.text]))
          }, config.retryAttempts, config.retryBaseDelayMs)

          // 按 id 回填；缺失的 id 逐条降级翻译（translateSingleLine 内部自行保护/还原）
          const missingIds = chunk.map((_, i) => i).filter(i => !idMap.has(i))
          if (missingIds.length > 0) {
            console.warn(`    ⚠️  translateLinesBatch: ${missingIds.length} item(s) missing, retrying individually${context ? ` [${context}]` : ''}`)
            await Promise.all(missingIds.map(async (i) => {
              idMap.set(i, await translateSingleLine(chunk[i], targetLang))
            }))
          }
          return chunk.map((_, i) => protections[i].restore(idMap.get(i) ?? chunk[i]))
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

    const dynamicRules = detectContentRules(strings.join('\n'), false, targetLang)
    const systemPrompt = buildPrompt(targetLang, 'stringsBatch', { ...options, dynamicRules })

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const protections = chunk.map(str => protectPlaceholders(str))
        const payload = protections.map((p, i) => ({ id: i, text: p.text }))
        try {
          const idMap = await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            return new Map(parsed.map(item => [item.id, item.text]))
          }, config.retryAttempts, config.retryBaseDelayMs)

          // 按 id 回填；缺失的 id 逐条降级翻译（translateSingleLine 内部自行保护/还原）
          const missingIds = chunk.map((_, i) => i).filter(i => !idMap.has(i))
          if (missingIds.length > 0) {
            console.warn(`    ⚠️  translateStrings: ${missingIds.length} item(s) missing, retrying individually${context ? ` [${context}]` : ''}`)
            await Promise.all(missingIds.map(async (i) => {
              idMap.set(i, await translateSingleLine(chunk[i], targetLang))
            }))
          }
          return chunk.map((_, i) => protections[i].restore(idMap.get(i) ?? chunk[i]))
        } catch {
          // 整批失败：逐条降级翻译
          console.warn(`    ⚠️  translateStrings: batch failed, falling back to line-by-line${context ? ` [${context}]` : ''}`)
          return Promise.all(chunk.map(str => translateSingleLine(str, targetLang)))
        }
      })
    )

    return results.flat()
  }

  // 单块降级翻译：translateBlocksBatch 批量失败后的逐块兜底
  async function translateSingleBlock(block, targetLang) {
    const protection = protectPlaceholders(block)
    const dynamicRules = detectContentRules(block, false, targetLang)
    const systemPrompt = buildPrompt(targetLang, 'singleBlock', { dynamicRules })
    try {
      const result = await withRetry(async () => {
        return await requestLLM(systemPrompt, protection.text)
      }, config.retryAttempts, config.retryBaseDelayMs)
      return protection.restore(result)
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
    const dynamicRules = detectContentRules(blocks.join('\n'), false, targetLang)
    const systemPrompt = buildPrompt(targetLang, 'blocksBatch', { dynamicRules })

    const chunks = chunkByTokenBudget(blocks, TOKEN_BUDGET)

    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const protections = chunk.map(block => protectPlaceholders(block))
        const payload = protections.map((p, i) => ({ id: i, text: p.text }))
        try {
          const idMap = await withRetry(async () => {
            const raw = await requestLLM(systemPrompt, JSON.stringify(payload))
            const parsed = JSON.parse(raw)
            if (!Array.isArray(parsed)) throw new Error('Response is not an array')
            return new Map(parsed.map(item => [item.id, item.text]))
          }, config.retryAttempts, config.retryBaseDelayMs)

          // 按 id 回填：缺失的 id 逐块单独重试（translateSingleBlock 内部自行保护/还原）
          const missingIds = chunk.map((_, i) => i).filter(i => !idMap.has(i))
          if (missingIds.length > 0) {
            console.warn(`    ⚠️  translateBlocksBatch: ${missingIds.length} block(s) missing, retrying individually${context ? ` [${context}]` : ''}`)
            await Promise.all(missingIds.map(async (i) => {
              idMap.set(i, await translateSingleBlock(chunk[i], targetLang))
            }))
          }
          return chunk.map((_, i) => protections[i].restore(idMap.get(i) ?? chunk[i]))
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
