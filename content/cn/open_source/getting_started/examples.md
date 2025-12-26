---
title: MemOS 示例
desc: "恭喜你——你已经掌握了快速入门并构建了第一个可用的记忆！现在是时候通过结合不同的记忆类型和功能，看看 MemOS 可以实现多大的可能性。使用这些精选示例来激发你自己的智能体、聊天机器人或知识系统的灵感。"
---

::card-group

  :::card
  ---
  icon: ri:play-line
  title: 最简Pipeline 
  to: /cn/open_source/getting_started/examples#示例-1最简pipeline
  ---
  最小的可用Pipeline  — 添加、搜索明文记忆。
  :::

  :::card
  ---
  icon: ri:tree-line
  title: 多信息源的添加与检索
  to: /cn/open_source/getting_started/examples#示例-2多信息源记忆的添加与检索
  ---
  添加文本、图片、文件、工具调用的多信息源messages到记忆，并能够检索它们。
  :::

  :::card
  ---
  icon: ri:apps-line
  title: 多Cube添加和检索
  to: /cn/open_source/getting_started/examples#示例-3多cube添加和检索
  ---
  添加不同记忆到不同的Cube，在检索时同时召回它们。
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: 仅 KVCacheMemory
  to: /cn/open_source/getting_started/examples#示例-4仅-kvcachememory
  ---
  使用短期 KV cache加速会话，实现快速上下文注入。
  :::

  :::card
  ---
  icon: hugeicons:share-07
  title: 混合 TreeText + KVCache
  to: /cn/open_source/getting_started/examples#示例-5混合模式
  ---
  在单一 MemCube 中结合可解释的基于图的明文记忆和快速 KV cache。
  :::

  :::card
  ---
  icon: ri:calendar-check-line
  title: 多记忆调度
  to: /cn/open_source/getting_started/examples#示例-6多记忆调度
  ---
  为多用户、多会话智能体运行动态记忆调用。
  :::

::

## 示例 1：最简Pipeline

### 何时使用：
- 你想要最小的入门可用示例。
- 你只需要将简单的明文记忆存储到数据库中，并能够检索它们。

### 关键点：
- 支持基础的个人用户记忆添加、搜索。

### 完整示例代码
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_1"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_1"],
    messages = [
      {"role": "user", "content": "I’ve planned to travel to Guangzhou during the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, Ji Hotel, Hilton], etc."},
      {"role": "user", "content": "I’ll choose 7 Days Inn."},
      {"role": "assistant", "content": "Okay, feel free to ask me if you have any other questions."}
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_1"],
    query="Please recommend a hotel that I haven’t stayed at before.",
    include_preference=True,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
````

## 示例 2：多信息源记忆的添加与检索

### 何时使用：

- 除单纯的文本对话外，你需要将文件、图片内容或工具调用历史信息加入记忆
- 同时你想要检索这些多源信息的记忆

### 关键点：

- 多种信息来源的记忆添加
- 需要有可下载的文件、图片url
- 添加的信息需要严格符合OpenAI Messages格式
- system prompt中的工具Schema需要包装在<tool_chema> </tool_schema>中

### 完整示例代码
添加文本+文件到记忆中
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_2"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_2"],
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Please read this file, summarize the key points, and provide a final conclusion."
                },
                {
                    "type": "file",
                    "file": {
                    "file_id": "file_123",
                    "filename": "report.md",
                    "file_data": "@http://139.196.232.20:9090/graph-test/algorithm/2025_11_13/1763043889_1763043782_PM1%E8%BD%A6%E9%97%B4PMT%E9%9D%B4%E5%8E%8B%E8%BE%B9%E5%8E%8B%E5%8E%8B%E5%8A%9B%E6%97%A0%E6%B3%95%E5%BB%BA%E7%AB%8B%E6%95%85%E9%9A%9C%E6%8A%A5%E5%91%8A20240720.md"
                    }
                },
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Final Summary: During the PMT boot-pressure startup test of the PM1 workshop on July 20, 2024, the drive could not run because the edge pressures on both sides failed to reach the 2.5-bar interlock requirement. After troubleshooting, the PLC output signals, hydraulic pipelines, and valves were all found to be normal. The root cause was ultimately identified as poor contact at the negative terminal of the proportional valve’s DC 24V power supply inside the PLC cabinet, caused by a short-jumpered terminal block. After re-connecting the negative incoming lines in parallel, the equipment returned to normal operation. It is recommended to replace terminal blocks in batches, inspect instruments with uncertain service life, and optimize the troubleshooting process by tracing common-mode issues from shared buses and power supply sources."
                }
            ]
        }
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_2"],
    query="Workshop PMT boot pressure startup test",
    include_preference=False,
)
search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```
添加多种混合信息源的messages到记忆中
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_2"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_2"],
    messages = [
  {
    "role": "system",
    "content": [
      {
        "type": "text",
        "text": "You are a professional industrial fault analysis assistant. Please read the PDF, images, and instructions provided by the user and provide a professional technical summary.\n\n<tool_schema>\n[\n  {\n    \"name\": \"file_reader\",\n    \"description\": \"Used to read the content of files uploaded by the user and return the text data (in JSON string format).\",\n    \"parameters\": [\n      {\"name\": \"file_id\", \"type\": \"string\", \"required\": true, \"description\": \"The file ID to be read\"}\n    ],\n    \"returns\": {\"type\": \"text\", \"description\": \"Returns the extracted text content of the file\"}\n  }\n]\n</tool_schema>"
      }
    ]
  },
  {
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Please read this file and image, summarize the key points, and provide a final conclusion."
      },
      {
        "type": "file",
        "file": {
          "file_id": "file_123",
          "filename": "report.pdf",
          "file_data": "@http://139.196.232.20:9090/graph-test/algorithm/2025_11_13/1763043889_1763043782_PM1%E8%BD%A6%E9%97%B4PMT%E9%9D%B4%E5%8E%8B%E8%BE%B9%E5%8E%8B%E5%8E%8B%E5%8A%9B%E6%97%A0%E6%B3%95%E5%BB%BA%E7%AB%8B%E6%95%85%E9%9A%9C%E6%8A%A5%E5%91%8A20240720.md"
        }
      },
      {
        "type": "image_url",
        "image_url": {
          "url": "https://play-groud-test-1.oss-cn-shanghai.aliyuncs.com/%E5%9B%BE%E7%89%871.jpeg"
        }
      }
    ]
  },
  {
    "role": "assistant",
    "tool_calls": [
      {
        "id": "call_file_reader_001",
        "type": "function",
        "function": {
          "name": "file_reader",
          "arguments": "{\"file_id\": \"file_123\"}"
        }
      }
    ]
  },
  {
    "role": "tool",
    "tool_call_id": "call_file_reader_001",
    "content": [
      {
        "type": "text",
        "text": "{\"file_id\":\"file_123\",\"extracted_text\":\"PM1 workshop PMT boot pressure startup test record… Final fault cause: poor contact at the negative terminal of the DC 24V power supply circuit due to a short-jumped terminal block.\"}"
      }
    ]
  },
  {
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Final Summary: During the PMT boot-pressure startup test of the PM1 workshop on July 20, 2024, the drive could not run because the edge pressures on both sides failed to reach the 2.5-bar interlock requirement. After troubleshooting, the PLC output signals, hydraulic pipelines, and valves were all found to be normal. The root cause was ultimately identified as poor contact at the negative terminal of the proportional valve’s DC 24V power supply inside the PLC cabinet, caused by a short-jumpered terminal block. After re-connecting the negative incoming lines in parallel, the equipment returned to normal operation. It is recommended to replace terminal blocks in batches, inspect instruments with uncertain service life, and optimize the troubleshooting process by tracing common-mode issues from shared buses and power supply sources."
      }
    ]
  }
],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)

print("add_memories rsp: \n\n", add_rsp)



search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_2"],
    query="Workshop PMT boot pressure startup test",
    include_preference=False,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```

## 示例 3：多Cube添加和检索

### 何时使用：

- 向彼此隔离的不同的Cube空间中添加记忆
- 你希望同时检索不同Cube空间中的记忆

### 关键点：

- 在检索时输入含有多个cube id的readable_cube_ids列表

### 完整示例代码
```python
import json
from memos.api.routers.server_router import add_memories, search_memories
from memos.api.product_models import APIADDRequest, APISearchRequest

user_id = "test_user_3"
add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_3_1"] ,
    messages = [
      {"role": "user", "content": "I’ve planned to travel to Guangzhou during the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, Ji Hotel, Hilton], etc."},
      {"role": "user", "content": "I’ll choose 7 Days Inn."},
      {"role": "assistant", "content": "Okay, feel free to ask me if you have any other questions."}
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

add_req = APIADDRequest(
    user_id=user_id,
    writable_cube_ids=["cube_test_user_3_2"] ,
    messages = [
      {"role": "user", "content": "I love you, I need you."},
      {"role": "assistant", "content": "Wow, I love you too"},
    ],
    async_mode="sync",
    mode="fine",
)

add_rsp = add_memories(add_req)
print("add_memories rsp: \n\n", add_rsp)

search_req = APISearchRequest(
    user_id=user_id,
    readable_cube_ids=["cube_test_user_3_1", "cube_test_user_3_2"],
    query="Please recommend a hotel, Love u u",
    include_preference=True,
)

search_rsp = search_memories(search_req).data
print("\n\nsearch_rsp: \n\n", json.dumps(search_rsp, indent=2, ensure_ascii=False))
```

## 示例 4：仅 KVCacheMemory

### 何时使用：

- 你想要短期工作记忆以加快多轮对话速度。
- 适合聊天机器人会话加速或提示复用。
- 最适合缓存隐藏状态 / KV 对。

### 关键点：

- 使用 KVCacheMemory，不含显式明文记忆。
- 演示提取 → 添加 → 合并 → 获取 → 删除。
- 展示如何导出/加载 KV cache。

### 完整示例代码


```python
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

# 为 KVCacheMemory（HuggingFace 后端）创建配置
config = MemoryConfigFactory(
    backend="kv_cache",
    config={
        "extractor_llm": {
            "backend": "huggingface",
            "config": {
                "model_name_or_path": "Qwen/Qwen3-0.6B",
                "max_tokens": 32,
                "add_generation_prompt": True,
                "remove_think_prefix": True,
            },
        },
    },
)

# 实例化 KVCacheMemory
kv_mem = MemoryFactory.from_config(config)

# 提取一个 KVCacheItem（DynamicCache）
prompt = [
    {"role": "user", "content": "What is MemOS?"},
    {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
]
print("===== Extract KVCacheItem =====")
cache_item = kv_mem.extract(prompt)
print(cache_item)

# 将缓存添加到内存中
kv_mem.add([cache_item])
print("All caches:", kv_mem.get_all())

# 通过 ID 获取
retrieved = kv_mem.get(cache_item.id)
print("Retrieved:", retrieved)

# 合并缓存（模拟多轮对话）
item2 = kv_mem.extract([{"role": "user", "content": "Tell me a joke."}])
kv_mem.add([item2])
merged = kv_mem.get_cache([cache_item.id, item2.id])
print("Merged cache:", merged)

# 删除其中一个
kv_mem.delete([cache_item.id])
print("After delete:", kv_mem.get_all())

# 导出和加载缓存
kv_mem.dump("tmp/kv_mem")
print("Dumped to tmp/kv_mem")
kv_mem.delete_all()
kv_mem.load("tmp/kv_mem")
print("Loaded caches:", kv_mem.get_all())
```

## 示例 5：混合模式

### 何时使用：
- 你希望同时拥有长期可解释记忆与短期快速上下文。
- 理想场景：用于具备计划能力、能记住事实并保持上下文的复杂智能体。
- 展示多记忆调度能力。

### 工作原理：

- **TreeTextMemory** 将你的长时记忆存储在图数据库（Neo4j）中。
- **KVCacheMemory** 将最近或稳定的上下文作为激活缓存保存。
- 二者在一个 **MemCube** 中协同工作，由你的 `MOS` Pipeline 统一管理。


### 完整示例代码

```python
import os

from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.configs.mem_os import MOSConfig
from memos.mem_cube.general import GeneralMemCube
from memos.mem_os.main import MOS

# 1. 配置 CUDA（如需）——用于本地 GPU 推理
os.environ["CUDA_VISIBLE_DEVICES"] = "1"

# 2. 定义用户和路径
user_id = "root"
cube_id = "root/mem_cube_kv_cache"
tmp_cube_path = "/tmp/default/mem_cube_5"

# 3. 初始化 MOSConfig
mos_config = MOSConfig.from_json_file("examples/data/config/simple_treekvcache_memos_config.json")
mos = MOS(mos_config)

# 4. 初始化 MemCube（TreeTextMemory + KVCacheMemory）
cube_config = GeneralMemCubeConfig.from_json_file(
    "examples/data/config/simple_treekvcache_cube_config.json"
)
mem_cube = GeneralMemCube(cube_config)

# 5. 将 MemCube 导出到磁盘
try:
    mem_cube.dump(tmp_cube_path)
except Exception as e:
    print(e)

# 6. 显式注册 MemCube
mos.register_mem_cube(tmp_cube_path, mem_cube_id=cube_id, user_id=user_id)

# 7. 提取并添加一个 KVCache 记忆（模拟稳定上下文）
extract_kvmem = mos.mem_cubes[cube_id].act_mem.extract("I like football")
mos.mem_cubes[cube_id].act_mem.add([extract_kvmem])

# 8. 开始聊天 —— 你的对话现在将使用：
#    - TreeTextMemory：用于结构化的多跳检索
#    - KVCacheMemory：用于快速上下文注入
while True:
    user_input = input("👤 [You] ").strip()
    print()
    response = mos.chat(user_input)
    print(f"🤖 [Assistant] {response}\n")

print("📢 [System] MemChat has stopped.")
````

## 示例 6：多记忆调度

### 何时使用：

- 你希望管理多个用户、多个 MemCube 或动态的记忆流。
- 适用于 SaaS 智能体或多会话 LLM。
- 展示 MemScheduler 与 YAML 配置能力。

### 关键点：

- 使用 parse\_yaml 加载 MOSConfig 和 MemCubeConfig。
- 动态创建用户与 MemCube。
- 展示记忆的运行时调度。

### 完整示例代码

```python
import shutil
import uuid
from pathlib import Path

from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.configs.mem_os import MOSConfig
from memos.mem_cube.general import GeneralMemCube
from memos.mem_os.main import MOS
from memos.mem_scheduler.utils import parse_yaml

# 使用 MemScheduler 加载主 MOS 配置
config = parse_yaml("./examples/data/config/mem_scheduler/memos_config_w_scheduler.yaml")
mos_config = MOSConfig(**config)
mos = MOS(mos_config)

# 创建动态用户 ID
user_id = str(uuid.uuid4())
mos.create_user(user_id=user_id)

# 创建 MemCube 配置并导出
config = GeneralMemCubeConfig.from_yaml_file(
    "./examples/data/config/mem_scheduler/mem_cube_config.yaml"
)
mem_cube_id = "mem_cube_5"
mem_cube_name_or_path = f"./outputs/mem_scheduler/{user_id}/{mem_cube_id}"

# 若存在旧目录则删除
if Path(mem_cube_name_or_path).exists():
    shutil.rmtree(mem_cube_name_or_path)
    print(f"{mem_cube_name_or_path} is not empty, and has been removed.")

# 导出新的 MemCube
mem_cube = GeneralMemCube(config)
mem_cube.dump(mem_cube_name_or_path)

# 为该用户注册 MemCube
mos.register_mem_cube(
    mem_cube_name_or_path=mem_cube_name_or_path,
    mem_cube_id=mem_cube_id,
    user_id=user_id
)

# 添加消息
messages = [
    {
        "role": "user",
        "content": "I like playing football."
    },
    {
        "role": "assistant",
        "content": "I like playing football too."
    },
]
mos.add(messages, user_id=user_id, mem_cube_id=mem_cube_id)

# 聊天循环：展示 TreeTextMemory 节点 + KVCache
while True:
    user_input = input("👤 [You] ").strip()
    print()
    response = mos.chat(user_input, user_id=user_id)
    retrieved_memories = mos.get_all(mem_cube_id=mem_cube_id, user_id=user_id)

    print(f"🤖 [Assistant] {response}")

    # 展示 TreeTextMemory 中的 WorkingMemory 节点
    for node in retrieved_memories["text_mem"][0]["memories"]["nodes"]:
        if node["metadata"]["memory_type"] == "WorkingMemory":
            print(f"[WorkingMemory] {node['memory']}")

    # 展示 KVCache 激活记忆
    if retrieved_memories["act_mem"][0]["memories"]:
        for act_mem in retrieved_memories["act_mem"][0]["memories"]:
            print(f"⚡ [KVCache] {act_mem['memory']}")
    else:
        print("⚡ [KVCache] None\n")
```

::note
**请注意**<br>
使用 dump() 和 load() 来持久化你的记忆立方体。

务必确保你的向量数据库维度与你的嵌入器匹配。

如使用基于图的明文记忆功能，你需要安装 Neo4j Desktop（社区版支持即将到来）。
::

## 下一步

你才刚刚开始！接下来可以尝试：

- 选择与你使用场景匹配的示例。
- 组合模块以构建更智能、更持久的智能体！

还需要更多帮助？
查看 API 文档或贡献你自己的示例吧！

