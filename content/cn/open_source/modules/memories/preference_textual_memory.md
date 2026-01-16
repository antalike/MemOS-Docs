---
title: "PreferenceTextMemory: 偏好记忆"
desc: "MemOS 中的智能偏好记忆模块，专为捕获、存储和检索用户偏好设计。支持显式和隐式偏好提取，使用向量语义搜索实现精准检索。"
---

# PreferenceTextMemory: 偏好记忆

让我们构建一个能够理解和记住用户偏好的智能系统！

**PreferenceTextMemory** 是 MemOS 中专门用于管理用户偏好的高级记忆模块。它能够从对话中自动识别用户的显式偏好（明确表达）和隐式偏好（行为推断），并使用向量语义搜索提供精准的偏好检索能力。

## 目录

- [你将学到什么](#你将学到什么)
- [为什么需要偏好记忆](#为什么需要偏好记忆)
- [核心概念](#核心概念)
    - [记忆结构](#记忆结构)
    - [元数据字段](#元数据字段-preferencetextualmemorymetadata)
    - [偏好类型](#偏好类型)
    - [工作流程](#工作流程)
- [API 参考](#api-参考)
    - [初始化](#初始化)
    - [核心方法](#核心方法)
    - [配置参数](#配置参数)
- [动手实践](#动手实践)
    - [快速开始](#快速开始)
    - [完整示例](#完整示例)
    - [高级用法](#高级用法)
- [使用场景指南](#使用场景指南)
- [与其他记忆模块对比](#与其他记忆模块对比)
- [最佳实践](#最佳实践)
- [下一步](#下一步)

## 你将学到什么

在本指南的最后，你将能够：
- 从对话中自动提取显式和隐式偏好
- 使用向量数据库存储和管理偏好记忆
- 基于语义相似度检索相关偏好
- 处理偏好的更新、去重和冲突解决
- 构建个性化的对话代理和推荐系统

## 为什么需要偏好记忆

### 优势特性

::list{icon="ph:check-circle-duotone"}
- **双重偏好提取**：自动识别显式偏好和隐式偏好
- **语义理解**：使用向量嵌入理解偏好的深层含义
- **智能去重**：自动检测和合并重复或冲突的偏好
- **精准检索**：基于向量相似度的语义搜索
- **持久化存储**：支持向量数据库（Qdrant/Milvus）
- **可扩展性**：支持大规模偏好数据管理
- **个性化增强**：为每个用户维护独立的偏好档案
::

### 应用场景

::list{icon="ph:lightbulb-duotone"}
- 个性化对话代理（记住用户喜好）
- 智能推荐系统（基于偏好推荐）
- 客户服务系统（提供定制化服务）
- 内容过滤系统（根据偏好筛选内容）
- 学习辅助系统（适应学习风格）
::

::alert{type="info"}
**适用场景**<br>
当你需要构建能够"记住"用户喜好并据此提供个性化服务的系统时，PreferenceTextMemory 是最佳选择。
::

## 核心概念

### 记忆结构

每个偏好记忆表示为一个 `TextualMemoryItem` 对象，包含以下字段：

| 字段       | 类型                                | 必填 | 描述                          |
| ---------- | ----------------------------------- | ---- | ----------------------------- |
| `id`       | `str`                               | ✗    | 唯一标识符（自动生成 UUID）   |
| `memory`   | `str`                               | ✓    | 偏好的摘要描述                |
| `metadata` | `PreferenceTextualMemoryMetadata`   | ✗    | 偏好的详细元数据              |

### 元数据字段 (`PreferenceTextualMemoryMetadata`)

偏好记忆的元数据继承自 `TextualMemoryMetadata`，并添加了偏好特定的字段：

| 字段              | 类型                                        | 默认值                  | 描述                           |
| ----------------- | ------------------------------------------- | ----------------------- | ------------------------------ |
| `preference_type` | `"explicit_preference"` / `"implicit_preference"` | `"explicit_preference"` | 偏好类型                       |
| `dialog_id`       | `str`                                       | None                    | 对话唯一标识符                 |
| `original_text`   | `str`                                       | None                    | 原始对话文本                   |
| `embedding`       | `list[float]`                               | None                    | 偏好的向量嵌入                 |
| `preference`      | `str`                                       | None                    | 提取的偏好内容                 |
| `created_at`      | `str`                                       | 自动生成                | 创建时间戳（ISO 8601）         |
| `mem_cube_id`     | `str`                                       | None                    | MemCube 标识符                 |
| `score`           | `float`                                     | None                    | 检索相关性分数                 |
| `user_id`         | `str`                                       | None                    | 用户标识符                     |
| `session_id`      | `str`                                       | None                    | 会话标识符                     |
| `status`          | `"activated"` / `"archived"` / `"deleted"`  | `"activated"`           | 偏好状态                       |

### 偏好类型

PreferenceTextMemory 支持两种类型的偏好：

#### 1. 显式偏好 (Explicit Preference)

用户明确表达的喜好或厌恶。

**示例**：
- "我喜欢深色模式"
- "我不吃辣"
- "请用简短的回答"
- "我更喜欢技术文档而不是视频教程"

#### 2. 隐式偏好 (Implicit Preference)

从用户行为和对话模式中推断出的偏好。

**示例**：
- 用户总是询问代码示例 → 偏好实践导向的学习
- 用户经常要求详细解释 → 偏好深入理解
- 用户多次提到环保话题 → 关注可持续发展

::alert{type="success"}
**智能提取**<br>
PreferenceTextMemory 使用 LLM 自动从对话中同时提取显式和隐式偏好，无需手动标注！
::

### 工作流程

PreferenceTextMemory 的工作流程包括以下步骤：

::steps{}

#### 步骤 1: 对话分块 (Splitting)
将长对话分割成可处理的块

#### 步骤 2: 偏好提取 (Extraction)
使用 LLM 从每个块中提取显式和隐式偏好

#### 步骤 3: 向量嵌入 (Embedding)
为提取的偏好生成语义向量

#### 步骤 4: 去重与合并 (Deduplication)
检测重复或冲突的偏好并智能合并

#### 步骤 5: 存储 (Storage)
将偏好存储到向量数据库

#### 步骤 6: 检索 (Retrieval)
基于语义相似度搜索相关偏好

::

## API 参考

### 初始化

```python
from memos.memories.textual.preference import PreferenceTextMemory
from memos.configs.memory import PreferenceTextMemoryConfig

memory = PreferenceTextMemory(config: PreferenceTextMemoryConfig)
```

### 核心方法

| 方法                                  | 参数                                    | 返回值                        | 描述                                   |
| ------------------------------------- | --------------------------------------- | ----------------------------- | -------------------------------------- |
| `get_memory(messages, type, info)`    | `messages, type, info`                  | `list[TextualMemoryItem]`     | 从消息中提取偏好记忆                   |
| `add(memories)`                       | `memories: list`                        | `list[str]`                   | 添加偏好记忆（自动去重）               |
| `search(query, top_k, info, filter)`  | `query, top_k, info, filter`            | `list[TextualMemoryItem]`     | 语义搜索偏好记忆                       |
| `get_with_collection_name(coll, id)`  | `collection_name, memory_id`            | `TextualMemoryItem`           | 从指定集合获取单个偏好                 |
| `get_by_ids_with_collection_name()`   | `collection_name, memory_ids`           | `list[TextualMemoryItem]`     | 批量获取偏好                           |
| `get_all()`                           | -                                       | `dict[str, list]`             | 获取所有偏好（按集合分组）             |
| `get_memory_by_filter(filter, page)`  | `filter, page, page_size`               | `tuple[list, int]`            | 按条件分页查询偏好                     |
| `delete(memory_ids)`                  | `memory_ids: list[str]`                 | `None`                        | 删除指定偏好                           |
| `delete_by_filter(filter)`            | `filter: dict`                          | `None`                        | 按条件删除偏好                         |
| `delete_with_collection_name()`       | `collection_name, memory_ids`           | `None`                        | 从指定集合删除偏好                     |
| `delete_all()`                        | -                                       | `None`                        | 清空所有偏好记忆                       |
| `dump(dir)`                           | `dir: str`                              | `None`                        | 导出偏好到 JSON 文件                   |
| `load(dir)`                           | `dir: str`                              | `None`                        | 从 JSON 文件加载偏好                   |

### 配置参数

**PreferenceTextMemoryConfig**

| 参数             | 类型                       | 必填 | 描述                                       |
| ---------------- | -------------------------- | ---- | ------------------------------------------ |
| `extractor_llm`  | `LLMConfigFactory`         | ✓    | 用于提取偏好的 LLM 配置                    |
| `vector_db`      | `VectorDBConfigFactory`    | ✓    | 向量数据库配置（Qdrant/Milvus）            |
| `embedder`       | `EmbedderConfigFactory`    | ✓    | 嵌入模型配置                               |
| `reranker`       | `RerankerConfigFactory`    | ✗    | 重排序模型配置（可选）                     |
| `extractor`      | `ExtractorConfigFactory`   | ✓    | 偏好提取器配置                             |
| `adder`          | `AdderConfigFactory`       | ✓    | 偏好添加器配置（含去重逻辑）               |
| `retriever`      | `RetrieverConfigFactory`   | ✓    | 偏好检索器配置                             |

**配置示例**

```json
{
  "backend": "preference",
  "config": {
    "extractor_llm": {
      "backend": "openai",
      "config": {
        "model_name_or_path": "gpt-4o-mini",
        "api_key": "sk-xxx"
      }
    },
    "vector_db": {
      "backend": "qdrant",
      "config": {
        "url": "http://localhost:6333",
        "collection_name": ["explicit_preference", "implicit_preference"]
      }
    },
    "embedder": {
      "backend": "openai",
      "config": {
        "model_name_or_path": "text-embedding-3-small",
        "api_key": "sk-xxx"
      }
    },
    "extractor": {
      "backend": "naive"
    },
    "adder": {
      "backend": "naive"
    },
    "retriever": {
      "backend": "naive"
    }
  }
}
```

## 动手实践

### 快速开始

只需 4 步即可开始使用 PreferenceTextMemory：

::steps{}

#### 步骤 1: 创建配置

```python
from memos.configs.memory import MemoryConfigFactory

config = MemoryConfigFactory(
    backend="preference",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
            },
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "url": "http://localhost:6333",
                "collection_name": ["explicit_preference", "implicit_preference"],
            },
        },
        "embedder": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "text-embedding-3-small",
                "api_key": "your-api-key",
            },
        },
        "extractor": {"backend": "naive"},
        "adder": {"backend": "naive"},
        "retriever": {"backend": "naive"},
    },
)
```

#### 步骤 2: 初始化记忆模块

```python
from memos.memories.factory import MemoryFactory

memory = MemoryFactory.from_config(config)
```

#### 步骤 3: 提取偏好

```python
# 从对话中提取偏好
messages = [[
    {"role": "user", "content": "我更喜欢深色模式的界面"},
    {"role": "assistant", "content": "好的，我会记住您喜欢深色模式"},
    {"role": "user", "content": "能简短一点回答吗？"},
    {"role": "assistant", "content": "明白，我会简洁回复"}
]]

preferences = memory.get_memory(
    messages=messages,
    type="chat",
    info={
        "user_id": "user_001",
        "session_id": "session_123"
    }
)

print(f"✓ 提取了 {len(preferences)} 条偏好")
```

::alert{type="info"}
**进阶：处理多模态内容**<br>
如果对话中包含图片、URL 或文件，可以使用 `MultiModalStructMemReader` 作为 extractor。<br>
查看完整示例：[使用 MultiModalStructMemReader](./tree_textual_memory#使用-multimodalstructmemreader高级)
::

#### 步骤 4: 添加并搜索偏好

```python
# 添加偏好到数据库
added_ids = memory.add(preferences)
print(f"✓ 已添加 {len(added_ids)} 条偏好")

# 搜索相关偏好
results = memory.search(
    query="用户界面偏好",
    top_k=5,
    info={
        "user_id": "user_001",
        "session_id": "session_123"
    },
    search_filter={"status": "activated"}
)

print(f"\n🔍 找到 {len(results)} 条相关偏好:")
for i, pref in enumerate(results, 1):
    print(f"  {i}. {pref.memory}")
    print(f"     类型: {pref.metadata.preference_type}")
    print(f"     偏好: {pref.metadata.preference}")
```

::

### 完整示例

以下是一个完整的端到端示例，展示偏好记忆的完整工作流：

```python
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

# ========================================
# 1. 初始化
# ========================================
config = MemoryConfigFactory(
    backend="preference",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
            },
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "url": "http://localhost:6333",
                "collection_name": ["explicit_preference", "implicit_preference"],
            },
        },
        "embedder": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "text-embedding-3-small",
                "api_key": "your-api-key",
            },
        },
        "extractor": {"backend": "naive"},
        "adder": {"backend": "naive"},
        "retriever": {"backend": "naive"},
    },
)

memory = MemoryFactory.from_config(config)

# ========================================
# 2. 提取偏好（显式 + 隐式）
# ========================================
conversation = [[
    {"role": "user", "content": "我喜欢简洁的代码风格，不要太多注释"},
    {"role": "assistant", "content": "明白，我会提供简洁的代码"},
    {"role": "user", "content": "能给我一个例子吗？"},
    {"role": "assistant", "content": "当然，这是一个简洁的实现..."},
    {"role": "user", "content": "很好！我更喜欢这种实用的例子"}
]]

preferences = memory.get_memory(
    messages=conversation,
    type="chat",
    info={
        "user_id": "developer_001",
        "session_id": "coding_session_456"
    }
)

print(f"✓ 提取了 {len(preferences)} 条偏好")

# 查看提取的偏好
for pref in preferences:
    print(f"\n类型: {pref.metadata.preference_type}")
    print(f"摘要: {pref.memory}")
    print(f"偏好: {pref.metadata.preference}")

# ========================================
# 3. 添加偏好（自动去重）
# ========================================
added_ids = memory.add(preferences)
print(f"\n✓ 成功添加 {len(added_ids)} 条偏好（已自动去重）")

# ========================================
# 4. 语义搜索
# ========================================
query = "代码编写风格偏好"
results = memory.search(
    query=query,
    top_k=3,
    info={
        "user_id": "developer_001",
        "session_id": "coding_session_456"
    },
    search_filter={"status": "activated"}
)

print(f"\n🔍 查询: '{query}'")
print(f"找到 {len(results)} 条相关偏好:")
for i, result in enumerate(results, 1):
    print(f"\n  {i}. {result.memory}")
    print(f"     相关性分数: {result.metadata.score:.3f}")
    print(f"     偏好类型: {result.metadata.preference_type}")

::alert{type="info"}
**扩展：互联网检索**<br>
如需从互联网检索内容并提取偏好，可以结合使用 InternetRetriever。<br>
查看示例：[从互联网检索记忆](./tree_textual_memory#从互联网检索记忆可选)
::

# ========================================
# 5. 按条件筛选
# ========================================
filtered_prefs, total = memory.get_memory_by_filter(
    filter={
        "user_id": "developer_001",
        "preference_type": "explicit_preference"
    },
    page=1,
    page_size=10
)

print(f"\n📊 用户显式偏好: {len(filtered_prefs)} / {total} 条")

# ========================================
# 6. 获取所有偏好
# ========================================
all_preferences = memory.get_all()
print(f"\n📚 所有偏好统计:")
for collection, prefs in all_preferences.items():
    print(f"  {collection}: {len(prefs)} 条")

# ========================================
# 7. 更新偏好状态
# ========================================
# 归档旧偏好
memory.delete_by_filter({
    "user_id": "developer_001",
    "created_at": {"$lt": "2026-01-01"}
})
print("\n✓ 已归档旧偏好")

# ========================================
# 8. 持久化存储
# ========================================
memory.dump("tmp/preferences")
print("\n💾 偏好已保存到 tmp/preferences")

# 加载偏好
memory.load("tmp/preferences")
print("✓ 偏好已从文件加载")
```

### 高级用法

#### 1. 多集合操作

```python
# 从特定集合获取偏好
explicit_pref = memory.get_with_collection_name(
    collection_name="explicit_preference",
    memory_id="pref_id_123"
)

# 批量获取
explicit_prefs = memory.get_by_ids_with_collection_name(
    collection_name="explicit_preference",
    memory_ids=["id_1", "id_2", "id_3"]
)

# 从特定集合删除
memory.delete_with_collection_name(
    collection_name="implicit_preference",
    memory_ids=["old_id_1", "old_id_2"]
)
```

#### 2. 分页查询

```python
# 分页获取用户偏好
page = 1
page_size = 20

while True:
    prefs, total = memory.get_memory_by_filter(
        filter={"user_id": "user_001"},
        page=page,
        page_size=page_size
    )
    
    if not prefs:
        break
    
    print(f"第 {page} 页: {len(prefs)} 条偏好")
    for pref in prefs:
        print(f"  - {pref.memory}")
    
    page += 1
```

#### 3. 偏好冲突检测

```python
# 搜索可能冲突的偏好
new_pref = "用户喜欢详细的解释"
similar_prefs = memory.search(
    query=new_pref,
    top_k=5,
    search_filter={"user_id": "user_001"}
)

# 检查是否有相反的偏好
for pref in similar_prefs:
    if "简洁" in pref.memory and "详细" in new_pref:
        print(f"⚠️ 检测到潜在冲突: {pref.memory}")
```

## 使用场景指南

### 最适合的场景

::list{icon="ph:check-circle-duotone"}
- **个性化对话系统**：构建能记住用户习惯的智能助手
- **推荐引擎**：基于用户偏好提供精准推荐
- **客户服务**：提供定制化的客户体验
- **学习系统**：适应每个学习者的风格和节奏
- **内容过滤**：根据偏好自动筛选内容
- **产品配置**：记住用户的配置偏好
::

### 典型应用案例

#### 案例 1: 智能助手

```python
# 用户与助手多次对话后
query = "帮我写一段代码"

# 检索用户的编程偏好
prefs = memory.search(
    query="编程风格 代码规范",
    top_k=5,
    search_filter={"user_id": "developer_001"}
)

# 根据偏好调整回复
preferences_context = "\n".join([
    f"- {p.memory}" for p in prefs
])

prompt = f"""
用户偏好:
{preferences_context}

请根据用户偏好编写代码...
"""
```

#### 案例 2: 推荐系统

```python
# 获取用户的内容偏好
content_prefs = memory.search(
    query="内容类型 主题兴趣",
    top_k=10,
    search_filter={
        "user_id": "user_001",
        "preference_type": "implicit_preference"
    }
)

# 提取偏好关键词
keywords = []
for pref in content_prefs:
    if hasattr(pref.metadata, 'tags'):
        keywords.extend(pref.metadata.tags)

# 基于偏好推荐内容
recommended_items = recommend_content(keywords)
```

## 与其他记忆模块对比

选择合适的记忆模块对于项目成功至关重要。以下对比帮助你做出决策：

| 特性           | **NaiveTextMemory**   | **GeneralTextMemory**      | **PreferenceTextMemory**    | **TreeTextMemory**          |
| -------------- | --------------------- | -------------------------- | --------------------------- | --------------------------- |
| **主要用途**   | 通用记忆              | 通用记忆                   | **偏好管理**                | 结构化知识图谱              |
| **搜索方式**   | 关键词匹配            | 向量语义搜索               | **向量语义搜索**            | 图结构 + 向量搜索           |
| **记忆类型**   | 通用文本              | 通用文本                   | **显式/隐式偏好**           | 层次化节点                  |
| **依赖组件**   | 仅 LLM                | LLM + 嵌入器 + 向量数据库  | **LLM + 嵌入器 + 向量数据库** | LLM + 嵌入器 + 图数据库     |
| **去重能力**   | ❌                     | ❌                          | **✅ 智能去重**              | ✅                           |
| **适用规模**   | < 1K 条               | 1K - 100K 条               | **10K - 1M 条**             | 10K - 1M 条                 |
| **个性化**     | ❌                     | ⚠️ 需手动实现               | **✅ 原生支持**              | ⚠️ 需手动实现               |
| **冲突检测**   | ❌                     | ❌                          | **✅ 支持**                  | ⚠️ 部分支持                 |
| **配置复杂度** | 低 ⭐                 | 中 ⭐⭐                    | **中高 ⭐⭐⭐**             | 高 ⭐⭐⭐⭐               |
| **学习曲线**   | 极简                  | 中等                       | **中等**                    | 较陡                        |
| **生产就绪**   | ❌ 仅原型/演示         | ✅ 适合大多数场景           | **✅ 专业偏好管理**          | ✅ 适合复杂应用             |

::alert{type="success"}
**选择建议**<br>
- **需要记住用户偏好？** → 选择 PreferenceTextMemory<br>
- **需要通用记忆检索？** → 使用 GeneralTextMemory<br>
- **需要知识图谱？** → 选择 TreeTextMemory
::

## 最佳实践

遵循以下建议，充分发挥 PreferenceTextMemory 的优势：

::steps{}

### 1. 合理设置集合

```python
# 为不同类型的偏好创建独立集合
config = {
    "vector_db": {
        "backend": "qdrant",
        "config": {
            "collection_name": [
                "explicit_preference",   # 显式偏好
                "implicit_preference"    # 隐式偏好
            ]
        }
    }
}

# 这样可以：
# ✓ 分别查询显式和隐式偏好
# ✓ 对不同类型应用不同的处理逻辑
# ✓ 便于偏好分析和可视化
```

### 2. 充分利用过滤器

```python
# 精准检索用户的特定偏好
results = memory.search(
    query="界面设置偏好",
    top_k=10,
    search_filter={
        "user_id": "user_001",              # ✓ 用户隔离
        "status": "activated",              # ✓ 只查询激活的偏好
        "preference_type": "explicit_preference",  # ✓ 只要显式偏好
        "created_at": {"$gte": "2026-01-01"}  # ✓ 只要最近的偏好
    }
)
```

### 3. 定期清理过时偏好

```python
from datetime import datetime, timedelta

# 归档 6 个月前的偏好
six_months_ago = (datetime.now() - timedelta(days=180)).isoformat()

memory.delete_by_filter({
    "created_at": {"$lt": six_months_ago},
    "status": "activated"
})

print("✓ 已归档过时偏好")
```

### 4. 处理偏好冲突

```python
def resolve_preference_conflict(memory, new_pref, user_id):
    """智能解决偏好冲突"""
    # 搜索相似的现有偏好
    similar = memory.search(
        query=new_pref,
        top_k=5,
        search_filter={"user_id": user_id}
    )
    
    # 检测冲突
    for pref in similar:
        if is_conflicting(pref.memory, new_pref):
            # 方案 1: 用新偏好替换旧偏好
            memory.delete([pref.id])
            print(f"✓ 已替换冲突偏好: {pref.memory}")
            
            # 方案 2: 标记为已归档
            # memory.delete_by_filter({
            #     "id": pref.id,
            #     "status": "activated"
            # })
    
    return True

# 使用示例
new_preference = "用户喜欢详细的解释"
resolve_preference_conflict(memory, new_preference, "user_001")
```

### 5. 监控偏好质量

```python
# 定期评估偏好提取质量
def evaluate_preference_quality(memory, sample_size=100):
    """评估偏好质量"""
    all_prefs = memory.get_all()
    
    stats = {
        "total": 0,
        "explicit": 0,
        "implicit": 0,
        "with_tags": 0,
        "avg_confidence": []
    }
    
    for collection, prefs in all_prefs.items():
        stats["total"] += len(prefs)
        
        for pref in prefs[:sample_size]:
            if pref.metadata.preference_type == "explicit_preference":
                stats["explicit"] += 1
            else:
                stats["implicit"] += 1
            
            if hasattr(pref.metadata, 'tags') and pref.metadata.tags:
                stats["with_tags"] += 1
            
            if hasattr(pref.metadata, 'confidence') and pref.metadata.confidence:
                stats["avg_confidence"].append(pref.metadata.confidence)
    
    # 输出统计
    print(f"📊 偏好质量报告:")
    print(f"  总数: {stats['total']}")
    print(f"  显式: {stats['explicit']}")
    print(f"  隐式: {stats['implicit']}")
    print(f"  有标签: {stats['with_tags']}")
    if stats["avg_confidence"]:
        avg_conf = sum(stats["avg_confidence"]) / len(stats["avg_confidence"])
        print(f"  平均置信度: {avg_conf:.2f}")

# 使用示例
evaluate_preference_quality(memory)
```

::

::alert{type="warning"}
**开发者注意事项**<br>
- 偏好数据存储在向量数据库中，需要正确配置 Qdrant 或 Milvus<br>
- 提取器使用 LLM，确保 API 配额充足<br>
- 大规模数据时建议使用重排序器（reranker）提升检索精度<br>
- 定期备份偏好数据，使用 `dump()` 和 `load()` 方法<br>
- 查看 `/examples/` 目录获取更多实战案例
::

## 下一步

恭喜！你已经掌握了 PreferenceTextMemory 的核心用法。接下来可以：

::list{icon="ph:arrow-right-duotone"}
- **探索其他记忆模块**：了解 [TreeTextMemory](/open_source/modules/memories/tree_textual_memory) 的图结构能力
- **学习向量数据库**：深入理解 [Qdrant](https://qdrant.tech/) 或 Milvus 的配置
- **优化检索性能**：配置 [重排序器](/open_source/modules/reranker) 提升检索精度
::

