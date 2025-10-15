## 使用示例

### 对话中使用记忆

在用户与 AI 对话的过程中，你可以调用 MemOS 检索与当前用户发言最相关的记忆，并将其填充到大模型的回复提示词中。

🍬 **小**Tips：填写 `conversation_id` 可以帮助 MemOS 理解当前会话的上下文，提升本会话相关记忆的权重，使对话模型的回复内容更加连贯。

如下示例所示，如果你已经参考 [添加消息 > 导入历史对话](/cn/dashboard/api/add-message#%E5%AF%BC%E5%85%A5%E5%8E%86%E5%8F%B2%E5%AF%B9%E8%AF%9D)，添加过用户`memos_user_345` 的历史对话消息，你可以一键复制该示例检索用户记忆。

```python
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
    "user_id": "memos_user_345",
    "conversation_id": "memos_conversation_789",  # 新建了一个会话ID
    "query": query_text,
}

# 调用 /search/memory 查询相关记忆
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
# 示例返回（展示已召回的记忆片段）
# [
#     {
#         "id": "3fa96c6c-a844-4249-a762-dbd26d4279c7",
#         "memory_key": "饮食偏好",
#         "memory_value": "[user观点]用户喜欢辣味食物，但不太喜欢重油的菜肴，如麻辣火锅和毛血旺。",
#         "memory_type": "WorkingMemory",
#         "conversation_id": "memos_conversation_345",
#         "tags": ["饮食", "偏好", "辣味"],
#         "relativity": 0.0043  # 表示与 query 的相关度，值越高表示越相关
#     },
#     {
#         "id": "51b537b6-9116-475c-b26f-2e4b445c863d",
#         "memory_key": "清爽辣味菜肴建议",
#         "memory_value": "[assistant观点]助手了解到用户的饮食偏好后，建议推荐一些清爽又带辣味的菜肴。",
#         "memory_type": "WorkingMemory",
#         "conversation_id": "memos_conversation_345",
#         "tags": ["饮食建议", "辣味"],
#         "relativity": 0.0355
#     }
# ]

```

### 获取用户整体画像

如果你需要对自己开发的应用进行用户分析，或者希望在 AI 应用中向用户实时展示他们的“个人关键印象”，可以调用 MemOS 全局检索用户的记忆，帮助大模型生成用户的个性化画像。

🍬 **小**Tips：此时可以不填写`conversation_id`哦～得到响应详情后，你可以挑选`memory_type` 为 `UserMemory` 的记忆，这类记忆提炼了与用户相关的个性化信息，适合用于生成用户画像或推荐内容。

如下示例所示，如果你已经参考 [添加消息 > 记录用户偏好或行为](/cn/dashboard/api/add-message#%E8%AE%B0%E5%BD%95%E7%94%A8%E6%88%B7%E5%81%8F%E5%A5%BD%E6%88%96%E8%A1%8C%E4%B8%BA)，添加过用户`memos_user_567` 的历史对话消息，你可以一键复制该示例检索用户记忆。

```python
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
    "user_id": "memos_user_567",
    "query": query_text,
}

# 调用 /search/memory 查询相关记忆
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")

# 示例返回（展示已召回的记忆片段）
# [
#   {
#     "id": "2b742eb2-ba0d-418b-8485-0333e51f4d63",
#     "memory_key": "用户的聊天风格与AI帮助期望",
#     "memory_value": "[user观点]用户喜欢幽默、温暖、轻松闲聊的聊天风格；希望AI提供建议、信息查询和灵感，并帮助规划日常学习计划、推荐电影和书籍以及提供心情陪伴。",
#     "memory_type": "UserMemory",  # 内存类型，用户记忆
#     "memoryTime": null,          # 记忆时间，未设置
#     "conversation_id": "memos_conversation_567",  # 对话 ID
#     "status": "activated",       # 状态：已激活
#     "confidence": 0.0,           # 置信度
#     "tags": [                    # 标签列表
#         "聊天风格",
#         "AI帮助",
#         "期望"
#     ],
#     "updateTime": 1758267685922, # 更新时间戳
#     "relativity": 1.6605854E-4   # 与上下文的相关性
#   },
#   {
#     "id": "aacdb351-b2d3-47b7-abdd-6945ec1f6778",
#     "memory_key": "用户感兴趣的话题",
#     "memory_value": "[user观点]用户对人工智能、未来科技和电影评论等话题最感兴趣。",
#     "memory_type": "UserMemory",  # 内存类型
#     "memoryTime": null,          # 记忆时间
#     "conversation_id": "memos_conversation_567",
#     "status": "activated",
#     "confidence": 0.0,
#     "tags": [
#         "兴趣",
#         "话题"
#     ],
#     "updateTime": 1758267685924,
#     "relativity": 9.536743E-5
#   },
#   {
#     "id": "381119b8-1063-4434-ae62-6806bc5a046a",
#     "memory_key": "用户的饮食和旅游偏好",
#     "memory_value": "[user观点]用户偏爱辣味及健康饮食；旅游时喜欢自然景观、城市文化和冒险活动。",
#     "memory_type": "WorkingMemory",  # 工作记忆
#     "memoryTime": null,
#     "conversation_id": "memos_conversation_567",
#     "status": "activated",
#     "confidence": 0.0,
#     "tags": [
#         "饮食",
#         "旅游",
#         "偏好"
#     ],
#     "updateTime": 1758267685921,
#     "relativity": 1.9669533E-5
#   },
#   {
#     "id": "895c2c35-6646-4241-909b-88e067e166b6",
#     "memory_key": "用户的学习方式和运动习惯",
#     "memory_value": "[user观点]用户偏好的学习方式包括阅读文章、观看视频和收听Podcast；运动习惯包括跑步和健身。",
#     "memory_type": "WorkingMemory",
#     "memoryTime": null,
#     "conversation_id": "memos_conversation_567",
#     "status": "activated",
#     "confidence": 0.0,
#     "tags": [
#         "学习",
#         "运动",
#         "方式"
#     ],
#     "updateTime": 1758267685918,
#     "relativity": 1.9073486E-5
#   },
#   {
#     "id": "df36e0e7-81a3-4694-810e-3b230d85dc13",
#     "memory_key": "用户的娱乐偏好",
#     "memory_value": "[user观点]用户喜欢的电影类型包括科幻、动作和喜剧；电视剧类型则偏好悬疑和历史剧；书籍类型偏好科普、技术和自我成长。",
#     "memory_type": "WorkingMemory",
#     "memoryTime": null,
#     "conversation_id": "memos_conversation_567",
#     "status": "activated",
#     "confidence": 0.0,
#     "tags": [
#         "娱乐",
#         "电影",
#         "电视剧",
#         "书籍"
#     ],
#     "updateTime": 1758267685917,
#     "relativity": 1.847744E-5
#   }
# ]
```