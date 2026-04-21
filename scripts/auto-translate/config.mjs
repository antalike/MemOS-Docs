import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 解析当前模块的绝对目录，后续用于读取同目录配置文件
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 将 CLI/环境中的布尔值字符串统一转为 boolean，无法识别时回退默认值
function toBoolean(value, defaultValue) {
  if (value === undefined) return defaultValue
  if (typeof value === 'boolean') return value
  const normalized = String(value).toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true
  if (['false', '0', 'no', 'n'].includes(normalized)) return false
  return defaultValue
}

// 解析形如 --key=value / --flag 的参数为 Map，便于后续按键读取
function parseArgMap(argv) {
  const argMap = new Map()
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue
    const body = raw.slice(2)
    const eqIndex = body.indexOf('=')
    if (eqIndex === -1) {
      argMap.set(body, true)
      continue
    }
    const key = body.slice(0, eqIndex)
    const value = body.slice(eqIndex + 1)
    argMap.set(key, value)
  }
  return argMap
}

// 加载目标语言列表：
// 1) 优先读取 scripts/auto-translate/languages.json（新位置）
// 2) 回退读取 scripts/languages.json（旧位置）
// 3) 都不可用时默认 ['en']
function loadLanguagesFile() {
  const localPath = path.join(__dirname, 'languages.json')
  const legacyPath = path.join(__dirname, '..', 'languages.json')
  const candidates = [localPath, legacyPath]
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(item => String(item).trim()).filter(Boolean)
    }
  }
  return ['en']
}

// 统一 sourceDir，去掉尾部斜杠并提供默认目录
function normalizeSourceDir(rawValue) {
  const value = (rawValue || 'content/cn').replace(/\/+$/, '')
  return value || 'content/cn'
}

// 读取并组装运行配置：
// - 命令（当前仅支持 run）
// - 路径/语言
// - 增量或全量策略
// - 翻译模型与重试参数
export function loadConfigFromCli(argv = process.argv.slice(2)) {
  const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'run'
  const args = command === 'run' ? argv.slice(1) : argv
  const argMap = parseArgMap(args)

  const sourceDir = normalizeSourceDir(argMap.get('source'))
  const full = toBoolean(argMap.get('full'), false)
  const changedOnly = full ? false : toBoolean(argMap.get('changed-only'), true)
  const targetsFromArg = argMap.get('target')
  const targetLangs = targetsFromArg
    ? String(targetsFromArg).split(',').map(v => v.trim()).filter(Boolean)
    : loadLanguagesFile()

  return {
    command,
    sourceDir,
    targetLangs,
    changedOnly,
    full,
    openaiApiKey: process.env.OPENAI_API_KEY || 'sk-3d99098b5fa240f1a55d528a993f34e8',
    openaiApiBase: process.env.OPENAI_API_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.OPENAI_MODEL || 'qwen-plus',
    retryAttempts: Number(process.env.TRANSLATE_RETRY_ATTEMPTS || 3),
    retryBaseDelayMs: Number(process.env.TRANSLATE_RETRY_BASE_DELAY_MS || 1000)
  }
}

// 对配置做最小可运行校验，尽早失败并给出明确错误
export function validateConfig(config) {
  if (config.command !== 'run') {
    throw new Error(`Unsupported command: ${config.command}`)
  }
  if (!config.sourceDir) {
    throw new Error('sourceDir is required')
  }
  if (!Array.isArray(config.targetLangs) || config.targetLangs.length === 0) {
    throw new Error('targetLangs is required')
  }
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }
}
