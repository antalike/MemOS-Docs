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
    "conversation_id": "0610",
    "messages": [
      {"role": "user", "content": "Я запланировал поездку в Гуанчжоу на летние каникулы, какие сетевые отели доступны для проживания?"},
      {"role": "assistant", "content": "Вы можете рассмотреть 【Семь Дней, Целый Сезон, Хилтон】 и так далее"},
      {"role": "user", "content": "Я выбрал Семь Дней"},
      {"role": "assistant", "content": "Хорошо, если есть другие вопросы, спрашивайте меня."}
    ]
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
# # Пожалуйста, убедитесь, что вы установили MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Инициализация клиента с использованием API Key
client = MemOSClient(api_key="YOUR_API_KEY")

messages = [
  {"role": "user", "content": "Я запланировал поездку в Гуанчжоу на летние каникулы, какие сетевые отели доступны для проживания?"},
  {"role": "assistant", "content": "Вы можете рассмотреть 【Семь Дней, Целый Сезон, Хилтон】 и так далее"},
  {"role": "user", "content": "Я выбрал Семь Дней"},
  {"role": "assistant", "content": "Хорошо, если есть другие вопросы, спрашивайте меня."}
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
      {"role": "user", "content": "Я запланировал поездку в Гуанчжоу на летние каникулы, какие сетевые отели доступны для проживания?"},
      {"role": "assistant", "content": "Вы можете рассмотреть 【Семь Дней, Целый Сезон, Хилтон】 и так далее"},
      {"role": "user", "content": "Я выбрал Семь Дней"},
      {"role": "assistant", "content": "Хорошо, если есть другие вопросы, спрашивайте меня."}
    ]
  }'
```
::
