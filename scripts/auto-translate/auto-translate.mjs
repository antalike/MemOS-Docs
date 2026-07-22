import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { load as yamlLoad, dump as yamlDump } from 'js-yaml'

// --- Paths ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Absolute path to the git repository root. */
let REPO_ROOT = (() => {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
  } catch {
    // Fallback: fuma/scripts -> repo root is two levels up
    return path.resolve(__dirname, '..', '..')
  }
})()

// --- Configuration ---
// Source language (Chinese) content lives here; targets mirror this tree.
const SOURCE_DIR = 'fuma/content/cn'
const langsConfigPath = path.join(__dirname, 'languages.json')

let TARGET_LANGS = ['en']
try {
  if (fs.existsSync(langsConfigPath)) {
    TARGET_LANGS = JSON.parse(fs.readFileSync(langsConfigPath, 'utf-8'))
  }
} catch (e) {
  console.warn('⚠️ Failed to read languages.json, defaulting to ["en"]', e)
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.deepseek.com'
const MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-flash'
// Output token budget per request. DeepSeek V4 allows up to 384K output within a
// 1M context, so whole-document translation comfortably fits. We start generous
// and, on truncation (finish_reason=length), grow up to the hard ceiling.
const MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 65536
const MODEL_MAX_OUTPUT = Number(process.env.OPENAI_MODEL_MAX_OUTPUT) || 384000
// How many files to translate in parallel.
const DEFAULT_CONCURRENCY = Number(process.env.TRANSLATE_CONCURRENCY) || 5

// Git baseline used both for change detection and as the "old source" when doing
// incremental translation. Overridable via --base / --working (set in main()).
let BASE_REF = 'HEAD^'
let COMPARE_WORKING = false

const LANG_NAMES = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
}
const langLabel = lang => LANG_NAMES[lang] || lang

// --- Shell / Git helpers ---

function exec(command) {
  try {
    return execSync(command, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function isTranslatableFile(relPath) {
  return (
    relPath.startsWith(SOURCE_DIR)
    && (relPath.endsWith('.mdx')
      || relPath.endsWith('/meta.json')
      || relPath.endsWith('.yml')
      || relPath.endsWith('.yaml'))
  )
}

/** Every translatable source file that still exists on disk, relative to repo root. */
function getAllSourceFiles() {
  return exec(`git ls-files ${SOURCE_DIR}`)
    .split('\n')
    .filter(isTranslatableFile)
    .filter(f => fs.existsSync(path.join(REPO_ROOT, f)))
}

/** Untracked (new, not-yet-committed) source files under the source dir. */
function getUntrackedSourceFiles() {
  return exec(`git ls-files --others --exclude-standard ${SOURCE_DIR}`)
    .split('\n')
    .filter(isTranslatableFile)
}

/**
 * Set of source files changed relative to BASE_REF.
 * - default: BASE_REF..HEAD (committed changes)
 * - --working: BASE_REF vs the working tree (includes uncommitted + untracked)
 */
function getChangedSet() {
  const diffCmd = COMPARE_WORKING
    ? `git diff --name-only ${BASE_REF} --`
    : `git diff --name-only ${BASE_REF} HEAD --`
  const changed = exec(diffCmd).split('\n').filter(isTranslatableFile)
  if (COMPARE_WORKING) changed.push(...getUntrackedSourceFiles())
  return new Set(changed)
}

/**
 * Source files DELETED relative to BASE_REF.
 * - default: BASE_REF..HEAD (committed deletions)
 * - --working: BASE_REF vs the working tree (also catches files removed but not yet committed)
 */
function getDeletedSourceFiles() {
  const diffCmd = COMPARE_WORKING
    ? `git diff --name-only --diff-filter=D ${BASE_REF} --`
    : `git diff --name-only --diff-filter=D ${BASE_REF} HEAD --`
  return exec(diffCmd).split('\n').filter(isTranslatableFile)
}

/**
 * Old paths of source files that were RENAMED relative to BASE_REF. Git records a
 * rename as `R` (not `D`), so the old path would otherwise leave an orphaned target.
 * `-M` forces rename detection regardless of the repo's diff.renames config.
 */
function getRenamedFromSourceFiles() {
  const range = COMPARE_WORKING ? `${BASE_REF} --` : `${BASE_REF} HEAD --`
  const out = exec(`git diff --name-status -M ${range}`)
  const fromPaths = []
  for (const line of out.split('\n')) {
    if (!line.startsWith('R')) continue
    const parts = line.split('\t')
    // Format: "R<score>\t<oldPath>\t<newPath>"
    if (parts.length >= 3 && isTranslatableFile(parts[1])) fromPaths.push(parts[1])
  }
  return fromPaths
}

/** Raw file content at a given git revision, or null if it did not exist there. */
function getGitContent(revision, relPath) {
  try {
    return execSync(`git show "${revision}:${relPath}"`, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

// --- Incremental reuse helpers (preserve existing translations) ---

/**
 * Build a lookup of previous translations: old-source-string -> [old-target-string].
 * Uses positional alignment between the old source and old target (both were
 * generated in lockstep), and only trusts it when their lengths match.
 * Duplicate source strings keep a FIFO queue so identical inputs map in order.
 */
function buildReuseMap(oldSourceStrings, oldTargetStrings) {
  const map = new Map()
  if (oldSourceStrings.length !== oldTargetStrings.length) return map
  for (let i = 0; i < oldSourceStrings.length; i++) {
    const key = oldSourceStrings[i]
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(oldTargetStrings[i])
  }
  return map
}

/**
 * For each new source string, reuse a previous translation when the source text is
 * unchanged; otherwise mark it for (re)translation. Applies reused values in place
 * via the provided setters and returns the strings that still need translation.
 */
function reuseOrCollect(strings, setters, reuseMap) {
  const pending = []
  const pendingIdx = []
  strings.forEach((s, i) => {
    const queue = reuseMap.get(s)
    if (queue && queue.length > 0) {
      setters[i](queue.shift())
    } else {
      pending.push(s)
      pendingIdx.push(i)
    }
  })
  return { pending, pendingIdx }
}

// --- Translation service ---

async function callLLM(systemPrompt, userContent, maxTokens = MAX_TOKENS, model = MODEL) {
  // Read credentials live so callers that load env after import (e.g. the
  // model-comparison tool loading .env.local) still authenticate correctly.
  const apiBase = process.env.OPENAI_API_BASE || OPENAI_API_BASE
  const apiKey = process.env.OPENAI_API_KEY || OPENAI_API_KEY
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.1,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`API Error: ${response.status} ${response.statusText} ${body}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]
  return {
    content: choice?.message?.content ?? '',
    finishReason: choice?.finish_reason ?? 'unknown',
  }
}

/**
 * Call the model and guarantee a COMPLETE response. If the output is truncated
 * (finish_reason=length), retry with a larger token budget up to the model's
 * hard ceiling before giving up. Returns the raw (un-stripped) content.
 */
async function callLLMComplete(systemPrompt, userContent, label = '', model = MODEL, startMaxTokens = MAX_TOKENS) {
  let maxTokens = startMaxTokens
  for (;;) {
    const { content, finishReason } = await callLLM(systemPrompt, userContent, maxTokens, model)
    if (finishReason === 'stop') return content
    if (finishReason === 'length' && maxTokens < MODEL_MAX_OUTPUT) {
      maxTokens = Math.min(maxTokens * 2, MODEL_MAX_OUTPUT)
      console.log(`    ⚠️ ${label || 'Output'} truncated, retrying with max_tokens=${maxTokens}...`)
      continue
    }
    throw new Error(`Incomplete response (finish_reason=${finishReason}) — output would be truncated${label ? ` for ${label}` : ''}`)
  }
}

function stripCodeFence(text) {
  let out = text.trim()
  if (out.startsWith('```')) {
    out = out.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```$/, '')
  }
  return out
}

/**
 * Translate a whole document in one shot. The model receives the entire file and
 * returns the entire translated file, preserving all structure/markup.
 */
async function translateDocument(content, lang, model = MODEL, startMaxTokens = MAX_TOKENS) {
  const systemPrompt = `You are a professional technical documentation translator for the MemOS project.
Translate the given MDX document from Chinese into ${langLabel(lang)}.

STRICT RULES:
1. Output ONLY the fully translated document. No explanations, no wrapping code fences around the whole output.
2. Preserve the YAML frontmatter delimiters (---) and its keys exactly. Translate only the VALUES of "title" and "description"; leave other frontmatter fields (icon, etc.) unchanged.
3. Preserve every MDX/JSX component, tag name, and prop exactly (e.g. <Callout type="info">, <Tabs>, <Cards>, <Steps>). Only translate the human-readable text inside them.
4. Preserve all Markdown structure: headings, lists, tables, blockquotes, bold/italic, and blank-line spacing. Translate link text but keep URLs, anchors, and image paths unchanged.
5. Inside fenced code blocks (\`\`\`) and inline code (\`code\`), keep all code syntax, indentation, identifiers, variable/function/API names, and keys byte-for-byte identical. HOWEVER, DO translate human-readable natural-language text that appears as quoted string-literal VALUES and as code comments (e.g. example chat messages, user-facing prompt text). Never change code logic, keys, identifiers, or the number of code-fence lines.
6. Preserve icon identifiers such as "ri:xxx-line" and prefixes like "(ri:xxx)" exactly.
7. Keep product and brand names untranslated: MemOS, MemCube, OpenClaw, MemTensor, MemScheduler, and similar proper nouns.
8. Use accurate, natural, and consistent technical terminology.`

  const raw = await callLLMComplete(systemPrompt, content, 'document', model, startMaxTokens)
  return stripCodeFence(raw).replace(/\s*$/, '') + '\n'
}

/**
 * Incrementally update an existing translation. The model receives the previous
 * Chinese, the current Chinese, and the previous translation, and rewrites the
 * translation so that unchanged content keeps its existing wording verbatim while
 * additions are translated, deletions removed, and edits updated minimally.
 */
async function translateDocumentIncremental(oldSource, newSource, oldTranslation, lang) {
  const systemPrompt = `You are a professional technical documentation translator for the MemOS project.
You are UPDATING an existing ${langLabel(lang)} translation of an MDX document, not translating from scratch.

You will receive three sections:
- <OLD_SOURCE>: the previous Chinese version.
- <NEW_SOURCE>: the current Chinese version.
- <OLD_TRANSLATION>: the existing ${langLabel(lang)} translation that matches OLD_SOURCE.

Produce the NEW translation of NEW_SOURCE.

INCREMENTAL RULES (most important):
1. For any content UNCHANGED between OLD_SOURCE and NEW_SOURCE, REUSE the corresponding text from OLD_TRANSLATION VERBATIM. Do not rephrase, re-translate, or "improve" unchanged content.
2. For content ADDED in NEW_SOURCE, translate it fresh, matching the terminology and style of OLD_TRANSLATION.
3. For content DELETED from NEW_SOURCE, remove its translation.
4. For content MODIFIED, update only the affected wording minimally, keeping the rest of that section stable.

OUTPUT & FORMAT RULES:
5. Output ONLY the complete new translated document (the full NEW_SOURCE translated), not a diff, no explanations, no wrapping code fences.
6. Preserve YAML frontmatter delimiters/keys; translate only "title"/"description" values.
7. Preserve every MDX/JSX component, tag, and prop exactly. Inside fenced/inline code, keep all syntax, identifiers, and keys identical, but DO translate human-readable natural-language string-literal values and code comments. Keep URLs, anchors, image paths, "ri:*" icons, and brand names (MemOS, MemCube, OpenClaw, MemTensor, MemScheduler) unchanged.`

  const userContent = `<OLD_SOURCE>\n${oldSource}\n</OLD_SOURCE>\n\n<NEW_SOURCE>\n${newSource}\n</NEW_SOURCE>\n\n<OLD_TRANSLATION>\n${oldTranslation}\n</OLD_TRANSLATION>`

  const raw = await callLLMComplete(systemPrompt, userContent, 'document')
  return stripCodeFence(raw).replace(/\s*$/, '') + '\n'
}

/**
 * Batch-translate an ordered list of short strings, returning a JSON array in the
 * same order. Used for structured files (meta.json, changelog.yml).
 */
async function translateStrings(strings, lang) {
  if (strings.length === 0) return []

  const systemPrompt = `You are a professional technical documentation translator for the MemOS project.
Translate each string in the given JSON array from Chinese into ${langLabel(lang)}.

STRICT RULES:
1. Return ONLY a valid JSON array of strings, in the exact same order and length as the input.
2. Preserve any Markdown/formatting inside a string (links, code, bold, etc.).
3. Keep product and brand names untranslated (MemOS, MemCube, OpenClaw, MemTensor, etc.).
4. If a string has no translatable text (e.g. it is a number, code, or identifier), return it unchanged.
5. Output raw JSON only, without code fences.`

  const raw = await callLLMComplete(systemPrompt, JSON.stringify(strings, null, 2), 'strings')
  const parsed = JSON.parse(stripCodeFence(raw))
  if (!Array.isArray(parsed) || parsed.length !== strings.length) {
    throw new Error(`Translation returned mismatched array length (expected ${strings.length}, got ${parsed.length})`)
  }
  return parsed
}

// --- File processors ---

function targetPathFor(relPath, lang) {
  return relPath.replace(SOURCE_DIR, `fuma/content/${lang}`)
}

function targetExists(relPath, lang) {
  return fs.existsSync(path.join(REPO_ROOT, targetPathFor(relPath, lang)))
}

/** Write atomically (tmp + rename) so a crash never leaves a half-written file. */
function writeTarget(relPath, content) {
  const abs = path.join(REPO_ROOT, relPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  const tmp = `${abs}.tmp-${process.pid}`
  fs.writeFileSync(tmp, content, 'utf-8')
  fs.renameSync(tmp, abs)
  console.log(`    ✅ Updated: ${relPath}`)
}

/** Top-level frontmatter keys (from the first `---`…`---` block), for parity checks. */
function frontmatterKeys(text) {
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end === -1) return null
  const block = text.slice(3, end)
  const keys = []
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):/)
    if (m) keys.push(m[1])
  }
  return keys
}

/** Count fenced code-block delimiter lines (```), used to detect dropped/truncated code. */
function countCodeFences(text) {
  return (text.match(/^\s*```/gm) || []).length
}

/**
 * Lightweight structural validation of a translated MDX document. Catches the
 * common failure modes (empty/truncated output, dropped frontmatter or code)
 * without a full MDX compile. Returns a list of problems (empty = OK).
 */
function validateMdxTranslation(source, output) {
  const problems = []
  if (!output || !output.trim()) {
    problems.push('empty output')
    return problems
  }

  const srcKeys = frontmatterKeys(source)
  if (srcKeys) {
    const outKeys = frontmatterKeys(output)
    if (!outKeys) {
      problems.push('missing frontmatter block')
    } else {
      const missing = srcKeys.filter(k => !outKeys.includes(k))
      if (missing.length) problems.push(`frontmatter keys missing: ${missing.join(', ')}`)
    }
  }

  const srcFences = countCodeFences(source)
  const outFences = countCodeFences(output)
  if (srcFences !== outFences) {
    problems.push(`code-fence count mismatch (source ${srcFences}, output ${outFences})`)
  }

  return problems
}

async function processMdxFile(relPath, langs, force) {
  console.log(`\n📄 Markdown: ${relPath}`)
  const newSource = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8')
  const oldSource = force ? null : getGitContent(BASE_REF, relPath)

  for (const lang of langs) {
    const targetRel = targetPathFor(relPath, lang)
    // Old translation must come from the SAME ref as oldSource so the three-way
    // (old CN / new CN / old translation) is a consistent version pair.
    const oldTranslation = force || oldSource == null ? null : getGitContent(BASE_REF, targetRel)
    const canReuse = oldSource != null && oldTranslation != null

    let translated
    if (canReuse) {
      console.log(`    ♻️ Incrementally updating ${langLabel(lang)} (reusing existing translation)...`)
      translated = await translateDocumentIncremental(oldSource, newSource, oldTranslation, lang)
    } else {
      console.log(`    ⏳ Translating full document to ${langLabel(lang)}...`)
      translated = await translateDocument(newSource, lang)
    }

    // Never overwrite a good translation with a broken/truncated one.
    const problems = validateMdxTranslation(newSource, translated)
    if (problems.length > 0) {
      throw new Error(`translation validation failed for ${targetRel}: ${problems.join('; ')}`)
    }

    writeTarget(targetRel, translated)
  }
}

// meta.json "pages" separators look like: "---[ri:icon-line]Label---" or "---Label---"
const SEPARATOR_RE = /^(---)(\[[^\]]*\])?([\s\S]*?)(---)$/

/**
 * Collect the translatable strings from a fumadocs meta.json object and return a
 * function that rebuilds the object once translations are provided.
 */
function collectMetaStrings(meta) {
  const strings = []
  const setters = []

  if (typeof meta.title === 'string') {
    strings.push(meta.title)
    setters.push(v => { meta.title = v })
  }
  if (typeof meta.description === 'string') {
    strings.push(meta.description)
    setters.push(v => { meta.description = v })
  }

  if (Array.isArray(meta.pages)) {
    meta.pages.forEach((entry, i) => {
      if (typeof entry !== 'string') return
      const m = entry.match(SEPARATOR_RE)
      if (m && m[3].trim()) {
        const prefix = m[2] || ''
        strings.push(m[3])
        setters.push(v => { meta.pages[i] = `---${prefix}${v}---` })
      }
    })
  }

  return { strings, setters }
}

function safeJsonParse(raw) {
  try {
    return raw == null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

async function processMetaJson(relPath, langs, force) {
  console.log(`\n🧭 Meta: ${relPath}`)
  const newSource = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8'))
  const oldSource = force ? null : safeJsonParse(getGitContent(BASE_REF, relPath))

  for (const lang of langs) {
    const targetRel = targetPathFor(relPath, lang)

    const meta = JSON.parse(JSON.stringify(newSource))
    const { strings, setters } = collectMetaStrings(meta)

    // Build a reuse map from the previous CN + its matching translation at the
    // SAME ref, so old source/target strings are a consistent version pair.
    let reuseMap = new Map()
    if (oldSource) {
      const oldTarget = safeJsonParse(getGitContent(BASE_REF, targetRel))
      if (oldTarget) {
        reuseMap = buildReuseMap(
          collectMetaStrings(oldSource).strings,
          collectMetaStrings(oldTarget).strings,
        )
      }
    }

    const { pending, pendingIdx } = reuseOrCollect(strings, setters, reuseMap)

    if (pending.length === 0) {
      console.log(`    ♻️ ${langLabel(lang)}: reused all ${strings.length} label(s), nothing new to translate`)
    } else {
      console.log(`    ⏳ ${langLabel(lang)}: reused ${strings.length - pending.length}, translating ${pending.length} new/changed label(s)...`)
      const translated = await translateStrings(pending, lang)
      translated.forEach((v, k) => setters[pendingIdx[k]](v))
    }

    writeTarget(targetRel, JSON.stringify(meta, null, 2) + '\n')
  }
}

// Keys whose scalar values must never be translated (version tags, dates, etc.)
const YAML_PRESERVE_KEYS = new Set(['name', 'date', 'version'])

/**
 * Walk a parsed YAML value and collect every translatable scalar string,
 * skipping preserved keys. Object keys themselves are left untouched.
 */
function collectYamlStrings(node, strings, setters, keyName = null) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      if (typeof item === 'string') {
        strings.push(item)
        setters.push(v => { node[i] = v })
      } else {
        collectYamlStrings(item, strings, setters)
      }
    })
  } else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const value = node[key]
      if (YAML_PRESERVE_KEYS.has(key)) continue
      if (typeof value === 'string') {
        strings.push(value)
        setters.push(v => { node[key] = v })
      } else {
        collectYamlStrings(value, strings, setters, key)
      }
    }
  }
}

/** Collect only the translatable scalar strings from a parsed YAML value. */
function yamlStringsOf(data) {
  const strings = []
  const setters = []
  collectYamlStrings(data, strings, setters)
  return strings
}

function safeYamlLoad(raw) {
  try {
    return raw == null ? null : yamlLoad(raw)
  } catch {
    return null
  }
}

async function processYamlFile(relPath, langs, force) {
  console.log(`\n⚙️ YAML: ${relPath}`)
  const raw = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf-8')
  const oldSource = force ? null : safeYamlLoad(getGitContent(BASE_REF, relPath))

  for (const lang of langs) {
    const targetRel = targetPathFor(relPath, lang)

    const data = yamlLoad(raw)
    const strings = []
    const setters = []
    collectYamlStrings(data, strings, setters)

    // Build a reuse map from the previous CN + its matching translation at the
    // SAME ref, so old source/target strings are a consistent version pair.
    let reuseMap = new Map()
    if (oldSource) {
      const oldTarget = safeYamlLoad(getGitContent(BASE_REF, targetRel))
      if (oldTarget) {
        reuseMap = buildReuseMap(yamlStringsOf(oldSource), yamlStringsOf(oldTarget))
      }
    }

    const { pending, pendingIdx } = reuseOrCollect(strings, setters, reuseMap)

    if (pending.length === 0) {
      console.log(`    ♻️ ${langLabel(lang)}: reused all ${strings.length} value(s), nothing new to translate`)
    } else {
      console.log(`    ⏳ ${langLabel(lang)}: reused ${strings.length - pending.length}, translating ${pending.length} new/changed value(s)...`)
      const translated = await translateStrings(pending, lang)
      translated.forEach((v, k) => setters[pendingIdx[k]](v))
    }

    const out = yamlDump(data, { lineWidth: -1, noRefs: true })
    writeTarget(targetRel, out)
  }
}

async function processFile(relPath, langs, force) {
  if (relPath.endsWith('/meta.json')) {
    await processMetaJson(relPath, langs, force)
  } else if (relPath.endsWith('.yml') || relPath.endsWith('.yaml')) {
    await processYamlFile(relPath, langs, force)
  } else {
    await processMdxFile(relPath, langs, force)
  }
}

// --- CLI ---

function parseArgs(argv) {
  const opts = { all: false, working: false, files: [] }
  for (const arg of argv) {
    if (arg === '--all') opts.all = true
    else if (arg === '--working') opts.working = true
    else if (arg.startsWith('--base=')) opts.base = arg.split('=')[1]
    else if (arg.startsWith('--target=')) opts.target = arg.split('=')[1]
    else if (arg.startsWith('--concurrency=')) opts.concurrency = Number(arg.split('=')[1])
    else if (arg.startsWith('--files=')) opts.files.push(...arg.split('=')[1].split(','))
    else if (!arg.startsWith('--')) opts.files.push(arg)
  }
  return opts
}

/** Run async tasks with a bounded number of workers, preserving all results. */
async function runPool(items, limit, worker) {
  const size = Math.max(1, Math.min(limit, items.length))
  let cursor = 0
  const runNext = async () => {
    while (cursor < items.length) {
      const index = cursor++
      await worker(items[index], index)
    }
  }
  await Promise.all(Array.from({ length: size }, runNext))
}

/** Normalize a user-provided path to a repo-root-relative path. */
function toRepoRelative(p) {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
  return path.relative(REPO_ROOT, abs)
}

/** Remove empty ancestor directories of a file, up to (but not including) stopAbs. */
function cleanupEmptyDirs(fileAbs, stopAbs) {
  let dir = path.dirname(fileAbs)
  while (dir.startsWith(stopAbs) && dir !== stopAbs) {
    let entries
    try {
      entries = fs.readdirSync(dir)
    } catch {
      break
    }
    // Treat a directory containing only OS cruft (.DS_Store) as empty.
    const meaningful = entries.filter(e => e !== '.DS_Store')
    if (meaningful.length > 0) break
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      break
    }
    dir = path.dirname(dir)
  }
}

/**
 * Delete target-language files whose source was removed OR renamed away, and clean
 * up any directories that become empty. (The rename's NEW path is translated fresh
 * by the normal change/missing-target flow.)
 */
function pruneDeletedTargets() {
  const gone = [...new Set([...getDeletedSourceFiles(), ...getRenamedFromSourceFiles()])]
  const removed = []
  for (const src of gone) {
    for (const lang of TARGET_LANGS) {
      const targetRel = targetPathFor(src, lang)
      const targetAbs = path.join(REPO_ROOT, targetRel)
      if (fs.existsSync(targetAbs)) {
        fs.rmSync(targetAbs, { force: true })
        removed.push(targetRel)
        cleanupEmptyDirs(targetAbs, path.join(REPO_ROOT, `fuma/content/${lang}`))
      }
    }
  }
  return removed
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is not set.')
    process.exit(1)
  }

  const opts = parseArgs(process.argv.slice(2))
  if (opts.target) {
    TARGET_LANGS = opts.target.split(',').map(s => s.trim()).filter(Boolean)
  }

  // Resolve the git baseline for change detection / incremental "old source".
  COMPARE_WORKING = opts.working
  BASE_REF = opts.base || (opts.working ? 'HEAD' : 'HEAD^')
  if (exec(`git rev-parse --verify --quiet ${BASE_REF}^{commit}`) === '') {
    console.error(`❌ Error: base ref "${BASE_REF}" is not a valid git revision.`)
    process.exit(1)
  }

  // Determine the candidate source files and how to decide which languages to translate.
  //  - explicit --files / --all: force-translate the given files for every target language.
  //  - default: scan ALL source files, and for each language translate only when the target
  //    is MISSING (e.g. a newly added language, or a new file) OR the source changed
  //    relative to BASE_REF.
  let files
  let force
  if (opts.files.length > 0) {
    files = opts.files.map(toRepoRelative).filter(isTranslatableFile)
    force = true
  } else if (opts.all) {
    files = getAllSourceFiles()
    force = true
  } else {
    files = getAllSourceFiles()
    // Include untracked new files so brand-new docs are picked up in working mode.
    if (COMPARE_WORKING) files = [...new Set([...files, ...getUntrackedSourceFiles()])]
    force = false
  }

  const changedSet = force ? null : getChangedSet()

  // Sync deletions: remove target files whose source was deleted (skip in force modes,
  // where we are explicitly (re)translating an existing set of files).
  let prunedFiles = []
  if (!force) {
    prunedFiles = pruneDeletedTargets()
    if (prunedFiles.length > 0) {
      console.log(`🗑️ Removed ${prunedFiles.length} orphaned target file(s) for deleted source:`)
      prunedFiles.forEach(f => console.log(`    - ${f}`))
    }
  }

  // Build the work list: [{ file, langs }], skipping files with nothing to do.
  const work = []
  for (const file of files) {
    const langs = force
      ? TARGET_LANGS
      : TARGET_LANGS.filter(lang => changedSet.has(file) || !targetExists(file, lang))
    if (langs.length > 0) work.push({ file, langs })
  }

  if (work.length === 0) {
    console.log(prunedFiles.length > 0
      ? '✨ No files to translate (deletions synced).'
      : '✨ Everything is up to date, nothing to translate.')
    return
  }

  const concurrency = opts.concurrency > 0 ? opts.concurrency : DEFAULT_CONCURRENCY
  const baseInfo = force
    ? 'force full re-translate'
    : `base: ${BASE_REF}${COMPARE_WORKING ? ' vs working tree' : ' vs HEAD'}`
  console.log(
    `Found ${work.length} file(s) to translate → target langs [${TARGET_LANGS.join(', ')}] `
    + `(${baseInfo}, concurrency: ${Math.min(concurrency, work.length)})`,
  )

  let done = 0
  const failures = []
  await runPool(work, concurrency, async ({ file, langs }) => {
    try {
      await processFile(file, langs, force)
    } catch (e) {
      failures.push(file)
      console.error(`❌ Failed to process ${file}:`, e.message)
    } finally {
      console.log(`   (${++done}/${work.length})`)
    }
  })

  console.log(`\n🎉 Done. ${work.length - failures.length}/${work.length} file(s) translated.`)
  if (failures.length > 0) {
    console.error(`⚠️ ${failures.length} file(s) failed:\n  - ${failures.join('\n  - ')}`)
    process.exitCode = 1
  }
}

// --- Test hooks & exports ---
// These setters let tests point the module at a throwaway git repo / config
// without spawning a subprocess. They are no-ops in normal CLI usage.
function __setRepoRoot(p) { REPO_ROOT = p }
function __getRepoRoot() { return REPO_ROOT }
function __setGitConfig({ baseRef, compareWorking } = {}) {
  if (baseRef !== undefined) BASE_REF = baseRef
  if (compareWorking !== undefined) COMPARE_WORKING = compareWorking
}
function __setTargetLangs(langs) { TARGET_LANGS = langs }

export {
  // pure helpers
  isTranslatableFile,
  stripCodeFence,
  buildReuseMap,
  reuseOrCollect,
  frontmatterKeys,
  countCodeFences,
  validateMdxTranslation,
  collectMetaStrings,
  safeJsonParse,
  collectYamlStrings,
  yamlStringsOf,
  safeYamlLoad,
  targetPathFor,
  targetExists,
  writeTarget,
  parseArgs,
  runPool,
  toRepoRelative,
  cleanupEmptyDirs,
  // git helpers
  getAllSourceFiles,
  getUntrackedSourceFiles,
  getChangedSet,
  getDeletedSourceFiles,
  getRenamedFromSourceFiles,
  getGitContent,
  pruneDeletedTargets,
  // llm / translation
  callLLM,
  callLLMComplete,
  translateDocument,
  translateDocumentIncremental,
  translateStrings,
  // processors
  processMdxFile,
  processMetaJson,
  processYamlFile,
  processFile,
  main,
  // test hooks
  __setRepoRoot,
  __getRepoRoot,
  __setGitConfig,
  __setTargetLangs,
}

// Only auto-run when executed directly (not when imported by tests).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main()
}
