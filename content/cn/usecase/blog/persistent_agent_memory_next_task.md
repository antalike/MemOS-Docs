---
title: "持久化 Agent 记忆，应当让下一次任务更轻松"
---

*记忆张量 MemTensor 如何看待连续性、纠错与边界*

假设团队周二发现，只有先启动数据库，集成测试才能通过。周五，另一个 Agent 接手相关任务，需要找到已经确认的准备步骤，以及它适用的条件。团队调整步骤后，保存的说明也需要同步更新。

这就是我们希望通过 MemOS 实现的体验：有用的知识能够延续到后续任务，并随时接受纠正。

## 大上下文仍然需要记忆策略

更大的上下文窗口让 Agent 能阅读更多材料。应用仍需决定哪些值得保留、谁可以复用，以及怎样处理更新。

在测试示例中，失败是一次事件；已经确认的准备顺序则是可复用流程，需要附带适用的环境与条件。

MemOS Cloud [按种类组织记忆](https://memos-docs.openmem.net/cn/memos_cloud/introduction/memory_types/)，让这些记录分别发挥作用。事件记忆保留发生时间等细节，技能记录可复用的任务步骤，事实与偏好提供用户背景。应用可以控制生成哪些种类，以及检索时包含哪些种类。

## 用四步衔接持续工作

**记录。** 通过[添加消息](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_message/)，MemOS Cloud 从对话中抽取记忆，检查重复与冲突，必要时更新已有记录。使用 `info` 可以附带来源、环境等自定义元数据。对周二的测试，应提交确认准备步骤及适用范围的讨论；元数据也为后续过滤提供字段。

**检索。** [检索记忆](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/search_memory/)结合关键词与向量检索，按相关性排序并移除重复结果。过滤条件可按标签、时间、Agent 或自定义元数据缩小范围；选择记忆种类可包含技能，返回数量限制则控制结果条数。周五接手任务时，检索相关测试说明，与当前请求一起送入模型。

**纠正。** 假设团队增加了自动启动数据库的脚本。如果知道需要更改的记录，可以通过[修改记忆](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/update_memory/)按 ID 编辑；用户也可以用[自然语言反馈](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_feedback/)描述新流程，由 MemOS 定位并更新相关记忆。对于变化中的事实与偏好，[时间感知机制](https://memos-docs.openmem.net/cn/memos_cloud/introduction/time_awareness/)维护历史版本，并结合查询中的时间线索区分当前信息和早期状态。

**停止使用或删除。** 过时流程可以通过更新接口归档。[删除记忆](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/delete_memory/)支持删除指定条目，或清除 API Key 所属项目内某个用户的记忆。删除流程也应覆盖应用缓存或摘要中保存的副本。

## 共享需要维护者

把流程共享给多个 Agent 前，先明确谁负责维护，以及哪些用户或项目可以使用。

MemOS Cloud 的[隔离能力](https://memos-docs.openmem.net/cn/memos_cloud/introduction/isolation_filters/)按项目与用户划分记忆范围。Agent 过滤条件可以进一步筛选某个用户在指定 Agent 下的记录；开启 Agent 独立记忆后，Agent 则拥有跨用户、跨会话的长期记忆。后端应把 `user_id` 映射到已认证用户。`conversation_id` 影响检索上下文，不承担访问控制职责。

对于共享的环境准备说明，[知识库](https://memos-docs.openmem.net/cn/memos_cloud/features/knowledge_base/)将上传文档转化为可检索记忆，并与用户记忆共同召回。一项任务就能同时参考团队文档和此前交互的背景。

在支持的 Agent 宿主中，[MemOS Local Plugin](https://docs.openmem.net/cn/openclaw/local_plugin/)把记忆存入本地 SQLite 数据库，并将记录与检索接入宿主的任务生命周期。任务完成后记录对话、工具调用和反馈，在下一次任务前提供相关上下文。反复出现的有效方法可以沉淀为可复用技能。

验证时使用三个会话：先确认流程，再由有权限的 Agent 应用，最后修改流程并重新提问。切换到另一个项目，以及删除后，也各重复一次请求。同时检查召回的记忆、实际送入模型的上下文和最终回答，发现过期说明或访问范围错误。
