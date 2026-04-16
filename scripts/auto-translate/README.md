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

当 `languages.json` 发生变更时，脚本按语言差异处理：
- 新增语言：对 `sourceDir` 下文件做全量补齐翻译。
- 删除语言：删除对应语言目录下的已生成译文文件。
- 保留语言：仅处理本次 Git diff 命中的变更文件。

---

## 整体运行流程

```
CLI 参数解析
    ↓
Git diff 基线解析（resolveDiffBase）
    ↓
判断运行模式
  ├─ full=true
  │    └─ 全量：git ls-files 所有源文件 × 所有目标语言
  │
  ├─ languages.json 有变更
  │    ├─ 比较新旧语言列表（getLanguageChanges）
  │    ├─ 已删除语言 → 删除 content/<lang>/ 整个目录
  │    ├─ 新增语言   → git ls-files 全量 × 仅新增语言
  │    └─ 保留语言   → git diff 增量（含删除文件清理）× 仅保留语言
  │
  └─ 常规增量
       └─ git diff 增量（含删除文件清理）× 所有目标语言
    ↓
并发处理文件（最多 5 个）
    ↓
  ├─ .md / .mdx  → Markdown 翻译流水线
  └─ .yml / .yaml → YAML 翻译流水线
    ↓
原子写入目标文件
    ↓
汇总输出（成功/失败/翻译块数）
```

---

## Git 比对流程

### 基线解析（`resolveDiffBase`）

脚本按优先级依次尝试以下策略确定 diff 基线提交：

1. **`GITHUB_EVENT_BEFORE`**：Push 事件的前一个 commit SHA，CI 中最精确的基线。若为全零（首次推送）则跳过。
2. **`GITHUB_BASE_REF` + merge-base**：PR 场景下，通过 `git merge-base origin/<base> HEAD` 找到分叉点，避免将目标分支的历史提交纳入 diff。
3. **上游跟踪分支 + merge-base**：读取 `@{u}`，同样取 merge-base，适用于本地开发。
4. **`HEAD^`**：回退到上一个提交，作为通用兜底。
5. **`HEAD`**（空树哈希）：仓库只有一个提交时，与空树比对，视所有文件为新增。

### 变更文件检测（`getChangedFiles`）

```
git diff --name-status --find-renames <diffBase> HEAD -- <sourceDir>
```

- **`R`（重命名）/ `C`（复制）**：取新路径加入待处理列表。
- **`D`（删除）**：加入 `deletedFiles`，翻译开始前先删除对应目标语言文件；若目录为空则一并清理。
- **其他（`A` 新增 / `M` 修改）**：加入待处理列表。

只处理以 `.md`、`.yml`、`.yaml` 结尾且位于 `sourceDir` 下的文件。

### 语言列表变更检测（`didLanguagesFileChange` / `getLanguageChanges`）

`didLanguagesFileChange` 通过 `git diff --name-only` 判断本次提交是否修改了 `languages.json`。

`getLanguageChanges` 在检测到变更后，用 `git show <diffBase>:scripts/auto-translate/languages.json` 读取旧版本，与磁盘当前版本对比，返回：

```js
{ addedLangs: [...], removedLangs: [...] }
```

`index.mjs` 根据结果分三路处理（见上方流程图），而非笼统触发全量翻译。

### 变更行号提取（`getChangedLineNumbers`）

```
git diff --unified=0 <diffBase> HEAD -- <filePath>
```

解析 `@@ -oldStart[,oldCount] +newStart[,newCount] @@` 头部，将新文件中被修改/新增的行号（1-based）收集为 `Set<number>`，供行级增量判断使用。返回 `null` 表示无 diff 信息（视为全部行需处理），返回空 Set 表示该文件本次无行变更。

---

## Markdown 翻译流水线

### 复用映射构建

在翻译之前，脚本先读取两份历史数据构建复用缓存，以最大化跳过 LLM 调用：

- **`oldCNBlocks`**：从 Git 历史（`diffBase` 版本）读取旧版 CN 文件，解析为块列表。
- **`existingENBlocks`**：从磁盘读取当前已存在的 EN 译文，解析为块列表。

两者按位置对齐，生成两级映射：

| 映射 | key | value | 用途 |
|------|-----|-------|------|
| `blockMap` | 旧 CN 块的 MD5 哈希 | 对应 EN 块全文 | 整块未变时直接复用 |
| `lineMap` | 旧 CN 行文本（trimEnd） | 对应 EN 行文本 | 块内部分行未变时复用 |

`lineMap` 在**文档级别**做行对齐（先把所有块的行拍平再按行号对齐），而非块级别，避免 MDC 或特殊语法导致 CN/EN 块边界不一致时行映射错误。

### 新文件快速路径

目标文件不存在时，跳过行级拆分流程，将所有含汉字的块整块发给 LLM 做批量翻译，一次完成。

### 增量翻译四阶段

目标文件已存在时，走完整增量流程：

```
阶段一：同步预分类（不调 LLM）
  ├─ 块哈希命中 blockMap → 整块标记为缓存命中，跳过
  └─ 未命中 → 对块内每行分类：
       ├─ 不含汉字 → resolved（直接保留）
       ├─ 行未在 changedLineNumbers 中 → 查 lineMap：
       │    ├─ 命中 → resolved（复用旧译文）
       │    └─ 未命中 → pending（需翻译）
       └─ 行在 changedLineNumbers 中（确认变更）→ 尝试结构性 patch：
            ├─ patch 成功 → resolved（无需 LLM）
            └─ patch 失败 → pending（需翻译）

阶段二：去重收集
  所有 pending 行文本去重 → translationDict（lineText → null）

阶段三：单次批量 LLM 调用
  uniqueLines → translator.translateLinesBatch → 填回 translationDict

阶段四：填回并拼接
  按块顺序合并 resolved + translationDict 结果 → 最终文件内容
```

### 结构性 Patch（`tryStructuralPatch`）

当一行中文的**汉字结构未变、仅非汉字部分（如版本号、数字、URL）变化**时，无需调 LLM：

1. 将 `oldCN` 和 `newCN` 按汉字/非汉字边界拆分为交替数组。
2. 若所有汉字段完全相同，则逐一替换变更的非汉字段。
3. 替换时以左右最近的**未变更非汉字段**作为锚点，将搜索范围收窄到锚点之间的 EN 文本区间，防止短 token（如纯数字）在 EN 中误匹配。
4. 成功替换则返回 patch 后的 EN 行；汉字结构变化或 EN 中找不到对应片段则返回 `null`，降级为 LLM 翻译。

### 并发控制

- 文件间：最多 5 个文件并发（`p-limit(5)`）。
- 块内：按 80 行分块后并发调用 LLM。

---

## YAML 翻译流水线

### 可翻译字符串收集

递归遍历 YAML 树，收集所有包含汉字的**键（key）和值（value）**；同时扫描原始 YAML 的**注释行**（`# ...`），提取其中可解析的中文字符串，一并纳入翻译集合。

文件路径、URL、图标名等不含汉字的字符串不会被提取，保持原样。

### 双重复用映射

YAML 流水线同样优先复用已有翻译，避免重复 LLM 调用：

```
reuseMap  = buildStringReuseMap(oldCN_tree, existingEN_tree)
  │ 来源：diffBase 版本的 CN 与磁盘上的 EN，结构完全对齐，最可靠
  │ 并行遍历两棵树，按结构位置对齐映射每个 CN字符串 → EN字符串
  │ 含 icon 防错位：key 含 (ri:icon-name) 时校验图标名相同才映射

directMap = buildStringReuseMap(newCN_tree, existingEN_tree)
  │ 来源：当前 CN 与磁盘 EN 直接对齐
  │ 当 diffBase 版本较远、reuseMap 覆盖不全时作为补充
  └─ 安全校验：映射值不含汉字才使用（防止新增条目插入中间导致错位）
```

**优先级**：`reuseMap` > `directMap` > LLM 翻译。

### LLM 批量翻译

未命中复用映射的字符串批量调用 LLM，每批最多 50 条，`yamlMode: true` 时提示词要求 LLM 输出带引号的 YAML 值格式。

### 原始字符串替换（`applyTranslationsToRaw`）

不重新序列化 YAML，而是在原始 YAML 字符串上做正则替换，以保留缩进、注释、字段顺序等原有格式：

- **单引号值** `'中文'`：剥掉 LLM 外层引号后套回单引号格式（内部 `'` 转义为 `''`）。
- **双引号值** `"中文"`：套回双引号格式（转义反斜杠和双引号）。
- **裸标量值** `key: 中文`：直接替换（LLM 输出带引号时保留引号）。
- **列表项** `- 中文`：同裸标量。
- **键名** `中文:`：同裸标量。

### 行级合并（`mergeWithExisting`）

替换完成后，将生成结果与现有 EN 文件做行级合并：

- 对生成内容的每一行，去掉 YAML 引号后与现有 EN 行做内容比对。
- **内容相同** → 保留现有 EN 行的原始格式（单引号/双引号/裸值等细节不变）。
- **内容不同**（新翻译或新增行）→ 使用生成版本。

这样可以避免仅因引号格式不同就产生 git diff 噪声。

---

## 不翻译的术语

以下术语在所有提示词中均被保护，不会被翻译：

`MemOS`、`MemCube`、`MOS`、`KV Cache`、`LoRA`、`LLM`、`API`、`SDK`、`NLI`

---

## 输出路径

源文件路径按语言映射到对应目录：

```
content/cn/foo/bar.md  →  content/en/foo/bar.md
content/cn/settings.yml  →  content/en/settings.yml
```

文件写入使用原子操作（先写临时文件，再重命名），避免写入中途的脏文件。

若源文件被删除，对应的译文文件也会同步删除；目录为空时一并清理。

---

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

---

## 退出码

| 退出码 | 含义 |
|--------|------|
| `0` | 全部成功 |
| `1` | 至少一个文件处理失败（CI 会标记为失败） |
