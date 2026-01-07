---
title: Delete Memory
desc: Delete memories from MemOS, supporting batch deletion of memories for multiple users.
---

::warning
**[Go directly to API Docs](/api_docs/core/delete_memory)**
<br>
<br>

**This article focuses on functional explanation. For detailed interface fields and limits, please click the link above.**
::

## 1. How to Delete Memories

By deleting memories, you can quickly remove memories upon user request or clear incorrect memories. MemOS supports deleting specific memories and also supports batch deletion of memories for multiple users simultaneously.

## 2. Key Parameters

*   **Memory IDs (memory\_ids)**: Each memory stored in MemOS corresponds to a unique identifier. It supports passing a list of IDs for precise deletion of specified memories.

## 3. Working Principle

*   **Delete Memory**: Delete the memory content matching the specified users based on the provided memory IDs.

## 4. Quick Start

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "memory_ids":["4a50618f-797d-4c3b-b914-94d7d1246c8d"]  # Replace with real memory IDs
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/delete/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

::note
&nbsp;Want to know if the deletion was successful?
Copy the above code and run it, then [Search Memory](/memos_cloud/mem_operations/search_memory) again to see if the memory has been successfully deleted.
::
