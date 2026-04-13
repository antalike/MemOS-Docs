import fs from 'fs'
import path from 'path'
import os from 'os'

export function toTargetPath(sourcePath, sourceDir, lang) {
  return path.join(`content/${lang}`, path.relative(sourceDir, sourcePath))
}

export function ensureParentDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function writeFileAtomic(filePath, content) {
  ensureParentDir(filePath)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-translate-'))
  const tempFile = path.join(tempDir, path.basename(filePath))
  fs.writeFileSync(tempFile, content, 'utf-8')
  fs.renameSync(tempFile, filePath)
  fs.rmSync(tempDir, { recursive: true, force: true })
}
