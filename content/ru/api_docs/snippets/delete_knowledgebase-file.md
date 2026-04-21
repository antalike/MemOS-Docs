::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Замените на ваш API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "file_ids": ["3711d404c51592c4eebae46900236f50"] # Замените на ID документа базы знаний
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/delete/knowledgebase-file"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# Пожалуйста, убедитесь, что установлен MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализируйте клиент с помощью API Key
client = MemOSClient(api_key="YOUR_API_KEY")

file_ids = ["3711d404c51592c4eebae46900236f50"] # Замените на ID документа базы знаний

res = client.delete_knowledgebase-file(file_ids=file_ids)

print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/delete/knowledgebase-file \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "file_ids": ["3711d404c51592c4eebae46900236f50"]
  }'
```
