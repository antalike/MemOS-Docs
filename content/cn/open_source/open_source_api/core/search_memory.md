---
title: 检索记忆
desc: 通过语义检索和过滤功能，MemOS召回相关记忆。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/core/search_memory)**
<br>
<br>

**本文聚焦于开源项目的功能说明，详细接口字段及限制请点击上方文字链接查看**
::

**接口路径**：`POST /product/search`
**功能描述**：当用户提出问题时，MemOS 会结合开发者预设的过滤条件，从海量记忆中召回最相关、最重要的片段。这些片段可作为大模型的上下文，显著提升回答的准确性与个性化程度。

## 1. 什么是检索记忆？

检索记忆是指系统根据用户当前的 `query`（查询内容），利用向量相似度匹配和逻辑过滤，从存储的“事实记忆”和“偏好记忆”中提取关键信息。

::note
**&nbsp;为什么需要检索记忆？**
<div style="padding-left: 2em;">

* **增强可靠性**：无需为模型手动构建复杂的上下文，直接获取经过验证的记忆片段。
* **高度相关性**：通过过滤器（Filter）确保召回的内容始终贴合当前的业务语境。
</div>
::

## 2. 关键接口参数

根据开源代码 `client.py` 的定义，检索接口支持以下参数：

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `query` | `str` | 是 | 检索的自然语言问题。系统将基于此内容进行语义匹配。 |
| `user_id` | `str` | 是 | 指定检索哪位用户的记忆库。 |
| `conversation_id` | `str` | 否 | 提供当前会话 ID 可增加该会话内记忆的权重，提升回复连贯性。 |
| `memory_limit_number` | `int` | 否 | 默认召回 6 条。限制返回的事实记忆数量。 |
| `filter` | `dict` | 否 | 基于 JSON 的逻辑条件，用于按标签、时间或元信息缩小范围。 |
| `include_preference` | `bool` | 否 | 是否同时召回该用户的偏好记忆（显式/隐式偏好）。 |

## 3. 工作原理



1. **查询预处理**：MemOS 会对输入的 `query` 进行清理与语义增强，以提升向量检索的效果。
2. **逻辑过滤**：结合 `filter` 参数中的运算符（如 `contains`, `gt` 等）初步筛选记忆范围。
3. **语义检索**：基于嵌入（Embedding）向量，在向量数据库中寻找相似度最高的内容。
4. **结果排序**：根据 `relativity`（相关性分数）和时间权重对记忆片段进行排序并返回。

## 4. 快速上手示例

使用开源版 `MemOSClient` 快速执行一次记忆检索：

```python
from memos.api.client import MemOSClient

# 初始化客户端
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8001/product"
)

# 执行检索
res = client.search_memory(
    user_id="memos_user_123",
    conversation_id="conv_2026_09",
    query="我暑假想去旅游，根据我的偏好推荐个城市",
    memory_limit_number=5,
    include_preference=True # 同时获取用户的偏好，如“喜欢安静”、“偏好南方”
)

if res:
    # 打印召回的事实记忆
    for mem in res.memory_detail_list:
        print(f"Key: {mem['memory_key']}, Value: {mem['memory_value']}")
```

## 5. 使用场景

### 5.1 增强对话上下文
在与 AI 对话的过程中，您可以调用 MemOS 检索与当前用户发言最相关的记忆，并将其填充到大模型的回复提示词中。
::note
`conversation_id`为非必填项，如填写可以帮助 MemOS 理解当前会话的上下文，提升本会话相关记忆的权重，使对话模型的回复内容更加连贯。
::

### 5.2 用户整体画像分析
不指定 `conversation_id` 且使用全局查询（如“我的兴趣关键词是什么？”），可以获取用户在所有会话中积累的属性特征，帮助生成个性化画像。

### 5.3 进阶过滤器检索
您可以利用 `filter `字段实现复杂的筛选逻辑。例如：只搜索标签包含“学习计划”且创建时间晚于特定日期的记忆。

```python
# 示例：组合过滤器
search_filter = {
    "and": [
        {"tags": {"contains": "学习计划"}},
        {"create_time": {"gt": "2025-11-09"}}
    ]
}
```
## 6. 更多功能

::note
&nbsp;有关 API 字段、格式等信息的完整列表，详见[Search Memory接口文档](/api_docs/core/search_memory)。
::
| **功能**       | **相关字段**                                            | **说明**                                                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| 召回偏好记忆   | `include_preference`<br><span style="line-height:0.6;">&nbsp;</span><br>`preference_limit_number`   | 偏好记忆是 MemOS 基于用户历史消息分析生成的用户偏好信息。开启后，可在检索结果中召回用户偏好记忆。 |
| 召回工具记忆   | `include_tool_memory`<br><span style="line-height:0.6;">&nbsp;</span><br>`tool_memory_limit_number` | 工具记忆是 MemOS 对已添加的工具调用信息进行分析后生成的记忆。开启后，可在检索结果中召回工具记忆，详见[工具调用](/memos_cloud/features/advanced/tool_calling)。 |
| 检索指定知识库 | `knowledgebase_ids`                                 | 用于指定本次检索可访问的项目关联知识库范围。开发者可借此实现精细的权限控制，灵活定义不同终端用户可访问的知识库集合，详见[知识库](/memos_cloud/features/advanced/knowledge_base)。     |
