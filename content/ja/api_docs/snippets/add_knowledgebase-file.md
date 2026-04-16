::code-group
```python [Python (HTTP)]
import os
import requests
import json

# あなたの API Key に置き換えてください
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "knowledgebase_id": "basec32f88c6-9dd3-4061-82c8-f0fa0e85a284",# ドキュメントをアップロードするナレッジベース ID に置き換えてください
  "file": [
    {"content": "https://cdn.memtensor.com.cn/file/出差报销额度说明.docx"}
  ]
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/knowledgebase-file"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# MemOS がインストール済みであることを確認してください (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# API Key を使用してクライアントを初期化します
client = MemOSClient(api_key="YOUR_API_KEY")

knowledgebase_id = "basec32f88c6-9dd3-4061-82c8-f0fa0e85a284" # ドキュメントをアップロードするナレッジベース ID に置き換えてください
file = [
  {
    "content": "https://cdn.memtensor.com.cn/file/出差报销额度说明.docx"
  }
]

res = client.add_knowledgebase-file(knowledgebase_id=knowledgebase_id,file=file)
print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/add/knowledgebase-file \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "knowledgebase_id": "basec32f88c6-9dd3-4061-82c8-f0fa0e85a284",
    "file": [
      {
        "content": "https://cdn.memtensor.com.cn/file/出差报销额度说明.docx"
      }
    ]
  }'
```
