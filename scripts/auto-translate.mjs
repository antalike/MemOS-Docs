import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import fetch from 'node-fetch'
import yaml from 'js-yaml'

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
 */
function getChangedFiles() {
  try {
    // Include .md and settings.yml
    const output = exec('git diff --name-only HEAD^ HEAD')
    return output.split('\n').filter(line =>
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

// --- Markdown Logic ---

function parseSections(markdown) {
  if (!markdown) return []
  const lines = markdown.split('\n')
  const sections = []
  let currentSection = { header: '_ROOT_', content: [] }
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) {
      if (currentSection.content.length > 0) {
        sections.push({
          header: currentSection.header,
          text: currentSection.content.join('\n')
        })
      }
      currentSection = { header: line.trim(), content: [line] }
    } else {
      currentSection.content.push(line)
    }
  }
  if (currentSection.content.length > 0) {
    sections.push({
      header: currentSection.header,
      text: currentSection.content.join('\n')
    })
  }
  return sections
}

// --- YAML Logic (Settings.yml) ---

/**
 * Extracts header comments from YAML source
 */
function getYamlHeaderComments(source) {
  if (!source) return ''
  const lines = source.split('\n')
  const comments = []
  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      comments.push(line)
    } else if (line.trim() === '') {
      continue // skip empty lines between comments
    } else {
      break // stop at first non-comment code
    }
  }
  return comments.join('\n') + (comments.length > 0 ? '\n' : '')
}

/**
 * Recursively process settings.yml structure
 *
 * Strategy:
 * 1. Traverse NewCN structure.
 * 2. For each key in Object:
 *    - Check if Key is "Translation Target" (contains Chinese or pattern).
 *    - Check if Key existed in OldCN.
 *    - If Unchanged & Exists in OldEN -> Use OldEN Key.
 *    - Else -> Mark for Translation.
 * 3. Return a new structure with placeholders or old keys, and a list of segments to translate.
 */
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

      // Determine if Key needs translation
      // For settings.yml, keys like "(ri:xxx) Some Text" need translation of "Some Text"
      // We assume simple check: if it contains Chinese characters?
      // Or just always translate if it looks like a text key?
      // Let's assume all keys in settings.yml nav are texts.

      let finalKey = key

      // Try to find this key in OldCN
      // In a list of maps, usually order matters.
      // If we are processing a map, we look for the exact key in OldCN.

      const keyExistedInOldCN = oldNode && typeof oldNode === 'object' && key in oldNode

      if (keyExistedInOldCN) {
        // Key didn't change (it's the same key in CN).
        // Check if we have a translation for it in OldEN.
        // But wait, OldEN keys are ALREADY translated.
        // We need to find the "corresponding" key in OldEN.
        // How? By index?
        // In settings.yml, it's usually a list of single-key objects: - "Key": Value
        // So we are inside one of those objects.
        // If we are traversing parallelly by index (which we do for Arrays), then oldEnNode is the map `{ "EnKey": Value }`.

        if (oldEnNode && typeof oldEnNode === 'object') {
          // Find the single key in oldEnNode
          const enKeys = Object.keys(oldEnNode)
          if (enKeys.length > 0) {
            // Assume the first key corresponds to our key (since it's usually single-key map in nav)
            // Or if multiple keys, it's hard to map. But nav is usually `- Label: Children`.
            const enKey = enKeys[0]
            // Reuse existing translation
            finalKey = enKey
          } else {
            // OldEN is empty? Translate.
            collector.push({ type: 'key', text: key, context: result }) // context is result obj, we will update key later? No, keys are immutable.
            // We can use a placeholder and replace later?
            // Better: Store a reference to the 'result' object and the 'original key', and replace it after translation.
            collector.push({ targetObj: result, originalKey: key, isKey: true })
          }
        } else {
          // No OldEN, translate
          collector.push({ targetObj: result, originalKey: key, isKey: true })
        }
      } else {
        // New Key or Changed Key (if we consider it changed).
        // Actually if key changed, it's a New Key effectively.
        collector.push({ targetObj: result, originalKey: key, isKey: true })
      }

      // Process Value (Recursive)
      // Value can be string (path) or list/object.
      // If string (path), we usually don't translate paths.
      // But we should check if value is structure.

      const childOldNode = keyExistedInOldCN ? oldNode[key] : undefined
      // For OldEN, we need the EnKey we resolved.
      const childOldEnNode = (oldEnNode && typeof oldEnNode === 'object' && finalKey in oldEnNode) ? oldEnNode[finalKey] : undefined

      result[finalKey] = processSettingsNode(value, childOldNode, childOldEnNode, collector)

      // If we marked key for translation, 'finalKey' is currently the Chinese Key.
      // We will swap it later.
    }
    return result
  } else {
    // Primitive value (String, Number, etc.)
    // In settings.yml, values are paths (strings). We DON'T translate them.
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
  // ... (Previous MD logic) ...
  const newCN = fs.readFileSync(filePath, 'utf-8')
  const oldCN = getGitContent('HEAD^', filePath)
  const newSections = parseSections(newCN)
  const oldSections = parseSections(oldCN)
  const oldSectionsMap = new Map(oldSections.map(s => [s.header, s.text]))

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)
    let oldEN = null
    let oldESectionsMap = new Map()
    if (fs.existsSync(targetPath)) {
      oldEN = fs.readFileSync(targetPath, 'utf-8')
      const oldESections = parseSections(oldEN)
      oldESectionsMap = new Map(oldESections.map(s => [s.header, s.text]))
    }

    const segmentsToTranslate = []
    const segmentIndices = []
    const finalSections = new Array(newSections.length).fill(null)

    for (let i = 0; i < newSections.length; i++) {
      const section = newSections[i]
      const oldText = oldSectionsMap.get(section.header)
      const enText = oldESectionsMap.get(section.header)
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
    fs.writeFileSync(targetPath, finalSections.join('\n'), 'utf-8')
    console.log(`    ✅ Updated: ${targetPath}`)
  }
}

async function processYamlFile(filePath) {
  console.log(`\n⚙️ Processing YAML: ${filePath}`)
  const newCNRaw = fs.readFileSync(filePath, 'utf-8')
  const oldCNRaw = getGitContent('HEAD^', filePath)

  // Parse
  const newCN = yaml.load(newCNRaw)
  const oldCN = oldCNRaw ? yaml.load(oldCNRaw) : null

  // Header comments
  const headerComments = getYamlHeaderComments(newCNRaw)

  for (const lang of TARGET_LANGS) {
    const targetPath = filePath.replace(SOURCE_DIR, `content/${lang}`)
    let oldEN = null
    if (fs.existsSync(targetPath)) {
      oldEN = yaml.load(fs.readFileSync(targetPath, 'utf-8'))
    }

    const collector = []
    // Build new structure with translation markers
    const finalObj = processSettingsNode(newCN, oldCN, oldEN, collector)

    if (collector.length > 0) {
      console.log(`    Need to translate ${collector.length} keys for [${lang}]`)
      const textsToTranslate = collector.map(item => item.originalKey)
      const translatedTexts = await translateBatch(textsToTranslate, lang)

      // Apply translations
      collector.forEach((item, idx) => {
        const transKey = translatedTexts[idx]
        // Swap key in targetObj
        const val = item.targetObj[item.originalKey]
        delete item.targetObj[item.originalKey]
        item.targetObj[transKey] = val
      })
    } else {
      console.log(`    ✨ No changes for [${lang}]`)
    }

    // Write
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
