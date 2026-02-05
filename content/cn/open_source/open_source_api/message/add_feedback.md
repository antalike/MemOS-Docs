---
title: 添加反馈
desc: 提交用户对大模型回复的反馈内容，帮助 MemOS 实时更正、优化或删除不准确的记忆。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/message/get_status)**
<br>
<br>

**本文聚焦于开源项目的功能说明，详细接口字段及限制请点击上方文字链接查看**
::

**接口路径**：`POST /product/feedback`
**功能描述**：当您发现大模型的回答基于了错误的记忆，或者用户的偏好发生了变化时，可以通过此接口提交反馈。MemOS 会分析反馈内容，并据此调整存储在向量库和图数据库中的相关条目。

## 1. 为什么需要添加反馈？

* **记忆纠偏**：MemOS 能够基于用户的反馈更正已有记忆，解决信息过时或提取错误的问题。
* **强化偏好**：通过正向或负向反馈，让 AI 更好地理解用户的隐性偏好。
* **提升准确性**：反馈内容会作为后续记忆生产的参考，防止 AI 重复犯同样的错误。

## 2. 关键接口参数
本接口接受以下参数：

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **`user_id`** | `str` | 是 | 反馈内容所关联的用户唯一标识符。 |
| **`conversation_id`** | `str` | 是 | 反馈内容所关联的会话唯一标识符。 |
| **`feedback_content`** | `str` | 是 | 反馈的文本内容（例如：“我不喜欢吃辣了”或“你记错我的名字了”）。 |
| `feedback_time` | `str` | 否 | 反馈发生的时间，支持结构化或自然语言描述。 |
| `agent_id` / `app_id` | `str` | 否 | 关联的 Agent 或应用标识，用于实现精细化的记忆隔离。 |
| `allow_public` | `bool` | 否 | 是否允许将由此反馈产生的修正记忆写入公共记忆库。 |

## 3. 工作原理

1. **反馈接收**：系统接收到 `feedback_content` 后，结合当前 `conversation_id` 的语境进行解析。
2. **冲突检测**：AI 会检查反馈内容是否与现有记忆库中的事实存在冲突。
3. **记忆更正**：如果发现冲突，系统会更新原有的事实条目；如果是新信息，则作为补充记忆存入。
4. **实时生效**：更正后的记忆在下一次调用 [**检索记忆**](./search_memory.md) 时即可被正确召回。

## 4. 快速上手示例

推荐使用项目中封装的 `MemOSClient` 提交反馈：

```python
from memos.api.client import MemOSClient

# 初始化客户端
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8000/product"
)

# 提交反馈以更正记忆
res = client.add_feedback(
    user_id="memos_user_123",
    conversation_id="conv_888",
    feedback_content="我最近开始尝试清淡饮食了，不再喜欢重辣的食物。",
    feedback_time="2026-02-04",
    tags=["preference_update"]
)

if res and res.code == 200:
    print("✅ 反馈已接收，系统正在更正记忆...")
```


## 5. 使用场景
### 5.1 纠正 AI 的错误推断
如果 AI 之前根据对话错误地总结了用户的名字或职业，用户可以直接反馈：“我的名字是 Grace，不是 Gray”。MemOS 会自动修正 `UserMemory` 中的相关条目。

### 5.2 更新过时的用户偏好
用户的喜好会随时间改变。通过记录反馈（如饮食习惯、旅游倾向的变化），可以确保 AI 生成的建议始终符合用户现状。

### 5.3 跨实体记忆同步
通过指定 `allow_knowledgebase_ids`，反馈产生的修正结果可以同步写入关联的知识库，让所有相关 Agent 都能获取到最新的信息。