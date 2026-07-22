import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getAllSourceFiles,
  getUntrackedSourceFiles,
  getChangedSet,
  getDeletedSourceFiles,
  getRenamedFromSourceFiles,
  getGitContent,
  pruneDeletedTargets,
  __setRepoRoot,
  __setGitConfig,
  __setTargetLangs,
} from '../auto-translate.mjs'
import { mkTmpRepo, writeFile, exists, rmTmp, sampleMdx } from './helpers.mjs'

const SRC = 'fuma/content/cn'

/** Set up a repo, point the module at it, and clean up afterwards. */
function withRepo(fn) {
  const { dir, git } = mkTmpRepo()
  __setRepoRoot(dir)
  try {
    return fn({ dir, git })
  } finally {
    rmTmp(dir)
  }
}

test('getAllSourceFiles: returns only tracked translatable files under source dir', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx())
    writeFile(dir, `${SRC}/dir/meta.json`, '{"title":"x"}')
    writeFile(dir, `${SRC}/notes.md`, '# not translatable')
    writeFile(dir, 'README.md', 'root')
    git('add -A')
    git('commit -q -m init')

    const files = getAllSourceFiles()
    assert.ok(files.includes(`${SRC}/a.mdx`))
    assert.ok(files.includes(`${SRC}/dir/meta.json`))
    assert.ok(!files.includes(`${SRC}/notes.md`))
    assert.ok(!files.includes('README.md'))
  })
})

test('getUntrackedSourceFiles: lists new, not-yet-committed source files', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/committed.mdx`, sampleMdx())
    git('add -A')
    git('commit -q -m init')
    writeFile(dir, `${SRC}/fresh.mdx`, sampleMdx())

    const untracked = getUntrackedSourceFiles()
    assert.deepEqual(untracked, [`${SRC}/fresh.mdx`])
  })
})

test('getChangedSet: committed changes vs HEAD^ (default mode)', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('T1'))
    writeFile(dir, `${SRC}/b.mdx`, sampleMdx('B'))
    git('add -A')
    git('commit -q -m base')

    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('T2'))
    git('add -A')
    git('commit -q -m change')

    __setGitConfig({ baseRef: 'HEAD^', compareWorking: false })
    const changed = getChangedSet()
    assert.ok(changed.has(`${SRC}/a.mdx`))
    assert.ok(!changed.has(`${SRC}/b.mdx`))
  })
})

test('getChangedSet: --working mode includes uncommitted + untracked', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('T1'))
    git('add -A')
    git('commit -q -m base')

    writeFile(dir, `${SRC}/a.mdx`, sampleMdx('modified')) // unstaged edit
    writeFile(dir, `${SRC}/new.mdx`, sampleMdx('new')) // untracked

    __setGitConfig({ baseRef: 'HEAD', compareWorking: true })
    const changed = getChangedSet()
    assert.ok(changed.has(`${SRC}/a.mdx`))
    assert.ok(changed.has(`${SRC}/new.mdx`))
  })
})

test('getDeletedSourceFiles: detects committed deletions', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/keep.mdx`, sampleMdx())
    writeFile(dir, `${SRC}/gone.mdx`, sampleMdx())
    git('add -A')
    git('commit -q -m base')

    git(`rm -q ${SRC}/gone.mdx`)
    git('commit -q -m delete')

    __setGitConfig({ baseRef: 'HEAD^', compareWorking: false })
    assert.deepEqual(getDeletedSourceFiles(), [`${SRC}/gone.mdx`])
  })
})

test('getRenamedFromSourceFiles: reports the OLD path of a rename', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/old-name.mdx`, sampleMdx('same content so rename is detected'))
    git('add -A')
    git('commit -q -m base')

    git(`mv ${SRC}/old-name.mdx ${SRC}/new-name.mdx`)
    git('commit -q -m rename')

    __setGitConfig({ baseRef: 'HEAD^', compareWorking: false })
    assert.deepEqual(getRenamedFromSourceFiles(), [`${SRC}/old-name.mdx`])
  })
})

test('getGitContent: returns content at a revision, null when absent', () => {
  withRepo(({ dir, git }) => {
    writeFile(dir, `${SRC}/a.mdx`, 'version-one')
    git('add -A')
    git('commit -q -m base')

    assert.equal(getGitContent('HEAD', `${SRC}/a.mdx`), 'version-one')
    assert.equal(getGitContent('HEAD', `${SRC}/missing.mdx`), null)
  })
})

test('pruneDeletedTargets: removes orphaned targets and cleans empty dirs', () => {
  withRepo(({ dir, git }) => {
    __setTargetLangs(['en'])
    writeFile(dir, `${SRC}/section/page.mdx`, sampleMdx())
    writeFile(dir, 'fuma/content/en/section/page.mdx', 'translated')
    git('add -A')
    git('commit -q -m base')

    git(`rm -q ${SRC}/section/page.mdx`)
    git('commit -q -m delete')

    __setGitConfig({ baseRef: 'HEAD^', compareWorking: false })
    const removed = pruneDeletedTargets()
    assert.deepEqual(removed, ['fuma/content/en/section/page.mdx'])
    assert.ok(!exists(dir, 'fuma/content/en/section/page.mdx'))
    // empty parent dir should be cleaned up too
    assert.ok(!exists(dir, 'fuma/content/en/section'))
  })
})

test('pruneDeletedTargets: also prunes targets of renamed-away sources', () => {
  withRepo(({ dir, git }) => {
    __setTargetLangs(['en'])
    writeFile(dir, `${SRC}/old.mdx`, sampleMdx('stable body for rename detection'))
    writeFile(dir, 'fuma/content/en/old.mdx', 'translated old')
    git('add -A')
    git('commit -q -m base')

    git(`mv ${SRC}/old.mdx ${SRC}/renamed.mdx`)
    git('commit -q -m rename')

    __setGitConfig({ baseRef: 'HEAD^', compareWorking: false })
    const removed = pruneDeletedTargets()
    assert.deepEqual(removed, ['fuma/content/en/old.mdx'])
    assert.ok(!exists(dir, 'fuma/content/en/old.mdx'))
  })
})
