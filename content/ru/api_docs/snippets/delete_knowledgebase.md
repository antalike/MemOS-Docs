::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Замените на ваш API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "knowledgebase_id": "basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7" # Замените на ID базы знаний, которую нужно удалить
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/delete/knowledgebase"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# Пожалуйста, убедитесь, что установлен MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализируйте клиента с помощью API Key
client = MemOSClient(api_key="YOUR_API_KEY")

knowledgebase_id = "basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7" # Замените на ID базы знаний, которую нужно удалить

res = client.delete_knowledgebase(knowledgebase_id=knowledgebase_id)
print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/delete/knowledgebase \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "knowledgebase_id": "basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7"
  }'
```
::
