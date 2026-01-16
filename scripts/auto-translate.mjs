import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import yaml from 'js-yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import remarkFrontmatter from 'remark-frontmatter'

// --- Configuration ---
const TARGET_LANGS = ['en'] // Add 'fr' etc. here to support more languages
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.deepseek.com'
const MODEL = process.env.OPENAI_MODEL || 'deepseek-chat'
const SOURCE_DIR = 'content/cn'

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

/**
 * Get list of changed files in content/cn
 * If scripts/auto-translate.mjs changed, return ALL content files
 */
function getChangedFiles() {
  try {
    const output = exec('git diff --name-only HEAD^ HEAD')
    const changedFiles = output.split('\n').filter(Boolean)

    // If script itself changed, likely a config change (e.g. new language added).
    // Process ALL content files to ensure new language is generated.
    if (changedFiles.includes('scripts/auto-translate.mjs')) {
      console.log('⚡️ Script changed, scanning all content files...')
      const allFiles = exec('git ls-files content/cn').split('\n')
      return allFiles.filter(line =>
        line.startsWith(SOURCE_DIR)
        && (line.endsWith('.md') || line.endsWith('settings.yml'))
      )
    }

    // Otherwise only process changed content files
    return changedFiles.filter(line =>
      line.startsWith(SOURCE_DIR)
      && (line.endsWith('.md') || line.endsWith('settings.yml'))
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

// --- Remark AST Logic ---

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify, { bullet: '-', fenc: '`' }) // normalize output style
  .use(remarkFrontmatter, ['yaml'])

/**
 * Split AST tree into logical sections based on Headings
 * Returns array of { type: 'heading'|'frontmatter'|'root', nodes: [], hash: string }
 */
function splitByHeaders(tree) {
  const sections = []
  let currentSection = { type: 'root', nodes: [] }

  for (const node of tree.children) {
    if (node.type === 'yaml') {
      // Frontmatter is its own section
      if (currentSection.nodes.length > 0) {
        sections.push(currentSection)
      }
      sections.push({ type: 'frontmatter', nodes: [node] })
      currentSection = { type: 'root', nodes: [] }
    } else if (node.type === 'heading') {
      // Start new section
      if (currentSection.nodes.length > 0) {
        sections.push(currentSection)
      }
      // Heading level determines hierarchy? For simplicity, flatten all headers as section starters.
      // But maybe include the heading IN the section.
      currentSection = { type: 'heading', depth: node.depth, nodes: [node] }
    } else {
      currentSection.nodes.push(node)
    }
  }

  if (currentSection.nodes.length > 0) {
    sections.push(currentSection)
  }

  // Generate hashes/text for comparison
  // We use the stringified markdown of the section as the "hash" for comparison.
  // This handles formatting normalization (e.g. extra spaces are ignored if AST is same).
  sections.forEach((section) => {
    const sectionTree = { type: 'root', children: section.nodes }
    section.text = processor.stringify(sectionTree).trim()

    // Extract header text for mapping if available
    if (section.type === 'heading') {
      // Stringify just the heading text content?
      // Let's use the full text of the heading line as key?
      // Or just the plain text of heading?
      // Simple: use the first line of section.text
      section.headerText = section.text.split('\n')[0]
    } else if (section.type === 'frontmatter') {
      section.headerText = '---FRONTMATTER---'
    } else {
      section.headerText = '---PREAMBLE---'
    }
  })

  return sections
}

// --- YAML Logic (Settings.yml) ---
// ... (Keep existing YAML logic unchanged) ...
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

function processSettingsNode(newNode, oldNode, oldEnNode, collector) {
  if (Array.isArray(newNode)) {
    return newNode.map((item, index) => {
      const oldItem = Array.isArray(oldNode) ? oldNode[index] : undefined
      const oldEnItem = Array.isArray(oldEnNode) ? oldEnNode[index] : undefined
      return processSettingsNode(item, oldItem, oldEnItem, collector)
    })
  } else if (typeof newNode === 'object' && newNode !== null) {
    const result = {}
    for (const key of Object.keys(newNode)) {
      const value = newNode[key]
      let finalKey = key
      const keyExistedInOldCN = oldNode && typeof oldNode === 'object' && key in oldNode

      if (keyExistedInOldCN) {
        if (oldEnNode && typeof oldEnNode === 'object') {
          const enKeys = Object.keys(oldEnNode)
          if (enKeys.length > 0) {
            finalKey = enKeys[0]
          } else {
            collector.push({ targetObj: result, originalKey: key, isKey: true })
          }
        } else {
          collector.push({ targetObj: result, originalKey: key, isKey: true })
        }
      } else {
        collector.push({ targetObj: result, originalKey: key, isKey: true })
      }

      const childOldNode = keyExistedInOldCN ? oldNode[key] : undefined
      const childOldEnNode = (oldEnNode && typeof oldEnNode === 'object' && finalKey in oldEnNode) ? oldEnNode[finalKey] : undefined
      result[finalKey] = processSettingsNode(value, childOldNode, childOldEnNode, collector)
    }
    return result
  } else {
    return newNode
  }
}

// --- Translation Service ---

async function translateBatch(segments, targetLang) {
  if (segments.length === 0) return []

  console.log(`    ⏳ Translating ${segments.length} segments to ${targetLang}...`)

  const systemPrompt = `You are a professional technical documentation translator. 
  Translate the following segments from Chinese to ${targetLang}.
  
  Rules:
  1. PRESERVE all Markdown formatting (links, code blocks, bold, etc.).
  2. PRESERVE Frontmatter exactly if present.
  3. PRESERVE icon prefixes like "(ri:xxx) " exactly. Only translate the text after it.
  4. Return the result as a JSON array of strings, strictly matching the order of input.
  5. The output must be valid JSON. Raw JSON string only.`

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

// --- Main Processors ---

async function processMarkdownFile(filePath) {
  console.log(`\n📄 Processing Markdown: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  // Parse AST
  const newTree = processor.parse(newCNRaw)
  const oldTree = oldCNRaw ? processor.parse(oldCNRaw) : { children: [] }

  const newSections = splitByHeaders(newTree)
  const oldSections = splitByHeaders(oldTree)

  // Map old sections by Header Text (or Preamble/Frontmatter)
  // Note: If multiple headers have same text, this map will overwrite.
  // For better accuracy, we could use index + header match, but simple map is usually enough for docs.
  const oldSectionsMap = new Map()
  oldSections.forEach(s => oldSectionsMap.set(s.headerText, s.text))

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)
    let oldENRaw = null
    let oldESectionsMap = new Map()

    if (fs.existsSync(targetPath)) {
      oldENRaw = fs.readFileSync(targetPath, 'utf-8')
      const oldETree = processor.parse(oldENRaw)
      const oldESections = splitByHeaders(oldETree)
      oldESections.forEach(s => oldESectionsMap.set(s.headerText, s.text))
    }

    const segmentsToTranslate = []
    const segmentIndices = []
    const finalSections = new Array(newSections.length).fill(null)

    for (let i = 0; i < newSections.length; i++) {
      const section = newSections[i]
      const oldText = oldSectionsMap.get(section.headerText)
      const enText = oldESectionsMap.get(section.headerText)

      // AST-based comparison:
      // processor.stringify() normalizes the output.
      // So extra newlines/spaces in raw file won't affect equality if AST is same.
      const isUnchanged = oldText && section.text === oldText

      if (isUnchanged && enText) {
        finalSections[i] = enText
      } else {
        segmentsToTranslate.push(section.text)
        segmentIndices.push(i)
      }
    }

    if (segmentsToTranslate.length > 0) {
      console.log(`    Need to translate ${segmentsToTranslate.length} sections for [${lang}]`)
      const translated = await translateBatch(segmentsToTranslate, lang)
      translated.forEach((trans, idx) => {
        finalSections[segmentIndices[idx]] = trans
      })
    } else {
      console.log(`    ✨ No changes for [${lang}]`)
    }

    const targetDir = path.dirname(targetPath)
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

    // Join sections with double newline to ensure separation
    const finalContent = finalSections.join('\n\n')
    fs.writeFileSync(targetPath, finalContent, 'utf-8')
    console.log(`    ✅ Updated: ${targetPath}`)
  }
}

async function processYamlFile(filePath) {
  console.log(`\n⚙️ Processing YAML: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  const newCN = yaml.load(newCNRaw)
  const oldCN = oldCNRaw ? yaml.load(oldCNRaw) : null
  const headerComments = getYamlHeaderComments(newCNRaw)

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)
    let oldEN = null
    if (fs.existsSync(targetPath)) {
      oldEN = yaml.load(fs.readFileSync(targetPath, 'utf-8'))
    }

    const collector = []
    const finalObj = processSettingsNode(newCN, oldCN, oldEN, collector)

    if (collector.length > 0) {
      console.log(`    Need to translate ${collector.length} keys for [${lang}]`)
      const textsToTranslate = collector.map(item => item.originalKey)
      const translatedTexts = await translateBatch(textsToTranslate, lang)

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
