import fs from 'fs'
import yaml from 'js-yaml'
import { toTargetPath } from './io.mjs'
import { getGitContent } from './git.mjs'

// CORE_SCHEMA 不含 timestamp 类型，避免将 ISO 日期解析为 JS Date 对象
const YAML_LOAD_OPTIONS = { schema: yaml.CORE_SCHEMA }

function yamlToObject(raw) {
  if (!raw) return null
  const value = yaml.load(raw, YAML_LOAD_OPTIONS)
  if (!value || typeof value !== 'object') return null
  return value
}

// 只翻译包含汉字的字符串，保护文件路径、URL、icon 名等
function isTranslatable(str) {
  return typeof str === 'string' && /[\u4e00-\u9fff]/.test(str)
}

// 检验字符串是否符合目标语言特征，防止把错误语言的旧译文当作有效缓存复用
// 对有明确 Unicode 字符集的语言（如韩文、日文）做精确校验；其余语言仅排除汉字
function containsTargetLang(str, targetLang) {
  if (typeof str !== 'string') return false
  const lang = targetLang.toLowerCase()
  if (lang === 'ko' || lang.startsWith('ko-')) {
    // 朝鲜文音节块 AC00-D7A3，兼容字母 1100-11FF 及兼容字母 3130-318F
    return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(str)
  }
  if (lang === 'ja' || lang.startsWith('ja-')) {
    // 平假名 3040-309F，片假名 30A0-30FF
    return /[\u3040-\u30FF]/.test(str)
  }
  // 其他语言（如 en）：只要不含汉字即视为合法
  return !isTranslatable(str)
}

// 提取 key 中的 icon 名，如 "(ri:cpu-line) 标题" → "ri:cpu-line"
// 用于防止位置错位时将不同 icon 的条目错误映射
function extractIcon(str) {
  if (typeof str !== 'string') return null
  const m = str.match(/^\(([^)]+)\)/)
  return m ? m[1] : null
}

// 并行遍历两棵树，按结构对齐收集 CN字符串 → EN字符串 的映射
function buildStringReuseMap(cnNode, enNode, map = new Map()) {
  if (!cnNode || !enNode) return map
  if (Array.isArray(cnNode) && Array.isArray(enNode)) {
    const len = Math.min(cnNode.length, enNode.length)
    for (let i = 0; i < len; i++) buildStringReuseMap(cnNode[i], enNode[i], map)
    return map
  }
  if (typeof cnNode === 'object' && typeof enNode === 'object') {
    const cnKeys = Object.keys(cnNode)
    const enKeys = Object.keys(enNode)
    const len = Math.min(cnKeys.length, enKeys.length)
    for (let i = 0; i < len; i++) {
      const cnIcon = extractIcon(cnKeys[i])
      const enIcon = extractIcon(enKeys[i])
      // 两个 key 都含 icon 但 icon 不同 → 位置已错位，跳过该对及其子树，避免产生错误映射
      if (cnIcon && enIcon && cnIcon !== enIcon) continue
      if (isTranslatable(cnKeys[i]) && !map.has(cnKeys[i])) {
        map.set(cnKeys[i], enKeys[i])
      }
      buildStringReuseMap(cnNode[cnKeys[i]], enNode[enKeys[i]], map)
    }
    return map
  }
  if (isTranslatable(cnNode) && typeof enNode === 'string') {
    if (!map.has(cnNode)) {
      map.set(cnNode, enNode)
    }
  }
  return map
}

// 从原始 YAML 注释行中提取可翻译字符串（去掉 # 后当 YAML 解析）
function collectCommentStrings(rawYaml, result = new Set()) {
  for (const line of rawYaml.split('\n')) {
    const m = line.match(/^\s*#\s*(.+)$/)
    if (!m) continue
    try {
      const parsed = yaml.load(m[1], YAML_LOAD_OPTIONS)
      if (parsed !== null && parsed !== undefined) {
        collectStrings(parsed, result)
      }
    } catch {
      // 注释行无法解析为 YAML 时跳过
    }
  }
  return result
}

// 递归收集 YAML 树中所有需要翻译的唯一字符串（key 和 value）
function collectStrings(node, result = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, result)
  } else if (typeof node === 'object' && node !== null) {
    for (const key of Object.keys(node)) {
      if (isTranslatable(key)) result.add(key)
      collectStrings(node[key], result)
    }
  } else if (isTranslatable(node)) {
    result.add(node)
  }
  return result
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 剥掉 LLM 返回的外层 YAML 引号，还原为裸字符串
// 用于已带引号的 source 场景（如 '中文' / "中文"），避免重复套引号
function stripYamlQuoteWrapper(str) {
  if (str.length >= 2) {
    if (str.startsWith('\'') && str.endsWith('\'')) {
      return str.slice(1, -1).replace(/''/g, '\'')
    }
    if (str.startsWith('"') && str.endsWith('"')) {
      return str.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    }
  }
  return str
}

// 直接在原始 YAML 字符串上做替换
// dst 为 LLM 已带引号的输出（如 'Hello World' 或 "it's done"）
function applyTranslationsToRaw(rawYaml, translationMap) {
  let result = rawYaml
  for (const [src, dst] of translationMap) {
    const escaped = escapeRegex(src)

    // source 已是单引号包裹：剥掉 LLM 外层引号，再套回单引号格式
    const dstRaw = stripYamlQuoteWrapper(dst)
    const dstSingle = dstRaw.replace(/'/g, '\'\'')
    result = result.replace(new RegExp(`'${escaped}'`, 'g'), `'${dstSingle}'`)

    // source 已是双引号包裹：剥掉 LLM 外层引号，再套回双引号格式
    const dstDouble = dstRaw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    result = result.replace(new RegExp(`"${escaped}"`, 'g'), `"${dstDouble}"`)

    // plain scalar（key: value 或列表项或 key 本身）：直接用 LLM 已带引号的输出
    result = result.replace(
      new RegExp(`(:\\s+)${escaped}([ \\t]*(?:#[^\\n]*)?)$`, 'mg'),
      (_, pre, suf) => `${pre}${dst}${suf}`
    )
    result = result.replace(
      new RegExp(`(^[ \\t]*-[ \\t]+)${escaped}([ \\t]*(?:#[^\\n]*)?)$`, 'mg'),
      (_, pre, suf) => `${pre}${dst}${suf}`
    )
    result = result.replace(
      new RegExp(`^([ \\t]*)${escaped}([ \\t]*:)`, 'mg'),
      (_, indent, colon) => `${indent}${dst}${colon}`
    )
  }
  return result
}

// 去掉 YAML 值的引号以便做内容比较
function stripYamlQuotes(line) {
  return line
    .replace(/(:\s+)['"](.+?)['"]\s*$/, '$1$2')
    .replace(/(^\s*-\s+)['"](.+?)['"]\s*$/, '$1$2')
    .trimEnd()
}

// 将生成的输出与现有 EN 文件做行级合并：
//   - 内容相同（忽略引号差异）的行 → 保留现有 EN 的格式（引号等）
//   - 内容不同的行（新翻译 / 新增行）→ 使用生成的版本
function mergeWithExisting(generated, existingRaw) {
  if (!existingRaw) return generated
  const genLines = generated.split('\n')
  const exLines = existingRaw.split('\n')

  // 建立 "去引号内容 → 原始行" 的映射（从现有 EN 文件）
  // 只对含内容的行建映射（跳过纯结构行如空行、纯 key 行）
  const contentToExLine = new Map()
  for (const line of exLines) {
    const stripped = stripYamlQuotes(line)
    if (!contentToExLine.has(stripped)) {
      contentToExLine.set(stripped, line)
    }
  }

  return genLines.map((line) => {
    const stripped = stripYamlQuotes(line)
    return contentToExLine.get(stripped) ?? line
  }).join('\n')
}

export async function buildYamlTarget({ filePath, sourceDir, targetLang, diffBase, translator }) {
  const targetPath = toTargetPath(filePath, sourceDir, targetLang)
  const newSourceRaw = fs.readFileSync(filePath, 'utf-8')
  const newSource = yamlToObject(newSourceRaw)

  const oldCnRaw = diffBase ? getGitContent(diffBase, filePath) : null
  const existingTargetRaw = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : null

  // --- 复用映射：双重来源，防止 diffBase 太远导致 reuseMap 不全 ---

  // 来源 1：oldCN ↔ existingTarget（diffBase 版本，结构一定对齐，最可靠）
  const reuseMap = (oldCnRaw && existingTargetRaw)
    ? buildStringReuseMap(yamlToObject(oldCnRaw), yamlToObject(existingTargetRaw))
    : new Map()

  // 来源 2：newCN ↔ existingTarget（直接对齐当前 CN 与现有目标文件）
  // 当 diffBase 很远时，reuseMap 可能不全；directMap 作为补充
  // 注意：新增条目插入中间时可能错位，需要校验映射值符合目标语言
  const directMap = existingTargetRaw
    ? buildStringReuseMap(newSource, yamlToObject(existingTargetRaw))
    : new Map()

  // 收集所有中文字符串（含注释行）
  const allStrings = collectStrings(newSource)
  collectCommentStrings(newSourceRaw, allStrings)
  const translationMap = new Map()
  const toTranslate = []

  for (const str of allStrings) {
    // 优先用 reuseMap（oldCN↔existingTarget 对齐，最可靠）
    // 额外校验：复用值必须符合目标语言特征，防止旧文件中错误语言的译文被永久复用
    const fromReuse = reuseMap.get(str)
    if (fromReuse !== undefined && containsTargetLang(fromReuse, targetLang)) {
      translationMap.set(str, fromReuse)
      continue
    }
    // 其次用 directMap（newCN↔existingTarget 对齐，可能因新增条目错位）
    // 校验：映射值必须不含汉字，且符合目标语言特征
    const fromDirect = directMap.get(str)
    if (fromDirect !== undefined && containsTargetLang(fromDirect, targetLang)) {
      translationMap.set(str, fromDirect)
      continue
    }
    // 都没命中 → 真正需要翻译
    toTranslate.push(str)
  }

  if (toTranslate.length > 0) {
    const translated = await translator.translateStrings(toTranslate, targetLang, { yamlMode: true }, `${filePath} → ${targetLang}`)
    for (let i = 0; i < toTranslate.length; i++) {
      translationMap.set(toTranslate[i], translated[i])
    }
  }

  // 在中文源文件上做 raw replacement（处理新增内容）
  const generated = applyTranslationsToRaw(newSourceRaw, translationMap)

  // 与现有 EN 文件合并：内容相同的行保留现有格式（引号等）
  const content = mergeWithExisting(generated, existingTargetRaw)

  return { targetPath, content, translatedCount: toTranslate.length }
}
