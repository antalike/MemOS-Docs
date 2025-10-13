## 使用示例

### 补充模型提示词

如果你认为在大模型回复时需要参考用户最近的对话内容，可以调用 MemOS 获取会话的历史消息，将返回的最近若干条消息拼接进提示词。这样可以在模型无状态的情况下，保持对话的连续性和上下文理解。

```python
import os
import requests
import json

API_KEY = os.environ["MEMOS_API_KEY"]
BASE_URL = os.environ["MEMOS_BASE_URL"]

headers = {
    "Authorization": f"Token {API_KEY}",
    "Content-Type": "application/json"
}

def get_message(user_id: str, conversation_id: str, limit: int):
    data = {
        "userId": user_id,
        "conversation_id": conversation_id,
        "messageLimitNumber": limit
    }

    res = requests.post(f"{BASE_URL}/get/message", headers=headers, json=data)

    if res.status_code == 200 and res.json().get("code") == 0:
        return res.json().get("data", {}).get("message_detail_list", [])
    else:
        print(f"❌ 获取消息失败: {res.text}")
        return []

# ---------------------------
# 获取历史消息
model_context = get_message("memos_user_345", "memos_conversation_345", 4)

# 去掉 chatTime，直接生成大模型可用格式，并打印
model_context_simple = [{"role": m["role"], "content": m["content"]} for m in model_context]
print(json.dumps(model_context_simple, ensure_ascii=False, indent=2))

# ---------------------------
# 示例输出：
# [
#   {"role": "user", "content": "我喜欢吃辣的食物"},
#   {"role": "assistant", "content": "明白啦，我记住了，你喜欢辣味的食物。"}
#   {"role": "user", "content": "但我又不太喜欢重油的，比如麻辣火锅、毛血旺之类的"},
#   {"role": "assistant", "content": "你更偏好清爽又带辣味的菜。我可以帮你推荐一些适合你的辣味美食哦~ "}
# ]
```

### 恢复聊天上下文

如果你正在初步搭建 AI 应用，暂时还没有设计本地或数据库存储用户聊天记录，可以在用户刷新页面或重新打开应用时，调用 MemOS 接口获取该用户最近一次活跃会话的历史消息，并恢复到对话窗口中。

```python
import os
import requests

API_KEY = os.environ["MEMOS_API_KEY"]
BASE_URL = os.environ["MEMOS_BASE_URL"]

headers = {
    "Authorization": f"Token {API_KEY}",
    "Content-Type": "application/json"
}

def get_messages(user_id: str, conversation_id: str):
    data = {
        "userId": user_id,
        "conversation_id": conversation_id,
    }

    res = requests.post(f"{BASE_URL}/get/message", headers=headers, json=data)

    if res.status_code == 200 and res.json().get("code") == 0:
        messages = res.json().get("data", {}).get("message_detail_list", [])
        return messages
    else:
        print(f"❌ 获取消息失败: {res.text}")
        return []

# 假设：用户打开 app 时
user_id = "memos_user_345"
conversation_id = "memos_conversation_345"

messages = get_messages(user_id, conversation_id)

# 打印角色、内容和时间
for m in messages:
    print(f"[{m['role']}] {m['content']} (time={m.get('chatTime', '未知')})")


# 📌 示例输出：
# [user] 我喜欢吃辣的食物 (time=2025-09-12 08:00:00)
# [assistant] 明白啦，我记住了，你喜欢辣味的食物。 (time=2025-09-12 08:01:00)
# [user] 但我又不太喜欢重油的，比如麻辣火锅、毛血旺之类的 (time=2025-09-25 12:00:00)
# [assistant] 你更偏好清爽又带辣味的菜。我可以帮你推荐一些适合你的辣味美食哦~ (time=2025-09-25 12:01:00)
```