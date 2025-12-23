---
title: Delete Memory
desc: Delete memories from MemOS, supporting batch deletion for multiple users.
---

## 1. How to Delete Memory

By deleting memories, you can quickly remove memories according to user requests or clear incorrect memories. MemOS supports deleting specific memories and also supports batch deletion of memories for multiple users simultaneously.

## 2. Key Parameters

*   **User List (user\_ids)**: Used to specify the scope of users for the deletion operation, supporting multiple user identifiers.

*   **Memory ID (memory\_ids)**: Each memory stored in MemOS corresponds to a unique identifier. Supports passing in a list form for precise deletion of specified memories.

## 3. How it Works

*   **Specify User**: First, specify the list of users whose memories need to be deleted to limit the scope of the deletion operation.

*   **Delete Memory**: Delete the memory content matching the specified user based on the provided memory IDs.

## 4. Quick Start

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_ids": ["memos_user_123"],
    "memory_ids":["4a50618f-797d-4c3b-b914-94d7d1246c8d"]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
# Note: Corrected endpoint from /add/message to /delete/memory
url = f"{os.environ['MEMOS_BASE_URL']}/delete/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

::note
&nbsp;Want to know if the deletion was successful?
Copy the code above and run it, then [Search Memory](/memos_cloud/mem_operations/search_memory) again to see if the memory has been successfully deleted.
::
