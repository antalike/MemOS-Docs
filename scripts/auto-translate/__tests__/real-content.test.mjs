import test from 'node:test'
import assert from 'node:assert/strict'
import { load as yamlLoad } from 'js-yaml'

import {
  processMdxFile,
  processMetaJson,
  processYamlFile,
  targetPathFor,
  __setRepoRoot,
} from '../auto-translate.mjs'
import {
  mkTmpRepo,
  copyIntoRepo,
  listRealFiles,
  readFile,
  exists,
  rmTmp,
} from './helpers.mjs'

/**
 * Mock fetch that understands the script's three prompt shapes and applies a
 * caller-supplied transform. `identity` proves lossless round-trips; `tag`
 * proves only translatable text changes while structure is preserved.
 */
function installMockFetch(transform) {
  const orig = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    const user = body.messages[1].content
    let content
    if (user.trimStart().startsWith('[')) {
      content = JSON.stringify(JSON.parse(user).map(transform.string))
    } else if (user.includes('<NEW_SOURCE>')) {
      content = transform.doc(user.match(/<NEW_SOURCE>\n([\s\S]*?)\n<\/NEW_SOURCE>/)[1])
    } else {
      content = transform.doc(user)
    }
    return {
      ok: true, status: 200, statusText: 'OK',
      async json() { return { choices: [{ message: { content }, finish_reason: 'stop' }] } },
      async text() { return '' },
    }
  }
  return () => { globalThis.fetch = orig }
}

const IDENTITY = { string: s => s, doc: d => d }
const TAG = { string: s => `[EN] ${s}`, doc: d => d }

/** Quietly run a noisy block (the processors log a lot per file). */
function silenceConsole() {
  const orig = console.log
  console.log = () => {}
  return () => { console.log = orig }
}

test('real content: fixtures are present in the repo', () => {
  const mdx = listRealFiles(f => f.endsWith('.mdx'))
  const meta = listRealFiles(f => f.endsWith('/meta.json'))
  assert.ok(mdx.length > 50, `expected many real .mdx files, got ${mdx.length}`)
  assert.ok(meta.length > 5, `expected several real meta.json files, got ${meta.length}`)
})

test('real content: every real MDX doc processes and passes structural validation', async () => {
  const mdx = listRealFiles(f => f.endsWith('.mdx'))
  const { dir } = mkTmpRepo()
  __setRepoRoot(dir)
  copyIntoRepo(dir, mdx)
  const restore = installMockFetch(IDENTITY)
  const unsilence = silenceConsole()
  try {
    for (const rel of mdx) {
      // processMdxFile throws if validateMdxTranslation rejects the output.
      await processMdxFile(rel, ['en'], true)
      assert.ok(exists(dir, targetPathFor(rel, 'en')), `missing target for ${rel}`)
    }
  } finally {
    unsilence()
    restore()
    rmTmp(dir)
  }
})

test('real content: every real meta.json round-trips losslessly (identity translation)', async () => {
  const metas = listRealFiles(f => f.endsWith('/meta.json'))
  const { dir } = mkTmpRepo()
  __setRepoRoot(dir)
  copyIntoRepo(dir, metas)
  const restore = installMockFetch(IDENTITY)
  const unsilence = silenceConsole()
  try {
    for (const rel of metas) {
      await processMetaJson(rel, ['en'], true)
      const src = JSON.parse(readFile(dir, rel))
      const out = JSON.parse(readFile(dir, targetPathFor(rel, 'en')))
      assert.deepEqual(out, src, `meta round-trip diverged for ${rel}`)
    }
  } finally {
    unsilence()
    restore()
    rmTmp(dir)
  }
})

test('real content: api_docs/meta.json translates labels but preserves icons, page refs, and non-text keys', async () => {
  const rel = 'fuma/content/cn/docs/api_docs/meta.json'
  const all = listRealFiles(f => f === rel)
  assert.equal(all.length, 1, 'expected the api_docs meta fixture to exist')

  const { dir } = mkTmpRepo()
  __setRepoRoot(dir)
  copyIntoRepo(dir, [rel])
  const restore = installMockFetch(TAG)
  const unsilence = silenceConsole()
  try {
    await processMetaJson(rel, ['en'], true)
    const src = JSON.parse(readFile(dir, rel))
    const out = JSON.parse(readFile(dir, targetPathFor(rel, 'en')))

    // Non-text metadata is untouched.
    assert.equal(out.icon, src.icon)
    assert.equal(out.root, src.root)
    // Plain page references pass through unchanged.
    assert.ok(out.pages.includes('core/add_message'))
    // Separators keep their icon prefix; only the label is translated.
    assert.ok(out.pages.some(p => /^---\[ri:rocket-line\]\[EN\] /.test(p)))
    // Title is translated.
    assert.ok(out.title.startsWith('[EN] '))
  } finally {
    unsilence()
    restore()
    rmTmp(dir)
  }
})

test('real content: changelog.yml round-trips losslessly (identity)', async () => {
  const yml = listRealFiles(f => f.endsWith('.yml') || f.endsWith('.yaml'))
  if (yml.length === 0) return // no yaml fixtures in this repo
  const { dir } = mkTmpRepo()
  __setRepoRoot(dir)
  copyIntoRepo(dir, yml)
  const restore = installMockFetch(IDENTITY)
  const unsilence = silenceConsole()
  try {
    for (const rel of yml) {
      await processYamlFile(rel, ['en'], true)
      const src = yamlLoad(readFile(dir, rel))
      const out = yamlLoad(readFile(dir, targetPathFor(rel, 'en')))
      assert.deepEqual(out, src, `yaml round-trip diverged for ${rel}`)
    }
  } finally {
    unsilence()
    restore()
    rmTmp(dir)
  }
})

test('real content: changelog.yml preserves reserved keys (name/date) while translating text', async () => {
  const yml = listRealFiles(f => f.endsWith('.yml') || f.endsWith('.yaml'))
  if (yml.length === 0) return
  const rel = yml[0]
  const { dir } = mkTmpRepo()
  __setRepoRoot(dir)
  copyIntoRepo(dir, [rel])
  const restore = installMockFetch(TAG)
  const unsilence = silenceConsole()
  try {
    await processYamlFile(rel, ['en'], true)
    const src = yamlLoad(readFile(dir, rel))
    const out = yamlLoad(readFile(dir, targetPathFor(rel, 'en')))

    // Reserved keys survive verbatim.
    assert.equal(out.versions[0].name, src.versions[0].name)
    assert.equal(out.versions[0].date, src.versions[0].date)

    // At least one nested human-readable value was translated.
    const flat = JSON.stringify(out)
    assert.ok(flat.includes('[EN] '), 'expected some translated text in the yaml output')
  } finally {
    unsilence()
    restore()
    rmTmp(dir)
  }
})
