#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import pLimit from 'p-limit'
import { loadConfigFromCli, validateConfig } from './config.mjs'
import {
  resolveDiffBase,
  listAllSourceFiles,
  getChangedFiles,
  didLanguagesFileChange,
  getLanguageChanges
} from './git.mjs'
import { createTranslator } from './translator.mjs'
import { processFile } from './pipeline.mjs'
import { toTargetPath } from './io.mjs'

function printUsage() {
  console.log('Usage: node scripts/auto-translate/index.mjs run [--target=en,ja] [--source=content/cn] [--full=true] [--changed-only=true]')
}

// 并发处理一批文件，仅针对指定的 langs 子集
async function processFiles(files, config, translator, diffBase, langs, summary) {
  if (files.length === 0 || langs.length === 0) return
  const langConfig = { ...config, targetLangs: langs }
  const limit = pLimit(15)
  let done = 0
  const total = files.length
  await Promise.all(files.map(filePath => limit(async () => {
    const startTs = new Date().toISOString().slice(11, 19)
    console.log(`[${startTs}] Processing: ${filePath}`)
    try {
      const outputResults = await processFile(filePath, langConfig, translator, diffBase)
      done += 1
      summary.fileSuccess += 1
      for (const result of outputResults) {
        summary.translatedBlocks += result.translatedCount
        if (result.changed) summary.changedOutputs += 1
        console.log(`  [${result.lang}] ${result.changed ? 'updated' : 'unchanged'} ${result.targetPath}`)
      }
      console.log(`  [${done}/${total}] Done: ${filePath}`)
    } catch (error) {
      done += 1
      summary.fileFailed += 1
      console.error(`  [${done}/${total}] Failed: ${filePath}`)
      console.error(error)
    }
  })))
}

// 删除源文件已删除的对应目标语言文件
function deleteRemovedSourceFiles(deletedFiles, langs, sourceDir) {
  for (const srcPath of deletedFiles) {
    for (const lang of langs) {
      const targetPath = toTargetPath(srcPath, sourceDir, lang)
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath)
        console.log(`Deleted: ${targetPath}`)
        const dir = path.dirname(targetPath)
        if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
      }
    }
  }
}

async function run() {
  // 1) 读取并解析 CLI 参数与环境变量配置
  const config = loadConfigFromCli()
  // 2) 仅支持 run 命令，其他命令打印用法并退出
  if (config.command !== 'run') {
    printUsage()
    process.exit(1)
  }

  // 3) 校验关键配置（源目录、目标语言、API Key）
  validateConfig(config)

  const diffBase = config.full ? '' : resolveDiffBase()
  const translator = createTranslator(config)
  const summary = { fileSuccess: 0, fileFailed: 0, translatedBlocks: 0, changedOutputs: 0 }

  if (config.full) {
    // 全量模式：所有文件、所有语言
    const files = listAllSourceFiles(config.sourceDir)
    console.log(`Full mode: translating ${files.length} files for [${config.targetLangs.join(', ')}]`)
    await processFiles(files, config, translator, '', config.targetLangs, summary)
  } else if (didLanguagesFileChange(diffBase)) {
    // languages.json 发生变更：分三种情况处理
    const { addedLangs, removedLangs } = getLanguageChanges(diffBase)
    const unchangedLangs = config.targetLangs.filter(l => !addedLangs.includes(l))

    console.log(`languages.json changed — added: [${addedLangs.join(', ')}], removed: [${removedLangs.join(', ')}], unchanged: [${unchangedLangs.join(', ')}]`)

    // 1) 删除已移除语言的整个 content 目录
    for (const lang of removedLangs) {
      const langDir = `content/${lang}`
      if (fs.existsSync(langDir)) {
        fs.rmSync(langDir, { recursive: true })
        console.log(`Deleted language directory: ${langDir}`)
      }
    }

    // 2) 新增语言：全量翻译所有源文件
    if (addedLangs.length > 0) {
      const allFiles = listAllSourceFiles(config.sourceDir)
      console.log(`Full translating ${allFiles.length} files for new languages: [${addedLangs.join(', ')}]`)
      await processFiles(allFiles, config, translator, '', addedLangs, summary)
    }

    // 3) 未变更语言：仅翻译本次变更的源文件
    if (unchangedLangs.length > 0) {
      const { files: changedFiles, deletedFiles } = getChangedFiles(config.sourceDir, diffBase)
      deleteRemovedSourceFiles(deletedFiles, unchangedLangs, config.sourceDir)
      if (changedFiles.length > 0) {
        console.log(`Incremental translating ${changedFiles.length} files for existing languages: [${unchangedLangs.join(', ')}]`)
        await processFiles(changedFiles, config, translator, diffBase, unchangedLangs, summary)
      } else {
        console.log('No changed source files for existing languages.')
      }
    }
  } else {
    // 常规增量模式：仅处理变更的源文件，所有语言
    const { files, deletedFiles } = getChangedFiles(config.sourceDir, diffBase)
    deleteRemovedSourceFiles(deletedFiles, config.targetLangs, config.sourceDir)

    console.log(`files: ${files}`)
    if (files.length === 0) {
      console.log('No relevant files to process.')
      return
    }
    await processFiles(files, config, translator, diffBase, config.targetLangs, summary)
  }

  // 输出汇总；存在失败时以非 0 退出码退出
  console.log(`Done. success=${summary.fileSuccess}, failed=${summary.fileFailed}, translated=${summary.translatedBlocks}, outputs_updated=${summary.changedOutputs}`)
  process.exit(summary.fileFailed > 0 ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
