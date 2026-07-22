import test from 'node:test'
import assert from 'node:assert/strict'

import {
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
  parseArgs,
  runPool,
  toRepoRelative,
  __setRepoRoot,
  __getRepoRoot,
} from '../auto-translate.mjs'

test('isTranslatableFile: accepts supported types under source dir', () => {
  assert.equal(isTranslatableFile('fuma/content/cn/a.mdx'), true)
  assert.equal(isTranslatableFile('fuma/content/cn/dir/meta.json'), true)
  assert.equal(isTranslatableFile('fuma/content/cn/x.yml'), true)
  assert.equal(isTranslatableFile('fuma/content/cn/x.yaml'), true)
})

test('isTranslatableFile: rejects wrong prefix, wrong extension, non-meta json', () => {
  assert.equal(isTranslatableFile('fuma/content/en/a.mdx'), false)
  assert.equal(isTranslatableFile('fuma/content/cn/a.md'), false)
  assert.equal(isTranslatableFile('fuma/content/cn/data.json'), false)
  assert.equal(isTranslatableFile('meta.json'), false)
  assert.equal(isTranslatableFile(''), false)
})

test('stripCodeFence: strips outer fence with and without language', () => {
  assert.equal(stripCodeFence('```js\ncode\n```'), 'code')
  assert.equal(stripCodeFence('```\ncode\n```'), 'code')
  assert.equal(stripCodeFence('  \n```md\nhi\n```\n  '), 'hi')
})

test('stripCodeFence: leaves un-fenced text untouched', () => {
  assert.equal(stripCodeFence('plain text'), 'plain text')
  assert.equal(stripCodeFence('text\n```js\ncode\n```'), 'text\n```js\ncode\n```')
})

test('stripCodeFence: only strips the OUTER fence, preserves inner code blocks', () => {
  const wrapped = '```markdown\n# Title\n```js\nx=1\n```\n```'
  assert.equal(stripCodeFence(wrapped), '# Title\n```js\nx=1\n```')
})

test('buildReuseMap: returns empty map when lengths differ', () => {
  const m = buildReuseMap(['a', 'b'], ['A'])
  assert.equal(m.size, 0)
})

test('buildReuseMap: FIFO queue for duplicate keys', () => {
  const m = buildReuseMap(['a', 'b', 'a'], ['A', 'B', 'A2'])
  assert.deepEqual(m.get('a'), ['A', 'A2'])
  assert.deepEqual(m.get('b'), ['B'])
})

test('reuseOrCollect: reuses hits, collects misses, consumes duplicates in order', () => {
  const reuseMap = buildReuseMap(['a', 'a'], ['A', 'A2'])
  const results = new Array(3)
  const setters = [0, 1, 2].map(i => v => { results[i] = v })
  const { pending, pendingIdx } = reuseOrCollect(['a', 'x', 'a'], setters, reuseMap)
  assert.deepEqual(pending, ['x'])
  assert.deepEqual(pendingIdx, [1])
  assert.equal(results[0], 'A')
  assert.equal(results[2], 'A2')
  assert.equal(results[1], undefined) // still pending, not set
})

test('frontmatterKeys: extracts keys / returns null on missing block', () => {
  assert.deepEqual(frontmatterKeys('---\ntitle: x\nicon: y\n---\nbody'), ['title', 'icon'])
  assert.equal(frontmatterKeys('no frontmatter'), null)
  assert.equal(frontmatterKeys('---\ntitle: x'), null) // no closing delimiter
})

test('countCodeFences: counts fence delimiter lines', () => {
  assert.equal(countCodeFences('```\na\n```'), 2)
  assert.equal(countCodeFences('no fences'), 0)
  assert.equal(countCodeFences('   ```js\nx\n   ```'), 2)
})

test('validateMdxTranslation: flags empty output', () => {
  assert.deepEqual(validateMdxTranslation('src', ''), ['empty output'])
  assert.deepEqual(validateMdxTranslation('src', '   '), ['empty output'])
})

test('validateMdxTranslation: flags missing frontmatter block', () => {
  const src = '---\ntitle: x\n---\nbody'
  const problems = validateMdxTranslation(src, 'body only')
  assert.deepEqual(problems, ['missing frontmatter block'])
})

test('validateMdxTranslation: flags missing frontmatter keys', () => {
  const src = '---\ntitle: x\ndescription: y\n---\nb'
  const out = '---\ntitle: x\n---\nb'
  assert.deepEqual(validateMdxTranslation(src, out), ['frontmatter keys missing: description'])
})

test('validateMdxTranslation: flags code-fence count mismatch', () => {
  const src = '---\ntitle: x\n---\n```\ncode\n```'
  const out = '---\ntitle: x\n---\nno code'
  assert.deepEqual(validateMdxTranslation(src, out), ['code-fence count mismatch (source 2, output 0)'])
})

test('validateMdxTranslation: passes a well-formed translation', () => {
  const src = '---\ntitle: 中\ndescription: 描述\n---\n# 标题\n```\ncode\n```'
  const out = '---\ntitle: EN\ndescription: desc\n---\n# Title\n```\ncode\n```'
  assert.deepEqual(validateMdxTranslation(src, out), [])
})

test('collectMetaStrings: collects title/description and page separators', () => {
  const meta = {
    title: '标题',
    description: '描述',
    pages: [
      '---[ri:home-line]首页---',
      '---普通---',
      '---   ---', // empty label -> skipped
      'getting-started', // plain page ref -> skipped
      42, // non-string -> skipped
    ],
  }
  const { strings, setters } = collectMetaStrings(meta)
  assert.deepEqual(strings, ['标题', '描述', '首页', '普通'])

  // setters roundtrip and preserve the icon prefix
  setters[0]('Title')
  setters[1]('Desc')
  setters[2]('Home')
  setters[3]('Normal')
  assert.equal(meta.title, 'Title')
  assert.equal(meta.description, 'Desc')
  assert.equal(meta.pages[0], '---[ri:home-line]Home---')
  assert.equal(meta.pages[1], '---Normal---')
})

test('safeJsonParse: null / invalid -> null, valid -> object', () => {
  assert.equal(safeJsonParse(null), null)
  assert.equal(safeJsonParse('{bad'), null)
  assert.deepEqual(safeJsonParse('{"a":1}'), { a: 1 })
})

test('collectYamlStrings/yamlStringsOf: collect values, skip preserved keys and object keys', () => {
  const data = {
    title: 'T',
    name: 'v1.2.3', // preserved
    date: '2020-01-01', // preserved
    version: '9', // preserved
    items: ['a', 'b'],
    nested: { desc: 'd', version: 'x' },
  }
  assert.deepEqual(yamlStringsOf(data), ['T', 'a', 'b', 'd'])

  const strings = []
  const setters = []
  collectYamlStrings(data, strings, setters)
  setters[0]('T-en')
  setters[1]('a-en')
  assert.equal(data.title, 'T-en')
  assert.equal(data.items[0], 'a-en')
  assert.equal(data.name, 'v1.2.3') // untouched
})

test('collectYamlStrings: recurses into arrays of objects', () => {
  const data = { list: [{ desc: 'x' }, 'y'] }
  const strings = []
  const setters = []
  collectYamlStrings(data, strings, setters)
  assert.deepEqual(strings, ['x', 'y'])
  setters[0]('x-en')
  setters[1]('y-en')
  assert.equal(data.list[0].desc, 'x-en')
  assert.equal(data.list[1], 'y-en')
})

test('safeYamlLoad: null / invalid -> null, valid -> object', () => {
  assert.equal(safeYamlLoad(null), null)
  assert.equal(safeYamlLoad('key: "unterminated'), null)
  assert.deepEqual(safeYamlLoad('a: 1\nb: two'), { a: 1, b: 'two' })
})

test('targetPathFor: rewrites source dir to target language dir', () => {
  assert.equal(targetPathFor('fuma/content/cn/a.mdx', 'en'), 'fuma/content/en/a.mdx')
  assert.equal(targetPathFor('fuma/content/cn/d/meta.json', 'ja'), 'fuma/content/ja/d/meta.json')
})

test('parseArgs: parses flags, options, and positional files', () => {
  assert.deepEqual(parseArgs(['--all']), { all: true, working: false, files: [] })
  assert.deepEqual(parseArgs(['--working']), { all: false, working: true, files: [] })
  assert.equal(parseArgs(['--base=abc123']).base, 'abc123')
  assert.equal(parseArgs(['--target=en,ja']).target, 'en,ja')
  assert.equal(parseArgs(['--concurrency=3']).concurrency, 3)
  assert.deepEqual(parseArgs(['--files=a.mdx,b.mdx']).files, ['a.mdx', 'b.mdx'])
  assert.deepEqual(parseArgs(['x.mdx', 'y.mdx']).files, ['x.mdx', 'y.mdx'])

  const mixed = parseArgs(['--all', '--target=en', 'z.mdx', '--files=a,b'])
  assert.equal(mixed.all, true)
  assert.equal(mixed.target, 'en')
  assert.deepEqual(mixed.files, ['z.mdx', 'a', 'b'])
})

test('runPool: processes every item and never exceeds the concurrency limit', async () => {
  const items = [0, 1, 2, 3, 4, 5, 6]
  const seen = []
  let inFlight = 0
  let maxInFlight = 0
  await runPool(items, 2, async item => {
    inFlight++
    maxInFlight = Math.max(maxInFlight, inFlight)
    await new Promise(r => setTimeout(r, 5))
    seen.push(item)
    inFlight--
  })
  assert.deepEqual(seen.sort((a, b) => a - b), items)
  assert.ok(maxInFlight <= 2, `maxInFlight=${maxInFlight}`)
})

test('runPool: handles empty item list without error', async () => {
  let calls = 0
  await runPool([], 5, async () => { calls++ })
  assert.equal(calls, 0)
})

test('toRepoRelative: resolves absolute path relative to repo root', () => {
  const prev = __getRepoRoot()
  try {
    __setRepoRoot('/tmp/repo')
    assert.equal(toRepoRelative('/tmp/repo/fuma/content/cn/a.mdx'), 'fuma/content/cn/a.mdx')
  } finally {
    __setRepoRoot(prev)
  }
})
