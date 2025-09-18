---
title: Linux API版
---

## 情景设计

**🎯 问题场景：** 你是一名AI应用开发者，已经学会了MemOS的基础操作，现在想要创建更结构化的记忆系统。你发现基础的`TextualMemoryMetadata`功能有限，无法满足复杂场景的需求，比如需要区分工作记忆和长期记忆，需要追踪记忆的来源，需要为记忆添加标签和实体信息。

**🔧 解决方案：** 通过本章，你将学会使用`TreeNodeTextualMemoryMetadata`创建结构化记忆，包括记忆生命周期管理、多源追踪、实体标签等功能，让你的AI应用拥有更智能的记忆系统。

## 配方 2.1：理解 TreeNodeTextualMemoryMetadata 的核心概念

**🎯 问题场景：** 你想要了解`TreeNodeTextualMemoryMetadata`与基础元数据的区别，以及它的核心功能。

**🔧 解决方案：** 通过这个配方，你将掌握`TreeNodeTextualMemoryMetadata`的核心概念和基本结构。

### 基本导入

```python
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata
```

### 核心概念

#### 1. 记忆类型 (memory_type)

- `WorkingMemory`: 工作记忆，临时存储
- `LongTermMemory`: 长期记忆，持久存储  
- `UserMemory`: 用户记忆，个性化存储

#### 2. 记忆状态 (status)

- `activated`: 激活状态
- `archived`: 归档状态
- `deleted`: 删除状态

#### 3. 记忆类型 (type)

- `fact`: 事实
- `event`: 事件
- `opinion`: 观点
- `topic`: 主题
- `reasoning`: 推理
- `procedure`: 程序

## 配方 2.2：创建基础的结构化记忆

**🎯 问题场景：** 你想要创建不同类型的内存，比如人物信息、项目信息、工作任务等，需要为每种记忆设置合适的元数据。

**🔧 解决方案：** 通过这个配方，你将学会创建各种类型的结构化记忆。

### 示例1：创建简单的人物记忆

创建文件 `create_person_memory_api.py`：

```python
# create_person_memory_api.py
# 🎯 创建人物记忆的示例 (API版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_person_memory_api():
    """
    🎯 创建人物记忆的示例 (API版)
    """
    
    print("🚀 开始创建人物记忆 (API版)...")
    
    # 加载环境变量
    load_dotenv()
    
    # 检查API配置
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ 未配置OPENAI_API_KEY。请在.env文件中配置OpenAI API密钥。")
    
    print("✅ 检测到OpenAI API模式")
    
    # 获取用户ID
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # 创建人物记忆的元数据
    metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="张三_信息",
        entities=["张三", "工程师"],
        tags=["人员", "技术"]
    )

    # 创建记忆项
    memory_item = TextualMemoryItem(
        memory="张三是我们公司的资深工程师，擅长Python和机器学习",
        metadata=metadata
    )

    print(f"记忆内容: {memory_item.memory}")
    print(f"记忆键: {memory_item.metadata.key}")
    print(f"记忆类型: {memory_item.metadata.memory_type}")
    print(f"标签: {memory_item.metadata.tags}")
    print(f"🎯 配置模式: OPENAI API")
    
    return memory_item

if __name__ == "__main__":
    create_person_memory_api()
```

运行命令：

```bash
cd test_cookbook/chapter2/API/2
python create_person_memory_api.py
```

### 示例2：创建项目记忆

创建文件 `create_project_memory_api.py`：

```python
# create_project_memory_api.py
# 🎯 创建项目记忆的示例 (API版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_project_memory_api():
    """
    🎯 创建项目记忆的示例 (API版)
    """
    
    print("🚀 开始创建项目记忆 (API版)...")
    
    # 加载环境变量
    load_dotenv()
    
    # 检查API配置
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ 未配置OPENAI_API_KEY。请在.env文件中配置OpenAI API密钥。")
    
    print("✅ 检测到OpenAI API模式")
    
    # 获取用户ID
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # 创建项目记忆的元数据
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="AI项目_详情",
        entities=["AI项目", "机器学习"],
        tags=["项目", "AI", "重要"],
        sources=["项目文档", "会议记录"]
    )

    # 创建记忆项
    project_memory = TextualMemoryItem(
        memory="AI项目是一个智能客服系统，使用最新的NLP技术，预计6个月完成",
        metadata=project_metadata
    )

    print(f"项目记忆: {project_memory.memory}")
    print(f"来源: {project_memory.metadata.sources}")
    print(f"🎯 配置模式: OPENAI API")
    
    return project_memory

if __name__ == "__main__":
    create_project_memory_api() 
```

运行命令：

```bash
python create_project_memory_api.py
```

### 示例3：创建工作记忆

创建文件 `create_work_memory_api.py`：

```python
# create_work_memory_api.py
# 🎯 创建工作记忆的示例 (API版)
import os
from dotenv import load_dotenv
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_work_memory_api():
    """
    🎯 创建工作记忆的示例 (API版)
    """
    
    print("🚀 开始创建工作记忆 (API版)...")
    
    # 加载环境变量
    load_dotenv()
    
    # 检查API配置
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        raise ValueError("❌ 未配置OPENAI_API_KEY。请在.env文件中配置OpenAI API密钥。")
    
    print("✅ 检测到OpenAI API模式")
    
    # 获取用户ID
    user_id = os.getenv("MOS_USER_ID", "default_user")
    
    # 创建工作记忆的元数据
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=user_id,
        type="procedure",
        source="conversation",
        confidence=80.0,
        memory_type="WorkingMemory",  # 工作记忆
        key="今日任务",
        tags=["任务", "今日"]
    )

    # 创建记忆项
    work_memory = TextualMemoryItem(
        memory="今天需要完成代码审查、团队会议、以及准备明天的演示",
        metadata=work_metadata
    )

    print(f"工作记忆: {work_memory.memory}")
    print(f"记忆类型: {work_memory.metadata.memory_type}")
    print(f"🎯 配置模式: OPENAI API")
    
    return work_memory

if __name__ == "__main__":
    create_work_memory_api() 
```

运行命令：

```bash
python create_work_memory_api.py
```

## 配方 2.3：常用字段说明和配置

**🎯 问题场景：** 你需要了解`TreeNodeTextualMemoryMetadata`的所有可用字段，以及如何正确配置它们。

**🔧 解决方案：** 通过这个配方，你将掌握所有字段的含义和配置方法。

### 常用字段说明

| 字段          | 类型  | 说明             | 示例                   |
| ------------- | ----- | ---------------- | ---------------------- |
| `user_id`     | str   | 用户ID           | "user123"              |
| `type`        | str   | 记忆类型         | "fact", "event"        |
| `source`      | str   | 来源             | "conversation", "file" |
| `confidence`  | float | 置信度(0-100)    | 90.0                   |
| `memory_type` | str   | 记忆生命周期类型 | "LongTermMemory"       |
| `key`         | str   | 记忆键/标题      | "重要信息"             |
| `entities`    | list  | 实体列表         | ["张三", "项目"]       |
| `tags`        | list  | 标签列表         | ["重要", "技术"]       |
| `sources`     | list  | 多源列表         | ["文档", "会议"]       |

## 配方 2.4：实际应用 - 创建记忆并添加到MemCube

**🎯 问题场景：** 你已经学会了创建结构化记忆，现在想要将这些记忆添加到MemCube中，并进行查询和管理。

**🔧 解决方案：** 通过这个配方，你将学会如何将结构化记忆集成到MemCube中，并实现完整的记忆管理流程。

创建文件 `memcube_with_structured_memories_api.py`：

```python
# memcube_with_structured_memories_api.py
# 🎯 将结构化记忆添加到MemCube的完整示例 (API版)
import os
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.memories.textual.item import TextualMemoryItem, TreeNodeTextualMemoryMetadata

def create_memcube_config_api():
    """
    🎯 创建MemCube配置 (API版)
    """
    
    print("🔧 创建MemCube配置 (API版)...")
    
    # 加载环境变量
    load_dotenv()
    
    # 检查API配置
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    
    if not openai_key:
        raise ValueError("❌ 未配置OPENAI_API_KEY。请在.env文件中配置OpenAI API密钥。")
    
    print("✅ 检测到OpenAI API模式")
    
    # 获取配置
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # OpenAI模式配置
    config = GeneralMemCubeConfig(
        user_id=user_id,
        cube_id=f"{user_id}_structured_memories_cube",
        text_mem={
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": "gpt-3.5-turbo",
                        "api_key": openai_key,
                        "api_base": openai_base,
                        "temperature": 0.1,
                        "max_tokens": 1024,
                    }
                },
                "embedder": {
                    "backend": "universal_api",
                    "config": {
                        "provider": "openai",
                        "api_key": openai_key,
                        "model_name_or_path": "text-embedding-ada-002",
                        "base_url": openai_base,
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_structured_memories",
                        "vector_dimension": 1536,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        act_mem={"backend": "uninitialized"},
        para_mem={"backend": "uninitialized"}
    )
    
    return config

def create_structured_memories_api():
    """
    🎯 将结构化记忆添加到MemCube的完整示例 (API版)
    """
    
    print("🚀 开始创建结构化记忆MemCube (API版)...")
    
    # 创建MemCube配置
    config = create_memcube_config_api()
    
    # 创建MemCube
    mem_cube = GeneralMemCube(config)
    
    print("✅ MemCube创建成功！")
    print(f"  📊 用户ID: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 文本记忆后端: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 嵌入模型: text-embedding-ada-002 (OpenAI)")
    print(f"  🎯 配置模式: OPENAI API")
    
    # 创建多个记忆项
    memories = []

    # 记忆1：人物信息
    person_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="conversation",
        confidence=90.0,
        memory_type="LongTermMemory",
        key="李四_信息",
        entities=["李四", "设计师"],
        tags=["人员", "设计"]
    )

    memories.append({
        "memory": "李四是我们的UI设计师，有5年经验，擅长用户界面设计",
        "metadata": person_metadata
    })

    # 记忆2：项目信息
    project_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="fact",
        source="file",
        confidence=95.0,
        memory_type="LongTermMemory",
        key="移动应用项目",
        entities=["移动应用", "开发"],
        tags=["项目", "移动端", "重要"]
    )

    memories.append({
        "memory": "移动应用项目正在进行中，预计3个月完成，团队有8个人",
        "metadata": project_metadata
    })

    # 记忆3：工作记忆
    work_metadata = TreeNodeTextualMemoryMetadata(
        user_id=mem_cube.config.user_id,
        type="procedure",
        source="conversation",
        confidence=85.0,
        memory_type="WorkingMemory",
        key="本周任务",
        tags=["任务", "本周"]
    )

    memories.append({
        "memory": "本周需要完成需求分析、原型设计、以及技术选型",
        "metadata": work_metadata
    })

    # 添加到MemCube
    mem_cube.text_mem.add(memories)

    print("✅ 成功添加了3个记忆项到MemCube")

    # 查询记忆
    print("\n🔍 查询所有记忆:")
    all_memories = mem_cube.text_mem.get_all()
    for i, memory in enumerate(all_memories, 1):
        print(f"{i}. {memory.memory}")
        print(f"   键: {memory.metadata.key}")
        print(f"   类型: {memory.metadata.memory_type}")
        print(f"   标签: {memory.metadata.tags}")
        print()

    # 搜索特定记忆
    print("🔍 搜索包含'李四'的记忆:")
    search_results = mem_cube.text_mem.search("李四", top_k=2)
    for result in search_results:
        print(f"- {result.memory}")
    
    return mem_cube

if __name__ == "__main__":
    create_structured_memories_api() 
```

运行命令：

```bash
cd test_cookbook/chapter2/API/4
python memcube_with_structured_memories_api.py
```

## 常见问题和解决方案

**Q1: 如何选择合适的memory_type？**

```python
# 🔧 根据记忆的重要性选择
if is_important:
    memory_type = "LongTermMemory"  # 长期存储
elif is_temporary:
    memory_type = "WorkingMemory"   # 临时存储
else:
    memory_type = "UserMemory"      # 个性化存储
```

**Q2: 如何设置合适的confidence值？**

```python
# 🔧 根据信息来源的可靠性设置
if source == "verified_document":
    confidence = 95.0
elif source == "conversation":
    confidence = 80.0
elif source == "web_search":
    confidence = 70.0
```

**Q3: 如何有效使用tags和entities？**

```python
# 🔧 使用有意义的标签和实体
tags = ["项目", "技术", "重要"]  # 便于分类和检索
entities = ["张三", "AI项目"]    # 便于实体识别和关联
```