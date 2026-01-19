---
title: MemOS API 开发指南 (Component & Handler 架构)
desc: MemOS v2.0 采用了更加模块化和解耦的架构。旧版的 MOS 类已被弃用，现在推荐使用 Components (组件) + Handlers (处理器) 的模式进行开发。
---


这种架构将“系统的构建”（Components）与“业务逻辑的执行”（Handlers）分离开来，使得系统更易于扩展、测试和维护。

## 1. 核心概念

### 1.1 Components (核心组件)

Components 是 MemOS 的“大脑”和“基础设施”，它们在服务器启动时被初始化（通过 `init_server()`），并在整个生命周期中复用。

核心组件包括：

#### 核心记忆组件

1. **MemCube**: 记忆容器, 用于隔离不同用户/不同 cube 的记忆, 并统一管理多种记忆模块.  
2. **MemReader**: 记忆加工器, 把用户输入（聊天, 文档, 图片）解析为系统可写入的记忆片段.  
3. **MemScheduler**: 调度器, 负责将耗时的记忆写入, 索引构建, 记忆组织等任务异步化并并发执行.mem_scheduler.  
4. **MemChat**: 对话控制器, 负责“检索记忆 -> 生成回复 -> 写入新记忆”的对话闭环.  
5. **MemFeedback**: 纠错与反馈, 用于把用户的自然语言反馈转换成对记忆库的安全修正.  

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

## 2. API 详解

### 2.1 初始化 (Initialization)
初始化是系统启动的基石。所有 Handler 的运行都依赖于统一的组件注册与依赖注入机制。

- 组件加载 ( init_server ) : 系统首先会初始化所有核心组件，包括 LLM（大语言模型）、存储层（向量数据库、图数据库）、调度器（Scheduler）以及各类内存立方体（Memory Cube）。
- 依赖注入 ( HandlerDependencies ) : 为了保证代码的解耦与可测试性，所有组件会被封装进 HandlerDependencies 对象中。Handler 在实例化时统一接收这个依赖容器，从而按需获取 naive_mem_cube 、 mem_reader 或 feedback_server 等资源，而无需在内部硬编码实例化过程。

### 2.2 添加记忆 (AddHandler)
AddHandler 是将外部信息转化为系统记忆的核心入口，支持处理对话、文件上传及纯文本输入。它不仅负责写入，还承担了部分反馈路由的职责。

- 核心功能 :
  - 多模态支持 : 能够处理用户对话列表（Messages），将其转化为系统内部的记忆对象。
  - 同步与异步模式 : 通过 async_mode 参数控制。生产环境推荐使用 "async" 模式，任务会被推入后台队列，通过 Scheduler 调度执行，接口立即返回 task_id ；调试时可使用 "sync" 阻塞等待结果。
  - 自动反馈路由 : 如果在请求中标记了 is_feedback=True ，Handler 会自动提取对话中的最后一条用户消息作为反馈内容，并将其路由至反馈处理逻辑，而不是作为普通新记忆添加。
  - 多目标写入 : 支持通过 writable_cube_ids 指定多个目标 Cube。如果指定了多个目标，Handler 会自动构建 CompositeCubeView 并行分发写入任务；如果仅单一目标，则使用轻量级的 SingleCubeView 。

### 2.3 搜索记忆 (SearchHandler)
SearchHandler 提供了基于语义的记忆检索服务，是实现 RAG（检索增强生成）的关键组件。

- 核心功能 :
  - 语义检索 : 利用向量嵌入（Embedding）技术，根据查询语句的语义相似度召回相关记忆，而非简单的关键词匹配。
  - 灵活的搜索范围 : 通过 readable_cube_ids 参数，调用者可以精确控制搜索的上下文范围（例如仅搜索特定用户的记忆，或跨用户搜索公共记忆）。
  - 多模式策略 : 底层支持多种搜索策略（如 fast 快速检索、 fine 精细检索或 mixture 混合检索），以在响应速度和召回准确率之间取得平衡。
  - 深度搜索集成 : 能够集成 deepsearch_agent ，处理更复杂的、需要多步推理的检索请求。

### 2.4 对话 (ChatHandler)
ChatHandler 是上层业务逻辑的编排者（Orchestrator），它不直接存储数据，而是通过组合其他 Handler 来完成端到端的对话任务。

- 核心功能 :
  - 流程编排 : 自动串联 "检索 -> 生成 -> 存储" 的全过程。首先调用 SearchHandler 获取上下文，然后调用 LLM 生成回复，最后调用 AddHandler 将新产生的对话记录保存为记忆。
  - 上下文管理 : 负责处理 history （历史对话）与 query （当前问题）的拼接，确保 AI 理解完整的对话语境。
  - 流式与非流式 : 支持标准响应（ APIChatCompleteRequest ）和流式响应（Stream），适应不同的前端交互需求。
  - 通知集成 : 可选集成 online_bot （如钉钉机器人），在生成回复后自动推送通知。

### 2.5 反馈与修正 (FeedbackHandler)
FeedbackHandler 是系统的"自我修正"机制，允许用户对 AI 的表现进行干预，从而优化未来的记忆检索与生成。

- 核心功能 :
  - 记忆修正 : 当用户指出 AI 的错误（如"会议地点不是北京是上海"）时，Handler 会根据用户的反馈内容更新或标记旧的记忆节点。
  - 正负反馈 : 支持处理点赞（Upvote）或点踩（Downvote）信号，调整特定记忆的权重或可信度。
  - 精准定位 : 除了基于对话历史的反馈，还支持通过 retrieved_memory_ids 参数，针对某几条具体的检索结果进行精确修正，提高反馈的有效性。

### 2.6 记忆管理 (MemoryHandler)
MemoryHandler 提供了对记忆数据的底层 CRUD（增删改查）能力，主要用于系统管理后台或数据清理工具。

- 核心功能 :
  - 精细化管理 : 不同于 AddHandler 的业务级写入，此 Handler 允许通过 memory_id 直接获取单条记忆详情或执行物理删除。
  - 依赖直通 : 部分操作需要直接与底层的 naive_mem_cube 组件交互，绕过复杂的业务包装，以提供最高效的数据操作能力。

### 2.7 任务调度状态 (SchedulerHandler)
SchedulerHandler 负责监控系统中所有异步任务的生命周期，是系统可观测性的重要组成部分。

- 核心功能 :
  - 状态追踪 : 配合 Redis 后端，追踪任务的实时状态（Queued 排队中, Running 执行中, Completed 已完成, Failed 已失败）。
  - 结果获取 : 对于异步执行的任务，客户端可以通过此接口轮询任务进度，并在任务完成后获取最终的执行结果或错误信息。
  - 调试支持 : 提供 handle_scheduler_wait 等工具函数，允许在测试脚本中将异步流程强制转为同步等待，便于集成测试。

### 2.8 猜你想问 (SuggestionHandler)
SuggestionHandler 旨在通过预测用户的潜在意图来提升交互体验，生成"推荐问题"（Next Query Suggestion）。

- 核心功能 :
  - 双模式生成 :
    - 基于对话 : 如果提供了 message （最近的对话记录），系统会分析对话上下文，生成 3 个与当前话题紧密相关的后续问题。
    - 基于记忆 : 如果没有对话上下文，系统会调用 naive_mem_cube 快速检索用户的"最近记忆"，并据此生成与用户近期生活/工作状态相关的问题。
  - 多语言支持 : 内置中英文提示词模板，根据 language 参数自动切换生成的语言风格。
