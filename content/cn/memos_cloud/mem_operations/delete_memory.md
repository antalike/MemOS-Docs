---
title: 删除记忆
desc: 从 MemOS 删除记忆，支持批量删除多个用户的记忆。
---

## 1. 如何删除记忆

通过删除记忆，您能够快速按照用户要求删除记忆、清除错误记忆、清理过期会话。MemOS 支持删除特定记忆，也支持同时批量删除多个用户的记忆。

## 2. 关键参数

*   **用户列表（user\_ids）**：用于指定需要执行删除操作的用户范围，支持传入多个用户标识。

*   **记忆 ID（memory\_ids）**：每条存储在 MemOS 中的记忆都对应一个唯一的标识符，支持以列表形式传入，用于精确删除指定记忆。

## 3. 工作原理

*   **指定用户**：首先指定需要删除记忆的用户列表，用于限定删除操作的作用范围。

*   **删除记忆**：根据提供的记忆 ID，删除与指定用户匹配的记忆内容。

## 4. 快速上手

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
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
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

::note
&nbsp;想知道是否删除成功？
一键复制上述代码并运行，再次[检索记忆](/memos_cloud/mem_operations/search_memory)，看看记忆是否删除成功？
::
