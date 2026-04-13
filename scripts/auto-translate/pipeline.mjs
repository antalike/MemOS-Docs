import fs from 'fs'
import { buildMarkdownTarget } from './markdown.mjs'
import { buildYamlTarget } from './yaml.mjs'
import { writeFileAtomic } from './io.mjs'

function isYaml(filePath) {
  return filePath.endsWith('.yml') || filePath.endsWith('.yaml')
}

export async function processFile(filePath, config, translator, diffBase) {
  return Promise.all(config.targetLangs.map(async (lang) => {
    const buildResult = isYaml(filePath)
      ? await buildYamlTarget({ filePath, sourceDir: config.sourceDir, targetLang: lang, diffBase, translator })
      : await buildMarkdownTarget({ filePath, sourceDir: config.sourceDir, targetLang: lang, diffBase, translator })

    const current = fs.existsSync(buildResult.targetPath) ? fs.readFileSync(buildResult.targetPath, 'utf-8') : ''
    const changed = current !== buildResult.content
    if (changed) writeFileAtomic(buildResult.targetPath, buildResult.content)

    return { lang, targetPath: buildResult.targetPath, changed, translatedCount: buildResult.translatedCount }
  }))
}
