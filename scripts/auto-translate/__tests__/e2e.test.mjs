import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { mkTmpRepo, writeFile, exists, readFile, rmTmp, sampleMdx } from './helpers.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.resolve(__dirname, '..', 'auto-translate.mjs')
const SRC = 'fuma/content/cn'

/** Start a mock chat/completions server that echoes structurally-valid output. */
function startMockServer() {
  const server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      const body = JSON.parse(raw)
      const user = body.messages[1].content
      let content
      const trimmed = user.trimStart()
      if (trimmed.startsWith('[')) {
        content = JSON.stringify(JSON.parse(user).map(s => `EN:${s}`))
      } else if (user.includes('<NEW_SOURCE>')) {
        content = user.match(/<NEW_SOURCE>\n([\s\S]*?)\n<\/NEW_SOURCE>/)[1]
      } else {
        content = user
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }))
    })
  })
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      resolve({ server, base: `http://127.0.0.1:${port}` })
    })
  })
}

/**
 * Run the translator CLI against a repo with the mock API wired in.
 * MUST be async (spawn, not spawnSync): the mock HTTP server runs in THIS
 * process's event loop, so blocking it with spawnSync would deadlock any run
 * that actually calls the API.
 */
function runCli(dir, base, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: dir,
      env: {
        ...process.env,
        OPENAI_API_KEY: 'test-key',
        OPENAI_API_BASE: base,
        OPENAI_MODEL: 'mock-model',
        ...extraEnv,
      },
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', c => { stdout += c })
    child.stderr.on('data', c => { stderr += c })
    child.on('error', reject)
    child.on('close', status => resolve({ status, stdout, stderr }))
  })
}

test('e2e: exits with error when OPENAI_API_KEY is missing', async () => {
  const { server } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx())
    git('add -A')
    git('commit -q -m init')
    const r = await runCli(dir, 'http://unused', ['--all', '--target=en'], { OPENAI_API_KEY: '' })
    assert.equal(r.status, 1)
    assert.match(r.stderr, /OPENAI_API_KEY is not set/)
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: exits with error on an invalid base ref', async () => {
  const { server, base } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx())
    git('add -A')
    git('commit -q -m init')
    const r = await runCli(dir, base, ['--base=nonexistent-ref', '--target=en'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /not a valid git revision/)
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: --files force-translates the given file for the target language', async () => {
  const { server, base } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, 'README.md', 'root')
    git('add -A')
    git('commit -q -m c1')
    writeFile(dir, `${SRC}/guide.mdx`, sampleMdx('指南', '正文'))
    git('add -A')
    git('commit -q -m c2')

    const r = await runCli(dir, base, [`--files=${SRC}/guide.mdx`, '--target=en'])
    assert.equal(r.status, 0, r.stderr)
    assert.ok(exists(dir, 'fuma/content/en/guide.mdx'))
    assert.match(readFile(dir, 'fuma/content/en/guide.mdx'), /指南/) // echoed by mock
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: default mode translates changed files and prunes deleted targets', async () => {
  const { server, base } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    // Base commit: two source files + their existing translations.
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('甲', '旧'))
    writeFile(dir, 'fuma/content/en/a.mdx', sampleMdx('A', 'old'))
    writeFile(dir, `${SRC}/b.mdx`, sampleMdx('乙'))
    writeFile(dir, 'fuma/content/en/b.mdx', sampleMdx('B'))
    git('add -A')
    git('commit -q -m base')

    // Second commit: change a.mdx, delete b.mdx (its target should be pruned).
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('甲', '新'))
    git(`rm -q ${SRC}/b.mdx`)
    git('add -A')
    git('commit -q -m change')

    const r = await runCli(dir, base, ['--target=en']) // default: HEAD^..HEAD
    assert.equal(r.status, 0, r.stderr)

    // a.mdx re-translated (incremental), b.mdx target pruned.
    assert.ok(exists(dir, 'fuma/content/en/a.mdx'))
    assert.match(readFile(dir, 'fuma/content/en/a.mdx'), /新/)
    assert.ok(!exists(dir, 'fuma/content/en/b.mdx'))
    assert.match(r.stdout, /Removed 1 orphaned target/)
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: --all force-translates every source file', async () => {
  const { server, base } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('甲'))
    writeFile(dir, `${SRC}/b.mdx`, sampleMdx('乙'))
    git('add -A')
    git('commit -q -m c1')
    // --all needs a valid HEAD^; make a second commit.
    writeFile(dir, 'README.md', 'x')
    git('add -A')
    git('commit -q -m c2')

    const r = await runCli(dir, base, ['--all', '--target=en'])
    assert.equal(r.status, 0, r.stderr)
    assert.ok(exists(dir, 'fuma/content/en/a.mdx'))
    assert.ok(exists(dir, 'fuma/content/en/b.mdx'))
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: a failing file is reported and the process exits non-zero', async () => {
  // Mock server returns a structurally-broken translation so validation fails.
  const server = http.createServer((req, res) => {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ choices: [{ message: { content: 'broken, no frontmatter' }, finish_reason: 'stop' }] }))
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('甲')) // has frontmatter + code fence
    git('add -A')
    git('commit -q -m c1')
    writeFile(dir, 'README.md', 'x')
    git('add -A')
    git('commit -q -m c2')

    const r = await runCli(dir, base, [`--files=${SRC}/a.mdx`, '--target=en'])
    assert.equal(r.status, 1)
    assert.match(r.stderr, /file\(s\) failed/)
    assert.ok(!exists(dir, 'fuma/content/en/a.mdx')) // broken output not written
  } finally {
    server.close()
    rmTmp(dir)
  }
})

test('e2e: reports "nothing to translate" when everything is up to date', async () => {
  const { server, base } = await startMockServer()
  const { dir, git } = mkTmpRepo()
  try {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx())
    writeFile(dir, 'fuma/content/en/a.mdx', sampleMdx('A'))
    git('add -A')
    git('commit -q -m c1')
    writeFile(dir, 'README.md', 'unrelated change')
    git('add -A')
    git('commit -q -m c2') // no source changes; target already exists

    const r = await runCli(dir, base, ['--target=en'])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /nothing to translate|up to date/)
  } finally {
    server.close()
    rmTmp(dir)
  }
})
