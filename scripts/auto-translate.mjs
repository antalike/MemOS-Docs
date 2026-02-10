import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import crypto from 'crypto'

// --- Configuration ---
// Read target languages from external config
const languagesConfigPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'languages.json')
const translationCachePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'translation-cache.json')
let TARGET_LANGS = ['en']
try {
  if (fs.existsSync(languagesConfigPath)) {
    TARGET_LANGS = JSON.parse(fs.readFileSync(languagesConfigPath, 'utf-8'))
  }
} catch (e) {
  console.warn('⚠️ Failed to read languages.json, defaulting to ["en"]', e)
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.deepseek.com'
const MODEL = process.env.OPENAI_MODEL || 'deepseek-chat'
const SOURCE_DIR = 'content/cn'
const TRANSLATE_BATCH_SIZE = Number(process.env.TRANSLATE_BATCH_SIZE || 50)
<<<<<<< Updated upstream
=======
const ENABLE_EDIT_TRANSLATE = process.env.ENABLE_EDIT_TRANSLATE !== '0'
const EDIT_SIM_THRESHOLD = Number(process.env.EDIT_SIM_THRESHOLD || 0.8)
const BLOCK_SIM_THRESHOLD = Number(process.env.BLOCK_SIM_THRESHOLD || 0.6)
>>>>>>> Stashed changes

// --- Helpers ---

/**
 * Execute a shell command and return stdout
 */
function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function parseGitStatus() {
  const output = exec('git status --porcelain')
  if (!output) return []
  const files = []
  for (const line of output.split('\n')) {
    if (!line) continue
    if (line.startsWith('?? ')) {
      files.push(line.slice(3))
      continue
    }
    // e.g. "R  old -> new"
    const renameMatch = line.match(/^[A-Z?]{1,2}\s+(.+)\s+->\s+(.+)$/)
    if (renameMatch) {
      files.push(renameMatch[2])
      continue
    }
    // e.g. " M path"
    const pathPart = line.slice(3)
    if (pathPart) files.push(pathPart)
  }
  return files
}

/**
 * Get list of changed files in content/cn
 * If scripts/auto-translate.mjs changed, return ALL content files
 */
function getChangedFiles() {
  try {
    const diffOutput = exec('git diff --name-only HEAD^ HEAD')
    const changedFiles = diffOutput.split('\n').filter(Boolean)
    const statusFiles = parseGitStatus()
    const combined = new Set([...changedFiles, ...statusFiles])
    const allChanged = Array.from(combined)

    // If script itself changed, likely a config change (e.g. new language added).
    // Process ALL content files to ensure new language is generated.
    if (allChanged.includes('scripts/languages.json')) {
      console.log('⚡️ Languages config changed, scanning all content files...')
      const allFiles = exec('git ls-files content/cn').split('\n')
      return allFiles.filter(line =>
        line.startsWith(SOURCE_DIR)
        && (line.endsWith('.md') || line.endsWith('.yml') || line.endsWith('.yaml'))
      )
    }

    // Otherwise only process changed content files
    return allChanged.filter(line =>
      line.startsWith(SOURCE_DIR)
      && (line.endsWith('.md') || line.endsWith('.yml') || line.endsWith('.yaml'))
    )
  } catch (e) {
    console.error('Failed to get diff:', e)
    return []
  }
}

/**
 * Get file content from a specific git revision
 */
function getGitContent(revision, filePath) {
  try {
    return exec(`git show ${revision}:${filePath}`)
  } catch {
    return null
  }
}

/**
 * Generate MD5 hash of a string
 */
function getHash(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// --- Remark AST Logic ---

const processor = unified()
  .use(remarkParse)
  // Use '*' for bullets to match user preference and reduce diff noise
  .use(remarkStringify, { bullet: '*', fenc: '`' })
  .use(remarkFrontmatter, ['yaml'])

/**
 * Split AST tree into minimal independent blocks (Paragraphs, Headings, Lists, etc.)
 * Flatten the tree structure into a linear list of "translate units".
 */
function splitIntoBlocks(tree, rawContent) {
  const blocks = []

  // Helper to process nodes recursively or flatly
  function processNode(node, pathKey, isLastInList = false, listSpread = false) {
    if (node.type === 'list') {
      // For Lists, iterate children (ListItems) and flatten them
      for (let i = 0; i < node.children.length; i++) {
        const item = node.children[i]
        const isLastItem = i === node.children.length - 1
        processNode(item, `${pathKey}/listItem/${i}`, isLastItem, node.spread)
      }
      return
    }

    // Determine separator
    // If it's a ListItem:
    //   - If it's the last item in the list, use '\n\n' (to separate from next block)
    //   - If list is loose (spread=true), use '\n\n'
    //   - Otherwise (tight list), use '\n'
    let separator = '\n\n'
    if (node.type === 'listItem') {
      if (isLastInList) {
        separator = '\n\n'
      } else {
        separator = listSpread ? '\n\n' : '\n'
      }
    }

    // Generate normalized text for hashing
    const tempRoot = { type: 'root', children: [node] }
    const normalizedText = processor.stringify(tempRoot).trim()

    // Get Raw Text for Output
    let rawText = normalizedText // Fallback
    if (rawContent && node.position) {
      rawText = rawContent.slice(node.position.start.offset, node.position.end.offset)
    }
    const textContent = extractTextFromBlock(rawText)

    blocks.push({
      type: node.type,
      path: pathKey,
      text: rawText,
      normalized: normalizedText,
      hash: getHash(normalizedText.replace(/\s+/g, ' ').trim()),
      textHash: getHash(textContent.replace(/\s+/g, ' ').trim()),
      textContent,
      start: node.position?.start?.offset ?? null,
      end: node.position?.end?.offset ?? null,
      separator: separator
    })
  }

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i]
    processNode(node, `root/${i}/${node.type}`)
  }

  return blocks
}

function buildDiffMap(oldBlocks, newBlocks) {
  const n = oldBlocks.length
  const m = newBlocks.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  const oldKeys = oldBlocks.map(b => `${b.type}|${b.textHash}`)
  const newKeys = newBlocks.map(b => `${b.type}|${b.textHash}`)

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldKeys[i - 1] === newKeys[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const ops = []
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (oldKeys[i - 1] === newKeys[j - 1]) {
      ops.push({ type: 'equal', oldIndex: i - 1, newIndex: j - 1 })
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      ops.push({ type: 'delete', oldIndex: i - 1 })
      i--
    } else {
      ops.push({ type: 'insert', newIndex: j - 1 })
      j--
    }
  }
  while (i > 0) {
    ops.push({ type: 'delete', oldIndex: i - 1 })
    i--
  }
  while (j > 0) {
    ops.push({ type: 'insert', newIndex: j - 1 })
    j--
  }
  ops.reverse()

  const mapNewToOld = new Array(m).fill(-1)
  const equalOps = []
  for (const op of ops) {
    if (op.type === 'equal') {
      mapNewToOld[op.newIndex] = op.oldIndex
      equalOps.push(op)
    }
  }

  return { mapNewToOld, ops, equalOps }
}

function buildSafeTextMap(equalOps, oldBlocks, oldENBlocks) {
  if (!oldBlocks || !oldENBlocks) return new Map()
  const map = new Map()

  for (const op of equalOps) {
    const oldIdx = op.oldIndex
    const cnBlock = oldBlocks[oldIdx]
    const enBlock = oldENBlocks[oldIdx]
    if (!cnBlock || !enBlock) continue
    const cnTree = processor.parse(cnBlock.text)
    const enTree = processor.parse(enBlock.text)
    const cnNodes = collectTextNodes(cnTree, cnBlock.text)
    const enNodes = collectTextNodes(enTree, enBlock.text)
    const len = Math.min(cnNodes.length, enNodes.length)
    for (let i = 0; i < len; i++) {
      const cnText = cnNodes[i]?.text
      const enText = enNodes[i]?.text
      if (cnText == null || enText == null) continue
      if (!map.has(cnText)) map.set(cnText, [])
      map.get(cnText).push(enText)
    }
  }

  return map
}

function buildLcsIndexMap(oldItems, newItems) {
  const n = oldItems.length
  const m = newItems.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldItems[i - 1] === newItems[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const mapNewToOld = new Array(m).fill(-1)
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    if (oldItems[i - 1] === newItems[j - 1]) {
      mapNewToOld[j - 1] = i - 1
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return mapNewToOld
}

function augmentMapWithSimilarBlocks(oldBlocks, newBlocks, mapNewToOld) {
  const usedOld = new Set(mapNewToOld.filter(i => i !== -1))
  const prevOldIndex = new Array(newBlocks.length).fill(-1)
  const nextOldIndex = new Array(newBlocks.length).fill(-1)

  let last = -1
  for (let i = 0; i < newBlocks.length; i++) {
    if (mapNewToOld[i] !== -1) last = mapNewToOld[i]
    prevOldIndex[i] = last
  }

  last = -1
  for (let i = newBlocks.length - 1; i >= 0; i--) {
    if (mapNewToOld[i] !== -1) last = mapNewToOld[i]
    nextOldIndex[i] = last
  }

  for (let i = 0; i < newBlocks.length; i++) {
    if (mapNewToOld[i] !== -1) continue
    const newBlock = newBlocks[i]
    if (!newBlock) continue

    const start = prevOldIndex[i] !== -1 ? prevOldIndex[i] + 1 : 0
    const end = nextOldIndex[i] !== -1 ? nextOldIndex[i] - 1 : oldBlocks.length - 1

    let bestIdx = -1
    let bestScore = 0
    const newText = normalizeSegment(newBlock.textContent || '')
    if (!newText) continue

    for (let j = start; j <= end; j++) {
      if (usedOld.has(j)) continue
      const oldBlock = oldBlocks[j]
      if (!oldBlock) continue
      if (oldBlock.type !== newBlock.type) continue

      const oldText = normalizeSegment(oldBlock.textContent || '')
      if (!oldText) continue
      const minLen = Math.min(oldText.length, newText.length)
      const maxLen = Math.max(oldText.length, newText.length)
      if (maxLen > 0 && minLen / maxLen < 0.5) continue

      const score = similarityScore(newText, oldText)
      if (score > bestScore) {
        bestScore = score
        bestIdx = j
      }
    }

    if (bestIdx !== -1 && bestScore >= BLOCK_SIM_THRESHOLD) {
      mapNewToOld[i] = bestIdx
      usedOld.add(bestIdx)
    }
  }

  return mapNewToOld
}

// --- YAML Logic (Settings.yml) ---

function getYamlHeaderComments(source) {
  if (!source) return ''
  const lines = source.split('\n')
  const comments = []
  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      comments.push(line)
    } else if (line.trim() === '') {
      continue
    } else {
      break
    }
  }
  return comments.join('\n') + (comments.length > 0 ? '\n' : '')
}

/**
 * Build a map of CN key-path -> EN key from existing translations.
 * Traverses OldCN and OldEN in parallel by structure order.
 */
function buildYamlPathMap(cnNode, enNode, map, basePath = '') {
  if (!cnNode || !enNode) return

  if (Array.isArray(cnNode) && Array.isArray(enNode)) {
    const len = Math.min(cnNode.length, enNode.length)
    for (let i = 0; i < len; i++) {
      buildYamlPathMap(cnNode[i], enNode[i], map, `${basePath}[${i}]`)
    }
  } else if (typeof cnNode === 'object' && cnNode !== null && typeof enNode === 'object' && enNode !== null) {
    const cnKeys = Object.keys(cnNode)
    const enKeys = Object.keys(enNode)

    const len = Math.min(cnKeys.length, enKeys.length)
    for (let i = 0; i < len; i++) {
      const cnKey = cnKeys[i]
      const enKey = enKeys[i]
      const pathKey = basePath ? `${basePath}.${cnKey}` : cnKey
      map.set(pathKey, enKey)
      buildYamlPathMap(cnNode[cnKey], enNode[enKey], map, pathKey)
    }
  }
}

/**
 * Traverse NewCN and reconstruct NewEN using the path map.
 * Collects missing keys for translation.
 */
function processYamlNode(node, map, collector, basePath = '') {
  if (Array.isArray(node)) {
    return node.map((item, i) => processYamlNode(item, map, collector, `${basePath}[${i}]`))
  } else if (typeof node === 'object' && node !== null) {
    const result = {}
    for (const key of Object.keys(node)) {
      const value = node[key]
      const pathKey = basePath ? `${basePath}.${key}` : key
      let finalKey = key

      if (map.has(pathKey)) {
        finalKey = map.get(pathKey)
      } else {
        collector.push({ targetObj: result, originalKey: key })
      }

      result[finalKey] = processYamlNode(value, map, collector, pathKey)
    }
    return result
  } else {
    return node
  }
}

// --- Translation Service ---

function loadTranslationCache() {
  try {
    if (!fs.existsSync(translationCachePath)) return {}
    return JSON.parse(fs.readFileSync(translationCachePath, 'utf-8'))
  } catch {
    return {}
  }
}

function saveTranslationCache(cache) {
  try {
    fs.writeFileSync(translationCachePath, JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.warn('⚠️ Failed to write translation cache:', e.message)
  }
}

function getCacheKey(lang, text) {
  return `${lang}:${getHash(text)}`
}

function filterTranslatable(text) {
  if (!text) return false
  if (!text.trim()) return false
  return /[\u4e00-\u9fff]/.test(text)
}

<<<<<<< Updated upstream
=======
const EN_ABBREVIATIONS = new Set([
  'e.g',
  'i.e',
  'etc',
  'vs',
  'fig',
  'eq',
  'dr',
  'mr',
  'ms',
  'prof',
  'sr',
  'jr',
  'st',
  'no'
])

function isSentenceBoundary(text, index) {
  const ch = text[index]
  if (ch === '。' || ch === '！' || ch === '？' || ch === '；') return true
  if (ch === '!' || ch === '?' || ch === ';') return true
  if (ch !== '.') return false
  if (text[index - 1] === '.') return false

  // Abbreviation check (e.g., "e.g.")
  let j = index - 1
  while (j >= 0 && /[A-Za-z]/.test(text[j])) j--
  const word = text.slice(j + 1, index)
  if (word && EN_ABBREVIATIONS.has(word.toLowerCase())) return false

  // Look ahead for next non-space char
  let k = index + 1
  while (k < text.length && /\s/.test(text[k])) k++
  if (k >= text.length) return true
  const next = text[k]

  if (/[A-Z0-9]/.test(next)) return true
  if (/["'“”‘’\(\[\{<\-]/.test(next)) return true
  if (/[\u4e00-\u9fff]/.test(next)) return true

  return false
}

function splitIntoSentences(text) {
  const segments = []
  if (!text) return segments
  let start = 0
  for (let i = 0; i < text.length; i++) {
    if (isSentenceBoundary(text, i)) {
      const end = i + 1
      segments.push(buildSegment(text, start, end))
      start = end
    }
  }
  if (start < text.length) {
    segments.push(buildSegment(text, start, text.length))
  }
  return segments
}

function buildSegment(text, start, end) {
  const raw = text.slice(start, end)
  let left = 0
  let right = raw.length
  while (left < right && /\s/.test(raw[left])) left++
  while (right > left && /\s/.test(raw[right - 1])) right--
  const prefix = raw.slice(0, left)
  const suffix = raw.slice(right)
  const core = raw.slice(left, right)
  return { start, end, text: raw, core, prefix, suffix }
}

function normalizeSegment(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function levenshtein(a, b) {
  if (a === b) return 0
  const alen = a.length
  const blen = b.length
  if (alen === 0) return blen
  if (blen === 0) return alen
  const dp = new Array(blen + 1)
  for (let j = 0; j <= blen; j++) dp[j] = j
  for (let i = 1; i <= alen; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= blen; j++) {
      const temp = dp[j]
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = temp
    }
  }
  return dp[blen]
}

function similarityScore(a, b) {
  const na = normalizeSegment(a)
  const nb = normalizeSegment(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const distance = levenshtein(na, nb)
  return 1 - distance / Math.max(na.length, nb.length)
}

function formatSegmentReplacement(segment, translatedCore) {
  if (translatedCore == null) return segment.text
  const core = String(translatedCore).trim()
  return `${segment.prefix}${core}${segment.suffix}`
}

function coerceSingleString(content) {
  if (content == null) return ''
  let text = String(content).trim()
  if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
  const firstChar = text[0]
  if (firstChar === '[' || firstChar === '"' || firstChar === '{') {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0] ?? '').trim()
      if (typeof parsed === 'string') return parsed.trim()
      if (parsed && typeof parsed === 'object') {
        const candidate = parsed.translation || parsed.text || parsed.result
        if (typeof candidate === 'string') return candidate.trim()
      }
    } catch {
      // fall through to raw text
    }
  }
  return text
}

async function translateSingle(segment, targetLang) {
  console.log(`    ⏳ Translating 1 segment to ${targetLang}...`)
  const systemPrompt = `You are a professional technical documentation translator.
Translate the following plain text from Chinese to ${targetLang}.

Rules:
1. Do NOT add or remove formatting. Input is plain text.
2. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only translate the text after it.
3. Return ONLY the translated text, no JSON, no extra commentary.`

  const userContent = String(segment)

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return coerceSingleString(data.choices[0].message.content)
}

async function translateSingleWithRetry(segment, targetLang, retries = 2) {
  let lastError = null
  for (let i = 0; i <= retries; i++) {
    try {
      return await translateSingle(segment, targetLang)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function editTranslateSingle(item, targetLang) {
  console.log(`    ⏳ Editing 1 segment to ${targetLang}...`)
  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON object: {oldCn, newCn, oldEn}.
Your task is to update the English translation for newCn by making minimal edits to oldEn.

Rules:
1. Keep terminology, tone, and structure from oldEn whenever possible.
2. Only change parts needed to reflect the difference between oldCn and newCn.
3. Do NOT add or remove formatting. Input segments are plain text.
4. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only edit the text after it.
5. Return ONLY the updated English text, no JSON, no extra commentary.`

  const userContent = JSON.stringify({
    oldCn: item.oldCn,
    newCn: item.newCn,
    oldEn: item.oldEn
  })

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return coerceSingleString(data.choices[0].message.content)
}

async function editTranslateSingleWithRetry(item, targetLang, retries = 2) {
  let lastError = null
  for (let i = 0; i <= retries; i++) {
    try {
      return await editTranslateSingle(item, targetLang)
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

>>>>>>> Stashed changes
async function translateBatch(segments, targetLang) {
  if (segments.length === 0) return []

  console.log(`    ⏳ Translating ${segments.length} segments to ${targetLang}...`)

  const systemPrompt = `You are a professional technical documentation translator.
  Translate the following plain text segments from Chinese to ${targetLang}.

  Rules:
  1. Do NOT add or remove formatting. Input segments are plain text.
  2. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only translate the text after it.
  3. Return the result as a JSON array of strings, strictly matching the order of input.
  4. The output must be valid JSON. Raw JSON string only.`

  const userContent = JSON.stringify(segments)

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content.trim()
    if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed) || parsed.length !== segments.length) {
      throw new Error('API returned mismatched array length')
    }
    return parsed
  } catch (error) {
    throw error
  }
}

<<<<<<< Updated upstream
=======
function shouldSplitBatch(error) {
  const message = error?.message || ''
  if (/mismatched array length/i.test(message)) return true
  if (/unexpected token/i.test(message)) return true
  if (/json/i.test(message)) return true
  if (/API Error:\s*413/i.test(message)) return true
  return false
}

async function translateBatchWithFallback(segments, targetLang) {
  try {
    return await translateBatch(segments, targetLang)
  } catch (error) {
    if (segments.length <= 1) {
      const single = await translateSingleWithRetry(segments[0], targetLang)
      return [single]
    }
    if (!shouldSplitBatch(error)) {
      console.error('    ❌ Translation failed:', error.message)
      throw error
    }
    const mid = Math.ceil(segments.length / 2)
    console.warn(`    ⚠️ Batch failed, splitting into ${mid} + ${segments.length - mid}`)
    const left = await translateBatchWithFallback(segments.slice(0, mid), targetLang)
    const right = await translateBatchWithFallback(segments.slice(mid), targetLang)
    return left.concat(right)
  }
}

async function editTranslateBatch(pairs, targetLang) {
  if (pairs.length === 0) return []

  console.log(`    ⏳ Editing ${pairs.length} segments to ${targetLang}...`)

  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON array of objects: {oldCn, newCn, oldEn}.
Your task is to update the English translation for newCn by making minimal edits to oldEn.

Rules:
1. Keep terminology, tone, and structure from oldEn whenever possible.
2. Only change parts needed to reflect the difference between oldCn and newCn.
3. Do NOT add or remove formatting. Input segments are plain text.
4. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only edit the text after it.
5. Return a JSON array of strings, strictly matching the input order.
6. The output must be valid JSON. Raw JSON string only.`

  const userContent = JSON.stringify(pairs)

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let content = data.choices[0].message.content.trim()
    if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')

    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed) || parsed.length !== pairs.length) {
      throw new Error('API returned mismatched array length')
    }
    return parsed
  } catch (error) {
    throw error
  }
}

async function editTranslateBatchWithFallback(pairs, targetLang) {
  try {
    return await editTranslateBatch(pairs, targetLang)
  } catch (error) {
    if (pairs.length <= 1) {
      const single = await editTranslateSingleWithRetry(pairs[0], targetLang)
      return [single]
    }
    if (!shouldSplitBatch(error)) {
      console.error('    ❌ Edit translation failed:', error.message)
      throw error
    }
    const mid = Math.ceil(pairs.length / 2)
    console.warn(`    ⚠️ Edit batch failed, splitting into ${mid} + ${pairs.length - mid}`)
    const left = await editTranslateBatchWithFallback(pairs.slice(0, mid), targetLang)
    const right = await editTranslateBatchWithFallback(pairs.slice(mid), targetLang)
    return left.concat(right)
  }
}

>>>>>>> Stashed changes
async function translateSegmentsWithCache(segments, targetLang, cache) {
  if (segments.length === 0) return []
  const results = new Array(segments.length).fill('')
  const missing = []
  const missingIndices = []

  for (let i = 0; i < segments.length; i++) {
    const text = segments[i]
    const key = getCacheKey(targetLang, text)
    if (cache[key] && cache[key].text === text) {
      results[i] = cache[key].trans
    } else {
      missing.push(text)
      missingIndices.push(i)
    }
  }

  if (missing.length > 0) {
    for (let i = 0; i < missing.length; i += TRANSLATE_BATCH_SIZE) {
      const chunk = missing.slice(i, i + TRANSLATE_BATCH_SIZE)
      const translated = await translateBatch(chunk, targetLang)
      translated.forEach((trans, idx) => {
        const original = chunk[idx]
        const missingIndex = missingIndices[i + idx]
        const key = getCacheKey(targetLang, original)
        cache[key] = { text: original, trans }
        results[missingIndex] = trans
      })
    }
  }

  return results
}

function collectTextNodes(tree, raw) {
  const nodes = []
  const skipParents = new Set(['code', 'inlineCode', 'yaml', 'html'])

  function walk(node, parentTypes) {
    const nextParents = parentTypes.concat(node.type)
    if (node.type === 'text') {
      if (parentTypes.some(t => skipParents.has(t))) return
      if (!node.position || node.position.start.offset == null || node.position.end.offset == null) return
      const start = node.position.start.offset
      const end = node.position.end.offset
      const text = raw.slice(start, end)
      nodes.push({ start, end, text })
      return
    }
    if (!node.children || node.children.length === 0) return
    for (const child of node.children) {
      walk(child, nextParents)
    }
  }

  walk(tree, [])
  return nodes
}

function extractTextFromBlock(rawBlock) {
  const tree = processor.parse(rawBlock)
  const nodes = collectTextNodes(tree, rawBlock)
  return nodes.map(n => n.text).join('\n')
}

function buildTextFreq(tree, raw) {
  const freq = new Map()
  const nodes = collectTextNodes(tree, raw)
  for (const n of nodes) {
    const t = n.text
    freq.set(t, (freq.get(t) || 0) + 1)
  }
  return freq
}

function applyReplacements(raw, replacements) {
  if (replacements.length === 0) return raw
  const sorted = replacements.slice().sort((a, b) => b.start - a.start)
  let result = raw
  for (const rep of sorted) {
    result = result.slice(0, rep.start) + rep.text + result.slice(rep.end)
  }
  return result
}

function buildGlobalTextMap(oldBlocks, oldENBlocks) {
  if (!oldBlocks || !oldENBlocks) return null
  const map = new Map()
  const len = Math.min(oldBlocks.length, oldENBlocks.length)

  for (let i = 0; i < len; i++) {
    const cnBlock = oldBlocks[i]
    const enBlock = oldENBlocks[i]
    if (!cnBlock || !enBlock) continue
    if (cnBlock.type !== enBlock.type) continue
    if (cnBlock.hash !== enBlock.hash) continue

    const cnTree = processor.parse(cnBlock.text)
    const enTree = processor.parse(enBlock.text)
    const cnNodes = collectTextNodes(cnTree, cnBlock.text)
    const enNodes = collectTextNodes(enTree, enBlock.text)
    const nodeLen = Math.min(cnNodes.length, enNodes.length)

    for (let j = 0; j < nodeLen; j++) {
      const cnText = cnNodes[j]?.text
      const enText = enNodes[j]?.text
      if (cnText == null || enText == null) continue
      if (!map.has(cnText)) map.set(cnText, [])
      map.get(cnText).push(enText)
    }
  }

  return map
}

async function translateMarkdownBlock(rawBlock, targetLang, cache) {
  const tree = processor.parse(rawBlock)
  const textNodes = collectTextNodes(tree, rawBlock)
  const segments = []
  const segmentRefs = []

  for (const node of textNodes) {
    if (!filterTranslatable(node.text)) continue
    segments.push(node.text)
    segmentRefs.push(node)
  }

  if (segments.length === 0) return rawBlock
  const translated = await translateSegmentsWithCache(segments, targetLang, cache)

  const replacements = translated.map((text, idx) => ({
    start: segmentRefs[idx].start,
    end: segmentRefs[idx].end,
    text
  }))

  return applyReplacements(rawBlock, replacements)
}

async function translateMarkdownBlocks(blocks, indices, targetLang, cache, oldBlocks, oldENBlocks, mapNewToOld, safeTextMap, oldTextFreq, newTextFreq) {
  const tasks = []
  const perBlock = new Map()

  for (const idx of indices) {
    const rawBlock = blocks[idx].text
    const tree = processor.parse(rawBlock)
    const textNodes = collectTextNodes(tree, rawBlock)
    const blockInfo = { raw: rawBlock, replacements: [] }
    perBlock.set(idx, blockInfo)

    const oldIndex = mapNewToOld?.[idx] ?? -1
    const oldCNBlock = oldIndex !== -1 ? oldBlocks?.[oldIndex]?.text : null
    const oldENBlock = oldIndex !== -1 ? oldENBlocks?.[oldIndex]?.text : null

    if (oldCNBlock && oldENBlock) {
      const oldCNTree = processor.parse(oldCNBlock)
      const oldENTree = processor.parse(oldENBlock)
      const oldCNNodes = collectTextNodes(oldCNTree, oldCNBlock)
      const oldENNodes = collectTextNodes(oldENTree, oldENBlock)

      const cnToEnQueue = new Map()
      for (let i = 0; i < oldCNNodes.length; i++) {
        const cnText = oldCNNodes[i]?.text
        const enText = oldENNodes[i]?.text
        if (cnText == null || enText == null) continue
        if (!cnToEnQueue.has(cnText)) cnToEnQueue.set(cnText, [])
        cnToEnQueue.get(cnText).push(enText)
      }

      for (const node of textNodes) {
        const cnText = node.text
        const queue = cnToEnQueue.get(cnText)
        if (queue && queue.length > 0) {
          blockInfo.replacements.push({
            start: node.start,
            end: node.end,
            text: queue.shift()
          })
          continue
        }

        if (!filterTranslatable(cnText)) continue
        if (
          safeTextMap &&
          oldTextFreq?.get(cnText) === 1 &&
          newTextFreq?.get(cnText) === 1
        ) {
          const globalQueue = safeTextMap.get(cnText)
          if (globalQueue && globalQueue.length > 0) {
            blockInfo.replacements.push({
              start: node.start,
              end: node.end,
              text: globalQueue.shift()
            })
            continue
          }
        }
        tasks.push({
          blockIndex: idx,
          start: node.start,
          end: node.end,
          text: cnText
        })
      }
    } else {
      for (const node of textNodes) {
        if (!filterTranslatable(node.text)) continue
        if (
          safeTextMap &&
          oldTextFreq?.get(node.text) === 1 &&
          newTextFreq?.get(node.text) === 1
        ) {
          const globalQueue = safeTextMap.get(node.text)
          if (globalQueue && globalQueue.length > 0) {
            blockInfo.replacements.push({
              start: node.start,
              end: node.end,
              text: globalQueue.shift()
            })
            continue
          }
        }
        tasks.push({
          blockIndex: idx,
          start: node.start,
          end: node.end,
          text: node.text
        })
      }
    }
  }

  if (tasks.length === 0) {
    const result = new Map()
    for (const idx of indices) {
      const info = perBlock.get(idx)
      result.set(idx, info ? info.raw : blocks[idx].text)
    }
    return result
  }

  const segments = tasks.map(t => t.text)
  const translated = await translateSegmentsWithCache(segments, targetLang, cache)

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    const info = perBlock.get(t.blockIndex)
    if (!info) continue
    info.replacements.push({ start: t.start, end: t.end, text: translated[i] })
  }

  const result = new Map()
  for (const [idx, info] of perBlock.entries()) {
    result.set(idx, applyReplacements(info.raw, info.replacements))
  }

  return result
}

// --- Main Processors ---

async function processMarkdownFile(filePath) {
  console.log(`\n📄 Processing Markdown: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  // Parse AST
  const newTree = processor.parse(newCNRaw)
  const oldTree = oldCNRaw ? processor.parse(oldCNRaw) : { children: [] }

  const newBlocks = splitIntoBlocks(newTree, newCNRaw)
  const oldBlocks = splitIntoBlocks(oldTree, oldCNRaw)
  const { mapNewToOld, equalOps } = buildDiffMap(oldBlocks, newBlocks)
  augmentMapWithSimilarBlocks(oldBlocks, newBlocks, mapNewToOld)
  const newTextFreq = buildTextFreq(newTree, newCNRaw)
  const oldTextFreq = buildTextFreq(oldTree, oldCNRaw || '')

  // --- Build Block Map (OldCN -> OldEN) ---
  // We need to map OldCN blocks to OldEN blocks to enable reuse.
  // Strategy: Assume sequential correspondence for identical blocks?
  // Or better: Build a Map<Hash, EnText>.
  // But Hash collision? (e.g. two "Note:" paragraphs).
  // We can use a queue/list for each hash to handle duplicates sequentially.

  const cache = loadTranslationCache()

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)

    const finalBlocks = new Array(newBlocks.length).fill(null)
    const blocksToTranslate = []
    let oldENBlocks = null
    let safeTextMap = null

    if (fs.existsSync(targetPath)) {
      const oldENRaw = fs.readFileSync(targetPath, 'utf-8')
      const oldENTree = processor.parse(oldENRaw)
      oldENBlocks = splitIntoBlocks(oldENTree, oldENRaw)
      safeTextMap = buildSafeTextMap(equalOps, oldBlocks, oldENBlocks)

      for (let i = 0; i < newBlocks.length; i++) {
        const oldIndex = mapNewToOld[i]
        if (oldIndex !== -1 && oldENBlocks[oldIndex]) {
          finalBlocks[i] = oldENBlocks[oldIndex].text
        } else {
          blocksToTranslate.push(i)
        }
      }
    } else {
      for (let i = 0; i < newBlocks.length; i++) blocksToTranslate.push(i)
    }

    if (blocksToTranslate.length > 0) {
      console.log(`    Need to translate ${blocksToTranslate.length} blocks for [${lang}]`)
      const translatedMap = await translateMarkdownBlocks(
        newBlocks,
        blocksToTranslate,
        lang,
        cache,
        oldBlocks,
        oldENBlocks,
        mapNewToOld,
        safeTextMap,
        oldTextFreq,
        newTextFreq
      )
      for (const idx of blocksToTranslate) {
        finalBlocks[idx] = translatedMap.get(idx) || newBlocks[idx].text
      }
    } else {
      console.log(`    ✨ No changes for [${lang}]`)
    }

    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

    // Join blocks with dynamic separators
    let finalContent = ''
    for (let i = 0; i < finalBlocks.length; i++) {
      const block = newBlocks[i]
      const content = finalBlocks[i]
      // Use block.separator if available, default to '\n\n'
      const separator = block.separator || '\n\n'

      finalContent += content
      // Don't add separator after the very last block?
      // Usually Markdown files end with a newline, so adding it is fine/good.
      if (i < finalBlocks.length - 1) {
        finalContent += separator
      } else {
        finalContent += '\n' // Ensure EOF newline
      }
    }

    fs.writeFileSync(targetPath, finalContent, 'utf-8')
    console.log(`    ✅ Updated: ${targetPath}`)
  }

  saveTranslationCache(cache)
}

async function processYamlFile(filePath) {
  console.log(`\n⚙️ Processing YAML: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  const newCN = yaml.load(newCNRaw)
  const oldCN = oldCNRaw ? yaml.load(oldCNRaw) : null
  const headerComments = getYamlHeaderComments(newCNRaw)
  const cache = loadTranslationCache()

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)

    // 1. Build Map from OldCN + OldEN
    let finalObj = null
    const collector = []

    if (oldCN && fs.existsSync(targetPath)) {
      const oldEN = yaml.load(fs.readFileSync(targetPath, 'utf-8'))
      const translationMap = new Map()
      buildYamlPathMap(oldCN, oldEN, translationMap)
      finalObj = processYamlNode(newCN, translationMap, collector)
    } else {
      finalObj = processYamlNode(newCN, new Map(), collector)
    }

    if (collector.length > 0) {
      console.log(`    Need to translate ${collector.length} keys for [${lang}]`)
      const textsToTranslate = collector.map(item => item.originalKey)
      const translatedTexts = await translateSegmentsWithCache(textsToTranslate, lang, cache)

      collector.forEach((item, idx) => {
        const transKey = translatedTexts[idx]
        const val = item.targetObj[item.originalKey]
        delete item.targetObj[item.originalKey]
        item.targetObj[transKey] = val
      })
    } else {
      console.log(`    ✨ No changes for [${lang}]`)
    }

    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

    const yamlStr = yaml.dump(finalObj, { lineWidth: -1, noRefs: true })
    fs.writeFileSync(targetPath, headerComments + yamlStr, 'utf-8')
    console.log(`    ✅ Updated: ${targetPath}`)
  }

  saveTranslationCache(cache)
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is not set.')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const targetArg = args.find(arg => arg.startsWith('--target='))
  if (targetArg) {
    const targets = targetArg.split('=')[1].split(',')
    TARGET_LANGS.length = 0
    TARGET_LANGS.push(...targets)
  }

  const files = getChangedFiles()

  if (files.length === 0) {
    console.log('No relevant files changed in content/cn.')
    return
  }

  console.log(`Found ${files.length} changed files.`)

  for (const file of files) {
    try {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        await processYamlFile(file)
      } else {
        await processMarkdownFile(file)
      }
    } catch (e) {
      console.error(`Failed to process ${file}:`, e)
    }
  }
}

main()
