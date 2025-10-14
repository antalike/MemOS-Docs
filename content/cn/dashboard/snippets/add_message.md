::code-group
```python [Python (HTTP)]
import os
import requests
import json

# 替换成你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "messages": [
    {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
    {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
    {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
    {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
    {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
    {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
  ],
  "user_id": "memos_user_123",
  "conversation_id": "0610"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# # 请确保已安装MemoS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# 使用 API Key 初始化客户端
client = MemOSClient(api_key="YOUR_API_KEY")

messages = [
  {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
  {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
  {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
  {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
  {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
  {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
]
user_id = "memos_user_123"
conversation_id = "0610"

res = client.add_message(messages=messages, user_id=user_id, conversation_id=conversation_id)

print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/add/message \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "memos_user_123",
    "conversation_id": "0610",
    "messages": [
      {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
      {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
      {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
      {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
      {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
      {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
    ]
  }'
```
::