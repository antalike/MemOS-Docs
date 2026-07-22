import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { translateDocument } from './auto-translate.mjs'
import {
  judgeTranslation,
  listSourceMdx,
  sampleFiles,
  mean,
  scoreBar,
  toRepoRelative,
  runPool,
  DIMENSIONS,
  DIMENSION_LABELS,
} from './eval-translation.mjs'

// --- Paths ---
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let REPO_ROOT = (() => {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()
  } catch {
    return path.resolve(__dirname, '..', '..', '..')
  }
})()

const SOURCE_DIR = 'fuma/content/cn'

// Candidate TRANSLATION models to compare (override with --models=). Chosen as a
// representative flagship-but-efficient model per family available on the endpoint.
const DEFAULT_MODELS = [
  'deepseek-v4-flash',
  'qwen3-max',
  'claude-sonnet-4-6',
]

// The single JUDGE model that scores every candidate translation (override with
// --judge=). A neutral judge not in the candidate list keeps scores comparable and
// avoids a model favoring its own output.
const DEFAULT_JUDGE = process.env.COMPARE_JUDGE || 'gpt-4.1'
const DEFAULT_SAMPLE = 4
const DEFAULT_CONCURRENCY = Number(process.env.EVAL_CONCURRENCY) || 4
// Starting output budget for candidate translations. Kept modest so the gateway
// routes to channels of models with smaller output limits (e.g. gpt-4o); the
// translator auto-grows this on truncation. Override with --max-tokens=.
const DEFAULT_TRANSLATE_MAX_TOKENS = Number(process.env.COMPARE_MAX_TOKENS) || 16384

// --- Aggregation (pure, testable) ---

const EPS = 1e-9

/** Per-model summary: mean overall + per-dimension, counts, failures. */
function aggregateByModel(records, models) {
  return models.map((model) => {
    const mine = records.filter(r => r.model === model)
    const ok = mine.filter(r => r.scores)
    const dims = {}
    for (const dim of DIMENSIONS) dims[dim] = mean(ok.map(r => r.scores[dim]))
    return {
      model,
      files: ok.length,
      failures: mine.length - ok.length,
      dimensions: dims,
      overall: mean(ok.map(r => r.overall)),
      structuralIssues: ok.filter(r => r.structuralProblems.length > 0).length,
    }
  })
}

/**
 * For each document, find the winning model(s) — those whose overall equals the max
 * among successful candidates. Ties award a win to each tied model.
 */
function computeDocWinners(records, docs) {
  return docs.map((doc) => {
    const forDoc = records.filter(r => r.source === doc && r.scores)
    if (forDoc.length === 0) return { doc, winners: [], best: null, scores: {} }
    const best = Math.max(...forDoc.map(r => r.overall))
    const winners = forDoc.filter(r => r.overall >= best - EPS).map(r => r.model)
    const scores = Object.fromEntries(forDoc.map(r => [r.model, r.overall]))
    return { doc, winners, best, scores }
  })
}

/** Count per-model wins across documents (ties count for every tied model). */
function computeWins(docWinners) {
  const wins = {}
  for (const { winners } of docWinners) {
    for (const m of winners) wins[m] = (wins[m] || 0) + 1
  }
  return wins
}

/** Rank models by mean overall (desc), then by wins (desc), then name. */
function rankModels(modelSummaries, wins) {
  return modelSummaries
    .map(s => ({ ...s, wins: wins[s.model] || 0 }))
    .sort((a, b) =>
      b.overall - a.overall
      || b.wins - a.wins
      || a.model.localeCompare(b.model))
}

/**
 * Cross-judge consensus: for each model, its mean overall under each judge and the
 * mean of those (equal weight per judge). Sorted by the cross-judge mean. Records
 * carry a `judge` field; only successful (scored) records contribute.
 */
function computeConsensus(records, models, judges) {
  return models.map((model) => {
    const byJudge = {}
    const perJudge = []
    for (const j of judges) {
      const rs = records.filter(r => r.judge === j && r.model === model && r.scores)
      if (rs.length) {
        const m = mean(rs.map(r => r.overall))
        byJudge[j] = m
        perJudge.push(m)
      } else {
        byJudge[j] = null
      }
    }
    return { model, byJudge, mean: mean(perJudge) }
  }).sort((a, b) => b.mean - a.mean || a.model.localeCompare(b.model))
}

/** Ordered model list (best→worst) for a single judge, by that judge's mean overall. */
function rankingForJudge(records, models, judge) {
  return models
    .map((model) => {
      const rs = records.filter(r => r.judge === judge && r.model === model && r.scores)
      return { model, overall: mean(rs.map(r => r.overall)) }
    })
    .sort((a, b) => b.overall - a.overall || a.model.localeCompare(b.model))
}

// --- Report rendering ---

function renderMarkdownReport({ ranked, docWinners, records, meta }) {
  const lines = []
  lines.push('# Translation Model Comparison Report')
  lines.push('')
  lines.push(`- Generated: ${meta.generatedAt}`)
  lines.push(`- Judge model: \`${meta.judge}\``)
  lines.push(`- Target language: ${meta.lang}`)
  lines.push(`- Models compared: ${meta.models.map(m => `\`${m}\``).join(', ')}`)
  lines.push(`- Documents per model: ${meta.docs}`)
  lines.push(`- Seed: \`${meta.seed}\``)
  lines.push('')

  lines.push('## Ranking')
  lines.push('')
  lines.push(`| Rank | Model | Overall | ${DIMENSIONS.map(d => DIMENSION_LABELS[d]).join(' | ')} | Wins | Structural | Failed |`)
  lines.push(`| --- | --- | --- | ${DIMENSIONS.map(() => '---').join(' | ')} | --- | --- | --- |`)
  ranked.forEach((s, i) => {
    const dimCells = DIMENSIONS.map(d => s.dimensions[d].toFixed(2)).join(' | ')
    const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''
    lines.push(`| ${i + 1} | ${medal}\`${s.model}\` | **${s.overall.toFixed(2)}** ${scoreBar(s.overall)} | ${dimCells} | ${s.wins}/${meta.docs} | ${s.structuralIssues} | ${s.failures} |`)
  })
  lines.push('')

  lines.push('## Per-document overall scores')
  lines.push('')
  lines.push(`| Document | ${meta.models.map(m => `\`${m}\``).join(' | ')} | Winner |`)
  lines.push(`| --- | ${meta.models.map(() => '---').join(' | ')} | --- |`)
  for (const dw of docWinners) {
    const short = dw.doc.replace(`${SOURCE_DIR}/docs/`, '')
    const cells = meta.models.map((m) => {
      const v = dw.scores[m]
      if (v == null) return '—'
      return dw.winners.includes(m) ? `**${v.toFixed(2)}**` : v.toFixed(2)
    }).join(' | ')
    lines.push(`| \`${short}\` | ${cells} | ${dw.winners.map(m => `\`${m}\``).join(', ') || '—'} |`)
  }
  lines.push('')

  // Per-model, per-doc detail (comments + issues), grouped by document.
  lines.push('## Details by document')
  lines.push('')
  const docs = [...new Set(records.map(r => r.source))]
  for (const doc of docs) {
    lines.push(`### \`${doc.replace(`${SOURCE_DIR}/docs/`, '')}\``)
    lines.push('')
    const forDoc = records.filter(r => r.source === doc)
      .slice()
      .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1))
    for (const r of forDoc) {
      if (!r.scores) {
        lines.push(`- \`${r.model}\`: ❌ ${r.error}`)
        continue
      }
      lines.push(`- \`${r.model}\` — **${r.overall.toFixed(2)}** (${DIMENSIONS.map(d => `${d} ${r.scores[d]}`).join(', ')})`)
      if (r.comment) lines.push(`  - ${r.comment}`)
      if (r.structuralProblems.length > 0) lines.push(`  - ⚠️ Structural: ${r.structuralProblems.join('; ')}`)
      for (const issue of r.issues) lines.push(`  - ${issue}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Cross-judge report: shows whether the model ranking is stable across judges. Built
 * from flat records that carry a `judge` field.
 */
function renderCrossJudgeReport({ records, meta }) {
  const { judges, models, docs, lang } = meta
  const consensus = computeConsensus(records, models, judges)
  const lines = []

  lines.push('# Translation Model Cross-Judge Comparison')
  lines.push('')
  lines.push(`- Generated: ${meta.generatedAt}`)
  lines.push(`- Judges: ${judges.map(j => `\`${j}\``).join(', ')}`)
  lines.push(`- Target language: ${lang}`)
  lines.push(`- Models compared: ${models.map(m => `\`${m}\``).join(', ')}`)
  lines.push(`- Documents per model: ${docs}`)
  lines.push(`- Seed: \`${meta.seed}\``)
  lines.push('')

  lines.push('## Consensus ranking (mean across judges)')
  lines.push('')
  lines.push(`| Rank | Model | ${judges.map(j => `\`${j}\``).join(' | ')} | **Mean** |`)
  lines.push(`| --- | --- | ${judges.map(() => '---').join(' | ')} | --- |`)
  consensus.forEach((c, i) => {
    const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : ''
    const cells = judges.map(j => (c.byJudge[j] == null ? '—' : c.byJudge[j].toFixed(2))).join(' | ')
    lines.push(`| ${i + 1} | ${medal}\`${c.model}\` | ${cells} | **${c.mean.toFixed(2)}** ${scoreBar(c.mean)} |`)
  })
  lines.push('')

  lines.push('## Ranking by each judge')
  lines.push('')
  for (const j of judges) {
    const order = rankingForJudge(records, models, j)
    const chain = order.map(o => `\`${o.model}\` (${o.overall.toFixed(2)})`).join(' > ')
    lines.push(`- **${j}**: ${chain}`)
  }
  lines.push('')

  // Rank-agreement note: do all judges agree on the top model?
  const tops = judges.map(j => rankingForJudge(records, models, j)[0]?.model)
  const uniqueTops = [...new Set(tops)]
  lines.push('## Agreement')
  lines.push('')
  if (uniqueTops.length === 1) {
    lines.push(`- ✅ All ${judges.length} judges rank \`${uniqueTops[0]}\` first.`)
  } else {
    lines.push(`- ⚠️ Judges disagree on the top model: ${judges.map((j, i) => `${j}→\`${tops[i]}\``).join(', ')}.`)
  }
  const spread = Math.max(...consensus.map(c => c.mean)) - Math.min(...consensus.map(c => c.mean))
  lines.push(`- Consensus score spread (best − worst): ${spread.toFixed(2)}.`)
  lines.push('')

  lines.push('## Per-judge structural issues')
  lines.push('')
  for (const j of judges) {
    const n = records.filter(r => r.judge === j && r.scores && r.structuralProblems.length > 0).length
    const failed = records.filter(r => r.judge === j && !r.scores).length
    lines.push(`- **${j}**: ${n} file(s) with structural issues, ${failed} judge failure(s).`)
  }
  lines.push('')

  return lines.join('\n')
}

// --- CLI ---

function parseArgs(argv) {
  const opts = { files: [] }
  for (const arg of argv) {
    if (arg.startsWith('--models=')) opts.models = arg.split('=')[1]
    else if (arg.startsWith('--judges=')) opts.judges = arg.split('=')[1]
    else if (arg.startsWith('--judge=')) opts.judge = arg.split('=')[1]
    else if (arg.startsWith('--target=')) opts.target = arg.split('=')[1]
    else if (arg.startsWith('--sample=')) opts.sample = Number(arg.split('=')[1])
    else if (arg.startsWith('--seed=')) opts.seed = arg.split('=')[1]
    else if (arg.startsWith('--max-tokens=')) opts.maxTokens = Number(arg.split('=')[1])
    else if (arg.startsWith('--concurrency=')) opts.concurrency = Number(arg.split('=')[1])
    else if (arg.startsWith('--out=')) opts.out = arg.split('=')[1]
    else if (arg.startsWith('--files=')) opts.files.push(...arg.split('=')[1].split(','))
    else if (!arg.startsWith('--')) opts.files.push(arg)
  }
  return opts
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY is not set (checked env and fuma/.env.local).')
    process.exit(1)
  }

  const opts = parseArgs(process.argv.slice(2))
  const models = opts.models
    ? opts.models.split(',').map(s => s.trim()).filter(Boolean)
    : DEFAULT_MODELS
  // Judges: --judges= (comma list) and/or --judge= (single), else the default judge.
  const judgeSet = []
  if (opts.judges) judgeSet.push(...opts.judges.split(',').map(s => s.trim()).filter(Boolean))
  if (opts.judge) judgeSet.push(opts.judge)
  const judges = [...new Set(judgeSet.length ? judgeSet : [DEFAULT_JUDGE])]
  const lang = opts.target || 'en'
  const sample = opts.sample > 0 ? opts.sample : DEFAULT_SAMPLE
  const seed = opts.seed || 'memos'
  const maxTokens = opts.maxTokens > 0 ? opts.maxTokens : DEFAULT_TRANSLATE_MAX_TOKENS
  const concurrency = opts.concurrency > 0 ? opts.concurrency : DEFAULT_CONCURRENCY

  // Resolve the documents to translate with every model.
  let docs
  if (opts.files.length > 0) {
    docs = opts.files
      .map(toRepoRelative)
      .map(f => f.replace(/fuma\/content\/[^/]+\//, `${SOURCE_DIR}/`))
      .filter(f => fs.existsSync(path.join(REPO_ROOT, f)))
  } else {
    docs = sampleFiles(listSourceMdx(), sample, seed)
  }
  if (docs.length === 0) {
    console.error('❌ No source documents matched.')
    process.exit(1)
  }

  // Preload source contents once (reused across all candidate models).
  const sources = new Map(docs.map(d => [d, fs.readFileSync(path.join(REPO_ROOT, d), 'utf-8')]))

  // Task grid: every (document × model) pair. Each task translates ONCE, then is
  // scored by every judge — so all judges rate identical translations.
  const tasks = []
  for (const doc of docs) {
    for (const model of models) tasks.push({ doc, model })
  }

  const multiJudge = judges.length > 1
  console.log(
    `🧪 Comparing ${models.length} model(s) on ${docs.length} doc(s) → ${lang} `
    + `(judges=[${judges.join(', ')}], seed=${seed}, ${tasks.length} translations × ${judges.length} judge(s), `
    + `concurrency=${Math.min(concurrency, tasks.length)})`,
  )

  // Flat records, one per (doc, model, judge). `judge` lets the pure aggregators run
  // per judge simply by filtering.
  const records = []
  let done = 0
  await runPool(tasks, concurrency, async ({ doc, model }) => {
    const source = sources.get(doc)
    const short = doc.replace(`${SOURCE_DIR}/docs/`, '')
    let translation
    try {
      translation = await translateDocument(source, lang, model, maxTokens)
    } catch (e) {
      for (const judge of judges) {
        records.push({ doc, source: doc, model, judge, scores: null, overall: null, issues: [], structuralProblems: [], error: `translate: ${e.message}` })
      }
      console.error(`   ❌ [${model}] translate ${short}: ${e.message}  (${++done}/${tasks.length})`)
      return
    }
    const perJudge = []
    for (const judge of judges) {
      try {
        const judged = await judgeTranslation(source, translation, lang, { model: judge })
        records.push({ doc, source: doc, model, judge, ...judged })
        perJudge.push(`${judge}:${judged.overall.toFixed(2)}`)
      } catch (e) {
        records.push({ doc, source: doc, model, judge, scores: null, overall: null, issues: [], structuralProblems: [], error: `judge: ${e.message}` })
        perJudge.push(`${judge}:ERR`)
      }
    }
    console.log(`   ✅ [${model}] ${perJudge.join(' ')}  ${short}  (${++done}/${tasks.length})`)
  })

  const generatedAt = new Date().toISOString()
  const outDir = opts.out
    ? (path.isAbsolute(opts.out) ? opts.out : path.resolve(REPO_ROOT, opts.out))
    : path.join(__dirname, 'eval-reports')
  fs.mkdirSync(outDir, { recursive: true })
  const stamp = generatedAt.replace(/[:.]/g, '-')

  let md
  let json
  if (multiJudge) {
    const meta = { generatedAt, judges, lang, models, docs: docs.length, seed }
    md = renderCrossJudgeReport({ records, meta })
    const consensus = computeConsensus(records, models, judges)
    json = JSON.stringify({ meta, consensus, records }, null, 2)

    console.log('\n🏁 Consensus ranking (mean across judges):')
    consensus.forEach((c, i) => {
      const per = judges.map(j => `${j} ${c.byJudge[j] == null ? '—' : c.byJudge[j].toFixed(2)}`).join(', ')
      console.log(`   ${i + 1}. ${c.model}: ${c.mean.toFixed(2)}  (${per})`)
    })
  } else {
    const judge = judges[0]
    const meta = { generatedAt, judge, lang, models, docs: docs.length, seed }
    const modelSummaries = aggregateByModel(records, models)
    const docWinners = computeDocWinners(records, docs)
    const ranked = rankModels(modelSummaries, computeWins(docWinners))
    md = renderMarkdownReport({ ranked, docWinners, records, meta })
    json = JSON.stringify({ meta, ranking: ranked, docWinners, records }, null, 2)

    console.log('\n🏁 Ranking (by mean overall):')
    ranked.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.model}: ${s.overall.toFixed(2)}  (wins ${s.wins}/${docs.length}, ${s.failures} failed)`)
    })
  }

  const prefix = multiJudge ? 'cross' : 'compare'
  fs.writeFileSync(path.join(outDir, `${prefix}-${stamp}.md`), md, 'utf-8')
  fs.writeFileSync(path.join(outDir, `${prefix}-${stamp}.json`), json, 'utf-8')
  fs.writeFileSync(path.join(outDir, `${prefix}-latest.md`), md, 'utf-8')
  fs.writeFileSync(path.join(outDir, `${prefix}-latest.json`), json, 'utf-8')

  console.log(`\n📝 Report written to ${path.relative(REPO_ROOT, outDir)}/${prefix}-latest.md`)

  const totalFailures = records.filter(r => !r.scores).length
  if (totalFailures > 0) {
    console.error(`⚠️ ${totalFailures} judge task(s) failed.`)
    process.exitCode = 1
  }
}

// --- Exports (for tests) ---
function __setRepoRoot(p) { REPO_ROOT = p }

export {
  aggregateByModel,
  computeDocWinners,
  computeWins,
  rankModels,
  computeConsensus,
  rankingForJudge,
  renderMarkdownReport,
  renderCrossJudgeReport,
  parseArgs,
  DEFAULT_MODELS,
  main,
  __setRepoRoot,
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main()
}
