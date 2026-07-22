import test from 'node:test'
import assert from 'node:assert/strict'

import {
  targetPathFor,
  seededShuffle,
  sampleFiles,
  clampScore,
  parseJudgeResponse,
  mean,
  aggregate,
  scoreBar,
  renderMarkdownReport,
  parseArgs,
  DIMENSIONS,
} from '../eval-translation.mjs'

test('targetPathFor: rewrites source dir to target language dir', () => {
  assert.equal(targetPathFor('fuma/content/cn/a.mdx', 'en'), 'fuma/content/en/a.mdx')
  assert.equal(targetPathFor('fuma/content/cn/d/x.mdx', 'ja'), 'fuma/content/ja/d/x.mdx')
})

test('seededShuffle: deterministic for a given seed, does not mutate input', () => {
  const input = ['a', 'b', 'c', 'd', 'e']
  const a = seededShuffle(input, 'seed-1')
  const b = seededShuffle(input, 'seed-1')
  assert.deepEqual(a, b)
  assert.deepEqual(input, ['a', 'b', 'c', 'd', 'e']) // untouched
  assert.deepEqual(a.slice().sort(), input.slice().sort()) // permutation
})

test('seededShuffle: different seeds generally produce different orders', () => {
  const input = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const a = seededShuffle(input, 'seed-1')
  const b = seededShuffle(input, 'seed-2')
  assert.notDeepEqual(a, b)
})

test('sampleFiles: returns all when n<=0 or n>=length; caps otherwise', () => {
  const files = ['a', 'b', 'c', 'd']
  assert.deepEqual(sampleFiles(files, 0, 's').sort(), files.slice().sort())
  assert.deepEqual(sampleFiles(files, 10, 's').sort(), files.slice().sort())
  const three = sampleFiles(files, 3, 's')
  assert.equal(three.length, 3)
  assert.equal(new Set(three).size, 3) // no dupes
})

test('sampleFiles: stable across calls with same seed', () => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f']
  assert.deepEqual(sampleFiles(files, 3, 'x'), sampleFiles(files, 3, 'x'))
})

test('clampScore: rounds and clamps into 1..5, rejects non-numbers', () => {
  assert.equal(clampScore(4), 4)
  assert.equal(clampScore(4.4), 4)
  assert.equal(clampScore(4.6), 5)
  assert.equal(clampScore(0), 1)
  assert.equal(clampScore(9), 5)
  assert.equal(clampScore('3'), 3)
  assert.equal(clampScore('abc'), null)
  assert.equal(clampScore(undefined), null)
})

test('parseJudgeResponse: parses clean JSON and computes overall', () => {
  const raw = JSON.stringify({
    accuracy: 5, terminology: 4, formatting: 5, fluency: 4,
    issues: ['minor wording'], comment: 'Solid.',
  })
  const r = parseJudgeResponse(raw)
  assert.equal(r.scores.accuracy, 5)
  assert.equal(r.scores.fluency, 4)
  assert.equal(r.overall, 4.5)
  assert.deepEqual(r.issues, ['minor wording'])
  assert.equal(r.comment, 'Solid.')
})

test('parseJudgeResponse: strips code fences', () => {
  const raw = '```json\n{"accuracy":3,"terminology":3,"formatting":3,"fluency":3}\n```'
  const r = parseJudgeResponse(raw)
  assert.equal(r.overall, 3)
  assert.deepEqual(r.issues, [])
})

test('parseJudgeResponse: recovers JSON embedded in prose', () => {
  const raw = 'Here is my assessment:\n{"accuracy":4,"terminology":5,"formatting":4,"fluency":5}\nDone.'
  const r = parseJudgeResponse(raw)
  assert.equal(r.scores.terminology, 5)
  assert.equal(r.overall, 4.5)
})

test('parseJudgeResponse: throws on missing dimension or unparseable input', () => {
  assert.throws(() => parseJudgeResponse('{"accuracy":4}'), /missing\/invalid "terminology"/)
  assert.throws(() => parseJudgeResponse('not json at all'), /could not parse/)
})

test('mean: rounds to 2 decimals, empty -> 0', () => {
  assert.equal(mean([]), 0)
  assert.equal(mean([1, 2]), 1.5)
  assert.equal(mean([5, 4, 4]), 4.33)
})

test('aggregate: computes per-language and overall summaries', () => {
  const results = [
    { lang: 'en', scores: { accuracy: 5, terminology: 5, formatting: 5, fluency: 5 }, overall: 5, structuralProblems: [] },
    { lang: 'en', scores: { accuracy: 3, terminology: 3, formatting: 3, fluency: 3 }, overall: 3, structuralProblems: ['code-fence count mismatch'] },
    { lang: 'ja', scores: { accuracy: 4, terminology: 4, formatting: 4, fluency: 4 }, overall: 4, structuralProblems: [] },
  ]
  const { langSummaries, overall } = aggregate(results)

  const en = langSummaries.find(s => s.lang === 'en')
  assert.equal(en.files, 2)
  assert.equal(en.overall, 4)
  assert.equal(en.dimensions.accuracy, 4)
  assert.equal(en.structuralIssues, 1)

  assert.equal(overall.files, 3)
  assert.equal(overall.overall, 4)
  assert.equal(overall.structuralIssues, 1)
})

test('scoreBar: renders 5 glyphs reflecting the rounded score', () => {
  assert.equal(scoreBar(5), '★★★★★')
  assert.equal(scoreBar(3), '★★★☆☆')
  assert.equal(scoreBar(4.5), '★★★★★') // rounds up
  assert.equal(scoreBar(0), '☆☆☆☆☆')
})

test('renderMarkdownReport: includes headers, per-lang table, and per-file section', () => {
  const results = [
    {
      lang: 'en', source: 'fuma/content/cn/a.mdx', target: 'fuma/content/en/a.mdx',
      scores: { accuracy: 5, terminology: 5, formatting: 5, fluency: 5 }, overall: 5,
      issues: [], comment: 'Great.', structuralProblems: [],
    },
    {
      lang: 'ja', source: 'fuma/content/cn/b.mdx', target: 'fuma/content/ja/b.mdx',
      scores: { accuracy: 2, terminology: 3, formatting: 2, fluency: 3 }, overall: 2.5,
      issues: ['dropped a code block'], comment: 'Needs work.',
      structuralProblems: ['code-fence count mismatch (source 4, output 2)'],
    },
  ]
  const summary = aggregate(results)
  const md = renderMarkdownReport({
    results, summary,
    meta: { generatedAt: '2026-07-21T00:00:00.000Z', model: 'test-model', langs: ['en', 'ja'], seed: 'memos' },
  })

  assert.match(md, /# Translation Quality Evaluation Report/)
  assert.match(md, /## By language/)
  assert.match(md, /test-model/)
  // Worst file (ja, 2.5) should appear before the best (en, 5).
  const jaIdx = md.indexOf('fuma/content/ja/b.mdx')
  const enIdx = md.indexOf('fuma/content/en/a.mdx')
  assert.ok(jaIdx !== -1 && enIdx !== -1 && jaIdx < enIdx, 'worst file should be listed first')
  assert.match(md, /dropped a code block/)
  assert.match(md, /Structural: code-fence count mismatch/)
})

test('parseArgs: parses eval flags and positional files', () => {
  assert.deepEqual(parseArgs(['--all']), { all: true, files: [] })
  assert.equal(parseArgs(['--target=en,ja']).target, 'en,ja')
  assert.equal(parseArgs(['--sample=10']).sample, 10)
  assert.equal(parseArgs(['--seed=abc']).seed, 'abc')
  assert.equal(parseArgs(['--concurrency=3']).concurrency, 3)
  assert.equal(parseArgs(['--model=gpt']).model, 'gpt')
  assert.equal(parseArgs(['--out=reports']).out, 'reports')
  assert.deepEqual(parseArgs(['--files=a.mdx,b.mdx', 'c.mdx']).files, ['a.mdx', 'b.mdx', 'c.mdx'])
})

test('DIMENSIONS: the four expected scoring dimensions', () => {
  assert.deepEqual(DIMENSIONS, ['accuracy', 'terminology', 'formatting', 'fluency'])
})
