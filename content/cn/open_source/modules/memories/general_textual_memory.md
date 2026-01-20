---
title: "GeneralTextMemory: 通用文本的记忆"
desc: "`GeneralTextMemory` 是MemOS中一个灵活的、基于向量的明文记忆模块，用于存储、搜索和管理非结构化知识。它适用于会话代理、个人助理和任何需要语义记忆检索的系统。"
---
## 目录

- [记忆结构](#记忆结构)
  - [元数据域 (`TextualMemoryMetadata`)](#元数据域-textualmemorymetadata)
- [API总结 (`GeneralTextMemory`)](#api总结-generaltextmemory)
  - [初始化](#初始化)
  - [核心方法](#核心方法)
- [文件存储](#文件存储)
- [示例用法](#示例用法)
- [扩展与进阶](#扩展与进阶)
  - [互联网检索](#互联网检索)
  - [MultiModal Reader](#multimodal-reader)
- [开发者注意事项](#开发者注意事项)


## 记忆结构

每个记忆被表达为一个`TextualMemoryItem`:

| 字段      | 类型                        | 描述                        |
| ---------- | --------------------------- | ---------------------------------- |
| `id`       | `str`                       | UUID (如果省略则自动生成)   |
| `memory`   | `str`                       | 记忆内容主体 (必填) |
| `metadata` | `TextualMemoryMetadata`     | 元数据（用于搜索/过滤）     |

### 元数据域 (`TextualMemoryMetadata`)

| 字段         | 类型                                               | 描述                         |
| ------------- | -------------------------------------------------- | ----------------------------------- |
| `type`        | `"procedure"`, `"fact"`, `"event"`, `"opinion"` | 记忆类型                         |
| `memory_time` | `str (YYYY-MM-DD)`                                 | 记忆所指的日期/时间      |
| `source`      | `"conversation"`, `"retrieved"`, `"web"`, `"file"` | 记忆源                |
| `confidence`  | `float (0-100)`                                    | 确定性/可信度评分          |
| `entities`    | `list[str]`                                        | 主要实体/概念               |
| `tags`        | `list[str]`                                        | 主题标签                       |
| `visibility`  | `"private"`, `"public"`, `"session"`            | 访问范围                        |
| `updated_at`  | `str`                                              | 最近更新时间戳 (ISO 8601)    |

所有的值都经过验证，无效的值将引发错误。

## API总结 (`GeneralTextMemory`)

### 初始化
```python
GeneralTextMemory(config: GeneralTextMemoryConfig)
```

### 核心方法
| 方法                   | 描述                                         |
| ------------------------ | --------------------------------------------------- |
| `extract(messages)`      | 从消息列表中提取记忆 (基于LLM)     |
| `add(memories)`          | 添加一个或多个记忆 (条目或字典)          |
| `search(query, top_k)`   | 使用向量相似度检索top-k记忆    |
| `get(memory_id)`         | 通过ID获取单个记忆                           |
| `get_by_ids(ids)`        | 通过ID获取多个记忆                      |
| `get_all()`              | 返回所有记忆                                |
| `update(memory_id, new)` | 通过ID更新一个记忆                               |
| `delete(ids)`            | 通过ID删除记忆                              |
| `delete_all()`           | 删除所有记忆                                 |
| `dump(dir)`              | 将所有记忆序列化到目录中的JSON文件    |
| `load(dir)`              | 从存储的文件中加载记忆                       |

## 文件存储

当调用 `dump(dir)`, 系统会将记忆保存到：

```
<dir>/<config.memory_filename>
```

该文件包含所有记忆条目的JSON列表，可以使用`load(dir)`重新加载.

## 示例用法

```python
import os
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

config = MemoryConfigFactory(
    backend="general_text",
    config={
        "extractor_llm": { ... },
        "vector_db": { ... },
        "embedder": { ... },
    },
)
m = MemoryFactory.from_config(config)

# Extract and add memories
memories = m.extract([
    {"role": "user", "content": "I love tomatoes."},
    {"role": "assistant", "content": "Great! Tomatoes are delicious."},
])
m.add(memories)

# Add a manually created memory item
memory_id = "xxx"
m.add(
  [
        {
            "id": memory_id,
            "memory": "User is Chinese.",
            ...
        }
    ]  
)

# Search
results = m.search("Tell me more about the user", top_k=2)

# Update
m.update(memory_id, {"memory": "User is Canadian.", ...})

# Delete
m.delete([memory_id])

# Dump/load
m.dump("tmp/mem")
m.load("tmp/mem")
```

::alert{type="info"}
**扩展：互联网检索**<br>
GeneralTextMemory 可以与互联网检索结合使用，从网页提取内容并添加到记忆库。<br>
查看示例：[从互联网检索记忆](./tree_textual_memory#从互联网检索记忆可选)
::

::alert{type="info"}
**进阶：使用 MultiModal Reader**<br>
如果需要处理图片、URL、文件等多模态内容，可以使用 `MultiModalStructMemReader`。<br>
查看完整示例：[使用 MultiModalStructMemReader](./tree_textual_memory#使用-multimodalstructmemreader高级)
::

## 开发者注意事项

* 使用Qdrant（或兼容）向量DB进行快速相似度搜索
* 嵌入和提取模型是可配置的（支持olama/OpenAI）
* `/tests`中的集成测试涵盖了所有方法。
