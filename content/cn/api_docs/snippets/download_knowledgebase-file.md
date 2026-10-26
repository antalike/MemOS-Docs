::code-group

```python [Python (HTTP)]
import os
import requests

# 替换为你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

file_id = "1f35642253606ed1e9dd8cd8113a8998"  # 替换为知识库文件 ID
headers = {"Authorization": f"Token {os.environ['MEMOS_API_KEY']}"}
url = f"{os.environ['MEMOS_BASE_URL']}/download/knowledgebase-file"

res = requests.post(url=url, headers=headers, json={"file_id": file_id})

# 成功时响应体就是文件内容；失败时返回包含 code 和 message 的 JSON
if res.headers.get("Content-Type", "").startswith("application/json"):
    print(f"result: {res.json()}")
else:
    filename = res.headers.get("Content-Disposition", "").split("filename=")[-1].strip('"') or "download"
    with open(filename, "wb") as f:
        f.write(res.content)
    print(f"已保存 {filename}：{len(res.content)} 字节")
```

```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/download/knowledgebase-file \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "file_id": "1f35642253606ed1e9dd8cd8113a8998"
  }' \
  --output 报销制度.pdf \
  --dump-header response_headers.txt
```

::
