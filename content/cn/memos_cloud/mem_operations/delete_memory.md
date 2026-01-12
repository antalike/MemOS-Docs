---
title: 删除记忆
desc: 从 MemOS 删除记忆,支持批量删除。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/core/delete_memory)**
<br>
<br>

**本文聚焦于功能说明，详细接口字段及限制请点击上方文字链接查看**
::

## 1. 关键参数

*   **记忆 ID（memory\_ids）**：每条存储在 MemOS 中的记忆都对应一个唯一的标识符，支持以列表形式传入，用于精确删除指定记忆。

:: note
如何获取记忆 ID？<br>
在检索记忆（search/memory）和获取记忆（get/memory）时，用户可能识别到了已经过期或者不满意的记忆条目。此时，您只需取返回列表中该记忆条目的`id`字段，在调用`delete/memory`接口时传入，即可删除对应的记忆条目。

## 2. 工作原理

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
    "memory_ids":["4a50618f-797d-4c3b-b914-94d7d1246c8d"]  # 替换为真实的记忆 ID
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
&nbsp;想知道是否删除成功？
一键复制上述代码并运行，再次[检索记忆](/memos_cloud/mem_operations/search_memory)，看看记忆是否删除成功？
::
