#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import pLimit from 'p-limit'
import { loadConfigFromCli, validateConfig } from './config.mjs'
import { resolveDiffBase, listAllSourceFiles, getChangedFiles } from './git.mjs'
import { createTranslator } from './translator.mjs'
import { processFile } from './pipeline.mjs'
import { toTargetPath } from './io.mjs'

function printUsage() {
  console.log('Usage: node scripts/auto-translate/index.mjs run [--target=en,ja] [--source=content/cn] [--full=true] [--changed-only=true]')
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
  // 4) 解析 diff 基线并按 full/changed-only 计算待处理文件
  const diffBase = config.full ? '' : resolveDiffBase()
  let files, deletedFiles = []
  if (config.full) {
    files = listAllSourceFiles(config.sourceDir)
  } else if (config.changedOnly) {
    const result = getChangedFiles(config.sourceDir, diffBase)
    files = result.files
    deletedFiles = result.deletedFiles
  } else {
    files = listAllSourceFiles(config.sourceDir)
  }

  // 4.5) 删除源文件已删除的对应目标语言文件
  for (const srcPath of deletedFiles) {
    for (const lang of config.targetLangs) {
      const targetPath = toTargetPath(srcPath, config.sourceDir, lang)
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath)
        console.log(`Deleted: ${targetPath}`)
        // 若目录为空则一并清理
        const dir = path.dirname(targetPath)
        if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir)
      }
    }
  }

  console.log('files: ', files)
  // 5) 无待处理文件时直接结束
  if (files.length === 0) {
    console.log('No relevant files to process.')
    return
  }

  // 6) 初始化翻译器与统计器
  const translator = createTranslator(config)
  const summary = { files: files.length, fileSuccess: 0, fileFailed: 0, translatedBlocks: 0, changedOutputs: 0 }

  // 7) 并发处理文件（最多 5 个并行），分发类型、翻译并写入目标语言文档
  const limit = pLimit(5)
  await Promise.all(files.map(filePath => limit(async () => {
    try {
      console.log(`Processing: ${filePath}`)
      const outputResults = await processFile(filePath, config, translator, diffBase)
      summary.fileSuccess += 1
      for (const result of outputResults) {
        summary.translatedBlocks += result.translatedCount
        if (result.changed) summary.changedOutputs += 1
        console.log(`  [${result.lang}] ${result.changed ? 'updated' : 'unchanged'} ${result.targetPath}`)
      }
    } catch (error) {
      summary.fileFailed += 1
      console.error(`Failed: ${filePath}`)
      console.error(error)
    }
  })))

  // 8) 输出汇总；存在失败时设置非 0 退出码给 CI
  console.log(`Done. files=${summary.files}, success=${summary.fileSuccess}, failed=${summary.fileFailed}, translated=${summary.translatedBlocks}, outputs_updated=${summary.changedOutputs}`)
  if (summary.fileFailed > 0) process.exitCode = 1
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
