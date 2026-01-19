---
title: MemOS API 开发指南 (Component & Handler 架构)
desc: MemOS v2.0 采用了更加模块化和解耦的架构。旧版的 MOS 类已被弃用，现在推荐使用 Components (组件) + Handlers (处理器) 的模式进行开发。
---


这种架构将“系统的构建”（Components）与“业务逻辑的执行”（Handlers）分离开来，使得系统更易于扩展、测试和维护。

## 1. 核心概念

### 1.1 Components (核心组件)

Components 是 MemOS 的“大脑”和“基础设施”，它们在服务器启动时被初始化（通过 `init_server()`），并在整个生命周期中复用。

核心组件包括：

- **基础模型与数据库**：
    - `llm`: 基础大语言模型，用于内部处理（如信息提取、摘要生成）。
    - `chat_llms`: 聊天专用大语言模型字典（支持多模型），用于对外对话。
    - `embedder`: 文本嵌入模型，将文本转化为向量。
    - `reranker`: 重排序模型，用于对检索结果进行精细化排序。
    - `graph_db`: 图数据库（如 Neo4j, PolarDB），存储记忆节点及其关系。
    - `vector_db`: 向量数据库（如 Milvus, Qdrant），存储偏好记忆的向量索引。
    - `redis_client`: Redis 客户端，用于任务队列和状态跟踪。

- **记忆系统核心**：
    - `naive_mem_cube`: 最核心的记忆容器，它统一管理了以下两个子系统：
        - `text_mem`: 文本记忆系统（基于 TreeTextMemory），处理对话、文档等显式记忆。
        - `pref_mem`: 偏好记忆系统（基于 PreferenceMemory），处理用户的喜好、习惯等隐式记忆。
    - `memory_manager`: 记忆管理器，负责记忆的生命周期（如遗忘、归档、整理）。

- **功能模块**：
    - `mem_scheduler`: 任务调度器，MemOS 的心脏，负责异步处理所有耗时的记忆写入、索引构建和后台优化任务。
    - `mem_reader`: 多模态解析器，负责读取和解析各种输入（PDF、图片、Markdown 等）。
    - `searcher`: 搜索器，封装了复杂的检索逻辑（包括多路召回、重排序、联网搜索等）。
    - `internet_retriever`: 联网检索器，用于获取实时信息。
    - `feedback_server`: 反馈服务，处理用户对记忆的修正和评价。
    - `deepsearch_agent`: 深度搜索代理，用于执行复杂的多步搜索任务。
    - `online_bot`: (可选) 机器人接口（如钉钉机器人），用于实时通知。

### 1.2 Handlers (业务处理器)

Handlers 是 MemOS 的“手”，它们封装了具体的业务逻辑，通过调用 Components 来完成任务。

主要 Handler 包括：

## 核心 Handler 概览

| Handler | 作用 | 核心方法 |
| :--- | :--- | :--- |
| **AddHandler** | 添加记忆 (对话/文档/文本) | `handle_add_memories` |
| **SearchHandler** | 搜索记忆 (语义检索) | `handle_search_memories` |
| **ChatHandler** | 对话 (带记忆增强) | `handle_chat_complete`, `handle_chat_stream` |
| **FeedbackHandler** | 反馈 (修正记忆/人工干预) | `handle_feedback_memories` |
| **MemoryHandler** | 管理 (获取详情/删除) | `handle_get_memory`, `handle_delete_memories` |
| **SchedulerHandler** | 调度 (查询异步任务状态) | `handle_scheduler_status`, `handle_scheduler_wait` |
| **SuggestionHandler** | 建议 (生成推荐问题) | `handle_get_suggestion_queries` |

## 2. 快速开始 (Python 脚本示例)

下面是一个完整的、可运行的 Python 脚本，展示了如何初始化 MemOS 服务器，并完成“添加记忆 -> 搜索记忆 -> 对话”的完整流程。

**前提条件**：请确保环境变量中已配置 `OPENAI_API_KEY`，或者在配置文件中指定了模型。

### 示例代码

```python
import uuid
import logging
import time

# 导入核心初始化模块和Handler
from memos.api import handlers
from memos.api.handlers.base_handler import HandlerDependencies
from memos.api.handlers.add_handler import AddHandler
from memos.api.handlers.search_handler import SearchHandler
from memos.api.handlers.chat_handler import ChatHandler
from memos.api.product_models import (
    APIADDRequest,
    APISearchRequest,
    APIChatCompleteRequest
)

# 设置日志级别
logging.basicConfig(level=logging.INFO)
logging.raiseExceptions = False


def main():
    print("🚀 正在初始化 MemOS 服务器组件...")

    # 1. 初始化核心组件 (Components)
    # 这会加载配置、连接数据库、初始化模型等
    components = handlers.init_server()

    # 2. 构建依赖注入容器
    deps = HandlerDependencies.from_init_server(components)

    # 3. 实例化业务处理器 (Handlers)
    add_handler = AddHandler(deps)
    search_handler = SearchHandler(deps)

    # 确保 chat_llms 可用
    chat_llms = components.get("chat_llms")
    if not chat_llms:
        print("⚠️ 警告：chat_llms 未初始化 (可能 ENABLE_CHAT_API=false?)。将使用处理 LLM 作为后备。")
        if components.get("llm"):
             llm_instance = components["llm"]
             print(f"后备 LLM 实例: {llm_instance}")
             print(f"后备 LLM 配置: {llm_instance.config if hasattr(llm_instance, 'config') else '无配置'}")
             chat_llms = {"default": llm_instance}
        else:
             print("❌ 错误：没有可用的 LLM。")
             return

    # ChatHandler 需要组合 SearchHandler 和 AddHandler
    chat_handler = ChatHandler(
        deps,
        chat_llms,
        search_handler,
        add_handler,
        online_bot=components.get("online_bot")
    )

    print("✅ MemOS 初始化完成！")

    # --- 模拟业务流程 ---

    # 创建一个用户ID (在该示例中，我们直接用 user_id 作为 cube_id)
    user_id = str(uuid.uuid4())
    cube_id = user_id
    print(f"\n👤 当前用户 ID: {user_id}")

    # Step 1: 添加记忆
    print("\n[Step 1] 正在添加记忆...")
    # 我们告诉系统：用户喜欢吃披萨
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[cube_id],  # 指定写入的记忆立方
        messages=[
            {"role": "user", "content": "我最喜欢的食物是披萨，特别是意式腊肠口味的。"},
            {"role": "assistant", "content": "好的，记住了，你喜欢意式腊肠披萨。"}
        ],
        async_mode="sync"  # 使用同步模式，以便立即看到结果（生产环境建议用 async）
    )
    add_res = add_handler.handle_add_memories(add_req)
    print(f"👉 添加结果: {add_res.message}")

    # Step 2: 搜索记忆
    print("\n[Step 2] 正在搜索记忆...")
    search_req = APISearchRequest(
        user_id=user_id,
        query="我喜欢吃什么？",
        readable_cube_ids=[cube_id],
        top_k=3
    )
    search_res = search_handler.handle_search_memories(search_req)

    # 从响应字典中提取记忆
    memories = []
    if search_res.data and "text_mem" in search_res.data:
        for bucket in search_res.data["text_mem"]:
            memories.extend(bucket.get("memories", []))

    print(f"🔍 搜索到的相关记忆 ({len(memories)} 条):")
    for idx, mem in enumerate(memories):
        # 这里的 mem 是一个字典
        memory_content = mem.get("memory", "")
        print(f"  {idx + 1}. {memory_content}")

    # Step 3: 带记忆的对话
    print("\n[Step 3] 正在进行对话...")
    chat_query = "今晚帮我推荐个晚餐吧。"
    print(f"🗣️ 用户: {chat_query}")

    chat_req = APIChatCompleteRequest(
        user_id=user_id,
        query=chat_query,
        model_name_or_path="gpt-4o-mini",
        readable_cube_ids=[cube_id],
        writable_cube_ids=[cube_id],
        history=[]  # 这里可以传入历史对话上下文
    )
    chat_res = chat_handler.handle_chat_complete(chat_req)

    if isinstance(chat_res, dict):
        response = chat_res.get("data", {}).get("response", "")
    else:
        response = chat_res.data.response
    
    print(f"🤖 AI 回复: {response}")

    # 防止调度程序提前终止
    time.sleep(10)


if __name__ == "__main__":
    main()
```

## 3. API 详解

### 3.1 初始化 (Initialization)
初始化是系统启动的基石。所有 Handler 的运行都依赖于统一的组件注册与依赖注入机制。

- 组件加载 ( init_server ) : 系统首先会初始化所有核心组件，包括 LLM（大语言模型）、存储层（向量数据库、图数据库）、调度器（Scheduler）以及各类内存立方体（Memory Cube）。
- 依赖注入 ( HandlerDependencies ) : 为了保证代码的解耦与可测试性，所有组件会被封装进 HandlerDependencies 对象中。Handler 在实例化时统一接收这个依赖容器，从而按需获取 naive_mem_cube 、 mem_reader 或 feedback_server 等资源，而无需在内部硬编码实例化过程。

### 3.2 添加记忆 (AddHandler)
AddHandler 是将外部信息转化为系统记忆的核心入口，支持处理对话、文件上传及纯文本输入。它不仅负责写入，还承担了部分反馈路由的职责。

- 核心功能 :
  - 多模态支持 : 能够处理用户对话列表（Messages），将其转化为系统内部的记忆对象。
  - 同步与异步模式 : 通过 async_mode 参数控制。生产环境推荐使用 "async" 模式，任务会被推入后台队列，通过 Scheduler 调度执行，接口立即返回 task_id ；调试时可使用 "sync" 阻塞等待结果。
  - 自动反馈路由 : 如果在请求中标记了 is_feedback=True ，Handler 会自动提取对话中的最后一条用户消息作为反馈内容，并将其路由至反馈处理逻辑，而不是作为普通新记忆添加。
  - 多目标写入 : 支持通过 writable_cube_ids 指定多个目标 Cube。如果指定了多个目标，Handler 会自动构建 CompositeCubeView 并行分发写入任务；如果仅单一目标，则使用轻量级的 SingleCubeView 。

### 3.3 搜索记忆 (SearchHandler)
SearchHandler 提供了基于语义的记忆检索服务，是实现 RAG（检索增强生成）的关键组件。

- 核心功能 :
  - 语义检索 : 利用向量嵌入（Embedding）技术，根据查询语句的语义相似度召回相关记忆，而非简单的关键词匹配。
  - 灵活的搜索范围 : 通过 readable_cube_ids 参数，调用者可以精确控制搜索的上下文范围（例如仅搜索特定用户的记忆，或跨用户搜索公共记忆）。
  - 多模式策略 : 底层支持多种搜索策略（如 fast 快速检索、 fine 精细检索或 mixture 混合检索），以在响应速度和召回准确率之间取得平衡。
  - 深度搜索集成 : 能够集成 deepsearch_agent ，处理更复杂的、需要多步推理的检索请求。

### 3.4 对话 (ChatHandler)
ChatHandler 是上层业务逻辑的编排者（Orchestrator），它不直接存储数据，而是通过组合其他 Handler 来完成端到端的对话任务。

- 核心功能 :
  - 流程编排 : 自动串联 "检索 -> 生成 -> 存储" 的全过程。首先调用 SearchHandler 获取上下文，然后调用 LLM 生成回复，最后调用 AddHandler 将新产生的对话记录保存为记忆。
  - 上下文管理 : 负责处理 history （历史对话）与 query （当前问题）的拼接，确保 AI 理解完整的对话语境。
  - 流式与非流式 : 支持标准响应（ APIChatCompleteRequest ）和流式响应（Stream），适应不同的前端交互需求。
  - 通知集成 : 可选集成 online_bot （如钉钉机器人），在生成回复后自动推送通知。

### 3.5 反馈与修正 (FeedbackHandler)
FeedbackHandler 是系统的"自我修正"机制，允许用户对 AI 的表现进行干预，从而优化未来的记忆检索与生成。

- 核心功能 :
  - 记忆修正 : 当用户指出 AI 的错误（如"会议地点不是北京是上海"）时，Handler 会根据用户的反馈内容更新或标记旧的记忆节点。
  - 正负反馈 : 支持处理点赞（Upvote）或点踩（Downvote）信号，调整特定记忆的权重或可信度。
  - 精准定位 : 除了基于对话历史的反馈，还支持通过 retrieved_memory_ids 参数，针对某几条具体的检索结果进行精确修正，提高反馈的有效性。

### 3.6 记忆管理 (MemoryHandler)
MemoryHandler 提供了对记忆数据的底层 CRUD（增删改查）能力，主要用于系统管理后台或数据清理工具。

- 核心功能 :
  - 精细化管理 : 不同于 AddHandler 的业务级写入，此 Handler 允许通过 memory_id 直接获取单条记忆详情或执行物理删除。
  - 依赖直通 : 部分操作需要直接与底层的 naive_mem_cube 组件交互，绕过复杂的业务包装，以提供最高效的数据操作能力。

### 3.7 任务调度状态 (SchedulerHandler)
SchedulerHandler 负责监控系统中所有异步任务的生命周期，是系统可观测性的重要组成部分。

- 核心功能 :
  - 状态追踪 : 配合 Redis 后端，追踪任务的实时状态（Queued 排队中, Running 执行中, Completed 已完成, Failed 已失败）。
  - 结果获取 : 对于异步执行的任务，客户端可以通过此接口轮询任务进度，并在任务完成后获取最终的执行结果或错误信息。
  - 调试支持 : 提供 handle_scheduler_wait 等工具函数，允许在测试脚本中将异步流程强制转为同步等待，便于集成测试。

### 3.8 猜你想问 (SuggestionHandler)
SuggestionHandler 旨在通过预测用户的潜在意图来提升交互体验，生成"推荐问题"（Next Query Suggestion）。

- 核心功能 :
  - 双模式生成 :
    - 基于对话 : 如果提供了 message （最近的对话记录），系统会分析对话上下文，生成 3 个与当前话题紧密相关的后续问题。
    - 基于记忆 : 如果没有对话上下文，系统会调用 naive_mem_cube 快速检索用户的"最近记忆"，并据此生成与用户近期生活/工作状态相关的问题。
  - 多语言支持 : 内置中英文提示词模板，根据 language 参数自动切换生成的语言风格。
