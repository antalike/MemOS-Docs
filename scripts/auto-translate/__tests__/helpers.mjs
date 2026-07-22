import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HELPERS_DIR = path.dirname(fileURLToPath(import.meta.url))

/** Absolute path to the real repo root and the real Chinese source tree. */
export const REAL_REPO = path.resolve(HELPERS_DIR, '..', '..', '..', '..')
export const REAL_CN_ABS = path.resolve(HELPERS_DIR, '..', '..', '..', 'content', 'cn')
export const SOURCE_DIR = 'fuma/content/cn'

/** Recursively list real source files, returned as repo-relative paths. */
export function listRealFiles(filterFn = () => true) {
  const out = []
  const walk = abs => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const child = path.join(abs, entry.name)
      if (entry.isDirectory()) walk(child)
      else out.push(path.relative(REAL_REPO, child))
    }
  }
  if (fs.existsSync(REAL_CN_ABS)) walk(REAL_CN_ABS)
  return out.filter(filterFn)
}

/** Copy real repo files (given repo-relative paths) into a throwaway repo. */
export function copyIntoRepo(destDir, relPaths) {
  for (const rel of relPaths) {
    const content = fs.readFileSync(path.join(REAL_REPO, rel), 'utf-8')
    writeFile(destDir, rel, content)
  }
}

/** Create a throwaway git repo with a deterministic identity/config. */
export function mkTmpRepo() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'at-test-')))
  const git = cmd =>
    execSync(`git ${cmd}`, {
      cwd: dir,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim()
  git('init -q')
  git('config user.email test@example.com')
  git('config user.name Test')
  git('config commit.gpgsign false')
  git('config core.autocrlf false')
  return { dir, git }
}

/** Write a file (creating parent dirs) inside a repo. */
export function writeFile(dir, rel, content) {
  const abs = path.join(dir, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, 'utf-8')
}

export function readFile(dir, rel) {
  return fs.readFileSync(path.join(dir, rel), 'utf-8')
}

export function exists(dir, rel) {
  return fs.existsSync(path.join(dir, rel))
}

export function rmTmp(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
}

/** A tiny valid MDX document with frontmatter + one code fence. */
export function sampleMdx(title = '标题', body = '这是正文。') {
  return `---
title: ${title}
description: 描述文本
icon: ri:home-line
---

# ${title}

${body}

\`\`\`js
const x = 1
\`\`\`
`
}
