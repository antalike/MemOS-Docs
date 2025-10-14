## 使用示例

### 实时导入对话

你可以在用户每次收到模型回复时，实时调用接口添加消息，随时与 MemOS 同步用户与助手的对话。MemOS将在后端不断根据新的对话，更新用户记忆。

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

def add_message(user_id, conversation_id, role, content):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": [{"role": role, "content": content}]
    }
    
    res = requests.post(f"{BASE_URL}/add/message", headers=headers, data=json.dumps(data))
    result = res.json()
  
    if result.get('code') == 0: 
      print(f"✅ 添加成功")
    else:
      print(f"❌ 添加失败, {result.get('message')}")

# 用户发送消息
add_message("memos_user_123", "memos_conversation_123", "user","""我今天早上跑了5公里，膝盖有点酸""")

# AI 回复消息
add_message("memos_assistant_123", "memos_conversation_123", "assistant","""你今天跑了5公里，膝盖有点酸，说明关节和肌肉还在适应强度。明天建议把距离控制在3公里左右，重点放在充分热身和放松。这样既能维持训练节奏，又能给膝盖恢复的时间。""")
```

### 导入历史对话

如果你已经构建了 AI 对话应用，MemOS 也支持批量导入已有聊天记录，帮助对话助手记住用户，更个性化地回复。

🍬 小Tips：`chat_time` 可使用结构化时间或中文文本，主要用于 MemOS 在召回记忆时参考，以提升记忆的准确性。

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

# 示例历史对话数据
history_messages = [
  # 用户第一天和AI的对话
    {"role": "user", "content": "我喜欢吃辣的食物", "chat_time": "2025-09-12 08:00:00"},
    {"role": "assistant", "content": "明白啦，我记住了，你喜欢辣味的食物。", "chat_time": "2025-09-12 08:01:00"},
  # 用户几天后和AI的对话
    {"role": "user", "content": "但我又不太喜欢重油的，比如麻辣火锅、毛血旺之类的", "chat_time": "2025-09-25 12:00:00"},
    {"role": "assistant", "content": "你更偏好清爽又带辣味的菜。我可以帮你推荐一些适合你的辣味美食哦~", "chat_time": "2025-09-25 12:01:00"}
]

def add_message(user_id, conversation_id, messages):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": messages
    }
    res = requests.post(f"{BASE_URL}/add/message", headers=headers, data=json.dumps(data))
    result = res.json()
  
    if result.get('code') == 0: 
      print(f"✅ 添加成功")
    else:
      print(f"❌ 添加失败, {result.get('message')}")

# === 使用示例 ===

# 导入历史对话
add_message("memos_user_345", "memos_conversation_345", history_messages)
```

### 记录用户偏好或行为

除了导入对话内容，用户的个人偏好、行为等数据，例如首次启动应用时填写的兴趣问卷信息，同样可以导入 MemOS，作为记忆的一部分。

🍬 小Tips：`content` 字段必须是字符串，可以写成单行或多行文本，都可以被系统正常识别。

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

# 用户兴趣信息
user_profile_info = [
    {
        "role": "user",
        "content": """
喜欢的电影类型: 科幻, 动作, 喜剧
喜欢的电视剧类型: 悬疑, 历史剧
喜欢的书籍类型: 科普, 技术, 自我成长
喜欢的学习方式: 文章, 视频, Podcast
运动习惯: 跑步, 健身
饮食偏好: 偏爱辣, 健康饮食
旅游偏好: 自然景观, 城市文化, 冒险
喜欢的聊天风格: 幽默, 温暖, 轻松闲聊
想让AI提供的帮助类型: 建议, 信息查询, 灵感
我最感兴趣的话题: 人工智能, 未来科技, 电影评论
我希望AI帮助的事情: 规划日常学习计划, 推荐电影和书籍, 提供心情陪伴
        """
    }
]

def add_message(user_id, conversation_id, messages):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": messages
    }
  
    res = requests.post(f"{BASE_URL}/add/message", headers=headers, data=json.dumps(data))
    result = res.json()
  
    if result.get('code') == 0: 
      print(f"✅ 添加成功")
    else:
      print(f"❌ 添加失败, {result.get('message')}")

# === 使用示例 ===

# 导入用户兴趣问卷信息
add_message("memos_user_567", "memos_conversation_id_567", user_profile_info)
```