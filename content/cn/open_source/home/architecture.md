---
title: 架构设计
desc: MemOS 由**核心模块**组成，这些模块协同工作，将您的 LLM 转变为真正的**记忆增强系统**——从编排到存储到检索。
---
## 核心模块

### MOS (Memory Operating System，记忆操作系统)

MemOS 的编排层——管理跨多种记忆类型（纯文本、激活、参数化）的预测性、异步调度，并编排**多用户、多会话**记忆工作流。

MOS 通过统一 API 将记忆容器（**MemCubes**）与 LLMs 连接，用于添加、搜索、更新、传输或回滚记忆。它还通过统一的记忆交换协议 (Memory Interchange Protocol，MIP) 支持跨模型、跨设备的互操作性。

### MemCube

一个模块化、可移植的**记忆容器**——将其视为一个灵活的存储卡，可以为**用户、Agent 或会话**容纳一种或多种记忆类型。

**多 Cube 支持 (Multi-Cube):**
MemOS 支持通过**组合视图 (Composite View)** 同时操作多个 MemCube，实现灵活的记忆隔离与共享：
- **写入策略**: 扇出写入 (Fan-out Write)，将记忆同时写入所有目标 Cube（例如同时写入用户个人 Cube 和项目共享 Cube）。
- **读取策略**: 并行搜索 (Parallel Search)，同时查询所有 Cube 并聚合结果，提供统一的全局记忆视图。

MemCubes 可以动态注册、更新或移除。它们支持可在会话、模型和设备之间传输的容器化存储。

### 异步添加机制 (Asynchronous Addition)

为了在高并发场景下保持低延迟，MemOS 提供了异步记忆添加模式 (`async_mode`)，利用 **MemScheduler** 进行后台调度：

- **文本记忆**: 采用"快速提取 + 异步处理"策略。API 立即完成基础的快速提取和存储，而复杂的后续处理（如深度图推理、重排索引）则作为任务提交给调度器异步执行。
- **偏好记忆**: 采用全异步策略。提取和存储任务完全交给调度器后台运行，最大程度减少 API 响应时间。

### 记忆

MemOS 支持几种专门的记忆类型以满足不同需求：

#### 1. 参数化记忆(**即将推出**)

嵌入在模型权重中；长期、高效率，但难以编辑。

#### 2. 激活记忆

运行时的隐藏状态和 KV-cache；短期、瞬态，引导动态行为。

#### 3. 明文记忆

结构化或非结构化知识块；可编辑、可追溯，适合快速更新、个性化和多代理共享。

- **GeneralTextMemory:** 灵活的、基于向量的存储，用于非结构化文本知识，具有语义搜索和元数据过滤。
- **TreeTextMemory:** 分层、基于图的明文记忆，用于结构化知识——结合**基于树的层次结构**和**跨分支链接**，实现动态、演进的知识图。它支持长期组织和多跳推理（通常由 Neo4j 支持）。

::note
**最佳实践**<br>
从 `GeneralTextMemory` 开始实践——然后随着需求的增长扩展到 graph 或 KV cache。
::

#### 基础模块

包括分块器、嵌入器、LLM 连接器、解析器和向量/图数据库接口。这些为记忆提取、语义嵌入、存储和检索提供构建建块。

## 代码结构

MemOS 项目组织清晰，支持即插即用：

```
src/memos/
    api/           # API 定义
    chunkers/      # 文本分块工具
    configs/       # 配置模式
    context/       # 日志上下文
    embedders/     # 嵌入模型
    graph_dbs/     # 图数据库后端 (例如，Neo4j)
    vec_dbs/       # 向量数据库后端 (例如，Qdrant)
    llms/          # LLM 连接器
    mem_agent/     # 深度检索
    mem_chat/      # 记忆增强聊天逻辑
    mem_cube/      # MemCube 管理
    mem_feedback   # 记忆反馈
    mem_os/        # MOS 编排
    mem_reader/    # 记忆读取器
    mem_scheduler/ # 记忆调度模块
    memories/      # 记忆类型实现
    multi_mem_cube/# 多视图cube
    parsers/       # 解析工具
    reranker/      # 重排模块
    templates/     # 提示词模板
    types/         # 类型定义
```

::note
**专业提示**<br>
使用`examples` 进行快速实验，使用 `docs` 进行模块深入探讨。
::

## 可扩展性

MemOS 是**模块化设计的**。
添加您自己的记忆类型、存储后端或 LLM 连接器，只需最少的更改——这要归功于其**统一配置和工厂模式**。

::note
**专业提示**<br>
[贡献](/open_source/contribution/overview) 一个新的后端或分享您的自定义记忆类型——这很容易插入。
::
