---
title: "如何为 AI Agent 选择 MemOS 接入方式"
---

假设客户在换货申请获批三天后再次联系，想知道何时发货，并提供了新的收货地址。处理这次对话的 Agent 需要此前的审批结果、更新后的地址，以及订单系统中的当前物流状态。

这为选择记忆系统提供了具体起点：从信息第一次出现的对话，一直追踪到后续需要它的任务。

我们构建 MemOS，是为了帮助应用[跨对话延续上下文](https://memos-docs.openmem.net/cn/memos_cloud/getting_started/quick_start/)。可以接入托管 API、在自己的基础设施上运行开源服务，或通过插件为支持的 Agent 添加记忆。起点取决于应用形态和运维方式。

## 先确定接入运行在哪里

团队自行开发应用时，首先选择托管服务或自行部署；为已有 Agent 环境添加记忆时，插件负责连接 Agent 与记忆系统。

| 正在构建的应用 | 建议起点 | 团队负责的内容 |
| --- | --- | --- |
| 需要托管记忆服务的应用 | [MemOS Cloud API](https://memos-docs.openmem.net/cn/memos_cloud/getting_started/quick_start/) | 应用集成、用户身份，以及召回记忆如何进入模型上下文 |
| 运行在自有基础设施上的服务 | [MemOS 开源框架](https://github.com/MemTensor/MemOS) | 服务、存储依赖、模型配置与运维 |
| 使用云端记忆的 OpenClaw 或 DeepSeek Harness | [MemOS Cloud Plugin](https://memos-docs.openmem.net/cn/openclaw/guide/) | Agent 环境与插件配置 |
| 使用本地记忆的 OpenClaw、Hermes Agent 或 DeepSeek Harness | [MemOS Local Plugin](https://docs.openmem.net/cn/openclaw/local_plugin/) | 本地运行环境、模型连接与备份 |

使用 MemOS Cloud 时，由我们运维记忆服务。自托管则让团队控制代码与基础设施；[参考 Docker 部署](https://github.com/MemTensor/MemOS)同时运行 MemOS API、Neo4j 与 Qdrant。

插件把记忆接入 Agent 的日常执行。MemOS Cloud Plugin 在运行前召回相关记忆，运行后保存新消息。MemOS Local Plugin 在本机维护 SQLite 存储，结合向量与词法检索，并将执行经验转化为可复用策略与技能，通过 Memory Viewer 检查结果。[本地配置](https://docs.openmem.net/cn/openclaw/local_plugin/)包含模型连接和可选的团队共享；判断数据处理位置时，需要一并查看这些设置。

选定路径后，测试真正需要的工作流程。下文以 MemOS Cloud 接口为例。

## 决定下一次对话需要记住什么

换货案例中，客户的通知偏好属于个人历史；公司的换货政策属于共享业务知识；查询订单并创建换货工单的流程，则可能被多个客户场景复用。

[客服示例](https://memos-docs.openmem.net/cn/usecase/customer_service_assistant/)将它们分别组织为用户记忆、Agent 技能与政策知识库。这样，Agent 可以同时检索客户背景与通用流程，并继续通过订单、工单系统获取当前业务状态。

MemOS Cloud 提供[多种记忆类型](https://memos-docs.openmem.net/cn/memos_cloud/introduction/memory_types/)：事实和偏好记录客户背景；事件记忆保留发生过什么；技能与工具记忆保存可复用的任务经验；属性记忆在应用需要结构化用户视图时，将信息组织到预定义字段中。

不同类型的准备工作有所区别。属性记忆需要为用户绑定模板，工具记忆需要输入工具调用信息，知识库需要上传内容。写入时使用 `allow_memory_view` 选择允许生成的种类。

开发阶段，检查几个代表性对话的抽取结果。“发货时请短信通知我”是一条偏好；“如果下个月搬家，我就需要改地址”是一条带条件的陈述。测试应检查抽取后是否保留了条件。

需要单独检查抽取时，[记忆抽取接口](https://memos-docs.openmem.net/cn/self_developed_model/extraction_usage_example/)可以返回事实与偏好候选，而不写入记忆存储。它支持文本对话的同步抽取，便于应用检查或增加自身验证。使用完整写入流程后，也要查看实际存储的记录。

## 让再次联系的客户被正确识别

客户从另一个渠道回来时，使用相同的 `user_id`。应用从已认证的客户记录中确定这个标识。

MemOS Cloud 的[项目与用户范围](https://memos-docs.openmem.net/cn/memos_cloud/introduction/isolation_filters/)决定请求检索哪些个人记忆。API Key 选择项目，`user_id` 标识项目内客户。API Key 保留在服务端，每个请求与应用访问规则关联。

多个 Agent 服务同一客户时，可以用 `agent_id` 标记记忆，并按生成记忆的 Agent 过滤。Agent 也可以拥有自己的独立记忆，例如积累可复用客服技能。该行为需要在项目设置中开启「为 Agent 创建独立记忆」，默认关闭。

新对话仍然可以使用客户先前的记忆。`conversation_id` 提供会话背景并影响相关性，不会自动将检索限制在当前会话内。

[检索记忆接口](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/search_memory/)结合关键词、向量检索、排序、过滤与去重。通过 `include_memory_view` 选择记忆种类，`memory_limit_number` 控制结果数量，`filter` 缩小范围。

在这个案例中，检查检索是否返回换货批准记录和相关收货信息，再检查应用实际送入模型的上下文。[应用接入流程](https://memos-docs.openmem.net/cn/memos_cloud/getting_started/quick_start/)展示了召回内容加入提示词的位置。

## 处理地址变化

周一正确的信息，周四可能需要更新。MemOS Cloud 的[时间感知机制](https://memos-docs.openmem.net/cn/memos_cloud/introduction/time_awareness/)支持状态变化与历史问题，让当前信息和早期版本分别服务不同请求。导入旧对话时提供 `chat_time`，保留信息的记录时间。

系统也需要纠错方式。客服团队知道具体错误条目时，可以[按记忆 ID 修改](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/update_memory/)内容、标题或状态。客户在对话中纠正时，后端可以附带用户与会话背景，通过[自然语言反馈](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/add_feedback/)提交。

持续跟踪到操作完成。Cloud 写入默认采用[异步处理](https://memos-docs.openmem.net/cn/memos_cloud/features/async_mode/)。使用返回的 `task_id` 查询 `get/status`，完成任务包含记忆变更摘要。随后再次检索相关信息，确认下一次回答使用新地址。

真正发货前，应用仍应通过业务系统核实地址与订单状态。

## 明确删除对象

客户要求删除历史信息时，先确定请求覆盖哪些记录。

[`delete/memory` 接口](https://memos-docs.openmem.net/cn/memos_cloud/mem_operations/delete_memory/)每次接受三种目标之一：具体的 `memory_ids`、`user_id` 或 `agent_id`。操作范围限定在 API Key 所属项目内，按 Agent 删除需要开启独立记忆。

该接口的删除目标不包含会话 ID 或知识库 ID。知识库文件使用[独立删除接口](https://memos-docs.openmem.net/cn/api_docs/knowledge/delete_kb_doc/)，传入 `file_ids`。

删除后重复相关检索。定义完整删除流程时，一并考虑应用在缓存、导出文件或日志中保留的副本。

## 推广前走完完整案例

试点始终围绕同一个换货场景。几种变化比一组互不相关的提示词更容易暴露集成问题。

1. **在新会话中返回。** 记录审批结果后，为同一客户打开另一次对话，检查 Agent 能否接续工单，减少重复询问。
2. **修改细节。** 更新收货地址，或把邮件通知改为短信，检查存储变化与下一次回答。
3. **加入条件陈述。** 尝试“如果我搬到西雅图，就需要更新地址”，检查可能发生的搬家是否被误记成已确认地址变更。
4. **换一个客户账号。** 以不同用户重复提问，检查请求的身份映射，并确认原客户的个人信息没有出现。
5. **删除测试记录。** 删除目标记忆后再次检索。流程涉及知识库文件时，单独测试文件删除。

记录新信息变得可检索所需的时间，以及 p95 延迟、Token 用量和失败排查耗时。对比有无记忆时的任务结果：Agent 是否给出正确下一步，客户重复解释的次数，以及纠正是否延续到后续对话。

简要保存配置、结果和待解决问题，让团队能够说明所选部署为何适合应用。

[Cloud 快速开始](https://memos-docs.openmem.net/cn/memos_cloud/getting_started/quick_start/)介绍首次写入和检索；自行部署时，从[自托管说明](https://github.com/MemTensor/MemOS)开始。先完成一个客户案例，再扩展到更多工作流。
