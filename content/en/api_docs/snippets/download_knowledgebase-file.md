::code-group

```python [Python (HTTP)]
import os
import requests

# Replace with your API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

file_id = "1f35642253606ed1e9dd8cd8113a8998"  # Replace with the Knowledge Base file ID
headers = {"Authorization": f"Token {os.environ['MEMOS_API_KEY']}"}
url = f"{os.environ['MEMOS_BASE_URL']}/download/knowledgebase-file"

res = requests.post(url=url, headers=headers, json={"file_id": file_id})

# The response body is the file itself. Errors are returned as JSON with code and message.
if res.headers.get("Content-Type", "").startswith("application/json"):
    print(f"result: {res.json()}")
else:
    filename = res.headers.get("Content-Disposition", "").split("filename=")[-1].strip('"') or "download"
    with open(filename, "wb") as f:
        f.write(res.content)
    print(f"saved {filename}: {len(res.content)} bytes")
```

```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/download/knowledgebase-file \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "file_id": "1f35642253606ed1e9dd8cd8113a8998"
  }' \
  --output reimbursement_policy.pdf \
  --dump-header response_headers.txt
```

::
