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
import * as diffSequencesModule from 'diff-sequences'

const diffSequences =
  diffSequencesModule.diffSequences
  || diffSequencesModule.default
  || diffSequencesModule

// --- Configuration ---
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
const ENABLE_EDIT_TRANSLATE = process.env.ENABLE_EDIT_TRANSLATE !== '0'
const EDIT_SIM_THRESHOLD = Number(process.env.EDIT_SIM_THRESHOLD || 0.75)

// 新增配置：结构权重
const STRUCTURAL_MATCH_WEIGHT = 0.3 // 结构匹配权重
const CONTENT_MATCH_WEIGHT = 0.7    // 内容匹配权重

// --- Helpers ---

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
    const renameMatch = line.match(/^[A-Z?]{1,2}\s+(.+)\s+->\s+(.+)$/)
    if (renameMatch) {
      files.push(renameMatch[2])
      continue
    }
    const pathPart = line.slice(3)
    if (pathPart) files.push(pathPart)
  }
  return files
}

function getChangedFiles() {
  try {
    const diffOutput = exec('git diff --name-only HEAD^ HEAD')
    const changedFiles = diffOutput.split('\n').filter(Boolean)
    const statusFiles = parseGitStatus()
    const combined = new Set([...changedFiles, ...statusFiles])
    const allChanged = Array.from(combined)

    if (allChanged.includes('scripts/languages.json')) {
      console.log('⚡️ Languages config changed, scanning all content files...')
      const allFiles = exec('git ls-files content/cn').split('\n')
      return allFiles.filter(line =>
        line.startsWith(SOURCE_DIR)
        && (line.endsWith('.md') || line.endsWith('.yml') || line.endsWith('.yaml'))
      )
    }

    return allChanged.filter(line =>
      line.startsWith(SOURCE_DIR)
      && (line.endsWith('.md') || line.endsWith('.yml') || line.endsWith('.yaml'))
    )
  } catch (e) {
    console.error('Failed to get diff:', e)
    return []
  }
}

function getGitContent(revision, filePath) {
  try {
    return exec(`git show ${revision}:${filePath}`)
  } catch {
    return null
  }
}

function getHash(str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

// --- Remark AST Logic ---

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify, { bullet: '*', fences: '`' })
  .use(remarkFrontmatter, ['yaml'])

/**
 * 改进：为每个 block 添加结构上下文信息
 */
function getStructuralContext(node, index, totalLength, parentType = null) {
  return {
    relativePosition: index / Math.max(totalLength - 1, 1), // 0-1 之间的相对位置
    parentType,
    depth: 0 // 可以扩展为计算嵌套深度
  }
}

/**
 * 改进版：Split AST into blocks with enhanced metadata
 */
function splitIntoBlocks(tree, rawContent) {
  const blocks = []

  function processNode(node, pathKey, isLastInList = false, listSpread = false, parentType = null, siblingIndex = 0, totalSiblings = 1) {
    if (node.type === 'list') {
      for (let i = 0; i < node.children.length; i++) {
        const item = node.children[i]
        const isLastItem = i === node.children.length - 1
        processNode(item, `${pathKey}/listItem/${i}`, isLastItem, node.spread, 'list', i, node.children.length)
      }
      return
    }

    let separator = '\n\n'
    if (node.type === 'listItem') {
      if (isLastInList) {
        separator = '\n\n'
      } else {
        separator = listSpread ? '\n\n' : '\n'
      }
    }

    const tempRoot = { type: 'root', children: [node] }
    const normalizedText = processor.stringify(tempRoot).trim()

    let rawText = normalizedText
    if (rawContent && node.position) {
      rawText = rawContent.slice(node.position.start.offset, node.position.end.offset)
    }
    const textContent = extractTextFromBlock(rawText)

    // 改进：添加结构上下文
    const structuralContext = getStructuralContext(node, siblingIndex, totalSiblings, parentType)

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
      separator: separator,
      // 新增字段
      structuralContext,
      headingLevel: node.type === 'heading' ? node.depth : null
    })
  }

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i]
    processNode(node, `root/${i}/${node.type}`, false, false, 'root', i, tree.children.length)
  }

  return blocks
}

/**
 * 改进版：使用 diff-sequences 收集匹配，但加入权重评分
 */
function collectLcsMatches(oldItems, newItems) {
  const matches = []
  if (oldItems.length === 0 || newItems.length === 0) return matches
  if (typeof diffSequences !== 'function') {
    throw new Error('diff-sequences export not resolved. Check dependency installation.')
  }

  diffSequences(
    oldItems.length,
    newItems.length,
    (oldIndex, newIndex) => oldItems[oldIndex] === newItems[newIndex],
    (nCommon, oldStart, newStart) => {
      for (let i = 0; i < nCommon; i++) {
        matches.push({
          oldIndex: oldStart + i,
          newIndex: newStart + i
        })
      }
    }
  )

  return matches
}

/**
 * 改进版：构建更智能的 block 匹配 key
 * 策略：
 * 1. 完全相同的 block（hash 相同）→ 使用 exact key
 * 2. 内容相同但格式不同（textHash 相同）→ 使用 text key  
 * 3. 位置信息作为辅助（避免重复内容混淆）
 */
function buildBlockMatchKey(block, index, mode = 'exact') {
  const positionHint = Math.floor(block.structuralContext.relativePosition * 100)
  
  if (mode === 'exact') {
    // 精确匹配：类型 + hash + 位置提示（避免重复段落混淆）
    return `${block.type}:${block.hash}:${positionHint}`
  } else if (mode === 'text') {
    // 文本匹配：类型 + textHash + 位置提示
    return `${block.type}:${block.textHash}:${positionHint}`
  } else if (mode === 'structural') {
    // 结构匹配：仅类型 + 标题层级 + 位置
    const level = block.headingLevel !== null ? block.headingLevel : 'none'
    return `${block.type}:${level}:${positionHint}`
  }
  
  return `${block.type}:${block.textHash}`
}

/**
 * 改进版：多层级 diff 匹配
 * 第一层：精确匹配（hash 完全相同）
 * 第二层：内容匹配（textHash 相同，格式可能变化）
 * 第三层：结构匹配（类型和位置相似）
 */
function buildDiffMap(oldBlocks, newBlocks) {
  // 第一层：精确匹配
  const exactOldKeys = oldBlocks.map((b, i) => buildBlockMatchKey(b, i, 'exact'))
  const exactNewKeys = newBlocks.map((b, i) => buildBlockMatchKey(b, i, 'exact'))
  const exactMatches = collectLcsMatches(exactOldKeys, exactNewKeys)
  
  const mapNewToOld = new Array(newBlocks.length).fill(-1)
  const mappedOld = new Set()
  const mappedNew = new Set()
  
  // 应用精确匹配
  for (const match of exactMatches) {
    mapNewToOld[match.newIndex] = match.oldIndex
    mappedOld.add(match.oldIndex)
    mappedNew.add(match.newIndex)
  }
  
  // 第二层：内容匹配（未匹配的 block）
  const unmatchedOld = oldBlocks.map((b, i) => ({ block: b, index: i })).filter(x => !mappedOld.has(x.index))
  const unmatchedNew = newBlocks.map((b, i) => ({ block: b, index: i })).filter(x => !mappedNew.has(x.index))
  
  if (unmatchedOld.length > 0 && unmatchedNew.length > 0) {
    const textOldKeys = unmatchedOld.map(x => buildBlockMatchKey(x.block, x.index, 'text'))
    const textNewKeys = unmatchedNew.map(x => buildBlockMatchKey(x.block, x.index, 'text'))
    const textMatches = collectLcsMatches(textOldKeys, textNewKeys)
    
    for (const match of textMatches) {
      const oldIdx = unmatchedOld[match.oldIndex].index
      const newIdx = unmatchedNew[match.newIndex].index
      mapNewToOld[newIdx] = oldIdx
      mappedOld.add(oldIdx)
      mappedNew.add(newIdx)
    }
  }
  
  // 第三层：结构位置匹配（用于内容完全变化但结构保留的情况）
  // 这层匹配的置信度较低，只在内容相似度高时采用
  const stillUnmatchedOld = oldBlocks.map((b, i) => ({ block: b, index: i })).filter(x => !mappedOld.has(x.index))
  const stillUnmatchedNew = newBlocks.map((b, i) => ({ block: b, index: i })).filter(x => !mappedNew.has(x.index))
  
  if (stillUnmatchedOld.length > 0 && stillUnmatchedNew.length > 0) {
    const structOldKeys = stillUnmatchedOld.map(x => buildBlockMatchKey(x.block, x.index, 'structural'))
    const structNewKeys = stillUnmatchedNew.map(x => buildBlockMatchKey(x.block, x.index, 'structural'))
    const structMatches = collectLcsMatches(structOldKeys, structNewKeys)
    
    // 只在内容有一定相似度时才使用结构匹配
    for (const match of structMatches) {
      const oldIdx = stillUnmatchedOld[match.oldIndex].index
      const newIdx = stillUnmatchedNew[match.newIndex].index
      const oldBlock = oldBlocks[oldIdx]
      const newBlock = newBlocks[newIdx]
      
      // 检查内容相似度
      const similarity = calculateTextSimilarity(oldBlock.textContent, newBlock.textContent)
      if (similarity >= 0.5) { // 至少 50% 相似才使用结构匹配
        mapNewToOld[newIdx] = oldIdx
        mappedOld.add(oldIdx)
        mappedNew.add(newIdx)
      }
    }
  }
  
  // 生成操作序列（用于调试和分析）
  const ops = []
  let oldPos = 0
  let newPos = 0
  
  for (let i = 0; i < newBlocks.length; i++) {
    const oldIdx = mapNewToOld[i]
    if (oldIdx === -1) {
      ops.push({ type: 'insert', newIndex: i })
    } else {
      while (oldPos < oldIdx) {
        ops.push({ type: 'delete', oldIndex: oldPos })
        oldPos++
      }
      ops.push({ type: 'equal', oldIndex: oldIdx, newIndex: i })
      oldPos = oldIdx + 1
    }
  }
  
  while (oldPos < oldBlocks.length) {
    ops.push({ type: 'delete', oldIndex: oldPos })
    oldPos++
  }
  
  const equalOps = ops.filter(op => op.type === 'equal')
  
  return { mapNewToOld, ops, equalOps }
}

/**
 * 改进版：计算文本相似度（用于结构匹配的验证）
 */
function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0
  const norm1 = normalizeSegment(text1)
  const norm2 = normalizeSegment(text2)
  if (norm1 === norm2) return 1
  
  const distance = levenshtein(norm1, norm2)
  const maxLen = Math.max(norm1.length, norm2.length)
  if (maxLen === 0) return 0
  
  return 1 - distance / maxLen
}

/**
 * 改进版：构建安全的文本复用映射
 * 策略：只复用在结构上完全对齐且内容未变的文本
 */
function buildSafeTextMap(equalOps, oldBlocks, oldENBlocks) {
  if (!oldBlocks || !oldENBlocks) return new Map()
  const map = new Map()

  for (const op of equalOps) {
    const oldIdx = op.oldIndex
    const cnBlock = oldBlocks[oldIdx]
    const enBlock = oldENBlocks[oldIdx]
    if (!cnBlock || !enBlock) continue
    
    // 只在 hash 完全相同时才建立文本映射
    if (cnBlock.hash !== enBlock.hash) continue
    
    const cnTree = processor.parse(cnBlock.text)
    const enTree = processor.parse(enBlock.text)
    const cnNodes = collectTextNodes(cnTree, cnBlock.text)
    const enNodes = collectTextNodes(enTree, enBlock.text)
    const len = Math.min(cnNodes.length, enNodes.length)
    
    for (let i = 0; i < len; i++) {
      const cnText = cnNodes[i]?.text
      const enText = enNodes[i]?.text
      if (cnText == null || enText == null) continue
      
      // 改进：使用位置感知的 key
      const contextKey = `${cnText}|${oldIdx}|${i}`
      if (!map.has(contextKey)) {
        map.set(contextKey, enText)
      }
    }
  }

  return map
}

function buildLcsIndexMap(oldItems, newItems) {
  const mapNewToOld = new Array(newItems.length).fill(-1)
  const matches = collectLcsMatches(oldItems, newItems)
  for (const match of matches) {
    mapNewToOld[match.newIndex] = match.oldIndex
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
  if (ch === '。' || ch === '!' || ch === '?' || ch === ';') return true
  if (ch === '!' || ch === '?' || ch === ';') return true
  if (ch !== '.') return false
  if (text[index - 1] === '.') return false

  let j = index - 1
  while (j >= 0 && /[A-Za-z]/.test(text[j])) j--
  const word = text.slice(j + 1, index)
  if (word && EN_ABBREVIATIONS.has(word.toLowerCase())) return false

  let k = index + 1
  while (k < text.length && /\s/.test(text[k])) k++
  if (k >= text.length) return true
  const next = text[k]

  if (/[A-Z0-9]/.test(next)) return true
  if (/["'""''\(\[\{<\-]/.test(next)) return true
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

/**
 * 改进版：动态相似度阈值
 * 短文本需要更高的相似度，长文本可以容忍更多差异
 */
function similarityScore(a, b) {
  const na = normalizeSegment(a)
  const nb = normalizeSegment(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  
  const distance = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length)
  const minLen = Math.min(na.length, nb.length)
  
  // 基础相似度
  const baseSimilarity = 1 - distance / maxLen
  
  // 长度惩罚：如果长度差异过大，降低相似度
  const lengthRatio = minLen / maxLen
  const lengthPenalty = lengthRatio < 0.7 ? lengthRatio : 1
  
  return baseSimilarity * lengthPenalty
}

/**
 * 改进版：根据文本长度动态调整阈值
 */
function getAdaptiveThreshold(textLength) {
  if (textLength < 20) {
    return 0.85 // 短文本：要求 85% 相似
  } else if (textLength < 50) {
    return 0.80 // 中等文本：80%
  } else if (textLength < 100) {
    return 0.75 // 较长文本：75%
  } else {
    return 0.70 // 长文本：70%
  }
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
      // fall through
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
      const translated = await translateBatchWithFallback(chunk, targetLang)
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

async function editSegmentsWithCache(items, targetLang, cache) {
  if (items.length === 0) return []
  const results = new Array(items.length).fill('')
  const missing = []
  const missingIndices = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = getCacheKey(targetLang, item.newCn)
    if (cache[key] && cache[key].text === item.newCn) {
      results[i] = cache[key].trans
    } else {
      missing.push(item)
      missingIndices.push(i)
    }
  }

  if (missing.length > 0) {
    for (let i = 0; i < missing.length; i += TRANSLATE_BATCH_SIZE) {
      const chunk = missing.slice(i, i + TRANSLATE_BATCH_SIZE)
      const payload = chunk.map(item => ({
        oldCn: item.oldCn,
        newCn: item.newCn,
        oldEn: item.oldEn
      }))
      const edited = await editTranslateBatchWithFallback(payload, targetLang)
      edited.forEach((trans, idx) => {
        const original = chunk[idx]
        const missingIndex = missingIndices[i + idx]
        const key = getCacheKey(targetLang, original.newCn)
        cache[key] = { text: original.newCn, trans }
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

/**
 * 改进版：翻译 Markdown blocks
 * 主要改进：
 * 1. 更智能的句子匹配（使用动态阈值）
 * 2. 避免全局文本映射的顺序问题
 * 3. 更好的编辑检测策略
 */
async function translateMarkdownBlocks(blocks, indices, targetLang, cache, oldBlocks, oldENBlocks, mapNewToOld, safeTextMap, oldTextFreq, newTextFreq) {
  const translateTasks = []
  const editTasks = []
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

    let oldCNNodes = []
    let oldENNodes = []
    let nodeMap = []
    let sameNodeLength = false
    if (oldCNBlock && oldENBlock) {
      const oldCNTree = processor.parse(oldCNBlock)
      const oldENTree = processor.parse(oldENBlock)
      oldCNNodes = collectTextNodes(oldCNTree, oldCNBlock)
      oldENNodes = collectTextNodes(oldENTree, oldENBlock)
      const oldTexts = oldCNNodes.map(n => n.text)
      const newTexts = textNodes.map(n => n.text)
      nodeMap = buildLcsIndexMap(oldTexts, newTexts)
      sameNodeLength = oldCNNodes.length === textNodes.length && oldENNodes.length === oldCNNodes.length
    }

    for (let i = 0; i < textNodes.length; i++) {
      const node = textNodes[i]
      const nodeText = node.text

      let oldNodeIndex = -1
      if (oldCNBlock && oldENBlock) {
        oldNodeIndex = nodeMap?.[i] ?? -1
        if (oldNodeIndex === -1 && sameNodeLength) oldNodeIndex = i
      }

      const oldCNNode = oldNodeIndex !== -1 ? oldCNNodes[oldNodeIndex] : null
      const oldENNode = oldNodeIndex !== -1 ? oldENNodes[oldNodeIndex] : null

      // 完全匹配：直接复用
      if (oldCNNode && oldENNode && oldCNNode.text === nodeText) {
        blockInfo.replacements.push({
          start: node.start,
          end: node.end,
          text: oldENNode.text
        })
        continue
      }

      const newSegments = splitIntoSentences(nodeText)
      const oldSegments = oldCNNode ? splitIntoSentences(oldCNNode.text) : []
      const oldEnSegments = oldENNode ? splitIntoSentences(oldENNode.text) : []
      const newSegKeys = newSegments.map(seg => normalizeSegment(seg.core || seg.text))
      const oldSegKeys = oldSegments.map(seg => normalizeSegment(seg.core || seg.text))
      const segMap = oldSegments.length > 0 ? buildLcsIndexMap(oldSegKeys, newSegKeys) : []
      const usedOld = new Set()

      for (let s = 0; s < newSegments.length; s++) {
        const seg = newSegments[s]
        const core = seg.core || seg.text
        if (!core || !filterTranslatable(core)) continue

        // 第一优先级：LCS 精确匹配
        const oldSegIndex = segMap?.[s] ?? -1
        if (oldSegIndex !== -1 && oldEnSegments[oldSegIndex]) {
          usedOld.add(oldSegIndex)
          const enCore = oldEnSegments[oldSegIndex].core || oldEnSegments[oldSegIndex].text
          blockInfo.replacements.push({
            start: node.start + seg.start,
            end: node.start + seg.end,
            text: formatSegmentReplacement(seg, enCore)
          })
          continue
        }

        // 第二优先级：安全文本映射（改进：使用位置感知的 key）
        if (safeTextMap && oldTextFreq?.get(core) === 1 && newTextFreq?.get(core) === 1) {
          // 使用位置感知的 key
          const contextKey = `${core}|${oldIndex}|${oldNodeIndex}`
          const mappedText = safeTextMap.get(contextKey)
          if (mappedText) {
            blockInfo.replacements.push({
              start: node.start + seg.start,
              end: node.start + seg.end,
              text: formatSegmentReplacement(seg, mappedText)
            })
            continue
          }
        }

        // 第三优先级：编辑翻译（改进：使用动态阈值）
        if (ENABLE_EDIT_TRANSLATE && oldSegments.length > 0 && oldEnSegments.length > 0) {
          let bestIdx = -1
          let bestScore = 0
          for (let j = 0; j < oldSegments.length; j++) {
            if (usedOld.has(j)) continue
            if (!oldEnSegments[j]) continue
            const oldCore = oldSegments[j].core || oldSegments[j].text
            const score = similarityScore(core, oldCore)
            if (score > bestScore) {
              bestScore = score
              bestIdx = j
            }
          }
          
          // 改进：使用动态阈值
          const threshold = getAdaptiveThreshold(core.length)
          if (bestIdx !== -1 && bestScore >= threshold) {
            usedOld.add(bestIdx)
            editTasks.push({
              blockIndex: idx,
              start: node.start + seg.start,
              end: node.start + seg.end,
              segment: seg,
              oldCn: oldSegments[bestIdx].core || oldSegments[bestIdx].text,
              newCn: core,
              oldEn: oldEnSegments[bestIdx].core || oldEnSegments[bestIdx].text
            })
            continue
          }
        }

        // 最后：全新翻译
        translateTasks.push({
          blockIndex: idx,
          start: node.start + seg.start,
          end: node.start + seg.end,
          segment: seg,
          text: core
        })
      }
    }
  }

  if (editTasks.length > 0) {
    const edited = await editSegmentsWithCache(editTasks, targetLang, cache)
    for (let i = 0; i < editTasks.length; i++) {
      const t = editTasks[i]
      const info = perBlock.get(t.blockIndex)
      if (!info) continue
      info.replacements.push({
        start: t.start,
        end: t.end,
        text: formatSegmentReplacement(t.segment, edited[i])
      })
    }
  }

  if (translateTasks.length > 0) {
    const segments = translateTasks.map(t => t.text)
    const translated = await translateSegmentsWithCache(segments, targetLang, cache)

    for (let i = 0; i < translateTasks.length; i++) {
      const t = translateTasks[i]
      const info = perBlock.get(t.blockIndex)
      if (!info) continue
      info.replacements.push({
        start: t.start,
        end: t.end,
        text: formatSegmentReplacement(t.segment, translated[i])
      })
    }
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

  const newTree = processor.parse(newCNRaw)
  const oldTree = oldCNRaw ? processor.parse(oldCNRaw) : { children: [] }

  const newBlocks = splitIntoBlocks(newTree, newCNRaw)
  const oldBlocks = splitIntoBlocks(oldTree, oldCNRaw)
  
  // 改进：使用新的多层级 diff
  const { mapNewToOld: mapNewToOldText, equalOps } = buildDiffMap(oldBlocks, newBlocks)
  
  // 精确匹配映射
  const mapNewToOldExact = mapNewToOldText.map((oldIndex, newIndex) => {
    if (oldIndex === -1) return -1
    if (!oldBlocks[oldIndex] || !newBlocks[newIndex]) return -1
    return oldBlocks[oldIndex].hash === newBlocks[newIndex].hash ? oldIndex : -1
  })
  
  const newTextFreq = buildTextFreq(newTree, newCNRaw)
  const oldTextFreq = buildTextFreq(oldTree, oldCNRaw || '')

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
        const oldIndexExact = mapNewToOldExact[i]
        if (oldIndexExact !== -1 && oldENBlocks[oldIndexExact]) {
          finalBlocks[i] = oldENBlocks[oldIndexExact].text
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
        mapNewToOldText,
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

    let finalContent = ''
    for (let i = 0; i < finalBlocks.length; i++) {
      const block = newBlocks[i]
      const content = finalBlocks[i]
      const separator = block.separator || '\n\n'

      finalContent += content
      if (i < finalBlocks.length - 1) {
        finalContent += separator
      } else {
        finalContent += '\n'
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
