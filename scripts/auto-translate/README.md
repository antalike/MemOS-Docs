# 文档翻译工具链

MemOS 文档以中文(`fuma/content/cn`)为**源语言**,其它语言目录(`en`、`ja` …)是它的镜像翻译。本目录提供三件套:


| 脚本                     | 作用                         | npm script                              |
| ---------------------- | -------------------------- | --------------------------------------- |
| `auto-translate.mjs`   | 增量把中文源翻译到目标语言              | `translate` / `translate:all`           |
| `eval-translation.mjs` | LLM-as-judge 给**现有译文**打质量分 | `eval:translate` / `eval:translate:all` |
| `compare-models.mjs`   | 多个**翻译模型**横向对比 + 多评委交叉验证   | `compare:models`                        |


所有命令都在 `fuma/` 目录下运行(`cd fuma`)。

---

## 1. 环境配置

三个脚本都通过 OpenAI 兼容接口调用大模型,读取以下环境变量;若未在 shell 里导出,会自动从 `fuma/.env.local` 读取(缺失的变量才补,不覆盖已有值):

```bash
OPENAI_API_KEY=...                       # 必填
OPENAI_API_BASE=https://api-int.memtensor.cn/v1   # 兼容 OpenAI 的 /chat/completions 端点
OPENAI_MODEL=deepseek-v4-flash           # 默认翻译模型 / 默认评委(eval)
```

> `.env.local` 已被 `.gitignore` 忽略,不会入库。

查看端点上可用的模型:

```bash
curl -s "$OPENAI_API_BASE/models" -H "Authorization: Bearer $OPENAI_API_KEY"
```

---



## 2. 翻译:`auto-translate.mjs`

以中文源为准,增量翻译到 `languages.json` 里列出的目标语言。**未改动的内容会复用旧译文逐字保留**,只翻译新增/改动部分;源文件被删除/重命名时会同步清理目标文件。

```bash
# 增量:翻译相对上一个 commit(HEAD^)有变化的文件
npm run translate

# 对比工作区(含未提交/未跟踪的新文件)
node scripts/auto-translate/auto-translate.mjs --working

# 强制全量重翻
npm run translate:all

# 指定文件 / 指定目标语言
node scripts/auto-translate/auto-translate.mjs --target=en,ja fuma/content/cn/docs/xxx.mdx
```

支持 `.mdx`、`meta.json`、`.yml/.yaml`,会保留 frontmatter、代码块、JSX 组件、链接、品牌名(MemOS/MemCube…)等结构。目标语言在 `languages.json` 中配置。

---



## 3. 质量测评:`eval-translation.mjs`

对**已经存在的译文**做 LLM-as-judge 打分。自动扫描 `fuma/content/`*(排除 `cn`)发现有译文的语言,按文档抽样,用评委模型在 4 个维度打 1–5 分,并叠加一层免费的结构校验(frontmatter / 代码块数量等)。

维度:`accuracy` 准确性、`terminology` 术语一致性、`formatting` 格式保留、`fluency` 流畅度。

```bash
# 每种语言随机抽样 6 篇(默认)
npm run eval:translate

# 全量评测
npm run eval:translate:all

# 常用参数
node scripts/auto-translate/eval-translation.mjs \
  --target=en,ja \      # 指定语言(默认自动发现)
  --sample=10 \         # 每语言抽样数;0/未给则用默认 6
  --seed=memos \        # 抽样随机种子(可复现)
  --model=gpt-4.1 \     # 评委模型(默认 OPENAI_MODEL)
  --concurrency=4 \
  --files=...           # 或直接指定若干源/译文文件
```

输出(见 [报告](#5-报告输出)):`eval-reports/latest.md` / `latest.json` + 带时间戳存档。报告含总体分、按语言分维度表、以及**按文件(最差在前)**的问题清单。

---



## 4. 模型对比 & 交叉验证:`compare-models.mjs`

对**同一批抽样文档**,让多个候选翻译模型分别翻译(**只在内存翻译,不写入** `content/`),再由评委打分并排名。支持**多评委交叉验证**:每份译文只翻一次,由多个评委分别打分,从而纯粹隔离"评委"这一变量。

默认候选模型:`deepseek-v4-flash`、`qwen3-max`、`claude-sonnet-4-6`;默认评委:`gpt-4.1`。

```bash
# 单评委对比(默认 3 模型 × 抽 4 篇 → en,评委 gpt-4.1)
npm run compare:models

# 正式基线:抽 16 篇
node scripts/auto-translate/compare-models.mjs --sample=16 --concurrency=8

# 多评委交叉验证:同一份译文,3 个评委分别打分
node scripts/auto-translate/compare-models.mjs --sample=16 \
  --judges=gpt-4.1,gemini-2.5-flash,claude-opus-4-6
```

参数:


| 参数               | 说明            | 默认                                              |
| ---------------- | ------------- | ----------------------------------------------- |
| `--models=a,b,c` | 候选翻译模型        | deepseek-v4-flash, qwen3-max, claude-sonnet-4-6 |
| `--judge=x`      | 单评委           | gpt-4.1(或 `COMPARE_JUDGE`)                      |
| `--judges=a,b,c` | 多评委(触发交叉验证报告) | —                                               |
| `--target=en`    | 目标语言(单一)      | en                                              |
| `--sample=N`     | 抽样文档数         | 4                                               |
| `--seed=`        | 抽样种子          | memos                                           |
| `--max-tokens=`  | 翻译起始输出预算      | 16384                                           |
| `--concurrency=` | 并发            | 4                                               |
| `--files=`       | 指定源文件替代抽样     | —                                               |


- **单评委**输出 `eval-reports/compare-latest.md`:排名表 + 每篇胜出 + 逐模型逐篇评语与问题。
- **多评委**输出 `eval-reports/cross-latest.md`:共识排名表(model × judge)+ 各评委各自排名 + 是否一致 + 分差。

---



## 5. 报告输出

所有报告写入 `scripts/auto-translate/eval-reports/`(**已 gitignore**),每类都有 `*-latest.{md,json}` 和带时间戳的存档:


| 前缀               | 来源                                   |
| ---------------- | ------------------------------------ |
| `latest`         | `eval-translation.mjs`               |
| `compare-latest` | `compare-models.mjs`(单评委)            |
| `cross-latest`   | `compare-models.mjs`(`--judges` 多评委) |


`.json` 便于程序化分析,`.md` 便于人工阅读。

---



## 6. 评委选择注意事项(重要)

实测得到的经验,直接影响结论可信度:

1. **不要用与被评模型同家族的评委。** 例如用 `claude-opus` 评 `claude-sonnet`,会系统性打高分(实测自家 4.97 vs 他家 4.89)。评委应尽量对所有候选**中立**——本套候选下 `gpt-4.1` 是最中立的评委。
2. **不要用"思考型"模型当评委。** `gemini-2.5-pro` 会把输出预算耗在隐藏推理上、返回大段散文而非纯 JSON,导致约 85% 的评分失败;改用非思考版 `gemini-2.5-flash` 则稳定。
3. **单评委、小样本的排名不稳。** 优质模型之间的质量差常在 0.03 量级,小于评委/样本波动。**结论应以多评委共识为准**,并优先看中立评委的判断。
4. **注意模型的输出上限与网关路由。** 某些模型(如 gpt-4o)在 `max_tokens` 过大(如 65536)时会因"无可用渠道"路由失败;对比脚本默认用较保守的 16384 起步、截断时再自动翻倍。



### 一次交叉验证结论示例(en,16 篇,3 评委)


| 模型                | gpt-4.1 | gemini-2.5-flash | claude-opus-4-6 | 均分       |
| ----------------- | ------- | ---------------- | --------------- | -------- |
| qwen3-max         | 4.92    | 5.00             | 4.97            | **4.96** |
| claude-sonnet-4-6 | 4.91    | 4.98             | 4.97            | **4.95** |
| deepseek-v4-flash | 4.91    | 5.00             | 4.89            | **4.93** |


三者质量基本持平(分差 0.03),选型建议按**成本 / 延迟 / 可用性**决定即可。

---



## 7. 测试

纯函数(抽样、解析、聚合、报告渲染、git/结构校验等)均有单元测试,LLM 调用在测试中被 mock,不产生真实请求:

```bash
npm run test:translate            # 运行全部测试
npm run test:translate:coverage   # 带覆盖率
```

测试位于 `__tests__/`。修改脚本后请先跑测试,再按需做一次小样本真实验证(如 `--sample=1`)。