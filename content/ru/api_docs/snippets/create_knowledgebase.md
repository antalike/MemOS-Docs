::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Замените на ваш API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "knowledgebase_name": "База Знаний По Финансовым Возвратам",
  "knowledgebase_description": "Свод всех знаний, связанных с финансовыми возвратами нашей компании."
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/create/knowledgebase"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# Пожалуйста, убедитесь, что установлен MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализация клиента с использованием API Key
client = MemOSClient(api_key="YOUR_API_KEY")

knowledgebase_name = "База Знаний По Финансовым Возвратам"
knowledgebase_description = "Свод всех знаний, связанных с финансовыми возвратами нашей компании."

res = client.create_knowledgebase(
    knowledgebase_name=knowledgebase_name,
    knowledgebase_description=knowledgebase_description
)
print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/create/knowledgebase \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "knowledgebase_name": "База Знаний По Финансовым Возвратам",
    "knowledgebase_description": "Свод всех знаний, связанных с финансовыми возвратами нашей компании."
  }'
```
::
