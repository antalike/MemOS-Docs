import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'
import crypto from 'crypto'
import * as diffSequencesModule from 'diff-sequences'

// 处理不同的导出格式（适配 pnpm、npm、yarn）
const diffSequences =
  diffSequencesModule.diffSequences                    // 直接命名导出
  || diffSequencesModule.default?.default              // pnpm 双层 default
  || diffSequencesModule.default                       // 标准 default
  || diffSequencesModule['module.exports']?.default    // CommonJS 兼容
  || diffSequencesModule

// --- Configuration ---
const languagesConfigPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'languages.json')
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
const BLOCK_MODIFY_SIM_THRESHOLD = Number(process.env.BLOCK_MODIFY_SIM_THRESHOLD || 0.75)

// --- Helpers ---

async function callLLM(messages, temperature = 0.1) {
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function cleanJSONString(text) {
  let content = String(text || '').trim()
  if (content.startsWith('```json')) content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  if (content.startsWith('```')) content = content.replace(/^```\s*/, '').replace(/\s*```$/, '')
  return content
}

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

function splitIntoBlocks(tree, rawContent) {
  const blocks = []
  const headingStack = []

  function normalizeHeadingText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim()
  }

  function getHeadingPathKey() {
    return headingStack.filter(Boolean).join(' > ')
  }

  function getRawText(node) {
    if (rawContent && node.position) {
      return rawContent.slice(node.position.start.offset, node.position.end.offset)
    }
    const tempRoot = { type: 'root', children: [node] }
    return processor.stringify(tempRoot).trim()
  }

  function isBlockNode(node, parentType) {
    if (node.type === 'heading') return true
    if (node.type === 'listItem') return true
    if (node.type === 'paragraph' && parentType !== 'listItem') return true
    if (node.type === 'code') return true
    if (node.type === 'html') return true
    if (node.type === 'yaml') return true
    if (node.type === 'blockquote') return true
    if (node.type === 'thematicBreak') return true
    if (node.type === 'table') return true
    if (node.type === 'definition') return true
    if (node.type === 'footnoteDefinition') return true
    return false
  }

  function shouldTraverseChildren(node) {
    if (node.type === 'heading') return false
    if (node.type === 'listItem') return false
    if (node.type === 'paragraph') return false
    if (node.type === 'code') return false
    if (node.type === 'html') return false
    if (node.type === 'yaml') return false
    if (node.type === 'blockquote') return false
    if (node.type === 'thematicBreak') return false
    if (node.type === 'table') return false
    if (node.type === 'definition') return false
    if (node.type === 'footnoteDefinition') return false
    return true
  }

  function visit(node, pathKey, parentPathKey, parentType, siblingIndex, totalSiblings) {
    if (!node) return

    if (node.type === 'heading') {
      const rawText = getRawText(node)
      const headingText = normalizeHeadingText(extractTextFromBlock(rawText))
      const depth = node.depth || 1
      headingStack.length = Math.max(0, depth - 1)
      headingStack[depth - 1] = headingText
    }

    if (isBlockNode(node, parentType)) {
      const rawText = getRawText(node)
      const tempRoot = { type: 'root', children: [node] }
      const normalizedText = processor.stringify(tempRoot).trim()
      let textContent = extractTextFromBlock(rawText)
      if (node.type === 'code' || node.type === 'html' || node.type === 'yaml' || !String(textContent).trim()) {
        textContent = rawText
      }
      const headingPath = getHeadingPathKey()

      blocks.push({
        type: node.type,
        path: pathKey,
        parentKey: parentPathKey,
        siblingIndex,
        totalSiblings,
        headingPath,
        text: rawText,
        normalized: normalizedText,
        hash: getHash(normalizedText.replace(/\s+/g, ' ').trim()),
        textHash: getHash(textContent.replace(/\s+/g, ' ').trim()),
        textContent,
        start: node.position?.start?.offset ?? null,
        end: node.position?.end?.offset ?? null,
        headingLevel: node.type === 'heading' ? node.depth : null
      })
    }

    if (!node.children || node.children.length === 0) return
    if (!shouldTraverseChildren(node)) return

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      visit(child, `${pathKey}/${child.type}/${i}`, pathKey, node.type, i, node.children.length)
    }
  }

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i]
    visit(node, `root/${i}/${node.type}`, 'root', 'root', i, tree.children.length)
  }

  blocks.sort((a, b) => {
    const sa = a.start ?? 0
    const sb = b.start ?? 0
    if (sa !== sb) return sa - sb
    return (a.end ?? 0) - (b.end ?? 0)
  })

  for (let i = 0; i < blocks.length; i++) {
    const curr = blocks[i]
    const next = blocks[i + 1]
    if (rawContent && curr.end != null) {
      if (next && next.start != null) {
        curr.separator = rawContent.slice(curr.end, next.start)
      } else {
        curr.separator = '\n'
      }
    } else {
      curr.separator = '\n\n'
    }
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

function sentenceOverlapScore(text1, text2) {
  const aSegs = splitIntoSentences(text1).map(seg => normalizeSegment(seg.core || seg.text)).filter(Boolean)
  const bSegs = splitIntoSentences(text2).map(seg => normalizeSegment(seg.core || seg.text)).filter(Boolean)
  if (aSegs.length === 0 || bSegs.length === 0) return 0
  const map = buildLcsIndexMap(aSegs, bSegs)
  let matches = 0
  for (let i = 0; i < map.length; i++) {
    const idx = map[i]
    if (idx !== -1 && aSegs[idx] === bSegs[i]) matches++
  }
  return matches / Math.max(aSegs.length, bSegs.length)
}

/**
 * 改进版：构建安全的文本复用映射
 * 策略：只复用在结构上完全对齐且内容未变的文本
 */

function buildLcsIndexMap(oldItems, newItems) {
  const mapNewToOld = new Array(newItems.length).fill(-1)
  const matches = collectLcsMatches(oldItems, newItems)
  for (const match of matches) {
    mapNewToOld[match.newIndex] = match.oldIndex
  }
  return mapNewToOld
}

function buildBlockKey(block) {
  return `${block.type}:${block.textHash}`
}

function scoreBlockCandidate(newBlock, oldBlock) {
  let score = 0
  if (newBlock.parentKey && oldBlock.parentKey && newBlock.parentKey === oldBlock.parentKey) score += 2
  if (newBlock.headingPath && oldBlock.headingPath && newBlock.headingPath === oldBlock.headingPath) score += 1
  if (newBlock.siblingIndex != null && oldBlock.siblingIndex != null && newBlock.siblingIndex === oldBlock.siblingIndex) score += 0.5
  return score
}

function findHeadingAnchors(oldBlocks, newBlocks) {
  const oldHeadings = oldBlocks.map((b, i) => ({ ...b, originalIndex: i })).filter(b => b.type === 'heading')
  const newHeadings = newBlocks.map((b, i) => ({ ...b, originalIndex: i })).filter(b => b.type === 'heading')

  const oldKeys = oldHeadings.map(b => `${b.depth}:${b.textHash}`)
  const newKeys = newHeadings.map(b => `${b.depth}:${b.textHash}`)

  const matches = collectLcsMatches(oldKeys, newKeys)
  return matches.map(m => ({
    oldIndex: oldHeadings[m.oldIndex].originalIndex,
    newIndex: newHeadings[m.newIndex].originalIndex
  }))
}

function alignSegment(oldSegment, newSegment, oldOffset) {
  const mapNewToOld = new Array(newSegment.length).fill(-1)
  const oldMatched = new Set()

  const oldKeys = oldSegment.map(buildBlockKey)
  const newKeys = newSegment.map(buildBlockKey)
  const lcsMatches = collectLcsMatches(oldKeys, newKeys)

  for (const match of lcsMatches) {
    mapNewToOld[match.newIndex] = match.oldIndex + oldOffset
    oldMatched.add(match.oldIndex)
  }

  const unmatchedOldByKey = new Map()
  for (let i = 0; i < oldSegment.length; i++) {
    if (oldMatched.has(i)) continue
    const key = oldKeys[i]
    if (!unmatchedOldByKey.has(key)) unmatchedOldByKey.set(key, [])
    unmatchedOldByKey.get(key).push(i)
  }

  for (let i = 0; i < newSegment.length; i++) {
    if (mapNewToOld[i] !== -1) continue
    const key = newKeys[i]
    const candidates = unmatchedOldByKey.get(key)
    
    // Try to match by key (content hash) first
    if (candidates && candidates.length > 0) {
      let bestIdx = -1
      let bestScore = -1
      for (const oldIdx of candidates) {
        const score = scoreBlockCandidate(newSegment[i], oldSegment[oldIdx])
        if (score > bestScore) {
          bestScore = score
          bestIdx = oldIdx
        }
      }
      if (bestIdx !== -1) {
        mapNewToOld[i] = bestIdx + oldOffset
        oldMatched.add(bestIdx)
        continue
      }
    }
    
    // Fallback: Semantic/Structural matching for modified blocks
    const relPos = i / newSegment.length
    const targetOldIdx = Math.floor(relPos * oldSegment.length)
    const searchRange = Math.max(5, Math.floor(oldSegment.length * 0.2))
    
    let bestSoftIdx = -1
    let bestSoftScore = 0
    let bestContext = -1
    
    for (let offset = -searchRange; offset <= searchRange; offset++) {
        const checkIdx = targetOldIdx + offset
        if (checkIdx < 0 || checkIdx >= oldSegment.length) continue
        if (oldMatched.has(checkIdx)) continue
        
        const oldB = oldSegment[checkIdx]
        const newB = newSegment[i]
        
        if (oldB.type !== newB.type) continue
        
        const sim = calculateTextSimilarity(oldB.textContent, newB.textContent)
        const overlap = sentenceOverlapScore(oldB.textContent, newB.textContent)
        const score = Math.max(sim, overlap)
        const contextScore = scoreBlockCandidate(newB, oldB)

        if (score > 0.4 && (score > bestSoftScore || (score === bestSoftScore && contextScore > bestContext))) {
             bestSoftScore = score
             bestContext = contextScore
             bestSoftIdx = checkIdx
        }
    }
    
    if (bestSoftIdx !== -1 && bestSoftScore >= BLOCK_MODIFY_SIM_THRESHOLD) {
         mapNewToOld[i] = bestSoftIdx + oldOffset
         oldMatched.add(bestSoftIdx)
    }
  }

  return mapNewToOld
}

function matchBlocks(oldBlocks, newBlocks) {
  const mapNewToOld = new Array(newBlocks.length).fill(-1)
  const matchType = new Array(newBlocks.length).fill('none')

  // 1. Hard Anchors: Headings
  const anchors = findHeadingAnchors(oldBlocks, newBlocks)

  const fullAnchors = [
    { oldIndex: -1, newIndex: -1 },
    ...anchors,
    { oldIndex: oldBlocks.length, newIndex: newBlocks.length }
  ]

  for (let i = 0; i < fullAnchors.length - 1; i++) {
    const startAnchor = fullAnchors[i]
    const endAnchor = fullAnchors[i+1]

    const oldSegmentStart = startAnchor.oldIndex + 1
    const oldSegmentEnd = endAnchor.oldIndex
    const newSegmentStart = startAnchor.newIndex + 1
    const newSegmentEnd = endAnchor.newIndex

    if (newSegmentStart >= newSegmentEnd) continue 

    const oldSegment = oldBlocks.slice(oldSegmentStart, oldSegmentEnd)
    const newSegment = newBlocks.slice(newSegmentStart, newSegmentEnd)

    // 2. Segmented Alignment
    const segmentMap = alignSegment(oldSegment, newSegment, oldSegmentStart)

    for (let j = 0; j < newSegment.length; j++) {
      const globalNewIdx = newSegmentStart + j
      const globalOldIdx = segmentMap[j]
      
      if (globalOldIdx !== -1) {
        mapNewToOld[globalNewIdx] = globalOldIdx
        if (oldBlocks[globalOldIdx].hash === newBlocks[globalNewIdx].hash) {
          matchType[globalNewIdx] = 'exact'
        } else {
          matchType[globalNewIdx] = 'modified'
        }
      }
    }
  }
  
  // Map anchors
  for (const anchor of anchors) {
     mapNewToOld[anchor.newIndex] = anchor.oldIndex
     matchType[anchor.newIndex] = 'exact'
  }

  return { mapNewToOld, matchType }
}

function mapOldCnToOldEn(oldCnBlocks, oldEnBlocks) {
  const map = new Array(oldCnBlocks.length).fill(-1)
  if (!oldEnBlocks || oldEnBlocks.length === 0) return map

  const oldEnByPath = new Map()
  for (let i = 0; i < oldEnBlocks.length; i++) {
    oldEnByPath.set(oldEnBlocks[i].path, i)
  }
  for (let i = 0; i < oldCnBlocks.length; i++) {
    const byPath = oldEnByPath.get(oldCnBlocks[i].path)
    if (byPath != null) map[i] = byPath
  }

  const remainingCn = []
  const remainingEn = []
  for (let i = 0; i < oldCnBlocks.length; i++) {
    if (map[i] === -1) remainingCn.push(i)
  }
  const usedEn = new Set(map.filter(idx => idx !== -1))
  for (let i = 0; i < oldEnBlocks.length; i++) {
    if (!usedEn.has(i)) remainingEn.push(i)
  }

  if (remainingCn.length > 0 && remainingEn.length > 0) {
    const cnTypes = remainingCn.map(i => oldCnBlocks[i].type)
    const enTypes = remainingEn.map(i => oldEnBlocks[i].type)
    const matches = collectLcsMatches(cnTypes, enTypes)
    for (const match of matches) {
      const cnIdx = remainingCn[match.oldIndex]
      const enIdx = remainingEn[match.newIndex]
      if (map[cnIdx] === -1) map[cnIdx] = enIdx
    }
  }

  return map
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
  if (ch === '。' || ch === '!' || ch === '?' || ch === ';' || ch === '！' || ch === '？' || ch === '；') return true
  if (ch === '：') return true // Chinese colon

  if (ch === ':') {
    // English colon: avoid splitting URLs (http://) or time (12:30)
    const next = text[index + 1]
    if (next === '/') return false
    if (/\d/.test(next)) return false
    return true
  }

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

const sentenceCache = new Map()

function splitIntoSentences(text) {
  if (!text) return []
  if (sentenceCache.has(text)) return sentenceCache.get(text)
  const segments = []
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
  sentenceCache.set(text, segments)
  return segments
}

function splitForIsolation(text) {
  const segs = splitIntoSentences(text)
  if (segs.length !== 1) return segs
  const raw = segs[0].text
  let colonIdx = raw.indexOf('：')
  if (colonIdx === -1) colonIdx = raw.indexOf(':')
  if (colonIdx <= 0 || colonIdx >= raw.length - 1) return segs
  const leftCore = raw.slice(0, colonIdx).trim()
  const rightCore = raw.slice(colonIdx + 1).trim()
  if (!leftCore || !rightCore) return segs
  if (leftCore.length > 60) return segs
  const first = buildSegment(raw, 0, colonIdx + 1)
  const second = buildSegment(raw, colonIdx + 1, raw.length)
  return [first, second]
}

function lockUnchangedSentences(oldCn, newCn, oldEn, editedEn) {
  if (!oldCn || !newCn || !oldEn || !editedEn) return editedEn

  const oldCnSegs = splitIntoSentences(oldCn)
  const newCnSegs = splitIntoSentences(newCn)
  const oldEnSegs = splitIntoSentences(oldEn)
  const editedEnSegs = splitIntoSentences(editedEn)

  console.log('    🔒 Locking check:')
  console.log(`      Old CN Segs: ${oldCnSegs.length}, New CN Segs: ${newCnSegs.length}`)
  console.log(`      Old EN Segs: ${oldEnSegs.length}, Edited EN Segs: ${editedEnSegs.length}`)

  if (oldCnSegs.length === 0 || newCnSegs.length === 0) return editedEn
  if (oldEnSegs.length === 0 || editedEnSegs.length === 0) return editedEn

  const maxLead = Math.min(oldCnSegs.length, newCnSegs.length)
  let lead = 0
  for (; lead < maxLead; lead++) {
    const s1 = normalizeSegment(oldCnSegs[lead].core)
    const s2 = normalizeSegment(newCnSegs[lead].core)
    if (s1 !== s2) {
      console.log(`      Lead mismatch at ${lead}:`)
      console.log(`        Old: "${s1}"`)
      console.log(`        New: "${s2}"`)
      break
    }
    lead++
  }
  console.log(`      Lead count: ${lead}`)

  const maxTail = Math.min(oldCnSegs.length, newCnSegs.length) - lead
  let tail = 0
  for (; tail < maxTail; tail++) {
    const oldIdx = oldCnSegs.length - 1 - tail
    const newIdx = newCnSegs.length - 1 - tail
    if (oldIdx < lead || newIdx < lead) break
    const s1 = normalizeSegment(oldCnSegs[oldIdx].core)
    const s2 = normalizeSegment(newCnSegs[newIdx].core)
    if (s1 !== s2) {
      console.log(`      Tail mismatch at tail-index ${tail}:`)
      console.log(`        Old: "${s1}"`)
      console.log(`        New: "${s2}"`)
      break
    }
    tail++
  }
  console.log(`      Tail count: ${tail}`)

  if (lead === 0 && tail === 0) return editedEn

  const maxReplace = Math.min(oldEnSegs.length, editedEnSegs.length)
  if (lead > maxReplace) {
    console.log('      ⚠️ Lead exceeds English segments, skipping lock.')
    return editedEn
  }
  if (tail > maxReplace - lead) tail = Math.max(0, maxReplace - lead)

  const nextSegs = editedEnSegs.slice()
  for (let i = 0; i < lead; i++) {
    if (!oldEnSegs[i]) break
    console.log(`      🔒 Locking lead ${i}: "${oldEnSegs[i].text.substring(0, 20)}..."`)
    nextSegs[i] = oldEnSegs[i]
  }
  for (let i = 0; i < tail; i++) {
    const idx = nextSegs.length - 1 - i
    const oldIdx = oldEnSegs.length - 1 - i
    if (idx < 0 || oldIdx < 0) break
    console.log(`      🔒 Locking tail ${i} (idx ${idx}): "${oldEnSegs[oldIdx].text.substring(0, 20)}..."`)
    nextSegs[idx] = oldEnSegs[oldIdx]
  }

  return nextSegs.map(seg => seg.text).join('')
}

function shouldIsolateSentences(item) {
  const oldCnCount = splitForIsolation(item.oldCn).length
  const newCnCount = splitForIsolation(item.newCn).length
  const oldEnCount = splitForIsolation(item.oldEn).length
  return oldCnCount > 1 || newCnCount > 1 || oldEnCount > 1
}

async function editLongTextSentenceIsolated(item, targetLang) {
  const newSegs = splitForIsolation(item.newCn)
  if (newSegs.length <= 1) return null
  const oldCnSegs = splitForIsolation(item.oldCn)
  const oldEnSegs = splitForIsolation(item.oldEn)
  const newKeys = newSegs.map(seg => normalizeSegment(seg.core || seg.text))
  const oldKeys = oldCnSegs.map(seg => normalizeSegment(seg.core || seg.text))
  const segMap = oldCnSegs.length > 0 ? buildLcsIndexMap(oldKeys, newKeys) : []
  const usedOld = new Set()
  const results = new Array(newSegs.length).fill('')
  const editPayload = []
  const editIndices = []
  const translatePayload = []
  const translateIndices = []

  for (let i = 0; i < newSegs.length; i++) {
    const seg = newSegs[i]
    const core = seg.core || seg.text
    if (!core || !filterTranslatable(core)) {
      results[i] = seg.text
      continue
    }
    const mapped = segMap?.[i] ?? -1
    if (mapped !== -1 && oldEnSegs[mapped]) {
      usedOld.add(mapped)
      const enCore = oldEnSegs[mapped].core || oldEnSegs[mapped].text
      results[i] = formatSegmentReplacement(seg, enCore)
      continue
    }
    let bestIdx = -1
    let bestScore = 0
    for (let j = 0; j < oldCnSegs.length; j++) {
      if (usedOld.has(j)) continue
      const oldCore = oldCnSegs[j].core || oldCnSegs[j].text
      const score = similarityScore(core, oldCore)
      if (score > bestScore) {
        bestScore = score
        bestIdx = j
      }
    }
    const threshold = getAdaptiveThreshold(core.length)
    if (bestIdx !== -1 && bestScore >= threshold && oldEnSegs[bestIdx]) {
      usedOld.add(bestIdx)
      editPayload.push({
        oldCn: oldCnSegs[bestIdx].core || oldCnSegs[bestIdx].text,
        newCn: core,
        oldEn: oldEnSegs[bestIdx].core || oldEnSegs[bestIdx].text
      })
      editIndices.push(i)
    } else {
      translatePayload.push(core)
      translateIndices.push(i)
    }
  }

  if (editPayload.length > 0) {
    const edited = await editTranslateBatchWithFallback(editPayload, targetLang)
    for (let i = 0; i < edited.length; i++) {
      const idx = editIndices[i]
      const seg = newSegs[idx]
      results[idx] = formatSegmentReplacement(seg, edited[i])
    }
  }

  if (translatePayload.length > 0) {
    const translated = await translateSegmentsWithCache(translatePayload, targetLang)
    for (let i = 0; i < translated.length; i++) {
      const idx = translateIndices[i]
      const seg = newSegs[idx]
      results[idx] = formatSegmentReplacement(seg, translated[i])
    }
  }

  return results.join('')
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

const normalizeCache = new Map()

function normalizeSegment(text) {
  const raw = text == null ? '' : String(text)
  if (normalizeCache.has(raw)) return normalizeCache.get(raw)
  const normalized = raw.replace(/\s+/g, ' ').trim()
  normalizeCache.set(raw, normalized)
  return normalized
}

function normalizeForInsertion(text) {
  return String(text || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
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

const LABEL_MAP = new Map([
  ['提示', 'Tip'],
  ['注意', 'Note'],
  ['警告', 'Warning'],
  ['警示', 'Warning'],
  ['说明', 'Note']
])

function normalizeLabel(label) {
  return String(label || '').replace(/[：:]/g, '').trim()
}

function extractLeadingBoldLabel(text) {
  const m = String(text || '').match(/^\s*\*\*([^*]+)\*\*/)
  return m ? m[1].trim() : null
}

function replaceLeadingBoldLabel(text, label) {
  const raw = String(text || '')
  const m = raw.match(/^(\s*)\*\*([^*]+)\*\*/)
  if (m) {
    return `${m[1]}**${label}**${raw.slice(m[0].length)}`
  }
  return `**${label}** ${raw}`
}

function enforceLeadingLabel(oldCn, newCn, oldEn, editedEn) {
  const newLabel = extractLeadingBoldLabel(newCn)
  if (!newLabel) return editedEn
  const normNew = normalizeLabel(newLabel)
  const mapped = LABEL_MAP.get(normNew)
  if (mapped) return replaceLeadingBoldLabel(editedEn, mapped)

  const oldLabelCn = extractLeadingBoldLabel(oldCn)
  const oldLabelEn = extractLeadingBoldLabel(oldEn)
  if (oldLabelCn && normalizeLabel(oldLabelCn) === normNew && oldLabelEn) {
    return replaceLeadingBoldLabel(editedEn, oldLabelEn)
  }

  return editedEn
}

function detectInsertions(oldCn, newCn) {
  if (!oldCn || !newCn) return null
  let i = 0
  const insertions = []
  let buffer = ''
  let insertPos = null

  for (let j = 0; j < newCn.length; j++) {
    const ch = newCn[j]
    if (i < oldCn.length && ch === oldCn[i]) {
      if (buffer) {
        insertions.push({ pos: insertPos ?? i, text: buffer })
        buffer = ''
        insertPos = null
      }
      i++
    } else {
      if (!buffer) insertPos = i
      buffer += ch
    }
  }

  if (buffer) insertions.push({ pos: insertPos ?? i, text: buffer })
  if (i !== oldCn.length) return null
  return insertions.length > 0 ? insertions : []
}

function getInsertions(oldCn, newCn) {
  const direct = detectInsertions(oldCn, newCn)
  if (direct) return { insertions: direct, base: oldCn, normalized: false }
  const normOld = normalizeForInsertion(oldCn)
  const normNew = normalizeForInsertion(newCn)
  const normalized = detectInsertions(normOld, normNew)
  if (normalized) return { insertions: normalized, base: normOld, normalized: true }
  return { insertions: null, base: oldCn, normalized: false }
}

function buildInsertionHints(oldCn, insertions, contextLen = 16) {
  return insertions.map(ins => {
    const left = oldCn.slice(Math.max(0, ins.pos - contextLen), ins.pos)
    const right = oldCn.slice(ins.pos, Math.min(oldCn.length, ins.pos + contextLen))
    return { text: ins.text, left, right, pos: ins.pos }
  })
}

function mergeAppendSuffix(oldEn, suffixEn) {
  let base = String(oldEn || '').replace(/\s+$/, '')
  const tail = String(suffixEn || '').replace(/^\s+/, '')
  if (!tail) return base
  if (!base) return tail

  // Smart punctuation handling:
  // If base ends with period and tail starts with comma/semicolon, remove period
  if (base.endsWith('.') && /^[,;]/.test(tail)) {
    base = base.slice(0, -1)
  }

  if (/^[,.;:!?]/.test(tail)) return `${base}${tail}`
  return `${base} ${tail}`
}

function mergePrependPrefix(oldEn, prefixEn) {
  const head = String(prefixEn || '').replace(/\s+$/, '')
  const base = String(oldEn || '').replace(/^\s+/, '')
  if (!head) return base
  if (!base) return head
  if (/[("'\[]$/.test(head)) return `${head}${base}`
  return `${head} ${base}`
}

function getTailIndex(text) {
  const raw = String(text || '')
  let i = raw.length

  // trim trailing whitespace
  while (i > 0 && /\s/.test(raw[i - 1])) i--

  // trim trailing html tags like <br>, <br/>, </p>
  while (i > 0 && raw[i - 1] === '>') {
    const lt = raw.lastIndexOf('<', i - 1)
    if (lt === -1) break
    const tag = raw.slice(lt, i)
    if (!/^<[^>]+>$/.test(tag)) break
    i = lt
    while (i > 0 && /\s/.test(raw[i - 1])) i--
  }

  // trim trailing punctuation
  while (i > 0 && /[\s\.\,\!\?\;\:\uFF0C\u3002\uFF01\uFF1F\uFF1B\uFF1A"'\)\]\}]/.test(raw[i - 1])) {
    i--
  }

  return i
}

function isHeadInsertion(insertions) {
  return insertions.length > 0 && insertions.every(ins => ins.pos === 0)
}

function isTailInsertion(insertions, oldCn) {
  if (insertions.length === 0) return false
  const tailIndex = getTailIndex(oldCn)
  return insertions.every(ins => ins.pos === tailIndex)
}

function shouldGuardEditDrift(oldCn, newCn, oldEn, editedEn) {
  if (!oldEn || !editedEn) return false
  const cnSim = similarityScore(oldCn || '', newCn || '')
  const enThreshold = Math.min(0.95, getAdaptiveThreshold(String(oldEn).length) + 0.1)
  const enSim = similarityScore(oldEn, editedEn)

  const normOldCn = normalizeSegment(oldCn || '')
  const normNewCn = normalizeSegment(newCn || '')
  const normOldEn = normalizeSegment(oldEn || '')
  const normEditedEn = normalizeSegment(editedEn || '')

  const cnLen = Math.max(normOldCn.length, normNewCn.length)
  const enLen = Math.max(normOldEn.length, normEditedEn.length)
  const cnChangeRatio = cnLen ? (levenshtein(normOldCn, normNewCn) / cnLen) : 0
  const enChangeRatio = enLen ? (levenshtein(normOldEn, normEditedEn) / enLen) : 0
  const enDriftByRatio = cnChangeRatio <= 0.15 && enChangeRatio >= Math.max(0.08, cnChangeRatio * 2.5)

  if (cnSim < 0.85) return enDriftByRatio
  return enSim < enThreshold || enDriftByRatio
}

function coerceSingleString(content) {
  if (content == null) return ''
  let text = cleanJSONString(content)
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

async function runLLMRequest({
  label,
  targetLang,
  systemPrompt,
  userContent,
  parser = coerceSingleString
}) {
  if (label) {
    console.log(`    ⏳ ${label}${targetLang ? ' to ' + targetLang : ''}...`)
  }

  const content = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ])

  return parser(content)
}

async function withRetry(fn, retries = 2) {
  let lastError = null
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function translateSingle(segment, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator.
Translate the following plain text from Chinese to ${targetLang}.

Rules:
1. Do NOT add or remove formatting. Input is plain text.
2. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only translate the text after it.
3. Return ONLY the translated text, no JSON, no extra commentary.`

  return runLLMRequest({
    label: 'Translating 1 segment',
    targetLang,
    systemPrompt,
    userContent: String(segment)
  })
}

async function translateInsertFragmentSingle(segment, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator.
Translate the following Chinese fragment so it can be inserted into an English sentence.

Rules:
1. Preserve leading/trailing punctuation or conjunctions if present (e.g. ", and ...").
2. Do NOT add or remove formatting. Input is plain text.
3. Return ONLY the translated fragment, no JSON, no extra commentary.`

  return runLLMRequest({
    label: 'Translating 1 fragment',
    targetLang,
    systemPrompt,
    userContent: String(segment)
  })
}

async function translateSingleWithRetry(segment, targetLang, retries = 2) {
  return withRetry(() => translateSingle(segment, targetLang), retries)
}

async function checkSemanticChange(oldText, newText) {
  if (!oldText || !newText) return true
  
  console.log('    🔍 Checking semantic change...')
  const systemPrompt = `You are a translation quality assurance expert.
Compare the Old and New Chinese text segments below.
Determine if the difference between them is significant enough to require updating the English translation.
Ignore minor formatting changes, whitespace, or capitalization if they don't affect the meaning.
Ignore style changes that don't alter the core information.

Return JSON: { "requiresUpdate": boolean, "reason": "short explanation" }`

  const userContent = JSON.stringify({
    old: oldText,
    new: newText
  })

  try {
    const content = await callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ])
    
    const result = safeParseJSON(content)
    return result.requiresUpdate === true
  } catch (e) {
    console.warn('    ⚠️ Semantic check failed, defaulting to update:', e.message)
    return true
  }
}

async function translateInsertFragmentWithCache(segment, targetLang) {
  return await translateInsertFragmentSingle(segment, targetLang)
}

async function editTranslateInsertionsSingle(item, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON object: {oldCn, newCn, oldEn, insertions}.
newCn equals oldCn with extra fragments inserted.

Task:
Update oldEn by inserting the English translations of the inserted fragments ONLY.

Rules:
1. Do NOT rewrite or paraphrase oldEn. Keep it unchanged except for insertions.
2. Use the provided left/right Chinese context in insertions to decide where to insert.
3. Do NOT add or remove formatting. Input segments are plain text.
4. Return ONLY the updated English text, no JSON, no extra commentary.`

  return runLLMRequest({
    label: 'Editing 1 segment (insertions)',
    targetLang,
    systemPrompt,
    userContent: JSON.stringify({
      oldCn: item.oldCn,
      newCn: item.newCn,
      oldEn: item.oldEn,
      insertions: item.insertions
    })
  })
}

async function editTranslateInsertionsSingleWithRetry(item, targetLang, retries = 2) {
  return withRetry(() => editTranslateInsertionsSingle(item, targetLang), retries)
}

async function editTranslateSingle(item, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON object: {oldCn, newCn, oldEn}.
Your task is to update the English translation for newCn by making minimal edits to oldEn.

Rules:
1. Keep terminology, tone, and structure from oldEn whenever possible.
2. Only change parts needed to reflect the difference between oldCn and newCn.
3. Think like a careful human editor: keep the original wording unless it is clearly incorrect or missing new information.
4. Avoid stylistic rewrites, synonym swaps, or casing changes if the meaning is already correct.
5. Preserve Markdown/HTML formatting exactly (e.g. **bold**, links, inline code, <br>).
6. Do NOT add or remove formatting tokens. Only edit the text content.
7. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only edit the text after it.
8. Return ONLY the updated English text, no JSON, no extra commentary.`

  return runLLMRequest({
    label: 'Editing 1 segment',
    targetLang,
    systemPrompt,
    userContent: JSON.stringify({
      oldCn: item.oldCn,
      newCn: item.newCn,
      oldEn: item.oldEn
    })
  })
}

async function editTranslateSingleWithRetry(item, targetLang, retries = 2) {
  return withRetry(() => editTranslateSingle(item, targetLang), retries)
}

async function processBatch(items, targetLang, systemPrompt, label) {
  if (items.length === 0) return []
  
  return runLLMRequest({
    label: `${label} ${items.length} segments`,
    targetLang,
    systemPrompt,
    userContent: JSON.stringify(items),
    parser: (content) => {
      const parsed = safeParseJSON(content)
      if (!Array.isArray(parsed) || parsed.length !== items.length) {
        throw new Error('API returned mismatched array length')
      }
      return parsed
    }
  })
}

async function translateBatch(segments, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator.
  Translate the following plain text segments from Chinese to ${targetLang}.

  Rules:
  1. Do NOT add or remove formatting. Input segments are plain text.
  2. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only translate the text after it.
  3. Return the result as a JSON array of strings, strictly matching the order of input.
  4. The output must be valid JSON. Raw JSON string only.`

  return processBatch(segments, targetLang, systemPrompt, 'Translating')
}

function shouldSplitBatch(error) {
  const message = error?.message || ''
  if (/mismatched array length/i.test(message)) return true
  if (/unexpected token/i.test(message)) return true
  if (/json/i.test(message)) return true
  if (/API Error:\s*413/i.test(message)) return true
  return false
}

async function batchWithFallback(items, targetLang, batchFn, singleFn, errorLabel, warnLabel) {
  if (items.length === 0) return []
  try {
    return await batchFn(items, targetLang)
  } catch (error) {
    if (items.length <= 1) {
      const single = await singleFn(items[0], targetLang)
      return [single]
    }
    if (!shouldSplitBatch(error)) {
      console.error(`    ❌ ${errorLabel} failed:`, error.message)
      throw error
    }
    const mid = Math.ceil(items.length / 2)
    console.warn(`    ⚠️ ${warnLabel} failed, splitting into ${mid} + ${items.length - mid}`)
    const left = await batchWithFallback(items.slice(0, mid), targetLang, batchFn, singleFn, errorLabel, warnLabel)
    const right = await batchWithFallback(items.slice(mid), targetLang, batchFn, singleFn, errorLabel, warnLabel)
    return left.concat(right)
  }
}

async function translateBatchWithFallback(segments, targetLang) {
  return batchWithFallback(
    segments,
    targetLang,
    translateBatch,
    translateSingleWithRetry,
    'Translation',
    'Batch'
  )
}

async function editTranslateBatch(pairs, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON array of objects: {oldCn, newCn, oldEn}.
Your task is to update the English translation for newCn by making minimal edits to oldEn.

Rules:
1. STRICTLY PRESERVE the original English sentence structure and vocabulary.
2. ONLY translate the *specific parts* that changed in the Chinese source (oldCn vs newCn).
3. DO NOT "improve", "polish", or "rewrite" the English text if the meaning hasn't changed.
4. If a word was translated as "provides", KEEP "provides". DO NOT change it to "offers" or "gives".
5. Preserve Markdown/HTML formatting exactly (e.g. **bold**, links, inline code, <br>).
6. Do NOT add or remove formatting tokens. Only edit the text content.
7. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only edit the text after it.
8. Return a JSON array of strings, strictly matching the input order.
9. The output must be valid JSON. Raw JSON string only.`

  return processBatch(pairs, targetLang, systemPrompt, 'Editing')
}

async function editTranslateBatchWithFallback(pairs, targetLang) {
  return batchWithFallback(
    pairs,
    targetLang,
    editTranslateBatch,
    editTranslateSingleWithRetry,
    'Edit translation',
    'Edit batch'
  )
}

async function editTranslateInsertionsBatch(items, targetLang) {
  const systemPrompt = `You are a professional technical documentation translator and editor.
You will receive a JSON array of objects: {oldCn, newCn, oldEn, insertions}.
newCn equals oldCn with extra fragments inserted.

Task:
Update oldEn by inserting the English translations of the inserted fragments ONLY.

Rules:
1. Do NOT rewrite or paraphrase oldEn. Keep it unchanged except for insertions.
2. Use the provided left/right Chinese context in insertions to decide where to insert.
3. Do NOT add or remove formatting. Input segments are plain text.
4. Return a JSON array of strings, strictly matching the input order.
5. The output must be valid JSON. Raw JSON string only.`

  return processBatch(items, targetLang, systemPrompt, 'Editing (insertions)')
}

async function editTranslateInsertionsBatchWithFallback(items, targetLang) {
  return batchWithFallback(
    items,
    targetLang,
    editTranslateInsertionsBatch,
    editTranslateInsertionsSingleWithRetry,
    'Insertion edit batch',
    'Insertion edit batch'
  )
}

async function translateSegmentsWithCache(segments, targetLang) {
  if (segments.length === 0) return []
  const results = new Array(segments.length).fill('')
  for (let i = 0; i < segments.length; i += TRANSLATE_BATCH_SIZE) {
    const chunk = segments.slice(i, i + TRANSLATE_BATCH_SIZE)
    const translated = await translateBatchWithFallback(chunk, targetLang)
    translated.forEach((trans, idx) => {
      results[i + idx] = trans
    })
  }
  return results
}

async function editSegmentsWithCache(items, targetLang) {
  if (items.length === 0) return []
  const results = new Array(items.length).fill('')

  // 1. 优先处理简单的插入/追加操作 (Deterministic Insertion First)
  const pendingEdits = []
  const pendingIndices = []
  const pendingInsertions = []
  const pendingInsertionsIndices = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    let handled = false

    if (shouldIsolateSentences(item)) {
      const isolated = await editLongTextSentenceIsolated(item, targetLang)
      if (isolated != null) {
        results[i] = isolated
        handled = true
      }
    }
    if (handled) continue

    // 尝试检测插入
    const insertionInfo = getInsertions(item.oldCn, item.newCn)
    const insertions = insertionInfo.insertions || []

    if (insertions.length > 0) {
      const baseText = insertionInfo.base || item.oldCn
      const onlyHead = isHeadInsertion(insertions)
      const onlyTail = isTailInsertion(insertions, baseText)

      // 仅处理纯粹的头部或尾部插入
      if (onlyHead || onlyTail) {
        const fragment = insertions.map(ins => ins.text).join('')
        if (fragment && fragment.trim()) {
          try {
            const fragEn = await translateInsertFragmentWithCache(fragment, targetLang)
            let trans = onlyHead
              ? mergePrependPrefix(item.oldEn, fragEn)
              : mergeAppendSuffix(item.oldEn, fragEn)

            trans = enforceLeadingLabel(item.oldCn, item.newCn, item.oldEn, trans)
            results[i] = trans
            handled = true
          } catch (e) {
            console.warn(`    ⚠️ Fragment translation failed for item ${i}, falling back to full edit:`, e.message)
          }
        }
      } else {
        // 如果不是纯粹的头部或尾部插入，但确实是插入（例如中间插入），
        // 我们将其加入到 pendingInsertions 中，使用更严格的 editTranslateInsertionsBatch
        // 这样可以避免使用 editTranslateBatch 导致的重写风险
        const hints = buildInsertionHints(item.oldCn, insertions)
        pendingInsertions.push({
          oldCn: item.oldCn,
          newCn: item.newCn,
          oldEn: item.oldEn,
          insertions: hints
        })
        pendingInsertionsIndices.push(i)
        handled = true
      }
    }

    if (!handled) {
      pendingEdits.push(item)
      pendingIndices.push(i)
    }
  }

  // 2. 处理中间插入 (Strict Insertion Batch)
  if (pendingInsertions.length > 0) {
    for (let i = 0; i < pendingInsertions.length; i += TRANSLATE_BATCH_SIZE) {
      const chunk = pendingInsertions.slice(i, i + TRANSLATE_BATCH_SIZE)
      const chunkIndices = pendingInsertionsIndices.slice(i, i + TRANSLATE_BATCH_SIZE)

      try {
        const edited = await editTranslateInsertionsBatchWithFallback(chunk, targetLang)
        for (let idx = 0; idx < edited.length; idx++) {
          const trans = edited[idx]
          const original = chunk[idx]
          const locked = lockUnchangedSentences(original.oldCn, original.newCn, original.oldEn, trans)
          const finalTrans = enforceLeadingLabel(original.oldCn, original.newCn, original.oldEn, locked)
          results[chunkIndices[idx]] = finalTrans
        }
      } catch (e) {
        console.error('    ❌ Insertion batch edit failed:', e)
        // 回退到普通 edit batch
        for (let idx = 0; idx < chunk.length; idx++) {
          pendingEdits.push(chunk[idx])
          pendingIndices.push(chunkIndices[idx])
        }
      }
    }
  }

  // 3. 剩余的进行批量 Edit Translation
    if (pendingEdits.length > 0) {
      for (let i = 0; i < pendingEdits.length; i += TRANSLATE_BATCH_SIZE) {
      const chunk = pendingEdits.slice(i, i + TRANSLATE_BATCH_SIZE)
      const chunkIndices = pendingIndices.slice(i, i + TRANSLATE_BATCH_SIZE)

      const payload = chunk.map(item => ({
        oldCn: item.oldCn,
        newCn: item.newCn,
        oldEn: item.oldEn
      }))

      try {
        const edited = await editTranslateBatchWithFallback(payload, targetLang)

        for (let idx = 0; idx < edited.length; idx++) {
          const original = chunk[idx]
          const originalIndex = chunkIndices[idx]
          let trans = edited[idx]

          trans = lockUnchangedSentences(original.oldCn, original.newCn, original.oldEn, trans)

          // 4. 漂移检查 (Drift Guard)
          if (shouldGuardEditDrift(original.oldCn, original.newCn, original.oldEn, trans)) {
            const insertionInfo = getInsertions(original.oldCn, original.newCn)
            const insertions = insertionInfo.insertions || []

            // 如果之前没能作为简单插入处理，这里尝试处理复杂插入
            if (insertions.length > 0) {
              try {
                const hints = buildInsertionHints(original.oldCn, insertions)
                trans = await editTranslateInsertionsSingleWithRetry({
                  oldCn: original.oldCn,
                  newCn: original.newCn,
                  oldEn: original.oldEn,
                  insertions: hints
                }, targetLang)
                trans = lockUnchangedSentences(original.oldCn, original.newCn, original.oldEn, trans)
              } catch (e) {
                console.warn('    ⚠️ Insertion edit failed, keeping oldEn to avoid drift:', e.message)
                trans = original.oldEn
              }
            } else {
              console.warn('    ⚠️ Edit drift detected, keeping oldEn to avoid large rewrite.')
              trans = original.oldEn
            }
          }

          trans = enforceLeadingLabel(original.oldCn, original.newCn, original.oldEn, trans)
          results[originalIndex] = trans
        }
      } catch (e) {
        console.error('    ❌ Batch edit failed:', e)
        // 保持原样作为最后防线
        for (let idx = 0; idx < chunk.length; idx++) {
          results[chunkIndices[idx]] = chunk[idx].oldEn
        }
      }
    }
  }

  return results
}

function collectTextNodes(tree, raw) {
  const nodes = []
  // Treat these blocks as atomic translation units (preserving inline formatting)
  const atomicBlocks = new Set(['paragraph', 'heading', 'tableCell'])
  // Skip these blocks entirely
  const skipBlocks = new Set(['code', 'yaml', 'image'])

  function walk(node) {
    if (skipBlocks.has(node.type)) return

    if (atomicBlocks.has(node.type)) {
      if (node.position && node.position.start && node.position.end) {
        const start = node.position.start.offset
        const end = node.position.end.offset
        // Slice from raw content to preserve markdown formatting
        const text = raw.slice(start, end)
        nodes.push({ start, end, text })
      }
      return // Do not traverse children
    }

    if (node.type === 'text') {
      if (!node.position || node.position.start.offset == null || node.position.end.offset == null) return
      const start = node.position.start.offset
      const end = node.position.end.offset
      const text = raw.slice(start, end)
      nodes.push({ start, end, text })
      return
    }

    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }
  }

  walk(tree)
  return nodes
}

function extractTextFromBlock(rawBlock) {
  const tree = processor.parse(rawBlock)
  const nodes = collectTextNodes(tree, rawBlock)
  return nodes.map(n => n.text).join('\n')
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

/**
 * 改进版：翻译 Markdown blocks
 * 主要改进：
 * 1. 更智能的句子匹配（使用动态阈值）
 * 2. 避免全局文本映射的顺序问题
 * 3. 更好的编辑检测策略
 */
async function translateMarkdownBlocks(blocks, indices, targetLang, oldBlocks, oldENBlocks, mapNewToOld) {
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
    const edited = await editSegmentsWithCache(editTasks, targetLang)
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
    const translated = await translateSegmentsWithCache(segments, targetLang)

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

async function processMarkdownForLang(filePath, lang, newBlocks, oldBlocks, mapNewToOld) {
  const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)

  const finalBlocks = new Array(newBlocks.length).fill(null)
  let oldENBlocks = null
  let oldCnToOldEnMap = null

  let oldENRaw = getGitContent('HEAD^', targetPath)
  if (!oldENRaw && fs.existsSync(targetPath)) {
    oldENRaw = fs.readFileSync(targetPath, 'utf-8')
  }
  if (oldENRaw) {
    const oldENTree = processor.parse(oldENRaw)
    oldENBlocks = splitIntoBlocks(oldENTree, oldENRaw)
    oldCnToOldEnMap = mapOldCnToOldEn(oldBlocks, oldENBlocks)
  }

  // Identify text blocks for batch processing vs special blocks
  const textIndices = []
  
  for (let i = 0; i < newBlocks.length; i++) {
    const newBlock = newBlocks[i]
    const oldIdx = mapNewToOld[i]
    const oldEnIdx = oldIdx !== -1 && oldCnToOldEnMap ? oldCnToOldEnMap[oldIdx] : -1
    const oldEnBlock = oldEnIdx !== -1 && oldENBlocks ? oldENBlocks[oldEnIdx] : null

    // Handle non-text blocks directly
    if (newBlock.type === 'yaml') {
      finalBlocks[i] = oldEnBlock?.text || newBlock.text
      continue
    }
    if (newBlock.type === 'code' || newBlock.type === 'html') {
      finalBlocks[i] = newBlock.text
      continue
    }

    // Collect text blocks for batch processing
    textIndices.push(i)
  }

  // Process text blocks in batch using sentence-level isolation
  if (textIndices.length > 0) {
    console.log(`    🚀 Batch processing ${textIndices.length} text blocks for ${lang}...`)
    // Optional: Compute safe text map for better consistency (omitted for now to save time)
    const results = await translateMarkdownBlocks(
      newBlocks, 
      textIndices, 
      lang, 
      oldBlocks, 
      oldENBlocks, 
      mapNewToOld
    )
    
    for (const [idx, content] of results) {
      finalBlocks[idx] = content
    }
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

async function processYamlForLang(filePath, lang, newCN, oldCN, headerComments) {
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
    const translatedTexts = await translateSegmentsWithCache(textsToTranslate, lang)

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

async function processMarkdownFile(filePath) {
  console.log(`\n📄 Processing Markdown: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  const newTree = processor.parse(newCNRaw)
  const oldTree = oldCNRaw ? processor.parse(oldCNRaw) : { children: [] }

  const newBlocks = splitIntoBlocks(newTree, newCNRaw)
  const oldBlocks = splitIntoBlocks(oldTree, oldCNRaw)
  const { mapNewToOld } = matchBlocks(oldBlocks, newBlocks)

  await Promise.all(TARGET_LANGS.map(lang => 
    processMarkdownForLang(filePath, lang, newBlocks, oldBlocks, mapNewToOld)
  ))
}

async function processYamlFile(filePath) {
  console.log(`\n⚙️ Processing YAML: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  const newCN = yaml.load(newCNRaw)
  const oldCN = oldCNRaw ? yaml.load(oldCNRaw) : null
  const headerComments = getYamlHeaderComments(newCNRaw)

  await Promise.all(TARGET_LANGS.map(lang => 
    processYamlForLang(filePath, lang, newCN, oldCN, headerComments)
  ))
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

export {
  matchBlocks,
  findHeadingAnchors,
  alignSegment,
  checkSemanticChange
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
