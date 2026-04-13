# auto-translate

自动将 `content/cn/` 下的中文文档翻译为目标语言，支持 Markdown 与 YAML 文件，基于 Git diff 实现增量翻译。

## 目录结构

```
scripts/auto-translate/
├── index.mjs        # 入口：解析参数、调度文件处理、输出汇总
├── config.mjs       # CLI 参数 & 环境变量解析与校验
├── git.mjs          # Git 操作：diff 基线解析、变更文件检测、行号提取
├── pipeline.mjs     # 文件级调度：按类型路由到 Markdown / YAML 流水线
├── markdown.mjs     # Markdown 翻译流水线（块级 + 行级增量）
├── yaml.mjs         # YAML 翻译流水线（结构感知字符串替换）
├── translator.mjs   # LLM 调用封装（批量翻译、分块、重试）
├── io.mjs           # 路径映射、原子写文件
├── hash.mjs         # MD5 工具（用于块级缓存）
└── languages.json   # 目标语言列表
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | API Key（必填） | — |
| `OPENAI_API_BASE` | API Base URL | `https://api.deepseek.com` |
| `OPENAI_MODEL` | 模型名称 | `deepseek-chat` |
| `TRANSLATE_RETRY_ATTEMPTS` | 失败重试次数 | `3` |
| `TRANSLATE_RETRY_BASE_DELAY_MS` | 重试基础延迟（ms，指数退避） | `1000` |

### 运行

```bash
# 仅翻译相对上次提交变更的文件（默认）
npm run translate:docs

# 全量翻译所有文件
node scripts/auto-translate/index.mjs run --full=true

# 只处理 changed-only 模式（自动检测 Git diff）
node scripts/auto-translate/index.mjs run --changed-only=true

# 指定源目录和目标语言
node scripts/auto-translate/index.mjs run --source=content/cn --target=en,ja
```

### CLI 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--source=<dir>` | 中文源文件目录 | `content/cn` |
| `--target=<lang,...>` | 目标语言，逗号分隔 | 读取 `languages.json` |
| `--full=true` | 全量翻译，忽略 Git diff | `false` |
| `--changed-only=true` | 仅翻译变更文件 | `true` |

## 目标语言配置

编辑 `scripts/auto-translate/languages.json`：

```json
["en", "ja"]
```

当 `languages.json` 本身发生变更时，脚本会自动触发全量翻译。

## 翻译策略

### Markdown 文件

脚本将 Markdown 解析为块（paragraph、heading、list 等），并采用三种模式：

1. **新文件（无现有译文）**：整块批量发送给 LLM，一次完成翻译。
2. **增量更新（有现有译文）**：
   - 块哈希命中缓存 → 直接复用旧译文，不调用 LLM。
   - 行未变更 → 从行级映射复用，不调用 LLM。
   - 行仅非汉字部分变更（如版本号、数字）→ 结构性 patch，不调用 LLM。
   - 剩余真正需要翻译的行 → 去重后**单次批量** LLM 调用。
3. **并发控制**：文件间最多 5 个并发；块内按 80 行分块并发。

### YAML 文件

1. 递归收集所有含汉字的 key 和 value。
2. 优先从 `oldCN ↔ existingEN` 映射复用已有翻译。
3. 其余字符串批量调用 LLM（每批 50 条）。
4. 在原始 YAML 字符串上做正则替换，保留结构与注释。
5. 与现有译文行级合并，保留引号格式等细节。

### 不翻译的术语

以下术语在所有提示词中均被保护，不会被翻译：

`MemOS`、`MemCube`、`MOS`、`KV Cache`、`LoRA`、`LLM`、`API`、`SDK`、`NLI`

## 输出路径

源文件路径按语言映射到对应目录：

```
content/cn/foo/bar.md  →  content/en/foo/bar.md
content/cn/settings.yml  →  content/en/settings.yml
```

文件写入使用原子操作（先写临时文件，再重命名），避免写入中途的脏文件。

若源文件被删除，对应的译文文件也会同步删除；目录为空时一并清理。

## GitHub Actions 集成

工作流文件：[.github/workflows/auto-translate.yml](../../.github/workflows/auto-translate.yml)

**触发条件：**
- `content/cn/**/*.md` 或 `content/cn/settings.yml` 有推送
- `scripts/auto-translate/languages.json` 有推送
- 手动触发（支持 `full` 开关）

**执行流程：**
1. 运行翻译脚本
2. 若有文件变更，创建 `auto-translate/YYYYMMDD-HHMMSS` 分支并提交
3. 自动开 PR，打 `translation` 标签，等待人工 review

**所需 Secrets：**

| Secret | 说明 |
|--------|------|
| `OPENAI_API_KEY` | LLM API Key |
| `OPENAI_API_BASE` | API Base URL（可选） |
| `OPENAI_MODEL` | 模型名称（可选） |

## 退出码

| 退出码 | 含义 |
|--------|------|
| `0` | 全部成功 |
| `1` | 至少一个文件处理失败（CI 会标记为失败） |