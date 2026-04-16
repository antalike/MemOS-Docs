::code-group
```python [Python (HTTP)]
import os
import requests
import json

# あなたの API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"
data = {
  "query": "国慶節に旅行に行きたいので、行ったことのない都市と、泊まったことのないホテルブランドをおすすめしてください",
  "user_id": "memos_user_123",
  "conversation_id": "0928"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# MemOS がインストール済みであることを確認してください (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# API Key を使用してクライアントを初期化します
client = MemOSClient(api_key="YOUR_API_KEY")

query = "国慶節に旅行に行きたいので、行ったことのない都市と、泊まったことのないホテルブランドをおすすめしてください"
user_id = "memos_user_123"
conversation_id = "0928"

res = client.search_memory(query=query, user_id=user_id, conversation_id=conversation_id)

print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/search/memory \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "国慶節に旅行に行きたいので、行ったことのない都市と、泊まったことのないホテルブランドをおすすめしてください",
    "user_id": "memos_user_123",
    "conversation_id": "0928"
  }'
```
::
