---
title: 添加消息
desc: MemOS 会将您通过接口提交的消息内容，自动处理并持久化为可检索、可召回的个人记忆。
---
::warning
**[直接看 API文档 点这里哦](/api_docs/core/add_message)**
<br>
<br>

**本文聚焦于开源项目的功能说明，详细接口字段及限制请点击上方文字链接查看**
::

**接口路径**：`POST /product/add`
**功能描述**：这是 MemOS 的核心生产接口。它支持通过对话列表、纯文本或元数据信息，将原始数据转化为结构化的记忆片段，实现 AI 应用的长期记忆能力。

## 1. 为什么记忆很重要？

在开源版 MemOS 中，添加消息是构建 AI “懂用户”能力的起点：
* **跨会话长期记忆**：能够实现跨会话的长期记忆，避免对话结束后信息丢失。
* **个性化积累**：随着交互不断积累，让 AI 越来越“懂用户”。
* **动态更新**：在会话过程中持续写入新信息，动态更新用户记忆。
* **共享体验**：在您的多个应用或产品之间，共享同一用户的记忆，实现一致的用户体验。

## 2. 关键接口参数

根据开源代码 `src/api/routers/client.py` 的实现，该接口接受以下核心参数：

### 核心标识
| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `user_id` | `str` | 是 | 用于标识消息所属的唯一用户。 |
| `conversation_id` | `str` | 是 | 用于标识消息所属的唯一会话。 |
| `messages` | `list` | 是 | 对话内容列表，格式为 `[{"role": "user", "content": "..."}]`。 |

### 扩展配置
| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `tags` | `list[str]` | `None` | 为当前消息添加自定义标签，用于后续记忆过滤。 |
| `async_mode` | `bool` | `True` | 控制添加消息后的处理方式。开启后系统将异步生产记忆。 |
| `info` | `dict` | `None` | 自定义元信息（如 `scene`, `biz_id`），支持后续高级过滤检索。 |
| `allow_public` | `bool` | `False` | 控制生成的记忆是否写入项目级公共记忆空间。 |

## 3. 工作原理



当您通过 `POST /product/add` 提交请求后，系统内部将执行以下逻辑：
1. **请求校验**：通过 `RequestContextMiddleware` 校验请求来源及其身份有效性。
2. **信息提取**：使用内部 LLM 从消息中提取事实、偏好等内容，处理为事实记忆、偏好记忆或工具记忆。
3. **冲突解决**：系统会自动检查现有记忆是否有重复或矛盾，并完成更新。
4. **记忆储存**：最终产生的记忆将使用向量数据库与图数据库储存。

## 4. 快速上手示例

您可以直接使用项目中封装的 `MemOSClient` 进行调用：

```python
import os
from memos.api.client import MemOSClient

# 初始化客户端
# 默认 base_url 指向本地 8000 端口的 /product
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8000/product"
)

# 添加一组对话消息
res = client.add_message(
    user_id="memos_user_123",
    conversation_id="conv_2026_01",
    messages=[
        {"role": "user", "content": "我计划今年暑假去大连看海。"},
        {"role": "assistant", "content": "大连是个不错的选择，我会记得您的旅行计划。"}
    ],
    tags=["travel_plan"],
    info={"priority": "high"}
)

if res and res.code == 200:
    print("✅ 记忆添加成功")
```
## 5. 使用场景

### 5.1 实时导入对话

您可以在用户每次收到模型回复时，实时调用接口同步对话。MemOS 将在后端不断根据新的对话更新用户记忆。

```python
import os
from memos.api.client import MemOSClient

# 初始化客户端，默认指向本地开发环境地址
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8001/product"
)

def sync_chat_to_memos(user_id, conversation_id, messages):
    # 调用开源版客户端封装的 add_message 方法
    res = client.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        messages=messages,
        async_mode=True  # 实时同步建议使用异步模式，不阻塞主流程
    )
  
    if res and res.code == 200: 
        print(f"✅ 记忆实时同步成功")
    else:
        print(f"❌ 同步失败")

# 示例：同步一组实时生成的对话
sync_chat_to_memos(
    user_id="memos_user_123", 
    conversation_id="conv_realtime_001",
    messages=[
        {"role": "user", "content": "我最近在自学 R 语言，对数据可视化很感兴趣。"}, 
        {"role": "assistant", "content": "这很棒！R 语言的 ggplot2 包是数据可视化的神器。"}
    ]
)
```
### 5.2 导入历史对话
```python
如果您已经构建了 AI 对话应用，MemOS 支持批量导入已有聊天记录，帮助助手建立初始记忆。

# 示例历史对话数据格式
history_messages = [
    {"role": "user", "content": "我喜欢吃辣的食物"},
    {"role": "assistant", "content": "明白啦，我记住了，你喜欢辣味的食物。"},
    {"role": "user", "content": "但我又不太喜欢重油的，比如麻辣火锅之类的"}
]

# 批量导入建议关闭 async_mode 以确保导入顺序和完整性
client.add_message(
    user_id="memos_user_123",
    conversation_id="history_import_01",
    messages=history_messages,
    async_mode=False
)
```
这是为你整理的开源版 添加消息 (Add Message) 文档中“使用场景”与“更多功能”部分的 Markdown 源代码。

我已将示例代码从云服务的原始 requests 方式，修改为直接调用你提供的开源版 MemOSClient 方式，这更符合开源项目的使用习惯。

Markdown

## 5. 使用场景

### 5.1 实时导入对话

您可以在用户每次收到模型回复时，实时调用接口同步对话。MemOS 将在后端不断根据新的对话更新用户记忆。

```python
import os
from memos.api.client import MemOSClient

# 初始化客户端，默认指向本地开发环境地址
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8001/product"
)

def sync_chat_to_memos(user_id, conversation_id, messages):
    # 调用开源版客户端封装的 add_message 方法
    res = client.add_message(
        user_id=user_id,
        conversation_id=conversation_id,
        messages=messages,
        async_mode=True  # 实时同步建议使用异步模式，不阻塞主流程
    )
  
    if res and res.code == 200: 
        print(f"✅ 记忆实时同步成功")
    else:
        print(f"❌ 同步失败")

# 示例：同步一组实时生成的对话
sync_chat_to_memos(
    user_id="memos_user_123", 
    conversation_id="conv_realtime_001",
    messages=[
        {"role": "user", "content": "我最近在自学 R 语言，对数据可视化很感兴趣。"}, 
        {"role": "assistant", "content": "这很棒！R 语言的 ggplot2 包是数据可视化的神器。"}
    ]
)
5.2 导入历史对话
如果您已经构建了 AI 对话应用，MemOS 支持批量导入已有聊天记录，帮助助手建立初始记忆。

Python

# 示例历史对话数据格式
history_messages = [
    {"role": "user", "content": "我喜欢吃辣的食物"},
    {"role": "assistant", "content": "明白啦，我记住了，你喜欢辣味的食物。"},
    {"role": "user", "content": "但我又不太喜欢重油的，比如麻辣火锅之类的"}
]

# 批量导入建议关闭 async_mode 以确保导入顺序和完整性
client.add_message(
    user_id="memos_user_123",
    conversation_id="history_import_01",
    messages=history_messages,
    async_mode=False
)
```
### 5.3 记录用户偏好或行为
除了对话内容，用户的个人偏好、兴趣问卷等结构化数据也可以导入，作为记忆的一部分。
```python
# 示例用户兴趣信息导入
client.add_message(
    user_id="memos_user_123",
    conversation_id="user_profile_001",
    messages=[
        {
          "role": "user",
          "content": """
          喜欢的电影类型: 科幻, 动作
          运动习惯: 跑步, 健身
          饮食偏好: 偏爱辣, 健康饮食
          """
        }
    ],
    tags=["profile", "preference"] # 使用标签便于后续筛选
)
```
## 6. 更多功能

开源版 `add_message` 提供了丰富的配置参数，支持精细化的记忆管理与多维度的数据归属。

:::note
有关 API 字段定义及格式的完整列表，请参考 [Add Message 详细接口文档](/api_docs/core/add_message)。
:::

| **功能** | **字段** | **说明** |
| :--- | :--- | :--- |
| **关联实体** | `agent_id` / `app_id` | 将当前用户的对话消息关联到具体的 Agent 或应用 ID，便于后续按实体维度检索记忆。 |
| **消息列表** | `messages` | 核心对话内容列表。支持 `user` / `assistant` / `system` / `tool` 等角色。 |
| **处理模式** | `async_mode` | 默认为 `True`。开启后系统异步提取记忆并快速返回；关闭则接口会阻塞直至记忆生产完成。 |
| **自定义标签** | `tags` | 为消息添加自定义标签（如 `feedback`），用于后续记忆过滤及高级图召回。 |
| **扩展元信息** | `info` | 自定义键值对字典。建议使用 `biz_id` 或 `scene` 等已索引字段以获得更优的检索性能。 |
| **公共记忆** | `allow_public` | 默认为 `False`。若开启，该消息生成的记忆将共享给项目下的所有用户。 |
| **写入知识库** | `allow_knowledgebase_ids` | 控制生成的记忆是否同步写入指定的知识库 ID 列表中，实现记忆与知识库的联动。 |

:::note
**开发者提示：**
在开源版 MemOS 中，所有的请求校验（如参数缺失）和业务异常均由 `APIExceptionHandler` 统一捕获，并返回标准化的错误响应格式。
:::