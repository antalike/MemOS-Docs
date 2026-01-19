---
title: 你的第一个记忆
desc: "动手实战！我们将带你使用 **SimpleStructMemReader** 从对话中提取记忆，并把它存进 **TreeTextMemory** 里。"
---

## 你将学到什么

通过这个实战指南，你将掌握 MemOS 的核心“三板斧”：

1.  **读 (Read)**：怎么用 `SimpleStructMemReader` 把乱七八糟的聊天记录变成结构化的记忆。
2.  **存 (Add)**：怎么把提取出来的记忆存进 `TreeTextMemory`（图数据库）。
3.  **搜 (Search)**：怎么用自然语言把存进去的记忆搜出来。

---

## 动手试试

下面的代码展示了如何处理一段“网球打不好”的对话。我们会从中提取关键信息，存起来，然后再搜出来。

### 1. 导入模块

```python
import time
from memos import log
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.configs.memory import TreeTextMemoryConfig
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory

logger = log.get_logger(__name__)
```

### 2. 初始化核心组件

我们需要两个帮手：一个负责“看”，一个负责“记”。

*   **TreeTextMemory**: 你的记忆仓库。它底层连着图数据库（比如 Neo4j），负责把记忆存得井井有条。
*   **SimpleStructMemReader**: 你的速记员。它负责读懂对话，把重要的信息（比如用户的喜好、经历）摘录下来。

```python
# 1. 启动记忆仓库 (TreeTextMemory)
# 加载配置文件，告诉它数据库在哪
tree_config = TreeTextMemoryConfig.from_json_file(
    "examples/data/config/tree_config_shared_database.json"
)
my_tree_textual_memory = TreeTextMemory(tree_config)

# ⚠️ 注意：这里为了演示方便清空了旧数据。生产环境千万别这么干！
my_tree_textual_memory.delete_all()

# 2. 雇佣速记员 (SimpleStructMemReader)
# 加载配置，告诉它用哪个 LLM (比如 GPT-4o) 来理解对话
reader_config = SimpleStructMemReaderConfig.from_json_file(
    "examples/data/config/simple_struct_reader_config.json"
)
reader = SimpleStructMemReader(reader_config)
```

### 3. 准备一段对话

假设这是用户和 AI 的一段聊天记录。用户在吐槽最近打网球状态不对，感觉身体被掏空。

```python
scene_data = [
    [
        {
            "role": "user",
            "chat_time": "3 May 2025",
            "content": "This week I’ve been feeling a bit off, especially when playing tennis. My body just doesn’t feel right.",
        },
        {
            "role": "assistant",
            "chat_time": "3 May 2025",
            "content": "It sounds like you've been having some physical discomfort lately...",
        },
        # ... (中间省略了几轮吐槽) ...
        {
            "role": "user",
            "chat_time": "3 May 2025",
            "content": "I think it might be due to stress and lack of sleep recently...",
        },
    ]
]
```

### 4. 提取并存储

这是最神奇的一步：Reader 会自动分析对话，提取出“用户最近压力大”、“睡眠不足”、“网球表现下降”等关键记忆点，然后存入数据库。

```python
# 1. 提取 (Extract)
# Reader 会调用 LLM 分析对话，返回一个记忆列表
memory = reader.get_memory(
    scene_data, 
    type="chat", 
    info={"user_id": "1234", "session_id": "2222"}
)

# 2. 存储 (Add)
for m_list in memory:
    added_ids = my_tree_textual_memory.add(m_list)
    
    # 看看存进去了啥
    for i, id in enumerate(added_ids):
        print(f"存入第 {i} 条记忆: " + my_tree_textual_memory.get(id).memory)
    
    # 等待后台整理完成（建立索引需要一点时间）
    my_tree_textual_memory.memory_manager.wait_reorganizer()
```

### 5. 检索记忆

记忆存好了，怎么用呢？当然是搜出来！

**基础搜索 (Search):**

就像用搜索引擎一样，直接问它。

```python
# 稍微等一下索引构建
time.sleep(2)

init_time = time.time()

# 试着搜一下关于“童年”的事（假设之前的对话里包含相关内容）
# 或者搜 "Why is the user feeling bad?" 试试
results = my_tree_textual_memory.search(
    "Talk about the user's childhood story?",
    top_k=10,
    info={
        "query": "Talk about the user's childhood story?",
        "user_id": "111",
        "session_id": "2234",
    },
)

for i, r in enumerate(results):
    print(f"搜到的第 {i} 条结果: {r.memory}")

print(f"搜索耗时: {round(time.time() - init_time)}s")
```

**高级搜索 (Fine Mode):**

如果你想要更聪明一点的搜索结果（比如让 LLM 帮你总结一下搜到的内容），可以开启 `mode="fine"`。

```python
# 开启 Fine 模式
results_fine_search = my_tree_textual_memory.search(
    "Recent news in the first city you've mentioned.",
    top_k=10,
    mode="fine", # 关键在这里
    info={
        "query": "Recent news in NewYork",
        "user_id": "111",
        "session_id": "2234",
        "chat_history": [
            {"role": "user", "content": "I want to know three beautiful cities"},
            {"role": "assistant", "content": "New York, London, and Shanghai"},
        ],
    },
)

for i, r in enumerate(results_fine_search):
    print(f"Fine Search 结果: {r.memory}")
```

### 6. 进阶：多模态与工具 (Modality & Tools)

MemOS 的 Reader 不仅仅能读文字聊天，还能处理文档、工具调用甚至图片（多模态）。

#### 1. 读取文档 (Documents)

Reader 可以直接读取本地文件内容，将其转化为记忆。这对于建立知识库非常有用。

```python
# 构造文档数据
doc_data = [
    {
        "type": "file",
        "file": {
            "filename": "tennis_rule.txt",
            "path": "./tennis_rule.txt", # 确保文件存在
            # 或者直接提供 content: "file_data": "..."
        }
    }
]

# 告诉 Reader 这是 "doc" 类型
doc_memories = reader.get_memory(
    doc_data, 
    type="doc", 
    info={"user_id": "1234", "session_id": "docs_import"}
)

# 存入记忆
for m in doc_memories:
    my_tree_textual_memory.add(m)
```

#### 2. 工具调用 (Tools)

当 Agent 使用工具（如搜索、计算器）时，Reader 能解析工具的输入输出，记录下“用户查询了天气”、“计算结果是50”等事实。

```python
tool_scene = [
    [
        {"role": "user", "content": "What's the weather in Beijing?"},
        {
            "role": "assistant", 
            "content": "", 
            "tool_calls": [{"id": "call_1", "function": {"name": "get_weather", "arguments": "{'city': 'Beijing'}"}}]
        },
        {
            "role": "tool", 
            "tool_call_id": "call_1", 
            "content": "Sunny, 25°C"
        }
    ]
]

# Reader 会自动理解这是工具交互
tool_memories = reader.get_memory(tool_scene, type="chat", info={"user_id": "1234"})
```

### 7. 用户偏好 (Preferences)

除了事实性记忆（TreeTextMemory），MemOS 还有专门的 **PreferenceTextMemory** 来管理用户喜好（如“喜欢吃辣”、“讨厌下雨”）。它使用向量数据库（如 Milvus/Qdrant）来存储，方便快速检索用户的个性化设置。

```python
from memos.memories.textual.simple_preference import SimplePreferenceTextMemory
# 注意：初始化需要配置 VectorDB, Embedder 等，这里仅作示意
# pref_memory = SimplePreferenceTextMemory(...)

# 从对话中自动提取偏好
# 比如用户说："I prefer dark mode."
pref_memories = pref_memory.get_memory(chat_data, type="chat", info=...)

# 存入偏好
pref_memory.add(pref_memories)

# 搜索偏好
prefs = pref_memory.search("What is the user's UI preference?", top_k=1)
print(prefs[0].memory) # 输出: "User prefers dark mode"
```

### 8. 记忆反馈 (Feedback)

记忆不是一成不变的。用户可能会纠正 AI：“我不喜欢红色，我改主意了，我喜欢蓝色”。**MemFeedback** 模块就是用来处理这种“修正”的。

它可以：
1.  **修改**错误的记忆。
2.  **删除**过时的记忆。
3.  **合并**冲突的记忆。

```python
from memos.mem_feedback.simple_feedback import SimpleMemFeedback

# 初始化反馈模块
# feedback_module = SimpleMemFeedback(...)

# 处理用户反馈
# 假设用户说："Actually, I started playing tennis in 2020, not 2018."
feedback_module.process_feedback({
    "user_id": "1234",
    "feedback_content": "Actually, I started playing tennis in 2020, not 2018.",
    "chat_history": [...], # 提供上下文
    "feedback_time": "Now"
})

# 反馈模块会自动在后台更新 Graph 数据库中的节点和关系
```

### 总结

现在你已经掌握了 MemOS 的核心工作流：
1.  **Reader**: 从 Chat/Doc/Tool 中提取信息。
2.  **Memory**: 用 TreeTextMemory 存事实，PreferenceMemory 存偏好。
3.  **Search**: 随时检索记忆增强 LLM。
4.  **Feedback**: 允许用户修正记忆，保持准确。

下一步，你可以尝试运行 `examples/mem_os/simple_memos.py`，体验一个整合了所有这些功能的完整 Agent！

### 7. 收尾

测试做完了，记得清理战场。

```python
# 关闭后台线程
my_tree_textual_memory.memory_manager.close()

# 备份一下记忆
my_tree_textual_memory.dump("tmp/my_tree_textual_memory")

# 删库跑路（仅限测试环境！）
my_tree_textual_memory.drop()
```

---

## 下一步？

恭喜！你已经跑通了 MemOS 的核心流程：**读 -> 存 -> 搜**。

接下来，你可以去看看更高级的玩法：
- **[MemReader](/open_source/modules/mem_reader)**：其实它还能读图片和 PDF。
- **[MemFeedback](/open_source/modules/mem_feedback)**：如果有记忆记错了，怎么让 AI 自动修正？
- **[MemCube](/open_source/modules/mem_cube)**：怎么把各种记忆能力打包在一起，做一个真正的全能大脑。
