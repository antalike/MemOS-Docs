import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { validateMdxTranslation } from './auto-translate.mjs'

// --- Paths ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Absolute path to the git repository root. */
let REPO_ROOT = (() => {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
  } catch {
    return path.resolve(__dirname, '..', '..', '..')
  }
})()

// --- Environment ---
// The translate script relies on env being exported by the shell. For convenience
// we also load fuma/.env.local (KEY=VALUE lines) so `npm run eval:translate` works
// out of the box, without overriding anything already set in the environment.
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal()

// --- Configuration ---
const SOURCE_DIR = 'fuma/content/cn'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.deepseek.com'
let MODEL = process.env.OPENAI_MODEL || 'deepseek-v4-flash'
const MAX_TOKENS = Number(process.env.OPENAI_MAX_TOKENS) || 8192
const MAX_TOKENS_CEILING = Number(process.env.OPENAI_MAX_TOKENS_CEILING) || 32768
const DEFAULT_CONCURRENCY = Number(process.env.EVAL_CONCURRENCY) || 4
const DEFAULT_SAMPLE = 6

const LANG_NAMES = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
}
const langLabel = lang => LANG_NAMES[lang] || lang

// Dimensions the judge scores, each on a 1–5 scale.
const DIMENSIONS = ['accuracy', 'terminology', 'formatting', 'fluency']
const DIMENSION_LABELS = {
  accuracy: 'Accuracy (准确性)',
  terminology: 'Terminology (术语一致性)',
  formatting: 'Formatting (格式保留)',
  fluency: 'Fluency (流畅度)',
}

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

/** Every source .mdx doc tracked by git, relative to repo root. */
function listSourceMdx() {
  return exec(`git ls-files ${SOURCE_DIR}`)
    .split('\n')
    .filter(f => f.startsWith(SOURCE_DIR) && f.endsWith('.mdx'))
    .filter(f => fs.existsSync(path.join(REPO_ROOT, f)))
}

/** Rewrite a `fuma/content/cn/...` path to its target-language equivalent. */
function targetPathFor(relPath, lang) {
  return relPath.replace(SOURCE_DIR, `fuma/content/${lang}`)
}

/**
 * Auto-detect target languages: any `fuma/content/<lang>` directory (other than the
 * source `cn`) that contains at least one translated .mdx file.
 */
function discoverTargetLangs() {
  const contentDir = path.join(REPO_ROOT, 'fuma/content')
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name !== 'cn')
    .map(e => e.name)
    .filter((lang) => {
      const langDir = path.join(contentDir, lang)
      return hasMdx(langDir)
    })
    .sort()
}

function hasMdx(dir) {
  let found = false
  const walk = (abs) => {
    if (found) return
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      if (found) return
      const child = path.join(abs, entry.name)
      if (entry.isDirectory()) walk(child)
      else if (entry.name.endsWith('.mdx')) found = true
    }
  }
  try {
    walk(dir)
  } catch {
    return false
  }
  return found
}

// --- Sampling (deterministic, seedable) ---

/** Small string hash → unsigned 32-bit int (FNV-1a), used to seed the shuffle. */
function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Mulberry32 PRNG — deterministic given a numeric seed. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic Fisher–Yates shuffle. Does not mutate the input. */
function seededShuffle(items, seed) {
  const arr = items.slice()
  const rand = mulberry32(typeof seed === 'string' ? hashString(seed) : (seed >>> 0))
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Pick up to `n` files deterministically. `n <= 0` means "all". */
function sampleFiles(files, n, seed) {
  if (!n || n <= 0 || n >= files.length) return files.slice()
  return seededShuffle(files, seed).slice(0, n)
}

// --- LLM judge ---

async function callLLM(systemPrompt, userContent, maxTokens = MAX_TOKENS, model = MODEL) {
  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0,
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
 * Call the judge and guarantee a non-empty, non-truncated response. Some models
 * spend the output budget on hidden reasoning and return empty content when it is
 * too small; on empty/truncated output we retry with a larger budget.
 */
async function callJudge(systemPrompt, userContent, model = MODEL) {
  let maxTokens = MAX_TOKENS
  for (;;) {
    const { content, finishReason } = await callLLM(systemPrompt, userContent, maxTokens, model)
    const truncated = finishReason === 'length' || !content.trim()
    if (!truncated) return content
    if (maxTokens < MAX_TOKENS_CEILING) {
      maxTokens = Math.min(maxTokens * 2, MAX_TOKENS_CEILING)
      continue
    }
    throw new Error(`judge returned empty/truncated output (finish_reason=${finishReason})`)
  }
}

/**
 * Judge a single source→translation pair with the given judge model. Returns parsed
 * dimension scores, overall, issues, comment, and a free structural check. Shared by
 * the eval flow (existing on-disk translations) and the model-comparison flow
 * (in-memory candidate translations).
 */
async function judgeTranslation(source, translation, lang, { model = MODEL } = {}) {
  const structuralProblems = validateMdxTranslation(source, translation)
  const userContent = `<SOURCE>\n${source}\n</SOURCE>\n\n<TRANSLATION>\n${translation}\n</TRANSLATION>`
  const raw = await callJudge(judgeSystemPrompt(lang), userContent, model)
  const parsed = parseJudgeResponse(raw)
  return { ...parsed, structuralProblems }
}

function judgeSystemPrompt(lang) {
  return `You are a meticulous senior reviewer evaluating the quality of a machine translation of MemOS technical documentation from Chinese into ${langLabel(lang)}.

You will receive the original Chinese document (<SOURCE>) and its translation (<TRANSLATION>).

Score the translation on FOUR dimensions, each on an integer scale of 1 to 5 (5 = excellent, 4 = good, 3 = acceptable, 2 = poor, 1 = unacceptable):
- "accuracy": Is the meaning faithfully conveyed, with no mistranslations, additions, or omissions?
- "terminology": Are technical terms consistent and correct? Product/brand names (MemOS, MemCube, OpenClaw, MemTensor, MemScheduler, etc.) MUST remain untranslated.
- "formatting": Are all Markdown/MDX/JSX structures preserved — frontmatter keys, headings, lists, tables, links/URLs, images, code blocks, and JSX component/tag/prop names? Code identifiers and keys must be byte-for-byte intact; only human-readable text should be translated.
- "fluency": Does the ${langLabel(lang)} read naturally and idiomatically for a native technical reader?

List concrete problems you found in "issues" (empty array if none). Each issue should be a short, specific string. Keep "comment" to one concise sentence.

Output ONLY a raw JSON object (no code fences, no extra prose) with exactly these keys:
{"accuracy": <1-5>, "terminology": <1-5>, "formatting": <1-5>, "fluency": <1-5>, "issues": ["..."], "comment": "..."}`
}

function clampScore(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return null
  return Math.max(1, Math.min(5, n))
}

/**
 * Parse the judge's JSON response robustly: strip an optional code fence, then fall
 * back to extracting the outermost {...} block. Returns a normalized result or
 * throws if no valid scores can be recovered.
 */
function parseJudgeResponse(raw) {
  let text = (raw || '').trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*\n?/, '').replace(/\n?```$/, '').trim()
  }
  let obj
  try {
    obj = JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
      throw new Error(`could not parse judge response as JSON: ${text.slice(0, 120)}`)
    }
    obj = JSON.parse(text.slice(start, end + 1))
  }

  const scores = {}
  for (const dim of DIMENSIONS) {
    const s = clampScore(obj[dim])
    if (s == null) throw new Error(`judge response missing/invalid "${dim}" score`)
    scores[dim] = s
  }
  const overall = Number((DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length).toFixed(2))
  const issues = Array.isArray(obj.issues) ? obj.issues.map(String).filter(Boolean) : []
  const comment = typeof obj.comment === 'string' ? obj.comment : ''
  return { scores, overall, issues, comment }
}

/** Evaluate a single translated file. Returns a per-file result record. */
async function evaluateFile(sourceRel, lang) {
  const targetRel = targetPathFor(sourceRel, lang)
  const source = fs.readFileSync(path.join(REPO_ROOT, sourceRel), 'utf-8')
  const translation = fs.readFileSync(path.join(REPO_ROOT, targetRel), 'utf-8')

  const { scores, overall, issues, comment, structuralProblems } =
    await judgeTranslation(source, translation, lang)

  return {
    lang,
    source: sourceRel,
    target: targetRel,
    scores,
    overall,
    issues,
    comment,
    structuralProblems,
  }
}

// --- Aggregation ---

function mean(nums) {
  if (nums.length === 0) return 0
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2))
}

/**
 * Aggregate per-file results into per-language and overall summaries: mean of each
 * dimension, mean overall, file count, and structural-problem count.
 */
function aggregate(results) {
  const byLang = {}
  for (const r of results) {
    ;(byLang[r.lang] ||= []).push(r)
  }

  const langSummaries = Object.entries(byLang).map(([lang, items]) => {
    const dims = {}
    for (const dim of DIMENSIONS) dims[dim] = mean(items.map(i => i.scores[dim]))
    return {
      lang,
      files: items.length,
      dimensions: dims,
      overall: mean(items.map(i => i.overall)),
      structuralIssues: items.filter(i => i.structuralProblems.length > 0).length,
    }
  }).sort((a, b) => a.lang.localeCompare(b.lang))

  const overall = {
    files: results.length,
    dimensions: Object.fromEntries(
      DIMENSIONS.map(dim => [dim, mean(results.map(r => r.scores[dim]))]),
    ),
    overall: mean(results.map(r => r.overall)),
    structuralIssues: results.filter(r => r.structuralProblems.length > 0).length,
  }

  return { langSummaries, overall }
}

// --- Report rendering ---

function scoreBar(value) {
  const filled = Math.round(value)
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function renderMarkdownReport({ results, summary, meta }) {
  const lines = []
  lines.push('# Translation Quality Evaluation Report')
  lines.push('')
  lines.push(`- Generated: ${meta.generatedAt}`)
  lines.push(`- Model: \`${meta.model}\``)
  lines.push(`- Target languages: ${meta.langs.join(', ')}`)
  lines.push(`- Files evaluated: ${summary.overall.files}`)
  lines.push(`- Seed: \`${meta.seed}\``)
  lines.push('')

  lines.push('## Overall')
  lines.push('')
  lines.push('| Metric | Score |')
  lines.push('| --- | --- |')
  for (const dim of DIMENSIONS) {
    const v = summary.overall.dimensions[dim]
    lines.push(`| ${DIMENSION_LABELS[dim]} | ${v.toFixed(2)} ${scoreBar(v)} |`)
  }
  lines.push(`| **Overall** | **${summary.overall.overall.toFixed(2)}** ${scoreBar(summary.overall.overall)} |`)
  lines.push(`| Files with structural issues | ${summary.overall.structuralIssues} / ${summary.overall.files} |`)
  lines.push('')

  lines.push('## By language')
  lines.push('')
  lines.push(`| Lang | Files | ${DIMENSIONS.map(d => DIMENSION_LABELS[d]).join(' | ')} | Overall | Structural |`)
  lines.push(`| --- | --- | ${DIMENSIONS.map(() => '---').join(' | ')} | --- | --- |`)
  for (const s of summary.langSummaries) {
    const dimCells = DIMENSIONS.map(d => s.dimensions[d].toFixed(2)).join(' | ')
    lines.push(`| ${s.lang} | ${s.files} | ${dimCells} | **${s.overall.toFixed(2)}** | ${s.structuralIssues} |`)
  }
  lines.push('')

  // Worst files first, so reviewers see the biggest problems at the top.
  const sorted = results.slice().sort((a, b) => a.overall - b.overall)
  lines.push('## Per-file results (worst first)')
  lines.push('')
  for (const r of sorted) {
    lines.push(`### \`${r.target}\``)
    lines.push('')
    lines.push(`- Overall: **${r.overall.toFixed(2)}** ${scoreBar(r.overall)}`)
    lines.push(`- Scores: ${DIMENSIONS.map(d => `${d} ${r.scores[d]}`).join(', ')}`)
    if (r.comment) lines.push(`- Comment: ${r.comment}`)
    if (r.structuralProblems.length > 0) {
      lines.push(`- ⚠️ Structural: ${r.structuralProblems.join('; ')}`)
    }
    if (r.issues.length > 0) {
      lines.push('- Issues:')
      for (const issue of r.issues) lines.push(`  - ${issue}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// --- CLI ---

function parseArgs(argv) {
  const opts = { all: false, files: [] }
  for (const arg of argv) {
    if (arg === '--all') opts.all = true
    else if (arg.startsWith('--target=')) opts.target = arg.split('=')[1]
    else if (arg.startsWith('--sample=')) opts.sample = Number(arg.split('=')[1])
    else if (arg.startsWith('--seed=')) opts.seed = arg.split('=')[1]
    else if (arg.startsWith('--concurrency=')) opts.concurrency = Number(arg.split('=')[1])
    else if (arg.startsWith('--model=')) opts.model = arg.split('=')[1]
    else if (arg.startsWith('--out=')) opts.out = arg.split('=')[1]
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

/**
 * Build the work list [{ source, lang }]. When explicit source files are given, map
 * them across all target langs (only where a translation exists). Otherwise sample
 * per language from all source docs that have a translation.
 */
function buildWorkList({ langs, explicitFiles, sample, seed }) {
  const work = []
  if (explicitFiles.length > 0) {
    const sources = explicitFiles
      .map(toRepoRelative)
      .map(f => (f.includes('/content/') ? f.replace(/fuma\/content\/[^/]+\//, `${SOURCE_DIR}/`) : f))
      .map(f => f.replace(`${SOURCE_DIR}//`, `${SOURCE_DIR}/`))
    for (const lang of langs) {
      for (const src of sources) {
        if (fs.existsSync(path.join(REPO_ROOT, targetPathFor(src, lang)))) {
          work.push({ source: src, lang })
        }
      }
    }
    return work
  }

  const allSources = listSourceMdx()
  for (const lang of langs) {
    const translated = allSources.filter(src =>
      fs.existsSync(path.join(REPO_ROOT, targetPathFor(src, lang))))
    for (const src of sampleFiles(translated, sample, `${seed}:${lang}`)) {
      work.push({ source: src, lang })
    }
  }
  return work
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is not set (checked env and fuma/.env.local).')
    process.exit(1)
  }

  const opts = parseArgs(process.argv.slice(2))
  if (opts.model) MODEL = opts.model

  const langs = opts.target
    ? opts.target.split(',').map(s => s.trim()).filter(Boolean)
    : discoverTargetLangs()

  if (langs.length === 0) {
    console.error('❌ No target languages found under fuma/content (nothing translated yet?).')
    process.exit(1)
  }

  const sample = opts.all ? 0 : (opts.sample > 0 ? opts.sample : DEFAULT_SAMPLE)
  const seed = opts.seed || 'memos'
  const concurrency = opts.concurrency > 0 ? opts.concurrency : DEFAULT_CONCURRENCY

  const work = buildWorkList({ langs, explicitFiles: opts.files, sample, seed })
  if (work.length === 0) {
    console.error('❌ No translated files matched the given options.')
    process.exit(1)
  }

  console.log(
    `🔍 Evaluating ${work.length} file(s) across [${langs.join(', ')}] `
    + `with model "${MODEL}" (${opts.all ? 'all files' : `sample=${sample}/lang`}, `
    + `seed=${seed}, concurrency=${Math.min(concurrency, work.length)})`,
  )

  const results = []
  const failures = []
  let done = 0
  await runPool(work, concurrency, async ({ source, lang }) => {
    try {
      const result = await evaluateFile(source, lang)
      results.push(result)
      console.log(`   ✅ [${lang}] ${result.overall.toFixed(2)}  ${result.target}  (${++done}/${work.length})`)
    } catch (e) {
      failures.push({ source, lang, error: e.message })
      console.error(`   ❌ [${lang}] ${targetPathFor(source, lang)}: ${e.message}  (${++done}/${work.length})`)
    }
  })

  if (results.length === 0) {
    console.error('❌ All evaluations failed; no report generated.')
    process.exit(1)
  }

  const summary = aggregate(results)
  const generatedAt = new Date().toISOString()
  const meta = { generatedAt, model: MODEL, langs, seed, sample: opts.all ? 'all' : sample }

  const outDir = opts.out
    ? (path.isAbsolute(opts.out) ? opts.out : path.resolve(REPO_ROOT, opts.out))
    : path.join(__dirname, 'eval-reports')
  fs.mkdirSync(outDir, { recursive: true })

  const stamp = generatedAt.replace(/[:.]/g, '-')
  const md = renderMarkdownReport({ results, summary, meta })
  const json = JSON.stringify({ meta, summary, results, failures }, null, 2)

  fs.writeFileSync(path.join(outDir, `report-${stamp}.md`), md, 'utf-8')
  fs.writeFileSync(path.join(outDir, `report-${stamp}.json`), json, 'utf-8')
  fs.writeFileSync(path.join(outDir, 'latest.md'), md, 'utf-8')
  fs.writeFileSync(path.join(outDir, 'latest.json'), json, 'utf-8')

  console.log('\n📊 Summary')
  console.log(`   Overall: ${summary.overall.overall.toFixed(2)} / 5 across ${summary.overall.files} file(s)`)
  for (const s of summary.langSummaries) {
    console.log(`   - ${s.lang}: ${s.overall.toFixed(2)} (${s.files} files, ${s.structuralIssues} with structural issues)`)
  }
  console.log(`\n📝 Report written to ${path.relative(REPO_ROOT, outDir)}/latest.md`)
  if (failures.length > 0) {
    console.error(`⚠️ ${failures.length} file(s) failed to evaluate.`)
    process.exitCode = 1
  }
}

// --- Exports (for tests) ---
function __setRepoRoot(p) { REPO_ROOT = p }

export {
  targetPathFor,
  discoverTargetLangs,
  hashString,
  mulberry32,
  seededShuffle,
  sampleFiles,
  clampScore,
  parseJudgeResponse,
  mean,
  aggregate,
  scoreBar,
  renderMarkdownReport,
  parseArgs,
  runPool,
  toRepoRelative,
  buildWorkList,
  judgeTranslation,
  listSourceMdx,
  DIMENSIONS,
  DIMENSION_LABELS,
  main,
  __setRepoRoot,
}

// Only auto-run when executed directly (not when imported by tests).
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main()
}
