import test from 'node:test'
import assert from 'node:assert/strict'

import {
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
} from '../compare-models.mjs'

const S = (a, t, f, fl) => ({ accuracy: a, terminology: t, formatting: f, fluency: fl })

/** Two docs × two models, plus one failed task. */
function fixtureRecords() {
  return [
    { doc: 'd1', source: 'd1', model: 'm1', scores: S(5, 5, 5, 5), overall: 5, issues: [], comment: 'great', structuralProblems: [] },
    { doc: 'd1', source: 'd1', model: 'm2', scores: S(3, 3, 3, 3), overall: 3, issues: ['x'], comment: 'meh', structuralProblems: ['code-fence count mismatch'] },
    { doc: 'd2', source: 'd2', model: 'm1', scores: S(4, 4, 4, 4), overall: 4, issues: [], comment: 'ok', structuralProblems: [] },
    { doc: 'd2', source: 'd2', model: 'm2', scores: null, overall: null, issues: [], comment: '', structuralProblems: [], error: 'API Error: 500' },
  ]
}

test('aggregateByModel: means over successes, counts failures + structural issues', () => {
  const summ = aggregateByModel(fixtureRecords(), ['m1', 'm2'])
  const m1 = summ.find(s => s.model === 'm1')
  const m2 = summ.find(s => s.model === 'm2')

  assert.equal(m1.files, 2)
  assert.equal(m1.failures, 0)
  assert.equal(m1.overall, 4.5)
  assert.equal(m1.dimensions.accuracy, 4.5)
  assert.equal(m1.structuralIssues, 0)

  assert.equal(m2.files, 1) // one succeeded, one failed
  assert.equal(m2.failures, 1)
  assert.equal(m2.overall, 3)
  assert.equal(m2.structuralIssues, 1)
})

test('computeDocWinners: picks the max-overall model per doc; ignores failures', () => {
  const winners = computeDocWinners(fixtureRecords(), ['d1', 'd2'])
  const d1 = winners.find(w => w.doc === 'd1')
  const d2 = winners.find(w => w.doc === 'd2')

  assert.deepEqual(d1.winners, ['m1'])
  assert.equal(d1.best, 5)
  assert.deepEqual(d1.scores, { m1: 5, m2: 3 })

  // m2 failed on d2, so m1 is the only (and winning) candidate
  assert.deepEqual(d2.winners, ['m1'])
  assert.equal(d2.best, 4)
})

test('computeDocWinners: ties award a win to every tied model', () => {
  const records = [
    { doc: 'd', source: 'd', model: 'a', scores: S(4, 4, 4, 4), overall: 4, issues: [], structuralProblems: [] },
    { doc: 'd', source: 'd', model: 'b', scores: S(4, 4, 4, 4), overall: 4, issues: [], structuralProblems: [] },
  ]
  const winners = computeDocWinners(records, ['d'])
  assert.deepEqual(winners[0].winners.sort(), ['a', 'b'])
})

test('computeWins: counts wins across docs', () => {
  const winners = computeDocWinners(fixtureRecords(), ['d1', 'd2'])
  const wins = computeWins(winners)
  assert.equal(wins.m1, 2)
  assert.equal(wins.m2 || 0, 0)
})

test('rankModels: orders by overall desc, then wins, then name', () => {
  const summ = aggregateByModel(fixtureRecords(), ['m1', 'm2'])
  const wins = computeWins(computeDocWinners(fixtureRecords(), ['d1', 'd2']))
  const ranked = rankModels(summ, wins)
  assert.equal(ranked[0].model, 'm1')
  assert.equal(ranked[0].wins, 2)
  assert.equal(ranked[1].model, 'm2')
})

test('rankModels: breaks overall ties by win count', () => {
  const summ = [
    { model: 'a', overall: 4, dimensions: S(4, 4, 4, 4), files: 2, failures: 0, structuralIssues: 0 },
    { model: 'b', overall: 4, dimensions: S(4, 4, 4, 4), files: 2, failures: 0, structuralIssues: 0 },
  ]
  const ranked = rankModels(summ, { a: 1, b: 3 })
  assert.equal(ranked[0].model, 'b') // more wins first
})

test('renderMarkdownReport: includes ranking, per-doc table, and details', () => {
  const records = fixtureRecords()
  const summ = aggregateByModel(records, ['m1', 'm2'])
  const docWinners = computeDocWinners(records, ['d1', 'd2'])
  const ranked = rankModels(summ, computeWins(docWinners))
  const md = renderMarkdownReport({
    ranked, docWinners, records,
    meta: { generatedAt: '2026-07-21T00:00:00.000Z', judge: 'judge-x', lang: 'en', models: ['m1', 'm2'], docs: 2, seed: 'memos' },
  })

  assert.match(md, /# Translation Model Comparison Report/)
  assert.match(md, /judge-x/)
  assert.match(md, /## Ranking/)
  assert.match(md, /🥇/)
  assert.match(md, /## Per-document overall scores/)
  assert.match(md, /API Error: 500/) // failed task surfaced in details
})

test('parseArgs: parses comparison flags and files', () => {
  assert.equal(parseArgs(['--models=a,b,c']).models, 'a,b,c')
  assert.equal(parseArgs(['--judge=j']).judge, 'j')
  assert.equal(parseArgs(['--judges=j1,j2']).judges, 'j1,j2')
  assert.equal(parseArgs(['--target=ja']).target, 'ja')
  assert.equal(parseArgs(['--sample=5']).sample, 5)
  assert.equal(parseArgs(['--seed=s']).seed, 's')
  assert.deepEqual(parseArgs(['--files=a.mdx', 'b.mdx']).files, ['a.mdx', 'b.mdx'])
})

/** One doc, two models, scored by two judges (flat records with a `judge` field). */
function crossRecords() {
  return [
    { doc: 'd1', source: 'd1', model: 'm1', judge: 'j1', scores: S(5, 5, 5, 5), overall: 5, issues: [], structuralProblems: [] },
    { doc: 'd1', source: 'd1', model: 'm1', judge: 'j2', scores: S(4, 4, 4, 4), overall: 4, issues: [], structuralProblems: [] },
    { doc: 'd1', source: 'd1', model: 'm2', judge: 'j1', scores: S(3, 3, 3, 3), overall: 3, issues: [], structuralProblems: ['x'] },
    { doc: 'd1', source: 'd1', model: 'm2', judge: 'j2', scores: S(5, 5, 5, 5), overall: 5, issues: [], structuralProblems: [] },
  ]
}

test('computeConsensus: averages each model across judges, sorted by mean', () => {
  const c = computeConsensus(crossRecords(), ['m1', 'm2'], ['j1', 'j2'])
  const m1 = c.find(x => x.model === 'm1')
  const m2 = c.find(x => x.model === 'm2')
  assert.deepEqual(m1.byJudge, { j1: 5, j2: 4 })
  assert.equal(m1.mean, 4.5)
  assert.deepEqual(m2.byJudge, { j1: 3, j2: 5 })
  assert.equal(m2.mean, 4)
  assert.equal(c[0].model, 'm1') // higher mean first
})

test('computeConsensus: marks a judge with no scores as null', () => {
  const recs = [
    { doc: 'd', source: 'd', model: 'm', judge: 'j1', scores: S(4, 4, 4, 4), overall: 4, issues: [], structuralProblems: [] },
    { doc: 'd', source: 'd', model: 'm', judge: 'j2', scores: null, overall: null, issues: [], structuralProblems: [], error: 'boom' },
  ]
  const c = computeConsensus(recs, ['m'], ['j1', 'j2'])
  assert.equal(c[0].byJudge.j1, 4)
  assert.equal(c[0].byJudge.j2, null)
  assert.equal(c[0].mean, 4) // only j1 contributes
})

test('rankingForJudge: orders models by that judge only', () => {
  const recs = crossRecords()
  assert.deepEqual(rankingForJudge(recs, ['m1', 'm2'], 'j1').map(o => o.model), ['m1', 'm2'])
  assert.deepEqual(rankingForJudge(recs, ['m1', 'm2'], 'j2').map(o => o.model), ['m2', 'm1'])
})

test('renderCrossJudgeReport: shows consensus, per-judge rankings, and disagreement', () => {
  const records = crossRecords()
  const md = renderCrossJudgeReport({
    records,
    meta: { generatedAt: '2026-07-21T00:00:00.000Z', judges: ['j1', 'j2'], lang: 'en', models: ['m1', 'm2'], docs: 1, seed: 'memos' },
  })
  assert.match(md, /# Translation Model Cross-Judge Comparison/)
  assert.match(md, /## Consensus ranking/)
  assert.match(md, /## Ranking by each judge/)
  // j1 ranks m1 first, j2 ranks m2 first → judges disagree
  assert.match(md, /Judges disagree on the top model/)
})

test('renderCrossJudgeReport: notes agreement when judges concur on the top model', () => {
  const records = [
    { doc: 'd', source: 'd', model: 'm1', judge: 'j1', scores: S(5, 5, 5, 5), overall: 5, issues: [], structuralProblems: [] },
    { doc: 'd', source: 'd', model: 'm1', judge: 'j2', scores: S(5, 5, 5, 5), overall: 5, issues: [], structuralProblems: [] },
    { doc: 'd', source: 'd', model: 'm2', judge: 'j1', scores: S(3, 3, 3, 3), overall: 3, issues: [], structuralProblems: [] },
    { doc: 'd', source: 'd', model: 'm2', judge: 'j2', scores: S(4, 4, 4, 4), overall: 4, issues: [], structuralProblems: [] },
  ]
  const md = renderCrossJudgeReport({
    records,
    meta: { generatedAt: 't', judges: ['j1', 'j2'], lang: 'en', models: ['m1', 'm2'], docs: 1, seed: 'memos' },
  })
  assert.match(md, /All 2 judges rank `m1` first/)
})

test('DEFAULT_MODELS: covers the candidate families and excludes the judge model', () => {
  assert.ok(DEFAULT_MODELS.some(m => m.includes('deepseek')))
  assert.ok(DEFAULT_MODELS.some(m => m.includes('qwen')))
  assert.ok(DEFAULT_MODELS.some(m => m.includes('claude')))
  // gpt-4.1 is the judge, so it must not appear among the candidate translators.
  assert.ok(!DEFAULT_MODELS.some(m => m.includes('gpt')))
})
