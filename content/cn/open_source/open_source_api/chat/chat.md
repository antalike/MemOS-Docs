---
title: 对话
desc: MemOS 提供的一站式对话接口，内置完整的记忆召回与自动管理能力，无需手动拼接上下文。
---

:::note
有关 API 字段、格式等信息的完整列表，详见[Chat 接口文档](/api_docs/chat/chat)。
:::

**接口路径**：`POST /product/chat/complete` 或 `POST /product/chat/stream`
**功能描述**：这是 MemOS 最核心的端到端接口。它整合了“记忆检索”、“Prompt 自动拼装”与“大模型生成”全链路，让您的 AI 应用原生具备长期记忆。



## 1. 为什么使用 Chat 接口？

* **一体化对话能力**：仅需调用一个接口传入当前用户提问，即可获得结合了历史记忆的回答，无需自建复杂的 RAG 链路。
* **记忆自动化循环**：通过 `add_message_on_answer` 参数，系统在回答的同时会自动加工并写入新记忆，形成闭环。
* **持久“上下文”理解**：在跨轮次、跨天甚至跨会话中保持连贯，让模型持续“记住”用户的偏好。

## 2. 关键接口参数

基于开源版 `src/api/routers/client.py` 的实现，`chat` 接口包含丰富的配置项：

### 核心参数
| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `query` | `str` | 是 | 用户的当前提问内容。 |
| `user_id` | `str` | 是 | 用于识别用户身份并检索对应的私有记忆。 |
| `conversation_id` | `str` | 是 | 标识当前会话，用于维持短期对话连贯性。 |

### 记忆与控制参数
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `add_message_on_answer` | `bool` | `False` | **关键功能**：设为 `True` 时，回答完成后自动调用 `add_message` 将对话存入记忆。 |
| `include_preference` | `bool` | `True` | 是否在生成回答时参考用户的偏好记忆。 |
| `knowledgebase_ids` | `list` | `None` | 指定需要包含的知识库 ID 列表，实现 RAG 增强。 |
| `system_prompt` | `str` | `None` | 自定义系统级提示词，覆盖默认配置。 |
| `temperature` | `float` | `None` | 控制生成随机性（0.0-1.0）。 |

## 3. 工作原理



1.  **发起请求**：AI 应用调用 `chat` 接口，传入 `user_id`、`query` 等参数。
2.  **自动召回**：MemOS 异步并发从个人记忆空间及关联知识库中提取相关事实。
3.  **Prompt 拼装**：系统将用户记忆、系统指令与当前问题拼接为完整 Prompt。
4.  **模型回答**：调用指定的大模型生成回复，并返回给应用。
5.  **异步加工**：若开启 `add_message_on_answer`，系统在后台自动将本轮对话更新为记忆。

## 4. 快速上手

推荐使用开源版内置的 `MemOSClient` 进行调用。以下示例展示了如何询问关于 R 语言学习的建议，并利用记忆功能：

```python
import os
from memos.api.client import MemOSClient

# 初始化客户端，指向本地服务地址
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8000/product"
)

# 发起对话：系统会自动查找用户之前关于“R语言”或“可视化”的记忆
res = client.chat(
    user_id="memos_user_123",
    conversation_id="session_r_study",
    query="我最近在学 R 语言，除了 ggplot2，还有什么推荐的数据可视化包吗？",
    add_message_on_answer=True,  # 自动存储本次对话为新记忆
    include_preference=True       # 开启偏好召回
)

if res:
    print(f"AI 建议: {res.data}")
```

## 5. 更多功能

除了一键复制上述快速开始代码，本接口还提供了丰富的其他可配置参数，您可以根据业务需求灵活调用 `chat` 接口。

### 5.1 筛选召回的记忆

通过以下参数，您可以实现精细化的记忆检索控制：

| **功能** | **字段** | **说明** |
| :--- | :--- | :--- |
| **记忆过滤器** | `filter` | 支持传入 JSON 结构的逻辑条件，用于按标签、元信息或时间筛选记忆。 |
| **召回偏好记忆** | `include_preference` / `preference_limit_number` | 开启后，AI 会参考用户的隐性/显式偏好。 |
| **检索指定知识库** | `knowledgebase_ids` | 用于指定本次对话可访问的关联知识库范围。 |

### 5.2 调整模型回答

您可以直接在请求中调整底层大模型的生成表现，或通过 `/configure` 接口进行全局设置。

| **功能** | **字段** | **说明 & 可选值** |
| :--- | :--- | :--- |
| **选定模型** | `model_name` | 指定使用的模型名称。开源版默认模型可在环境配置中通过 `MOS_CHAT_MODEL` 定义。 |
| **自定义指令** | `system_prompt` | 支持传入自定义系统提示词，覆盖默认的记忆安全协议指令。 |
| **流式回答控制** | `async_mode` | 对应接口 `/product/chat/stream`。开启后支持流式输出，提升交互体验。 |
| **温度系数** | `temperature` | 控制生成随机性。建议范围 0.0 - 2.0，默认值为 0.7。 |
| **候选词范围** | `top_p` | 控制生成时的采样范围。默认值为 0.95。 |
| **长度限制** | `max_tokens` | 限制单次回复的最大 Token 数。默认值为 8192。 |



### 5.3 闭环记忆自动化

这是开源版的核心特色，支持在对话过程中自动完成记忆的维护：

| **功能** | **字段** | **说明** |
| :--- | :--- | :--- |
| **自动生成记忆** | `add_message_on_answer` | 开启后（True），系统会自动将用户消息与模型回复处理为新记忆。 |
| **关联元信息** | `info` / `tags` | 为本次对话生成的记忆打上业务标签或存储自定义元数据。 |
| **实体关联** | `agent_id` / `app_id` | 将记忆关联到特定的 Agent 或应用，方便多应用间的数据隔离。 |

:::note
**开发者提示：**
在开源版本中，所有默认参数均可在项目的 `DEFAULT_CONFIG` 中找到并进行初始化修改。
:::