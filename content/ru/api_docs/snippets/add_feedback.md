::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Замените на ваш API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "user_id": "memos_user_123",
  "conversation_id": "memos_feedback_conv",
  "feedback_content": "Нет, мы теперь изменили на 150 юаней в день на питание в городах первого уровня и 700 юаней в день на жилье; для городов второго и третьего уровня остается как раньше.",
  "allow_knowledgebase_ids":["basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7"] # Замените на ID базы знаний
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/feedback"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# # Пожалуйста, убедитесь, что MemoS установлен (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализируйте клиента с помощью API Key
client = MemOSClient(api_key="YOUR_API_KEY")

user_id = "memos_user_123"
conversation_id = "memos_feedback_conv"
feedback_content = "Нет, мы теперь изменили на 150 юаней в день на питание в городах первого уровня и 700 юаней в день на жилье; для городов второго и третьего уровня остается как раньше."
allow_knowledgebase_ids = ["basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7"] # Замените на ID базы знаний

res = client.add_feedback(
    user_id=user_id,
    conversation_id=conversation_id,
    feedback_content=feedback_content,
    allow_knowledgebase_ids=allow_knowledgebase_ids
)

print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/add/feedback \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "memos_user_123",
    "conversation_id": "memos_feedback_conv",
    "feedback_content": "Нет, мы теперь изменили на 150 юаней в день на питание в городах первого уровня и 700 юаней в день на жилье; для городов второго и третьего уровня остается как раньше.",
    "allow_knowledgebase_ids":["basee5ec9050-c964-484f-abf1-ce3e8e2aa5b7"]
  }'
```
::
