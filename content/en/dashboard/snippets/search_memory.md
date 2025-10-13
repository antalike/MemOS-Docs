::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Replace with your API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "Any suggestions for where to go during National Day?",
  "user_id": "memos_user_123",
  "conversation_id": "0928"
}

# MemOS will support returning matches, instruction, and full_instruction in the future:
# "return_matches": true
# "return_instruction": true
# "return_full_instruction": true

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Python (SDK)]
# Please ensure that MemOS has been installed (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# Initialize MemOS client with API Key to start sending requests
client = MemOSClient(api_key="YOUR_API_KEY")

query = "Any suggestions for where to go during National Day?"
user_id = "memos_user_123"
conversation_id ="0928"

# MemOS will support returning matches, instruction, and full_instruction in the future:
# return_matches = True
# return_instruction = True
# return_full_instruction = True

res = client.search_memory(query=query, user_id=user_id, conversation_id=conversation_id)

print(f"result: {res}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/search/memory \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "Any suggestions for where to go during National Day?",
    "user_id": "memos_user_123",
    "conversation_id": "0928"
  }'
```
::