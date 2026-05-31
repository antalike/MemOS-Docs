::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Замените на ваш API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "task_id": "40aae834-4248-4944-b2bb-a674f37a2fdb" # Замените на ID задачи для запроса
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/get/status"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# Пожалуйста, убедитесь, что установлен MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализируйте клиент с помощью API Key
client = MemOSClient(api_key="YOUR_API_KEY")

task_id = "40aae834-4248-4944-b2bb-a674f37a2fdb" # Замените на реальный ID задачи

res = client.get_task_status(task_id=task_id)
print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/get/status \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "task_id": "40aae834-4248-4944-b2bb-a674f37a2fdb"
  }'
```
::
