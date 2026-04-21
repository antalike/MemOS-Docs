import fs from 'fs'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { getGitContent, getChangedLineNumbers } from './git.mjs'
import { md5 } from './hash.mjs'
import { toTargetPath } from './io.mjs'

const processor = unified()
  .use(remarkParse)
  .use(remarkStringify, { bullet: '*', fence: '`' })

function parseMarkdown(content) {
  if (!content) return { type: 'root', children: [] }
  return processor.parse(content)
}

function isMarkdownTable(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return false
  const separatorLine = lines[1].trim()
  return /^\|?[\s\-:]+\|[\s\-:|]+\|?$/.test(separatorLine)
}

function splitIntoBlocks(tree, rawContent) {
  const blocks = []
  const nodes = tree.children || []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const nextNode = nodes[i + 1]
    const tempRoot = { type: 'root', children: [node] }
    const normalizedText = processor.stringify(tempRoot).trim()
    let rawText = normalizedText
    let separator = '\n'
    if (rawContent && node.position) {
      rawText = rawContent.slice(node.position.start.offset, node.position.end.offset)
      if (nextNode?.position) {
        separator = rawContent.slice(node.position.end.offset, nextNode.position.start.offset)
      } else {
        separator = rawContent.slice(node.position.end.offset)
        if (!separator) separator = '\n'
      }
    }
    blocks.push({
      text: rawText,
      normalized: normalizedText,
      hash: md5(normalizedText),
      separator,
      startLine: node.position?.start.line ?? null, // 1-based
      endLine: node.position?.end.line ?? null,
      isCode: node.type === 'code',
      isTable: isMarkdownTable(rawText)
    })
  }
  return blocks
}

// 按位置对齐 oldCN 和 existingEN，构建两级复用映射：
//   blockMap: CN块hash → EN块全文（整块未变时直接复用）
//   lineMap:  CN行文本 → EN行文本（块内部分行未变时复用）
//
// lineMap 在文档级别（而非块级别）做对齐：
//   把所有 oldCN 块的行和所有 existingEN 块的行按顺序拍平后逐行对应。
//   这样即使 remark 对 CN/EN 两个文件产生不同的块边界（MDC、特殊语法等），
//   行级对应关系依然正确，不受块结构差异影响。
function buildReuseMaps(oldCNBlocks, existingTargetBlocks, targetLang) {
  const blockMap = new Map()
  const lineMap = new Map()

  // 块级映射：按位置对齐，同时校验块内容符合目标语言
  const blockLimit = Math.min(oldCNBlocks.length, existingTargetBlocks.length)
  for (let i = 0; i < blockLimit; i++) {
    const targetText = existingTargetBlocks[i].text
    if (!blockMap.has(oldCNBlocks[i].hash) && containsTargetLang(targetText, targetLang)) {
      blockMap.set(oldCNBlocks[i].hash, targetText)
    }
  }

  // 行级映射：文档级拍平后按行位置对齐
  // trimEnd 用于消除编辑器保存时可能引入的尾部空格差异
  const allOldCNLines = oldCNBlocks.flatMap(b => b.text.split('\n'))
  const allExistingTargetLines = existingTargetBlocks.flatMap(b => b.text.split('\n'))
  const lineLimit = Math.min(allOldCNLines.length, allExistingTargetLines.length)
  for (let i = 0; i < lineLimit; i++) {
    const cnLine = allOldCNLines[i].trimEnd()
    const targetLine = allExistingTargetLines[i]
    if (hasHan(cnLine) && !lineMap.has(cnLine) && containsTargetLang(targetLine, targetLang)) {
      lineMap.set(cnLine, targetLine)
    }
  }

  return { blockMap, lineMap }
}

function hasHan(text) {
  return /[\p{Script=Han}]/u.test(text)
}

// 检验字符串是否符合目标语言特征，防止把错误语言的旧译文当作有效缓存复用
function containsTargetLang(str, targetLang) {
  if (typeof str !== 'string') return false
  const lang = targetLang.toLowerCase()
  if (lang === 'ko' || lang.startsWith('ko-')) {
    return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
  }
  if (lang === 'ja' || lang.startsWith('ja-')) {
    return /[\u3040-\u30FF]/.test(str)
  }
  return !hasHan(str)
}

// 将字符串按汉字/非汉字边界分段，返回交替数组（偶数索引为非汉字段，奇数索引为汉字段）
// 例: "通过60%减少Token" → ["", "通过", "60%", "减少", "Token"]
function splitByHan(text) {
  return text.split(/([\p{Script=Han}]+)/u)
}

// 若 newCN 与 oldCN 仅在非汉字段有差异（汉字结构完全相同），
// 则将相同差异应用到 oldEN 并返回替换后的译文。
// 返回 null 表示无法结构性替换（汉字结构变了，或 EN 中找不到对应片段）。
//
// 核心策略：以待替换 token 左右两侧最近的"未变更非汉字段"作锚点，
// 把搜索范围收窄到两锚点之间，避免短 token（如纯数字）在 EN 中误匹配。
function tryStructuralPatch(oldCN, newCN, oldEN) {
  if (!oldCN || !newCN || !oldEN) return null
  const oldParts = splitByHan(oldCN)
  const newParts = splitByHan(newCN)
  // 分段数不同 → 汉字结构已变，无法 patch
  if (oldParts.length !== newParts.length) return null
  // 汉字段（奇数索引）必须完全相同
  for (let i = 1; i < oldParts.length; i += 2) {
    if (oldParts[i] !== newParts[i]) return null
  }

  let result = oldEN
  let anyReplaced = false

  for (let i = 0; i < oldParts.length; i += 2) {
    if (oldParts[i] === newParts[i]) continue

    const fromTrimmed = oldParts[i].trim()
    const toTrimmed = newParts[i].trim()
    // 仅空白变化，或 trim 后内容相同 → 无需操作
    if (!fromTrimmed || fromTrimmed === toTrimmed) continue

    // 找当前变更段左右最近的未变更非汉字锚点（trim 后非空）
    let prevAnchor = null
    for (let j = i - 2; j >= 0; j -= 2) {
      const t = oldParts[j].trim()
      if (t) { prevAnchor = t; break }
    }
    let nextAnchor = null
    for (let j = i + 2; j < oldParts.length; j += 2) {
      const t = oldParts[j].trim()
      if (t) { nextAnchor = t; break }
    }

    // 用锚点确定 EN 中的搜索窗口：[searchStart, searchEnd)
    // 锚点不存在时不限制该侧边界
    let searchStart = 0
    let searchEnd = result.length
    if (prevAnchor) {
      const idx = result.indexOf(prevAnchor)
      if (idx !== -1) searchStart = idx + prevAnchor.length
    }
    if (nextAnchor) {
      const idx = result.indexOf(nextAnchor, searchStart)
      if (idx !== -1) searchEnd = idx
    }

    // 在窗口内查找 fromTrimmed 并替换
    const idx = result.indexOf(fromTrimmed, searchStart)
    if (idx === -1 || idx > searchEnd) return null
    result = result.slice(0, idx) + toTrimmed + result.slice(idx + fromTrimmed.length)
    anyReplaced = true
  }

  return anyReplaced ? result : oldEN
}

// 根据 git diff 的变更行号，计算该块内哪些行（0-based）发生了变化
// 返回 null 表示无 diff 信息，所有含中文的行均视为需要翻译
function getBlockChangedLineIndexes(block, changedLineNumbers) {
  if (!changedLineNumbers || block.startLine === null) return null
  const result = new Set()
  const lineCount = block.text.split('\n').length
  for (let i = 0; i < lineCount; i++) {
    if (changedLineNumbers.has(block.startLine + i)) result.add(i)
  }
  return result
}

// 对单个块做行级预分类（纯同步，不调 LLM）：
//   resolved: 已确定译文（无中文 / lineMap 命中 / 结构性 patch）
//   pending:  需要 LLM 翻译的行，{ i, lineText }
function preResolveBlock(block, oldCNBlock, changedLineIndexes, lineMap) {
  const lines = block.text.split('\n')
  const oldCNLines = oldCNBlock ? oldCNBlock.text.split('\n') : []
  const resolvedLines = new Array(lines.length).fill(null)
  const pending = [] // { i, lineText }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (!hasHan(line)) {
      resolvedLines[i] = line
      continue
    }

    const lineDefinitelyChanged = changedLineIndexes !== null && changedLineIndexes.has(i)
    if (!lineDefinitelyChanged) {
      // 未明确变更：查 lineMap，命中则复用
      const reused = lineMap.get(line.trimEnd())
      if (reused !== undefined) { resolvedLines[i] = reused; continue }
    } else {
      // 变更行：汉字结构不变则结构性 patch，跳过 LLM
      const oldCNLine = oldCNLines[i]?.trimEnd()
      const oldENLine = oldCNLine !== undefined ? lineMap.get(oldCNLine) : undefined
      if (oldENLine !== undefined) {
        const patched = tryStructuralPatch(oldCNLine, line.trimEnd(), oldENLine)
        if (patched !== null) { resolvedLines[i] = patched; continue }
      }
    }

    pending.push({ i, lineText: line })
  }

  return { resolvedLines, pending }
}

export async function buildMarkdownTarget({ filePath, sourceDir, targetLang, diffBase, translator }) {
  const targetPath = toTargetPath(filePath, sourceDir, targetLang)
  const newSourceRaw = fs.readFileSync(filePath, 'utf-8')
  const newBlocks = splitIntoBlocks(parseMarkdown(newSourceRaw), newSourceRaw)

  // 从 git 历史取旧 CN，从磁盘取现有 EN，构建复用映射
  const oldSourceRaw = diffBase ? getGitContent(diffBase, filePath) : null
  const existingTargetRaw = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : null
  const oldCNBlocks = splitIntoBlocks(parseMarkdown(oldSourceRaw), oldSourceRaw)
  const existingTargetBlocks = splitIntoBlocks(parseMarkdown(existingTargetRaw), existingTargetRaw)
  const { blockMap, lineMap } = buildReuseMaps(oldCNBlocks, existingTargetBlocks, targetLang)
  const changedLineNumbers = diffBase ? getChangedLineNumbers(diffBase, filePath) : null

  // 新文件快速路径：目标文件不存在时，跳过行级拆分流程
  // 普通块整块翻译（translateBlocksBatch），代码块或表格仅提取中文行翻译后原位替换
  // 中文占比过低的普通块（如夹在代码块间的 JSON 模板）也走行提取，避免发送大量英文冗余内容
  if (!existingTargetRaw) {
    // 中文字符占总字符数的比例（按字符数，非字节数）
    const hanRatio = (text) => {
      const hanCount = (text.match(/[\p{Script=Han}]/gu) ?? []).length
      return text.length > 0 ? hanCount / text.length : 0
    }
    // 低于此比例的普通块改走行提取，而非整块发送（节省英文内容的 token 消耗）
    const HAN_RATIO_THRESHOLD = 0.15

    const narrativeBlocks = newBlocks.filter(b => hasHan(b.text) && !b.isCode && !b.isTable && hanRatio(b.text) >= HAN_RATIO_THRESHOLD)
    const lineExtractBlocks = newBlocks.filter(b => hasHan(b.text) && (b.isCode || b.isTable || hanRatio(b.text) < HAN_RATIO_THRESHOLD))

    // 同步收集所有需要行级提取的块的唯一中文行
    const codeLineDict = new Map() // lineText → translation
    for (const block of lineExtractBlocks) {
      for (const line of block.text.split('\n')) {
        if (hasHan(line) && !codeLineDict.has(line)) codeLineDict.set(line, null)
      }
    }
    const uniqueCodeLines = [...codeLineDict.keys()]

    // 普通块整块翻译 与 行级提取翻译 并发执行
    const [regularTranslated, codeLineTranslated] = await Promise.all([
      narrativeBlocks.length > 0
        ? translator.translateBlocksBatch(narrativeBlocks.map(b => b.text), targetLang, `${filePath} → ${targetLang}`)
        : Promise.resolve([]),
      uniqueCodeLines.length > 0
        ? translator.translateLinesBatch(uniqueCodeLines, targetLang, `${filePath} code → ${targetLang}`)
        : Promise.resolve([])
    ])

    const blockTransMap = new Map(narrativeBlocks.map((b, i) => [b.text, regularTranslated[i]]))
    uniqueCodeLines.forEach((line, i) => codeLineDict.set(line, codeLineTranslated[i]))

    // 将翻译后的中文行替换回各块原文
    const codeBlockTransMap = new Map()
    for (const block of lineExtractBlocks) {
      const translatedText = block.text.split('\n')
        .map(line => hasHan(line) ? (codeLineDict.get(line) ?? line) : line)
        .join('\n')
      codeBlockTransMap.set(block.text, translatedText)
    }

    let content = ''
    let translatedCount = 0
    for (const block of newBlocks) {
      if (blockTransMap.has(block.text)) {
        content += blockTransMap.get(block.text)
        translatedCount++
      } else if (codeBlockTransMap.has(block.text)) {
        content += codeBlockTransMap.get(block.text)
        translatedCount++
      } else {
        content += block.text
      }
      content += block.separator || '\n'
    }
    return { targetPath, content, translatedCount }
  }

  // 阶段一：对每个块做同步预分类，不调 LLM
  // blockPreResolutions[i] = null 表示整块命中缓存，否则为 { resolvedLines, pending }
  const blockPreResolutions = newBlocks.map((block, i) => {
    if (blockMap.has(block.hash)) return null
    const changedLineIndexes = getBlockChangedLineIndexes(block, changedLineNumbers)
    const oldCNBlock = i < oldCNBlocks.length ? oldCNBlocks[i] : null
    return preResolveBlock(block, oldCNBlock, changedLineIndexes, lineMap)
  })

  // 阶段二：收集文件内所有需要 LLM 翻译的唯一行
  const translationDict = new Map() // lineText → translation（初始为 null）
  for (const res of blockPreResolutions) {
    if (!res) continue
    for (const { lineText } of res.pending) {
      if (!translationDict.has(lineText)) translationDict.set(lineText, null)
    }
  }

  // 阶段三：对去重后的唯一行做一次批量 LLM 调用
  if (translationDict.size > 0) {
    const uniqueLines = [...translationDict.keys()]
    const translated = await translator.translateLinesBatch(uniqueLines, targetLang, `${filePath} → ${targetLang}`)
    uniqueLines.forEach((line, i) => translationDict.set(line, translated[i]))
  }

  // 阶段四：用翻译字典填回各块，拼接最终内容
  let translatedCount = 0
  const finalBlocks = newBlocks.map((block, i) => {
    const res = blockPreResolutions[i]
    if (!res) return blockMap.get(block.hash) // 整块缓存命中

    translatedCount++
    const lines = block.text.split('\n')
    const pendingMap = new Map(res.pending.map(p => [p.i, p.lineText]))
    return res.resolvedLines.map((resolved, j) => {
      if (resolved !== null) return resolved
      const lineText = pendingMap.get(j)
      return lineText !== undefined ? (translationDict.get(lineText) ?? lines[j]) : lines[j]
    }).join('\n')
  })

  let content = ''
  for (let i = 0; i < finalBlocks.length; i++) {
    content += finalBlocks[i]
    content += newBlocks[i].separator || '\n'
  }

  return { targetPath, content, translatedCount }
}
