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
    const diffOutput = exec('git diff --name-only --diff-filter=ACMRT HEAD')
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

    blocks.push({
      type: node.type,
      path: pathKey,
      text: rawText,
      normalized: normalizedText,
      hash: getHash(normalizedText.replace(/\s+/g, ' ').trim()),
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

function buildLcsMap(oldBlocks, newBlocks) {
  const n = oldBlocks.length
  const m = newBlocks.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))

  const oldKeys = oldBlocks.map(b => `${b.type}|${b.path}|${b.hash}`)
  const newKeys = newBlocks.map(b => `${b.type}|${b.path}|${b.hash}`)

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldKeys[i - 1] === newKeys[j - 1]) {
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
    if (oldKeys[i - 1] === newKeys[j - 1]) {
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
    console.error('    ❌ Translation failed:', error.message)
    throw error
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

async function translateMarkdownBlocks(blocks, indices, targetLang, cache) {
  const tasks = []
  const perBlock = new Map()

  for (const idx of indices) {
    const rawBlock = blocks[idx].text
    const tree = processor.parse(rawBlock)
    const textNodes = collectTextNodes(tree, rawBlock)
    const blockInfo = { raw: rawBlock, replacements: [] }
    perBlock.set(idx, blockInfo)

    for (const node of textNodes) {
      if (!filterTranslatable(node.text)) continue
      tasks.push({
        blockIndex: idx,
        start: node.start,
        end: node.end,
        text: node.text
      })
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
  const lcsMap = buildLcsMap(oldBlocks, newBlocks)

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

    if (fs.existsSync(targetPath)) {
      const oldENRaw = fs.readFileSync(targetPath, 'utf-8')
      const oldENTree = processor.parse(oldENRaw)
      const oldENBlocks = splitIntoBlocks(oldENTree, oldENRaw)

      for (let i = 0; i < newBlocks.length; i++) {
        const oldIndex = lcsMap[i]
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
      const translatedMap = await translateMarkdownBlocks(newBlocks, blocksToTranslate, lang, cache)
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
  // if (!OPENAI_API_KEY) {
  //   console.error('❌ Error: OPENAI_API_KEY is not set.')
  //   process.exit(1)
  // }

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
