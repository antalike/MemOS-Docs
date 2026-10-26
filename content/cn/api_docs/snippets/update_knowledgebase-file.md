::code-group

```python [Python (HTTP, JSON)]
import os
import requests
import json

# 替换为你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# file.content 支持可公开访问的 URL 或 Base64 Data URI
data = {
  "file_id": "1f35642253606ed1e9dd8cd8113a8998",  # 替换为知识库文件 ID
  "file": {
    "name": "软件采购报销制度.pdf",
    "content": "https://cdn.memtensor.com.cn/file/软件采购报销制度_v2.pdf"
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

# 替换为你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

file_id = "1f35642253606ed1e9dd8cd8113a8998"  # 替换为知识库文件 ID
path = "./软件采购报销制度_v2.pdf"
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
  --form 'file=@"./软件采购报销制度_v2.pdf"'
```

::
