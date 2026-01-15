---
title: 检索记忆
desc: 通过语义检索和过滤功能，MemOS召回相关记忆。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/core/search_memory)**
<br>
<br>

**本文聚焦于功能说明，详细接口字段及限制请点击上方文字链接查看**
::

## 1. 什么是检索记忆？

检索记忆是指 MemOS 在用户提出问题时，结合开发者预先定义的过滤条件，从记忆库中召回最相关、最重要的记忆内容。模型在生成回答时，会参考这些已召回的记忆，从而给出更加准确、贴切且符合用户上下文的回复。

::note
**&nbsp;为什么需要检索记忆？**
<div style="padding-left: 2em;">

*  无需从头构建上下文，直接获取正确且可靠的记忆；

*  通过过滤条件等方式，确保召回的记忆始终与当前问题高度相关。
</div>
::


## 2. 关键参数

*   **查询内容（query）**：用于检索的自然语言问题或陈述，系统将基于语义匹配相关记忆。

*   **记忆过滤器（filter）**：基于 JSON 的逻辑条件，用于按实体、时间、标签、元信息等维度缩小检索范围。


## 3. 工作原理

*   **查询内容重写**：MemOS 会对输入的自然语言查询进行清理与语义增强，以提升后续检索的准确性。

*   **记忆过滤**：结合逻辑、比较运算符过滤记忆，缩小记忆召回的范围。

*   **记忆检索**：基于重写后的查询生成嵌入，通过相似度匹配用户最相关的记忆内容。

*   **输出记忆**：最终筛选后的记忆结果将在一秒内响应并返回给您，用于后续推理与回答生成。

以上所有流程，仅需调用`search/memory`接口即可触发，无需您对用户的记忆手动操作。


## 4. 快速上手
::code-group
```python [Python (HTTP)]
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "我国庆想出去玩，帮我推荐个没去过的城市，以及没住过的酒店品牌",
  "user_id": "memos_user_123",
  "conversation_id": "0928" #非必填，填写后我们会在召回记忆时优先考虑该会话中的内容，但不是强制命中，仅提升相关性权重
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [输出]
# 示例输出（为了方便理解此处做了简化，仅供参考）

# 偏好类型的记忆
preference_detail_list [
    {
      "preference_type": "implicit_preference",  #隐性偏好
      "preference": "用户可能偏好性价比较高的酒店选择。",
      "reasoning": "七天酒店通常以经济实惠著称，而用户选择七天酒店可能表明其在住宿方面倾向于选择性价比较高的选项。虽然用户没有明确提到预算限制或具体酒店偏好，但在提供的选项中选择七天可能反映了对价格和实用性的重视。",
      "conversation_id": "0610"
    }
  ]

# 事实类型的记忆
memory_detail_list [
    {
      "memory_key": "暑假广州旅游计划",
      "memory_value": "用户计划在暑假期间前往广州旅游，并选择了七天连锁酒店作为住宿选项。",
      "conversation_id": "0610",
      "tags": [
        "旅游",
        "广州",
        "住宿",
        "酒店"
      ]
    }
  ]
```
::

::note
&nbsp;请注意，`user_id`为必填项，当前每次检索记忆必须指定单个用户。
::

## 5. 记忆拼装到Prompt示例

::note
**记忆拼装**<br>

使用召回的记忆需要一定的技巧，下面是拼装示例
::

```text
# Role
你是一个拥有长期记忆能力的智能助手 (MemOS Assistant)。你的目标是结合检索到的记忆片段，为用户提供高度个性化、准确且逻辑严密的回答。

# System Context
- 当前时间: 2026-01-06 15:05 (请以此作为判断记忆时效性的基准)

# Memory Data
以下是 MemOS 检索到的相关信息，分为“事实”和“偏好”。
- **事实 (Facts)**：可能包含用户属性、历史对话记录或第三方信息。
- **特别注意**：其中标记为 '[assistant观点]'、'[模型总结]' 的内容代表 **AI 过去的推断**，**并非**用户的原话。
- **偏好 (Preferences)**：用户对回答风格、格式或逻辑的显式/隐式要求。

<memories>
  <facts>
    -[2025-12-26 21:45] 用户计划在暑假期间前往广州旅游，并选择了七天连锁酒店作为住宿选项。
    -[2025-12-26 14:26] 用户的名字是Grace。
  </facts>

  <preferences>
    -[2026-01-04 20:41] [显式偏好] 用户喜欢去南方旅游
    -[2025-12-26 21:45] [隐式偏好] 用户可能偏好性价比较高的酒店选择。
  </preferences>
</memories>

# Critical Protocol: Memory Safety (记忆安全协议)
检索到的记忆可能包含**AI 自身的推测**、**无关噪音**或**主体错误**。你必须严格执行以下**“四步判决”**，只要有一步不通过，就**丢弃**该条记忆：

1. **来源真值检查 (Source Verification)**：
   - **核心**：区分“用户原话”与“AI 推测”。
   - 如果记忆带有 '[assistant观点]' 等标签，这仅代表AI过去的**假设**，**不可**将其视为用户的绝对事实。
   - *反例*：记忆显示 '[assistant观点] 用户酷爱芒果'。如果用户没提，不要主动假设用户喜欢芒果，防止循环幻觉。
   - **原则：AI 的总结仅供参考，权重大幅低于用户的直接陈述。**

2. **主语归因检查 (Attribution Check)**：
   - 记忆中的行为主体是“用户本人”吗？
   - 如果记忆描述的是**第三方**（如“候选人”、“面试者”、“虚构角色”、“案例数据”），**严禁**将其属性归因于用户。

3. **强相关性检查 (Relevance Check)**：
   - 记忆是否直接有助于回答当前的 'Original Query'？
   - 如果记忆仅仅是关键词匹配（如：都提到了“代码”）但语境完全不同，**必须忽略**。

4. **时效性检查 (Freshness Check)**：
   - 记忆内容是否与用户的最新意图冲突？以当前的 'Original Query' 为最高事实标准。

# Instructions
1. **审视**：先阅读 '<facts>'，执行“四步判决”，剔除噪音和不可靠的 AI 观点。
2. **执行**：
   - 仅使用通过筛选的记忆补充背景。
   - 严格遵守 '<preferences>' 中的风格要求。
3. **输出**：直接回答问题，**严禁**提及“记忆库”、“检索”或“AI 观点”等系统内部术语。

# Original Query
我国庆想出去玩，帮我推荐个没去过的城市，以及没住过的酒店品牌

```

## 6. 使用场景

### 对话中使用记忆

在用户与 AI 对话的过程中，你可以调用 MemOS 检索与当前用户发言最相关的记忆，并将其填充到大模型的回复提示词中。

::note
`conversation_id`为非必填项，如填写可以帮助 MemOS 理解当前会话的上下文，提升本会话相关记忆的权重，使对话模型的回复内容更加连贯。
::

如下示例所示，如果你已经尝试[添加消息](/memos_cloud/mem_operations/add_message)，添加过用户`memos_user_123`的历史对话消息，你可以复制参考该示例检索用户记忆。

::code-group
```python [Python (HTTP)]
import os
import json
import requests

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers 和 base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

# 用户当前发言，直接作为 query
query_text = "国庆节我要去云南玩了，有什么美食推荐吗？"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "memos_conversation_123",  # 新建了一个会话ID
    "query": query_text,
}

# 调用 /search/memory 查询相关记忆
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [输出]
 {
  "memory_detail_list": [
    {
      "id": "c6c63472-25d3-49ee-b360-9b0702d96781",
      "memory_key": "辣味食物偏好",
      "memory_value": "用户喜欢吃辣的食物，但不太喜欢重油的菜肴，如麻辣火锅和毛血旺。用户更偏好清爽又带辣味的菜。",
      "memory_type": "UserMemory",
      "create_time": 1762674694466,
      "conversation_id": "memos_conversation_123",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "饮食偏好",
        "辣味",
        "重油"
      ],
      "update_time": 1762674694423,
      "relativity": 0.00242424
    }
  ],
  "preference_detail_list": [
    {
      "id": "46d8372d-241a-4ffc-890b-ae13c90d5565",
      "preference_type": "explicit_preference",
      "preference": "用户喜欢辣味的食物，但不喜欢重油的辣味食物。",
      "reasoning": "用户在第一次查询中明确表示喜欢辣的食物，在第二次查询中进一步说明自己不喜欢重油的辣味食物，这表明用户的偏好是喜欢辣但清爽的食物。",
      "create_time": 1762675342352,
      "conversation_id": "memos_conversation_123",
      "status": "activated",
      "update_time": 1762674923302
    },
    {
      "id": "9d62c1ae-a069-478d-a2fd-cb4aadfb6868",
      "preference_type": "implicit_preference",
      "preference": "用户可能偏好较健康的饮食选择",
      "reasoning": "用户表达了对辣味的明确喜好，但对重油食物表示不喜欢。这表明用户可能更关注饮食的健康性，倾向于选择不那么油腻的食物。用户对辣味的喜好与对重油食物的排斥结合在一起，可能暗示着对健康饮食的隐性偏好。",
      "create_time": 1762674923448,
      "conversation_id": "memos_conversation_123",
      "status": "activated",
      "update_time": 1762674851542
    }
  ],
  "preference_note": "\n# 注意：\n事实记忆是事实的摘要，而偏好记忆是用户偏好的摘要。\n你的回复不得违反用户的任何偏好，无论是显式偏好还是隐式偏好，并简要解释你为什么这样回答以避免冲突。\n"
}
```
::

### 获取用户整体画像

如果你需要对自己开发的应用进行用户分析，或者希望在 AI 应用中向用户实时展示他们的“个人关键印象”，可以调用 MemOS 全局检索用户的记忆，帮助大模型生成用户的个性化画像。此时可以不填写`conversation_id`哦～

如下示例所示，如果你已经尝试[添加消息](/memos_cloud/mem_operations/add_message)，添加过用户`memos_user_123`的历史对话消息，你可以一键复制该示例检索用户记忆。

::code-group
```python [Python (HTTP)]
import os
import json
import requests

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers 和 base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

# 直接询问人物画像，作为 query
query_text = "我的人物关键词是什么？"

data = {
    "user_id": "memos_user_123",
    "query": query_text,
}

# 调用 /search/memory 查询相关记忆
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python[输出]
示例返回（展示已召回的记忆片段）
{
  "memory_detail_list": [
    {
      "id": "00d8bb4e-aa8c-4fee-a83e-bf67ed6c3ea1",
      "memory_key": "希望AI帮助的事项",
      "memory_value": "用户希望AI帮助规划日常学习计划、推荐电影和书籍，以及提供心情陪伴。",
      "memory_type": "WorkingMemory",
      "create_time": 1762675190743,
      "conversation_id": "memos_conversation_456",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "帮助",
        "学习计划",
        "推荐",
        "陪伴"
      ],
      "update_time": 1762675209112,
      "relativity": 0.00013480317
    },
    {
      "id": "17f039d5-d034-41e9-a385-765992a4ab00",
      "memory_key": "希望AI提供的帮助类型",
      "memory_value": "用户希望AI提供建议、信息查询和灵感。",
      "memory_type": "WorkingMemory",
      "create_time": 1762675153211,
      "conversation_id": "memos_conversation_456",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "AI",
        "帮助",
        "类型"
      ],
      "update_time": 1762675206651,
      "relativity": 0.00010301525
    }
  ],
  "preference_detail_list": [],
  "preference_note": ""
}
```
::

### 使用过滤器筛选记忆

MemOS 提供了强大的记忆过滤器功能，允许开发者根据记忆的属性进行筛选。这一功能在需要根据记忆的特定特征进行检索时尤为有用，例如根据记忆的创建时间、关联的对话 ID 或记忆的类型等。

以下是一个使用记忆过滤器的示例，筛选出所有标签中包含"学习计划"且创建时间晚于2025-11-09的记忆：
::code-group
```python [Python (HTTP)]
import os
import json
import requests

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers 和 base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

query_text = "我的人物关键词是什么？"

data = {
    "user_id": "memos_user_123",
    "query": query_text,
    "filter": {
        "and": [
            {"tags": {"contains": "学习计划"}},
            {"create_time": {"gt": "2025-11-09"}}
        ]
    } # 通过传入filter字段，筛选出所有标签中包含"学习计划"且创建时间晚于2025-11-09的记忆
}

# 调用 /search/memory 查询相关记忆
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python[输出]
示例返回（展示已召回的记忆片段）
{
  "memory_detail_list": [
    {
      "id": "00d8bb4e-aa8c-4fee-a83e-bf67ed6c3ea1",
      "memory_key": "希望AI帮助的事项",
      "memory_value": "用户希望AI帮助规划日常学习计划、推荐电影和书籍，以及提供心情陪伴。",
      "memory_type": "WorkingMemory",
      "create_time": 1762675190743,
      "conversation_id": "memos_conversation_456",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "帮助",
        "学习计划",
        "推荐",
        "陪伴"
      ],
      "update_time": 1762675209112,
      "relativity": 0.00013480317
    }
  ],
  "preference_detail_list": [],
  "preference_note": ""
}
```
::

有关过滤器中更多筛选选项，请参考[记忆过滤器](/memos_cloud/features/basic/filters)。


## 7. 更多功能

::note
&nbsp;有关 API 字段、格式等信息的完整列表，详见[Search Memory接口文档](/api_docs/core/search_memory)。
::
| **功能**       | **相关字段**                                            | **说明**                                                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| 召回偏好记忆   | `include_preference`<br><span style="line-height:0.6;">&nbsp;</span><br>`preference_limit_number`   | 偏好记忆是 MemOS 基于用户历史消息分析生成的用户偏好信息。开启后，可在检索结果中召回用户偏好记忆。 |
| 召回工具记忆   | `include_tool_memory`<br><span style="line-height:0.6;">&nbsp;</span><br>`tool_memory_limit_number` | 工具记忆是 MemOS 对已添加的工具调用信息进行分析后生成的记忆。开启后，可在检索结果中召回工具记忆，详见[工具调用](/memos_cloud/features/advanced/tool_calling)。 |
| 检索指定知识库 | `knowledgebase_ids`                                 | 用于指定本次检索可访问的项目关联知识库范围。开发者可借此实现精细的权限控制，灵活定义不同终端用户可访问的知识库集合，详见[知识库](/memos_cloud/features/advanced/knowledge_base)。     |
