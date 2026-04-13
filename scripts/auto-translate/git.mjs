import { execSync } from 'child_process'

const EMPTY_TREE_HASH = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function hasGitRevision(revision) {
  return Boolean(exec(`git rev-parse --verify --quiet ${revision}`))
}

function sanitizeGitRef(ref) {
  if (!ref) return ''
  return /^[a-zA-Z0-9._/-]+$/.test(ref) ? ref : ''
}

export function resolveDiffBase() {
  const githubBefore = process.env.GITHUB_EVENT_BEFORE
  if (
    githubBefore
    && githubBefore !== '0000000000000000000000000000000000000000'
    && hasGitRevision(githubBefore)
  ) {
    return githubBefore
  }

  const baseRef = sanitizeGitRef(process.env.GITHUB_BASE_REF)
  if (baseRef) {
    const remoteRef = `origin/${baseRef}`
    if (hasGitRevision(remoteRef)) {
      const mergeBase = exec(`git merge-base ${remoteRef} HEAD`)
      if (mergeBase) return mergeBase
    }
  }

  const upstream = exec('git rev-parse --abbrev-ref --symbolic-full-name @{u}')
  if (upstream) {
    const mergeBase = exec(`git merge-base ${upstream} HEAD`)
    if (mergeBase) return mergeBase
  }

  if (hasGitRevision('HEAD^')) return 'HEAD^'
  if (hasGitRevision('HEAD')) return EMPTY_TREE_HASH
  return ''
}

function isTargetFile(filePath, sourceDir) {
  return filePath
    && filePath.startsWith(sourceDir)
    && (filePath.endsWith('.md') || filePath.endsWith('.yml') || filePath.endsWith('.yaml'))
}

export function listAllSourceFiles(sourceDir) {
  const output = exec(`git ls-files ${sourceDir}`)
  return output.split('\n').filter(file => isTargetFile(file, sourceDir))
}

export function getChangedFiles(sourceDir, diffBase) {
  if (!diffBase) return { files: [], deletedFiles: [] }
  const changedFiles = exec(`git diff --name-only ${diffBase} HEAD`).split('\n').filter(Boolean)
  if (changedFiles.includes('scripts/languages.json') || changedFiles.includes('scripts/auto-translate/languages.json')) {
    return { files: listAllSourceFiles(sourceDir), deletedFiles: [] }
  }

  const diffOutput = exec(`git diff --name-status --find-renames ${diffBase} HEAD -- ${sourceDir}`)
  const files = new Set()
  const deletedFiles = []
  for (const line of diffOutput.split('\n').filter(Boolean)) {
    const parts = line.split('\t')
    const status = parts[0]?.[0]
    if (!status) continue
    if (status === 'R' || status === 'C') {
      const nextPath = parts[2]
      if (isTargetFile(nextPath, sourceDir)) files.add(nextPath)
      continue
    }
    const currentPath = parts[1]
    if (status === 'D') {
      if (isTargetFile(currentPath, sourceDir)) deletedFiles.push(currentPath)
      continue
    }
    if (isTargetFile(currentPath, sourceDir)) files.add(currentPath)
  }
  return { files: [...files], deletedFiles }
}

export function getGitContent(revision, filePath) {
  if (!revision) return null
  const content = exec(`git show ${revision}:${filePath}`)
  return content || null
}

// 解析 git diff 的 unified=0 格式，返回新文件中被修改/新增的行号集合（1-based）
// 返回 null 表示无法获取 diff（视为全部行都需要处理）
// 返回空 Set 表示该文件在 diff 中无变更行
export function getChangedLineNumbers(diffBase, filePath) {
  if (!diffBase) return null
  const diff = exec(`git diff --unified=0 ${diffBase} HEAD -- ${filePath}`)
  if (!diff) return new Set()

  const result = new Set()
  // @@ -oldStart[,oldCount] +newStart[,newCount] @@
  for (const line of diff.split('\n')) {
    const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/)
    if (!m) continue
    const start = Number(m[1])
    const count = m[2] !== undefined ? Number(m[2]) : 1
    // count=0 表示纯删除，新文件中无对应行
    for (let i = 0; i < count; i++) result.add(start + i)
  }
  return result
}
