import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'

import {
  processMdxFile,
  processMetaJson,
  processYamlFile,
  processFile,
  cleanupEmptyDirs,
  targetExists,
  writeTarget,
  __setRepoRoot,
  __setGitConfig,
} from '../auto-translate.mjs'
import { mkTmpRepo, writeFile, readFile, exists, rmTmp, sampleMdx } from './helpers.mjs'

const SRC = 'fuma/content/cn'

/**
 * Smart mock fetch: understands the three prompt shapes the script produces
 * (string-array batch, incremental three-way doc, full doc) and echoes back a
 * structurally-valid "translation". Records all calls for assertions.
 */
function installMockFetch() {
  const calls = []
  const orig = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body)
    const user = body.messages[1].content
    calls.push({ url, body, user })

    let content
    const trimmed = user.trimStart()
    if (trimmed.startsWith('[')) {
      const arr = JSON.parse(user)
      content = JSON.stringify(arr.map(s => `EN:${s}`))
    } else if (user.includes('<NEW_SOURCE>')) {
      content = user.match(/<NEW_SOURCE>\n([\s\S]*?)\n<\/NEW_SOURCE>/)[1]
    } else {
      content = user // full-document translate: echo source verbatim
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      async json() { return { choices: [{ message: { content }, finish_reason: 'stop' }] } },
      async text() { return '' },
    }
  }
  return {
    calls,
    restore() { globalThis.fetch = orig },
  }
}

function withRepo(fn) {
  const { dir, git } = mkTmpRepo()
  __setRepoRoot(dir)
  const mock = installMockFetch()
  return Promise.resolve()
    .then(() => fn({ dir, git, mock }))
    .finally(() => {
      mock.restore()
      rmTmp(dir)
    })
}

test('processMdxFile (force): full-document translate writes the target', async () => {
  await withRepo(async ({ dir, mock }) => {
    const rel = `${SRC}/a.mdx`
    writeFile(dir, rel, sampleMdx('标题'))
    await processMdxFile(rel, ['en'], true)

    assert.ok(exists(dir, 'fuma/content/en/a.mdx'))
    // full (not incremental) path: prompt must NOT contain the three-way markers
    assert.ok(!mock.calls[0].user.includes('<NEW_SOURCE>'))
  })
})

test('processMdxFile: validation failure throws and does NOT overwrite target', async () => {
  await withRepo(async ({ dir }) => {
    const rel = `${SRC}/a.mdx`
    writeFile(dir, rel, sampleMdx('标题')) // source has frontmatter + code fence

    // Override fetch to return a broken translation (dropped frontmatter + fence)
    globalThis.fetch = async () => ({
      ok: true, status: 200, statusText: 'OK',
      async json() { return { choices: [{ message: { content: 'broken output' }, finish_reason: 'stop' }] } },
      async text() { return '' },
    })

    await assert.rejects(() => processMdxFile(rel, ['en'], true), /validation failed/)
    assert.ok(!exists(dir, 'fuma/content/en/a.mdx'))
  })
})

test('processMdxFile (incremental): uses the three-way prompt when prior translation exists', async () => {
  await withRepo(async ({ dir, git, mock }) => {
    const rel = `${SRC}/a.mdx`
    writeFile(dir, rel, sampleMdx('标题', '旧正文'))
    writeFile(dir, 'fuma/content/en/a.mdx', sampleMdx('Title', 'old body'))
    git('add -A')
    git('commit -q -m base')

    // Change the source in the working tree (HEAD keeps the old version).
    writeFile(dir, rel, sampleMdx('标题', '新正文'))
    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })

    await processMdxFile(rel, ['en'], false)
    assert.ok(mock.calls[0].user.includes('<NEW_SOURCE>'))
    assert.ok(mock.calls[0].user.includes('<OLD_TRANSLATION>'))
    assert.ok(exists(dir, 'fuma/content/en/a.mdx'))
  })
})

test('processMetaJson (force): translates all labels and rebuilds structure', async () => {
  await withRepo(async ({ dir }) => {
    const rel = `${SRC}/meta.json`
    writeFile(dir, rel, JSON.stringify({
      title: '标题',
      pages: ['---[ri:home-line]首页---', 'plain-ref'],
    }, null, 2))

    await processMetaJson(rel, ['en'], true)
    const out = JSON.parse(readFile(dir, 'fuma/content/en/meta.json'))
    assert.equal(out.title, 'EN:标题')
    assert.equal(out.pages[0], '---[ri:home-line]EN:首页---')
    assert.equal(out.pages[1], 'plain-ref') // untouched
  })
})

test('processMetaJson (incremental): reuses unchanged labels, only sends new ones', async () => {
  await withRepo(async ({ dir, git, mock }) => {
    const rel = `${SRC}/meta.json`
    writeFile(dir, rel, JSON.stringify({ title: '标题', description: '描述' }, null, 2))
    writeFile(dir, 'fuma/content/en/meta.json', JSON.stringify({ title: 'KeepTitle', description: 'KeepDesc' }, null, 2))
    git('add -A')
    git('commit -q -m base')

    // Add a new label; keep title/description unchanged.
    writeFile(dir, rel, JSON.stringify({ title: '标题', description: '描述', pages: ['---新增---'] }, null, 2))
    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })

    await processMetaJson(rel, ['en'], false)
    const out = JSON.parse(readFile(dir, 'fuma/content/en/meta.json'))
    assert.equal(out.title, 'KeepTitle') // reused verbatim
    assert.equal(out.description, 'KeepDesc') // reused verbatim
    assert.equal(out.pages[0], '---EN:新增---') // freshly translated

    // Only the ONE new label should have been sent to the API.
    const sent = JSON.parse(mock.calls[0].user)
    assert.deepEqual(sent, ['新增'])
  })
})

test('processMetaJson (incremental): reuses ALL labels when nothing changed (no API call)', async () => {
  await withRepo(async ({ dir, git, mock }) => {
    const rel = `${SRC}/meta.json`
    writeFile(dir, rel, JSON.stringify({ title: '标题' }, null, 2))
    writeFile(dir, 'fuma/content/en/meta.json', JSON.stringify({ title: 'KeepTitle' }, null, 2))
    git('add -A')
    git('commit -q -m base')
    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })

    await processMetaJson(rel, ['en'], false)
    const out = JSON.parse(readFile(dir, 'fuma/content/en/meta.json'))
    assert.equal(out.title, 'KeepTitle')
    assert.equal(mock.calls.length, 0) // fully reused, nothing sent
  })
})

test('processYamlFile (incremental): reuses unchanged values, translates only new ones', async () => {
  await withRepo(async ({ dir, git, mock }) => {
    const rel = `${SRC}/changelog.yml`
    writeFile(dir, rel, 'title: 版本说明\nitems:\n  - 旧功能\n')
    writeFile(dir, 'fuma/content/en/changelog.yml', 'title: KeepTitle\nitems:\n  - KeepItem\n')
    git('add -A')
    git('commit -q -m base')

    writeFile(dir, rel, 'title: 版本说明\nitems:\n  - 旧功能\n  - 新功能\n')
    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })

    await processYamlFile(rel, ['en'], false)
    const out = readFile(dir, 'fuma/content/en/changelog.yml')
    assert.match(out, /title: KeepTitle/) // reused
    assert.match(out, /KeepItem/) // reused
    assert.match(out, /EN:新功能/) // new value translated
    assert.deepEqual(JSON.parse(mock.calls[0].user), ['新功能'])
  })
})

test('processYamlFile (incremental): reuses ALL values when nothing changed (no API call)', async () => {
  await withRepo(async ({ dir, git, mock }) => {
    const rel = `${SRC}/changelog.yml`
    writeFile(dir, rel, 'title: 版本说明\n')
    writeFile(dir, 'fuma/content/en/changelog.yml', 'title: KeepTitle\n')
    git('add -A')
    git('commit -q -m base')
    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })

    await processYamlFile(rel, ['en'], false)
    assert.match(readFile(dir, 'fuma/content/en/changelog.yml'), /title: KeepTitle/)
    assert.equal(mock.calls.length, 0)
  })
})

test('processYamlFile (force): translates values, preserves reserved keys', async () => {
  await withRepo(async ({ dir }) => {
    const rel = `${SRC}/changelog.yml`
    writeFile(dir, rel, 'title: 版本说明\nname: v1.0.0\nitems:\n  - 新功能\n')
    await processYamlFile(rel, ['en'], true)

    const out = readFile(dir, 'fuma/content/en/changelog.yml')
    assert.match(out, /title: EN:版本说明/)
    assert.match(out, /name: v1\.0\.0/) // reserved key value untouched
    assert.match(out, /EN:新功能/)
  })
})

test('processFile: routes by extension to the right processor', async () => {
  await withRepo(async ({ dir }) => {
    writeFile(dir, `${SRC}/doc.mdx`, sampleMdx())
    writeFile(dir, `${SRC}/meta.json`, JSON.stringify({ title: 'T' }))
    writeFile(dir, `${SRC}/data.yml`, 'title: T')

    await processFile(`${SRC}/doc.mdx`, ['en'], true)
    await processFile(`${SRC}/meta.json`, ['en'], true)
    await processFile(`${SRC}/data.yml`, ['en'], true)

    assert.ok(exists(dir, 'fuma/content/en/doc.mdx'))
    assert.ok(exists(dir, 'fuma/content/en/meta.json'))
    assert.ok(exists(dir, 'fuma/content/en/data.yml'))
  })
})

test('writeTarget + targetExists: atomic write is visible afterwards', async () => {
  await withRepo(async ({ dir }) => {
    const rel = 'fuma/content/en/nested/x.mdx'
    assert.equal(targetExists(`${SRC}/nested/x.mdx`, 'en'), false)
    writeTarget(rel, 'hello\n')
    assert.equal(readFile(dir, rel), 'hello\n')
    assert.equal(targetExists(`${SRC}/nested/x.mdx`, 'en'), true)
  })
})

test('cleanupEmptyDirs: removes empty ancestors (incl. .DS_Store) up to the stop dir', async () => {
  await withRepo(async ({ dir }) => {
    const stop = path.join(dir, 'fuma/content/en')
    const fileAbs = path.join(stop, 'a/b/page.mdx')
    fs.mkdirSync(path.dirname(fileAbs), { recursive: true })
    fs.writeFileSync(path.join(stop, 'a/b/.DS_Store'), '')
    // file itself already gone; only cruft remains
    cleanupEmptyDirs(fileAbs, stop)
    assert.ok(!exists(dir, 'fuma/content/en/a/b'))
    assert.ok(!exists(dir, 'fuma/content/en/a'))
    assert.ok(exists(dir, 'fuma/content/en')) // stop dir preserved
  })
})
