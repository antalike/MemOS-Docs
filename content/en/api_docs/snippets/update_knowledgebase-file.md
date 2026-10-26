::code-group

```python [Python (HTTP, JSON)]
import os
import requests
import json

# Replace with your API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# file.content accepts a public URL or a Base64 data URI
data = {
  "file_id": "1f35642253606ed1e9dd8cd8113a8998",  # Replace with the Knowledge Base file ID
  "file": {
    "name": "Software_Procurement_Reimbursement_Policy.pdf",
    "content": "https://cdn.memtensor.com.cn/file/Software_Procurement_Reimbursement_Policy_v2.pdf"
  }
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/update/knowledgebase-file"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

```python [Python (HTTP, Multipart)]
import os
import requests

# Replace with your API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

file_id = "1f35642253606ed1e9dd8cd8113a8998"  # Replace with the Knowledge Base file ID
path = "./Software_Procurement_Reimbursement_Policy_v2.pdf"
headers = {"Authorization": f"Token {os.environ['MEMOS_API_KEY']}"}
url = f"{os.environ['MEMOS_BASE_URL']}/update/knowledgebase-file"

with open(path, "rb") as f:
    files = {"file": (os.path.basename(path), f, "application/pdf")}
    res = requests.post(url=url, headers=headers, data={"file_id": file_id}, files=files)

print(f"result: {res.json()}")
```

```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/update/knowledgebase-file \
  --header 'Authorization: Token YOUR_API_KEY' \
  --form 'file_id=1f35642253606ed1e9dd8cd8113a8998' \
  --form 'file=@"./Software_Procurement_Reimbursement_Policy_v2.pdf"'
```

::
