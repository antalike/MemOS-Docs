---
title: 使用 MemOS 构建智能小说分析系统
---

### 🆚 为什么选择MemOS？传统方法 vs MemOS对比

在开始编码之前，让我们看看MemOS到底解决了什么问题：

![Cookbook-Chapter3-Chart](https://statics.memtensor.com.cn/memos/cookbook-chapter3-chart.png)

**实际效果对比举例：**

**用户问："萧峰和段誉的关系如何发展？"**

| 传统方法                    | MemOS方法               |
| --------------------------- | ----------------------- |
| 🐌 重新搜索全文中的相关片段 | ⚡ 直接从关系层检索     |
| 😵 可能遗漏关键情节         | 🎯 完整的关系发展时间线 |
| 📄 只能基于部分文本回答     | 🧠 基于完整人物画像分析 |

### 💡 为什么使用MemOS内置组件？

想象你要做一道菜，你可以选择：

- 🔧 **自己制作所有调料** - 费时费力，质量难保证
- 🏪 **使用专业调料品牌** - 省时高效，品质稳定

MemOS就像是专业的"调料品牌"，它已经为我们准备好了：

- 🤖 **智能对话客户端** - 自动处理网络问题、支持多种AI模型
- 🧠 **向量化服务** - 专门优化的中文文本理解能力
- ⚙️ **配置管理** - 简单易用的参数设置

**学习收获：**
通过本章，你将学会如何像专业开发者一样，优先使用成熟的组件库，而不是从零开始编写复杂的底层代码。

---

### 章节引言

本章将带你构建一个基于《天龙八部》小说的智能记忆分析系统，实现从原始文本到结构化记忆的完整转换流程。

**核心技术架构**：

![Cookbook-Chapter3-Core](https://statics.memtensor.com.cn/memos/cookbook-chapter3-core.png)

**数据处理流水线**：

1. **文本预处理** → 章节切分 → **结构化输入**
2. **AI驱动抽取** → 人物建模 → **MemCube生成**
3. **格式转换** → 图结构构建 → **MemOS记忆库**

**系统设计理念**：

- 本章提供了从非结构化文本到智能记忆系统的完整解决方案
- 每个配方都解决数据流水线中的关键技术问题
- 支持大规模文本的并行处理和增量更新
- 构建可查询、可推理的智能记忆网络

---

### 环境配置

```python
import requests
import json
import os
import pickle
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
```

## 配方3.0：文本预处理与API环境配置

### 🎯 目標

建立小说文本的结构化处理基础，包括章节分割和AI服务连接。

### 📖 章节分割算法

通过正则表达式识别章节标题，将长篇小说切分为可处理的片段：

```python
def extract_all_chapters(text: str, output_dir: str = "chapters"):
    # 匹配所有"第X章"标题的位置
    pattern = r"(第[一二三四五六七八九十百千零〇两\d]+章)"
    matches = list(re.finditer(pattern, text))

    if not matches:
        raise ValueError("未找到任何章节标题")

    os.makedirs(output_dir, exist_ok=True)

    for i in range(len(matches)):
        start_idx = matches[i].start()
        end_idx = matches[i+1].start() if i+1 < len(matches) else len(text)
        chapter_title = matches[i].group()
        chapter_number = i + 1  # 用自然数编号
  
        chapter_text = text[start_idx:end_idx].strip()
        filename = os.path.join(output_dir, f"chapter{chapter_number}.txt")
        with open(filename, "w", encoding="utf-8") as f:
            f.write(chapter_text)
        print(f"✅ 已保存：{filename}（{chapter_title}）")

# 读取整本小说
with open("天龙八部.txt", "r", encoding="utf-8") as f:
    full_text = f.read()

# 提取并保存所有章节
extract_all_chapters(full_text)
```

### 🔧 API客户端配置

建立稳定的AI服务连接，支持不同任务类型的模型调用：

```python
# JSON修复功能配置
try:
    from json_repair import repair_json
    HAS_JSONREPAIR = True
    print("✓ jsonrepair库已加载，JSON修复功能已启用")
except ImportError:
    HAS_JSONREPAIR = False
    print("⚠ jsonrepair库未安装，将使用基础修复策略")
    def repair_json(text):
        return text

class TaskType(Enum):
    EVENT_EXTRACTION = "event_extraction"

class MemOSLLMClient:
    """对话客户端 - 使用MemOS让AI调用变得简单可靠"""
  
    def __init__(self, api_key: str, api_base: str = "https://api.openai.com/v1", model: str = "gpt-4o"):
        # 🔧 第一步：导入MemOS的智能组件
        from memos.llms.factory import LLMFactory
        from memos.configs.llm import LLMConfigFactory
  
        # 🎯 第二步：告诉MemOS我们要用什么AI模型
        llm_config_factory = LLMConfigFactory(
            backend="openai",  # 使用OpenAI（也支持其他厂商）
            config={
                "model_name_or_path": model,  # 你选择的AI模型
                "api_key": api_key,          # 你的API密钥
                "api_base": api_base,        # API服务地址
                "temperature": 0.8,          # 创造性程度
                "max_tokens": 8192,          # 最大回复长度
                "top_p": 0.9,               # 回复质量控制
            }
        )
  
        # 🚀 第三步：让MemOS帮我们创建一个对话客户端
        # MemOS会自动处理网络重试、连接池等复杂问题
        self.llm = LLMFactory.from_config(llm_config_factory)
        print(f"✅ 对话客户端已就绪！使用模型: {model}")
  
    def call_api(self, messages: List[Dict], task_type: TaskType, timeout: int = 1800) -> Dict:
        """和AI对话的方法 - 就这么简单！"""
        try:
            response = self.llm.generate(messages)
            return {
                "status": "success",      # 成功了！
                "content": response,      # AI的回答
                "model_used": self.llm.config.model_name_or_path  # 用的哪个模型
            }
        except Exception as e:
            # 😅 如果出错了，MemOS会告诉我们具体什么问题
            return {
                "status": "error", 
                "error": str(e),
                "model_used": self.llm.config.model_name_or_path
            }
```

### 🚀 批量处理初始化

建立章节遍历机制，为后续并行处理做准备：

```python
# 🎯 配置你的AI助手（使用MemOS让一切变简单）
API_KEY = "YOUR_API_KEY"  # 🔑 填入你的OpenAI API密钥
API_BASE = "https://api.openai.com/v1"  # 🌐 API服务地址（通常不用改）
MODEL_NAME = "gpt-4o"  # 🤖 选择你喜欢的AI模型

# 🚀 创建你的专属AI助手
api_client = MemOSLLMClient(
    api_key=API_KEY,
    api_base=API_BASE,
    model=MODEL_NAME
)
# 现在你就有了一个聪明、稳定、易用的AI助手！

memcubes = {}  # 全局人物记忆库
alias_to_name = {}  # 别名到标准名映射
chapter_folder = "chapters"

# 按章节顺序处理
chapter_files = sorted(
    [os.path.join(chapter_folder, f) for f in os.listdir(chapter_folder) 
     if f.startswith("chapter") and f.endswith(".txt")],
    key=lambda x: int(re.search(r'chapter(\d+)', x).group(1))
)

for chapter_file in chapter_files:
    chapter_id = chapter_file.replace(".txt", "")
    print(f"\n📖 正在处理：{chapter_id}")
  
    with open(chapter_file, "r", encoding="utf-8") as f:
        content = f.read()
    # 后续处理逻辑...
```

---

## 配方3.1：AI驱动的人物识别与别名统一

### 🎯 目標

使用AI自动识别小说中的人物，建立别名映射关系，初始化人物记忆容器。

### 🧠 智能人物识别

通过精心设计的prompt实现准确的人物抽取和别名归并：

```python
@staticmethod
def extract_character_names_prompt(paragraph: str, alias_to_name: dict = None):
    system_msg = (
        "你是一个小说人物识别专家，请从以下小说片段中提取所有明确提及的人物。\n"
        "对于每个人物，请标注该人物的标准姓名（如"乔峰"）以及其在该片段中出现的所有称呼、别名、代称（如"丐帮帮主"、"乔帮主"、"那大汉"）。\n\n"
        "请以如下格式返回 JSON：\n"
        "[\n"
        "  {\n"
        "    \"name\": \"乔峰\",\n"
        "    \"aliases\": [\"丐帮帮主\", \"乔帮主\", \"那大汉\"]\n"
        "  }\n"
        "]\n\n"
        "⚠️ 注意：\n"
        "1. 只包含人物，不包括地点或组织。\n"
        "2. 同一人物的多个称呼应统一归并在同一个条目中。\n"
        "3. 所有字段使用标准 JSON 格式。不要包含 markdown 符号或注释。\n"
        "4. 如果无法确定某个称呼是否为新人物，可以暂时保留为独立项。"
    )

    if alias_to_name:
        system_msg += "\n\n以下是已知别名对应的标准人物姓名，请尽量将新识别到的称呼归入已有人物中：\n"
        alias_map_str = json.dumps(alias_to_name, ensure_ascii=False, indent=2)
        system_msg += alias_map_str

    return [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": f"小说片段如下：\n{paragraph}"}
    ]
```

### 💾 MemCube初始化与别名管理

为每个识别出的人物创建结构化记忆容器：

```python
def init_memcube(character_name: str, chunk_id: str):
    """初始化人物记忆立方体 - 包含所有核心字段"""
    return {
        "name": character_name,
        "first_appearance": chunk_id,
        "aliases": [character_name],
        "events": [],
        "utterances": [],
        "speech_style": "",
        "personality_traits": [],
        "emotion_state": "",
        "relations": []
    }

# 执行人物识别和初始化
name_prompt = Prompt.extract_character_names_prompt(content, alias_to_name)
name_result = api_client.call_api(name_prompt, TaskType.EVENT_EXTRACTION, timeout=1800)

try:
    extracted = json.loads(name_result.get("content", "").strip("```json").strip("```").strip())
except:
    extracted = []

# 更新人物库和别名映射
for item in extracted:
    std_name = item["name"]
    aliases = item.get("aliases", [])
  
    # 初始化或更新 MemCube
    if std_name not in memcubes:
        print(f"🆕 新人物识别：{std_name}")
        memcubes[std_name] = init_memcube(std_name, chapter_id)
        memcubes[std_name]["aliases"] = []

    # 合并别名列表
    all_aliases = list(set(memcubes[std_name].get("aliases", []) + aliases))
    memcubes[std_name]["aliases"] = all_aliases

    # 构建全局别名映射
    for alias in [std_name] + aliases:
        alias_to_name[alias] = std_name
```

---

## 配方3.2：结构化记忆内容抽取

### 🎯 目標

使用AI从小说文本中抽取结构化的人物信息，包括事件、语录、性格、情绪和关系网络。

### 🎭 多维度信息抽取Prompt

设计精确的prompt模板，确保AI返回标准化的JSON数据：

```python
@staticmethod
def update_character_prompt(character_name: str, unfinished_events: list, paragraph: str):
    return [
        {
            "role": "system",
            "content": (
                "你是小说人物建模专家，将分析某人物的未完成事件与最新小说片段。\n"
                "你的任务是更新以下字段：\n"
                "- events：事件列表（更新状态、添加新事件，包含子字段 event_id、action、motivation、impact、involved_entities、time、location、event、if_completed）\n"
                "- 每个事件必须包含唯一的 \"event_id\"，例如 \"event_001\"、\"event_002\" 等。\n"
                "- utterances：说过的话（含时间或事件编号）\n"
                "- speech_style：说话风格（如 古典、直接、讽刺等）\n"
                "- personality_traits：性格（如 冷静、冲动）\n"
                "- emotion_state：当前情绪状态\n"
                "- relations：与他人的关系列表\n\n"
                "请特别注意以下要求：\n"
                "1. 请认真判断现有未完成事件是否已经在新片段中结束。\n"
                "2. 如果某事件已有结局或结果，请务必将其 `if_completed` 字段标记为 true。\n"
                "3. 如果小说片段中出现与该人物相关的新事件，请添加新的事件条目。\n"
                "最终请输出以下 JSON 结构：\n"
                "{\n"
                "  \"events\": [...],\n"
                "  \"utterances\": [...],\n"
                "  \"speech_style\": \"...\",\n"
                "  \"personality_traits\": [...],\n"
                "  \"emotion_state\": \"...\",\n"
                "  \"relations\": [...]\n"
                "}\n\n"
                "⚠️ 请注意：\n"
                "1. 所有字段名必须使用双引号包裹（JSON 标准格式）。\n"
                "2. 不要添加注释符号、额外说明或 markdown 符号。\n"
                "3. 仅返回完整 JSON 对象，不能是数组或其他格式。\n"
                "4. 如没有内容可填，请使用空数组 [] 或空字符串 \"\"。\n"
            )
        },
        {
            "role": "user",
            "content": (
                f"人物姓名：{character_name}\n"
                f"当前未完结事件如下（JSON）：\n{json.dumps(unfinished_events, ensure_ascii=False, indent=2)}\n\n"
                f"小说片段如下：\n{paragraph}\n\n"
                "请按上述格式返回该人物的更新信息。"
            )
        }
    ]
```

### 🔄 智能数据合并算法

实现事件状态追踪和增量更新机制：

```python
def get_unfinished_events(memcube: dict):
    """获取未完成的事件列表 - 用于上下文连续性"""
    return [event for event in memcube.get("events", []) if not event.get("if_completed", False)]

def merge_events(old_events: list, new_events: list):
    """智能事件合并 - 处理状态更新和新增事件"""
    event_dict = {e["event_id"]: e for e in old_events}

    for new_event in new_events:
        eid = new_event["event_id"]
        if eid in event_dict:
            # 合并策略：新字段优先，保留历史信息
            merged = event_dict[eid].copy()
            for key, value in new_event.items():
                if value not in [None, "", []]:
                    merged[key] = value
            event_dict[eid] = merged
        else:
            event_dict[eid] = new_event  # 新事件直接加入

    return list(event_dict.values())

def merge_unique_list(old: list, new: list):
    """列表去重合并 - 保持原有顺序"""
    combined = old + new
    seen = set()
    result = []
    for item in combined:
        if isinstance(item, dict):
            key = json.dumps(item, sort_keys=True, ensure_ascii=False)
        else:
            key = str(item)
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result
```

### ⚡ 並列処理エンジン

スレッドプールを使用して高効率なバッチ人物更新を実装します：

```python
# 全人物状態を並列更新
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = {
        executor.submit(update_memcube_for_character, name, memcube, content, chapter_id): name
        for name, memcube in memcubes.items()
    }

    for future in as_completed(futures):
        name = futures[future]
        try:
            name, updated, error = future.result()
            if error or not updated:
                print(f"⚠️ 更新失敗：{name} in {chapter_id} -> {error}")
                continue

            # 更新結果をインテリジェントにマージ
            memcube = memcubes[name]
            memcube["events"] = merge_events(memcube["events"], updated.get("events", []))
            memcube["utterances"].extend(updated.get("utterances", []))
            if updated.get("speech_style"):
                memcube["speech_style"] = updated["speech_style"]
            memcube["personality_traits"] = merge_unique_list(
                memcube["personality_traits"], updated.get("personality_traits", [])
            )
            if updated.get("emotion_state"):
                memcube["emotion_state"] = updated["emotion_state"]
            memcube["relations"].extend(updated.get("relations", []))

        except Exception as e:
            print(f"⚠️ 並列実行例外：{name} -> {e}")
```

---

## レシピ3.3：記憶ベースのインテリジェント推論システム

### 🎯 目標

構築したMemCubeに基づいて、小説のプロット推論、妥当性評価、感情分析などの高度な機能を実現します。

### 🔮 プロット推演エンジン

人物の完全な記憶情報を利用して物語の展開を予測します：

```python
@staticmethod
def speculate_event_outcome(character_name: str, memcube: dict, user_input: str):
    """人物記憶に基づくプロット推演 - 小説風の叙述を生成"""
    return [
        {
            "role": "system",
            "content": (
                "あなたは小説脚本推演の専門家です。\n"
                "あなたには全人物の完全な JSON 情報（イベントチェーン、性格、感情、関係などを含む）と、ユーザーが提示した仮説的なプロットが1つ与えられます。\n"
                "あなたの任務は、これらの人物の背景、未完了イベント、関係網、性格と動機に基づいて、物語がどのように展開する可能性があるかを合理的に推演することです。\n"
                "完全な小説段落スタイルの叙述を生成してください（リストでも JSON でもない）。物語がどのように展開するかを描写してください。\n"
                "言語スタイルは原作小説と一致させてください（例：古典武侠風）。"
            )
        },
        {
            "role": "user",
            "content": (
                f"人物名：{character_name}\n\n"
                f"人物情報は以下の通りです（JSON 形式）：\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"ユーザーの仮説的なプロットは以下の通りです：\n{user_input}\n\n"
                "上記の情報に基づいて物語の展開を推演し、小説風の言語による叙述を返してください。いかなる説明的言語や JSON も含めないでください。"
            )
        }
    ]

@staticmethod
def evaluate_plot_reasonableness(character_name: str, memcube: dict, user_input: str):
    """プロット妥当性分析 - 人物ロジックに基づいてプロットの信頼性を判断"""
    return [
        {
            "role": "system",
            "content": (
                "あなたは小説人物の行動妥当性分析の専門家です。\n"
                "あなたには全人物の完全な JSON 情報（イベントチェーン、性格、感情、関係などを含む）と、ユーザーが提示した仮説的なプロットが1つ与えられます。\n"
                "あなたの任務は以下の通りです：\n"
                "1. そのプロットが、その人物の行動ロジック、性格特性、感情状態および現在の背景に合致するかを判断すること。\n"
                "2. 合理的でない場合は、具体的にどこが合理的でないかを指摘し、理由を説明すること。\n"
                "3. 合理的である場合は、その妥当性を説明し、そのプロットがどのように自然に発生するかを簡潔に記述すること。\n\n"
                "返却形式：\n"
                "- 妥当性評価：合理的 / 不合理 / 条件付きで合理的\n"
                "- 分析説明：人物の動機、関係、背景に適合するかどうかを詳細に説明\n"
                "- 提案：必要に応じて、修正提案またはより合理的な代替表現を提示\n\n"
                "簡潔な中国語で回答してください。小説本文や JSON 構造は生成しないでください。"
            )
        },
        {
            "role": "user",
            "content": (
                f"人物名：{character_name}\n\n"
                f"全人物の完全な情報は以下の通りです（JSON 形式）：\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"ユーザーが提示したプロット構想は以下の通りです：\n{user_input}\n\n"
                "このプロットがその人物の現在の状態とロジックに適合するかどうかを判断し、理由を説明してください。"
            )
        }
    ]
```

### 🎭 多次元分析フレームワーク

感情軌跡、衝突進展、立場判断などの専門的な分析ツールを提供します：

```python
@staticmethod
def emotion_trajectory_prompt(character_name: str, memcube: dict, user_input: str):
    """感情軌跡分析 - 人物の感情変化を予測"""
    return [
        {
            "role": "system",
            "content": (
                "あなたは小説人物の感情軌跡分析の専門家です。\n"
                "あなたにはある人物の完全な情報（イベント、性格、感情、関係などを含む）と、ユーザーが想定した1つのプロットが与えられます。\n"
                "そのプロットの中で、その人物の感情が変化するかどうかを判断してください。\n\n"
                "あなたの任務は以下の通りです：\n"
                "1. そのプロット構想に感情変化が含まれているかどうかを判断すること。\n"
                "2. ある場合は、感情タイプを示し、その変化がどのように引き起こされたかを説明すること。\n"
                "3. ない場合は、なぜ感情が安定したままなのかを説明すること。\n\n"
                "返却形式：\n"
                "- 感情変化：有 / 無\n"
                "- 現在の感情：xxx\n"
                "- 変化理由：xxx\n"
                "簡潔な中国語で回答してください。"
            )
        },
        {
            "role": "user",
            "content": (
                f"人物名：{character_name}\n\n"
                f"この人物の完全な情報は以下の通りです（JSON）：\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"ユーザーが想定したプロットは以下の通りです：\n{user_input}"
            )
        }
    ]

@staticmethod
def conflict_progression_prompt(character_name: str, memcube: dict, user_input: str):
    """衝突進化分析 - 人物間の矛盾の発展を追跡"""
    return [
        {
            "role": "system",
            "content": (
                "あなたは小説人物間の対立関係の進化を分析する専門家です。\n"
                "あなたにはある人物の完全な資料（JSON 形式）と、ユーザーが提示した1つの想定プロットが与えられます。\n"
                "このプロットの中で、他者との対立進展が含まれているかどうかを判断してください。\n\n"
                "あなたの任務は以下の通りです：\n"
                "1. その想定プロットに既存または潜在的な衝突対象が含まれているかどうかを判断すること。\n"
                "2. ある場合は、その関係に変化が生じるかどうかを判断すること（例：激化、緩和、解決）。\n"
                "3. 衝突変化の原因を簡潔に述べること。\n\n"
                "返却形式：\n"
                "- 相手：xxx\n"
                "- 現在の段階：xxx（例：潜在 → 激化 → 緩和 → 解決）\n"
                "- 変化理由：xxx\n"
                "簡潔な中国語で回答してください。"
            )
        },
        {
            "role": "user",
            "content": (
                f"人物名：{character_name}\n\n"
                f"この人物の完全な情報は以下の通りです（JSON）：\n{json.dumps(memcube, ensure_ascii=False, indent=2)}\n\n"
                f"ユーザーが想定したプロットは以下の通りです：\n{user_input}"
            )
        }
    ]
```

### 💡 実際の応用例

```python
# 構築済みの人物記憶ライブラリを読み込む
with open("memcubes1.json", "r", encoding="utf-8") as f:
    memcubes = json.load(f)

character_name = "段誉"
user_input = "もし段誉が剣湖宮の武術大会に現れなかったら、どうなっていたでしょうか？"

# プロット推演を実行
prompt = Prompt.speculate_event_outcome(character_name, memcubes[character_name], user_input)
response = api_client.call_api(prompt, TaskType.EVENT_EXTRACTION)
print(response.get("content", "❌ 戻り値がありません"))
```

---

## レシピ3.4：Embeddingモデル最適化設定

### 🔄 中国語テキスト検索のEmbeddingモデル切り替え

**切り替え理由の説明：**

元のコードではテキストのベクトル化にnomic-embedモデルを使用していますが、このモデルは主に英語テキスト向けに最適化されており、中国語小説コンテンツを処理する際に以下の問題があります：

1. **中国語の意味理解能力が限定的**：nomic-embed-textモデルは主に英語コーパスに基づいて学習されており、中国語の意味理解とテキスト関係の把握能力が弱い
2. **検索精度不足**：『天龍八部』などの中国語小説における人物、イベント、関係の検索で、意味類似度計算が十分に正確ではない
3. **文化的背景の欠如**：中国文学作品における武侠、歴史、文化などの特定の文脈を十分に理解できない

**推奨される置き換え案：**

[Mem0公式ドキュメント](https://docs.mem0.ai/components/embedders/models/openai)と[中国語embeddingモデル評価](https://github.com/wangyuxinwhy/uniem)に基づき、以下の設定を推奨します：

#### 方案一：OpenAI Embedding（推奨）

```python
config = {
    "embedder": {
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-large",  # 多言語対応、中国語で優れた効果
            "embedding_dims": 3072,
            "api_key": "YOUR_OPENAI_API_KEY"
        }
    }
}
```

**利点：**

- 中国語と英語のバイリンガルに対応し、中国語テキスト検索タスクで優れた性能を発揮
- ベクトル次元がより高い(3072)ため、意味表現がより豊か
- MTEB-zh評価で良好な性能

#### 方案二：M3Eモデル（オープンソース代替）

```python
config = {
    "embedder": {
        "provider": "huggingface",  
        "config": {
            "model": "moka-ai/m3e-base",  # 中国語向けに最適化されたオープンソースモデル
            "embedding_dims": 768
        }
    }
}
```

**利点：**

- 中国語向けに特化して学習されており、中国語テキスト分類と検索でOpenAI ada-002より優れる
- 異種テキスト検索をサポートし、小説の人物関係とイベント検索に適している
- 完全オープンソースで、API呼び出し料金なし

#### 方案三：ローカルデプロイ

```python
config = {
    "embedder": {
        "provider": "ollama",
        "config": {
            "model": "moka-ai/m3e-base",
            "ollama_base_url": "http://localhost:11434"
        }
    }
}
```

**性能比較データ：**

[MTEB-zh評価](https://github.com/wangyuxinwhy/uniem)の結果によると：

| モデル                          | 中国語テキスト分類精度 | 中国語検索 ndcg@10 | 利点       |
| ----------------------------- | ------------------ | ---------------- | ---------- |
| nomic-embed                   | 未テスト           | 未テスト         | 英語最適化 |
| OpenAI text-embedding-3-large | 0.6231             | 0.7786+          | 多言語対応 |
| M3E-base                      | 0.6157             | 0.8004           | 中国語特化 |

---

## レシピ3.5：Memoryグラフ構造コンバーター

### 🎯 目標

MemCubeデータをMemOS互換のMemoryノード形式に変換し、クエリ可能なナレッジグラフを構築します。

### 🏗️ Memoryノード生成

人物イベントと関係を標準化されたMemoryオブジェクトに変換します：

```python
def create_memory_node(content: str, entities: list, key: str, memory_type: str = "fact") -> dict:
    """標準化されたMemoryノードを作成"""
    node_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
  
    # embeddingをシミュレート（実際の応用では実際のembeddingサービスを使用する必要があります）
    embedding = [0.1] * 768  # サンプル次元
  
    return {
        "id": node_id,
        "memory": content,
        "metadata": {
            "user_id": "",
            "session_id": "",
            "status": "activated",
            "type": "fact",
            "confidence": 0.99,
            "entities": entities,
            "tags": ["イベント"] if "イベント" in key else ["関係"],
            "updated_at": now,
            "memory_type": memory_type,
            "key": key,
            "sources": [],
            "embedding": embedding,
            "created_at": now,
            "usage": [],
            "background": ""
        }
    }
```

### 🔄 バッチ変換処理

高効率なMemCubeからMemoryへの変換パイプラインを実装します：

```python
INPUT_FILE = "memcube_all.json"
OUTPUT_FILE = "memory_graph.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    memcube_data = json.load(f)

nodes = []
edges = []

for character, data in memcube_data.items():
    previous_event_id = None

    # === イベントシーケンス変換 ===
    for event in data.get("events", []):
        memory_text = f"{character}は{event.get('time')}に{event.get('location')}で、{event.get('motivation')}のために、{event.get('action')}を行い、結果は{event.get('impact')}であった。"
        entities = [character] + event.get("involved_entities", [])
        node = create_memory_node(
            content=memory_text,
            entities=entities,
            key=f"{character}のイベント：{event.get('action')}"
        )
        nodes.append(node)

        # イベント時系列関係を構築
        if previous_event_id:
            edges.append({
                "source": previous_event_id,
                "target": node["id"],
                "type": "FOLLOWS"
            })
        previous_event_id = node["id"]

    # === 関係ネットワーク集約 ===
    relations_texts = []
    seen = set()
    for relation in data.get("relations", []):
        name = relation.get("name") or relation.get("人物") or relation.get("character")
        relation_text = relation.get("relation") or relation.get("relationship") or relation.get("関係")
        if not name or not relation_text:
            continue
        dedup_key = (str(name), str(relation_text))
        if dedup_key in seen:
            continue
        seen.add(dedup_key)
        relations_texts.append(f"{name}とは{relation_text}の関係である")

    if relations_texts:
        memory_text = f"{character}" + "，".join(relations_texts) + "。"
        entities = [character] 
        node = create_memory_node(
            content=memory_text,
            entities=entities,
            key=f"{character}の関係要約",
        )
        nodes.append(node)

# 変換結果を保存
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump({
        "nodes": nodes,
        "edges": edges
    }, f, ensure_ascii=False, indent=2)

print(f"✅ 変換完了、合計 {len(nodes)} 個の memory ノードと {len(edges)} 本のエッジを生成")
print(f"📁 出力ファイル: {OUTPUT_FILE}")
```

---

## レシピ3.5：MemOS統合とクエリ検証

### 🎯 目標

変換後のMemoryデータをMemOSシステムに統合し、意味ベースのインテリジェント検索を実現します。

### 🔗 MemOSコネクタ

MemOSサービスとの安定した接続を確立します：

```python
import memos
from memos.configs.embedder import EmbedderConfigFactory
from memos.configs.memory import TreeTextMemoryConfig
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.embedders.factory import EmbedderFactory
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory
from memos.configs.mem_os import MOSConfig

# MemOS設定を読み込む
config = TreeTextMemoryConfig.from_json_file("/root/Test/memos_config.json")
tree_memory = TreeTextMemory(config)

# 記憶データを読み込む
tree_memory.load("/root/Test")

# 意味検索を実行
results = tree_memory.search("段誉が初めて仙女姉姉に出会う", top_k=5)

for result in results:
    relativity = result.metadata.relativity if hasattr(result.metadata, 'relativity') else 0.0
    print(f"関連度: {relativity:.3f}")
    print(f"内容: {result.memory}")
    print("---")
```

### 🔍 インテリジェント検索検証

多次元クエリによってシステム性能を検証します：

```python
# 多タイプクエリテスト
test_queries = [
    "段誉が神仙姐姐に初めて出会う",
    "乔峰の身の上の謎",
    "虚竹の奇遇の経験",
    "丁春秋と无崖子の因縁"
]

for query in test_queries:
    print(f"\n🔍 クエリ: {query}")
    results = tree_memory.search(query, top_k=3)
  
    for i, result in enumerate(results, 1):
        relativity = result.metadata.relativity if hasattr(result.metadata, 'relativity') else 0.0
        print(f"  {i}. 関連度: {relativity:.3f}")
        print(f"     内容: {result.memory[:100]}...")
```

---

## 🎯 MemOSに基づく創造的拡張

おめでとうございます！あなたはすでにMemOSのコア技術を習得しました。では次に、どのようなワクワクするアプリケーションを作り出せるか見てみましょう：

### 🕰️ アイデア1：インテリジェント世界タイムラインシステム

MemOSに基づいて動的な武侠世界のタイムラインを構築し、AIに出来事の因果関係を理解させます：

```python
# 例：インテリジェントなタイムライン管理
timeline_memory = {
    "1094年": {
        "events": ["萧峰の身の上の謎が明らかになる", "聚贤庄の大戦"],
        "consequences": ["江湖が震撼する", "丐帮が分裂する"],
        "affected_characters": ["萧峰", "阿朱", "段正淳"]
    },
    "1095年": {
        "events": ["雁门关事件の真相", "阿朱の死"],
        "consequences": ["萧峰の心境が変化する", "宋と辽の関係が緊張する"]
    }
}

# AIは回答できます：もし萧峰が雁门关に行かなかったら、その後はどのように展開したか？
```

### 🧠 アイデア2：動的Working Memory世界背景

MemCubeのworking memory機能を利用して、世界背景をストーリーの進行に合わせてリアルタイムに更新します：

```python
# 例：動的な世界状態管理
from memos.memories.textual.base import TextualMemoryItem

# 世界状態メモリアイテムを作成
world_state_memories = [
    TextualMemoryItem(
        memory="宋と辽の政治的緊張度が0.8レベルに達し、国境衝突が頻発している",
        metadata={"type": "world_state", "category": "politics"}
    ),
    TextualMemoryItem(
        memory="現在江湖で広く伝わっている絶世の武功：九阳神功、易筋经",
        metadata={"type": "world_state", "category": "martial_arts"}
    ),
    TextualMemoryItem(
        memory="少林と武当は中立を保ち、丐帮内部では分裂が生じている",
        metadata={"type": "world_state", "category": "sect_relations"}
    )
]

# MemCubeのテキストメモリを使用して世界状態を管理
mem_cube.text_mem.replace_working_memory(world_state_memories)

# 萧峰が重要な決断を下したとき、working memoryを自動更新
current_working_memory = mem_cube.text_mem.get_working_memory()
```

### 🎮 アイデア3：MemOS駆動のインタラクティブテキストゲーム

**究極のアイデア**：MemOS + MemCube + GPT-4oに基づいて、本当にインテリジェントなシングルプレイヤーのテキストアドベンチャーゲームを構築しましょう！

```python
# ゲームコアアーキテクチャの例
class WuxiaTextGame:
    def __init__(self, mos_config):
        from memos.mem_os.main import MOS
        
        self.world_memory = MOS(mos_config)  # 世界メモリシステム
        self.character_cubes = {}            # 各NPCのMemCube
        self.timeline_memories = []          # タイムラインメモリリスト
        
        # ゲームのメインユーザーを作成
        self.world_memory.create_user("game_master")
      
    def start_adventure(self, player_choice):
        """
        プレイヤーの選択：
        - 役割：萧峰/段誉/虚竹/オリジナル角色
        - 時点：幼年/青年/中年
        - 場所：中原/大理/辽国
        """
        return f"{player_choice.location}へようこそ..."
  
    def process_action(self, player_input):
        """
        プレイヤーの自然言語入力を処理：
        "少林寺へ行って武功を学びたい"
        "萧峰と義兄弟の契りを結びたい"
        "雁门关の惨劇を阻止したい"
        """
                # 1. プレイヤーの意図を理解（MemOSのLLM機能を使用）
        intent_analysis = self.world_memory.chat(
            query=f"プレイヤーの意図を分析: {player_input}",
            user_id="game_master"
        )
        
        # 2. 関連メモリを検索
        context = self.world_memory.search(
            query=player_input, 
            user_id="game_master"
        )
      
                # 3. 行動の結果を計算（検索されたコンテキストに基づく）
        consequences = self.predict_consequences(player_input, context)
        
        # 4. 世界状態を更新（新しいメモリを追加）
        self.update_world_state(player_input, consequences)
        
        # 5. ストーリー展開を生成
        return self.generate_story(player_input, context, consequences)
    
    def predict_consequences(self, player_input, context):
        """プレイヤーの行動結果を予測"""
        query = f"以下の背景に基づいて：{context}、プレイヤーの行動'{player_input}'の可能な結果を予測"
        result = self.world_memory.chat(
            query=query,
            user_id="game_master"
        )
        return result
    
    def update_world_state(self, player_input, consequences):
        """世界状態をMemOSメモリに更新"""
        memory_content = f"プレイヤーの行動: {player_input}, 結果: {consequences}"
        self.world_memory.add(
            memory_content=memory_content,
            user_id="game_master"
        )
    
    def generate_story(self, player_input, context, consequences):
        """ストーリー展開を生成"""
        query = f"背景{context}と結果{consequences}に基づいて、プレイヤーの行動'{player_input}'に対する面白いストーリー展開を生成"
                 return self.world_memory.chat(
             query=query,
             user_id="game_master"
         )

# 完全な使用例
def create_wuxia_game():
    """完全な武侠テキストゲームの例を作成"""
    from memos.configs.mem_os import MOSConfig
    
    # MemOS設定を作成
    mos_config = MOSConfig(
        user_id="game_system",
        chat_model={
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o",
                "api_key": "YOUR_API_KEY",
                "api_base": "https://api.openai.com/v1"
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-4o",
                        "api_key": "YOUR_API_KEY",
                        "api_base": "https://api.openai.com/v1"
                    }
                }
            }
        },
        enable_textual_memory=True
    )
    
    # ゲームインスタンスを作成
    game = WuxiaTextGame(mos_config)
    
    # 対話例
    response = game.process_action("洛阳の宿で萧峰を探したい")
    print(response)
    
    return game
```

**ゲームプレイ例：**

```
プレイヤー：私は世に出たばかりの少年で、萧峰を訪ねたい
AI：  その時、萧峰は洛阳一帯で身の上の謎を調べており、あなたは宿で偶然彼に出会った...
      萧峰はあなたが若いのを見ると、こう尋ねた："若い兄弟よ、こんな遅くまで外をうろついているのか？"

プレイヤー：武功を学びたいと伝え、弟子にしてほしいと頼む
AI：  萧峰はははっと大笑いした："私自身の身の上ですら一団の霧なのに、どうして人の師匠になれる？
      だが出会ったのも縁だ、護身のために何手か教えてやろう..."
      [あなたの武功レベル +1、萧峰との関係 +5]

プレイヤー：萧峰に彼の身の上の真相を伝えたい
AI：  これは危険な選択です！身の上を前もって明かすと、物語全体の流れが変わる可能性があります...
      本当にそうしますか？これによりまったく新しいストーリー分岐が開かれます。
```

### 🌟 あなたの想像力こそが境界です！

MemOSに基づいて、あなたは次のものを作れます：

- 📚 **インテリジェント小説ジェネレーター** - AIがあなたの設定に基づいて自動創作
- 🎭 **バーチャルキャラクター伴走** - 萧峰や段誉とリアルな対話を行う
- 🎨 **インタラクティブストーリー創作** - 動的に生成される物語世界
- 🎯 **教育ゲームプラットフォーム** - ゲームの中で歴史と文学を学ぶ
- 🔮 **予測型エンターテインメント** - AIがあなたの選択がストーリーにどう影響するかを予測

**鍵となるのは**：MemOSはAIに本当の"記憶"を持たせ、次のことを可能にします：

- 🧠 すべての歴史的出来事と人物関係を記憶する
- 🔄 プレイヤーの行動に応じて世界状態を動的に更新する
- 🎯 論理に合ったストーリー展開を生成する
- 🌟 無限の可能性を持つ物語分岐を作り出す

---

## 🎮 今すぐ体験：インタラクティブテキストゲームデモ

MemOSに基づいて構築されたテキストゲームを自分で体験してみたいですか？私たちは完全なデモプロジェクトを提供しており、本章で紹介した技術を実際のインタラクティブなテキスト生成にどのように適用するかを示しています。

### 📦 デモの特徴

- **🎯 『天龙八部』に基づく**: 本章で処理した同じ小説内容を知識ベースとして使用
- **🔍 インテリジェント意図認識**: ユーザーが行いたい操作タイプを自動認識
- **💬 複数のインタラクションモード**: ストーリー続写、キャラクター分析、仮説プロット、人物対話などをサポート
- **🧠 MemOS駆動**: 実際のMemCube検索とコンテキスト生成を表示

### 🚀 今すぐ試す

**👉 [MemCube Interactive Text Game Demo - Hugging Face](https://huggingface.co/datasets/MemCube/interactive-text-game-demo)**

このデモプロジェクトには以下が含まれます：
- ✅ **完全なソースコード**: MemOS各コンポーネントの実際の使用方法を表示
- ✅ **実行ガイド**: デプロイと実行の方法をステップごとに説明
- ✅ **技術説明**: 実装原理と設計の考え方を詳しく説明
- ✅ **カスタマイズ可能**: あなた自身のテキスト内容に置き換えることが可能

このdemoを実際に操作することで、本章で紹介したMemOS技術が実際のアプリケーションでどのように機能するかをより深く理解できるでしょう！

**さあ、あなたの創造力を解き放ち、MemOSであなただけのインテリジェント世界を作りましょう！** 🚀
