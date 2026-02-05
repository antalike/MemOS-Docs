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

**接口路径**：`POST /product/delete_memory`
**功能描述**：当某条记忆已过期、不再准确或根据用户隐私要求需要移除时，可以使用此接口从向量数据库与图数据库中永久删除指定的记忆内容。

## 1. 关键参数

*   **记忆 ID 列表（memory\_ids[]）**：每条存储在 MemOS 中的记忆都对应一个唯一标识符，支持以列表形式传入，用于精确删除一条或多条指定记忆。
根据开源代码 `src/api/routers/client.py` 的实现，删除操作需要以下两个核心列表参数：

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **用户 ID 列表 (`user_ids`)** | `list[str]` | 是 | 指定这些记忆所属的用户标识列表。 |
| **记忆 ID 列表 (`memory_ids`)** | `list[str]` | 是 | 每条记忆的唯一标识符列表。您可以通过检索接口获取此 ID。 |

:::note
**如何获取待删除记忆的记忆ID**
<br>
<br>
在检索记忆（`search/memory`）和获取记忆（`get/memory`）时，返回结果中的每条记忆都包含唯一的 `id` 字段，作为该记忆的唯一标识符。  <br>
当发现某条记忆已过期或不符合预期时，可直接取 `id`，并作为 `memory_ids[]` 参数传入 `delete/memory` 接口，即可删除对应的记忆条目。
:::


## 2. 工作原理

1. **请求路由**：请求发送至 `server_api.py` 统一定义的路由入口。
2. **逻辑校验**：系统通过 `_validate_required_params` 确保 `user_ids` 和 `memory_ids` 均不为空。
3. **物理移除**：MemOS 会同步清理底层向量数据库中的向量索引，以及图数据库中的实体关联。
4. **异常处理**：若删除过程中出现业务逻辑错误，将由 `APIExceptionHandler` 返回标准化的 400 或 500 响应。

## 3. 快速上手

推荐使用项目中封装的 `MemOSClient` 进行批量删除操作：

```python
import os
from memos.api.client import MemOSClient

# 初始化客户端
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8001/product"
)

# 准备待删除的记忆信息
target_users = ["memos_user_123"]
target_memories = [
    "4a50618f-797d-4c3b-b914-94d7d1246c8d", 
    "b210928a-1234-5678-90ab-cdef12345678"
]

# 执行删除操作
res = client.delete_memory(
    user_ids=target_users,
    memory_ids=target_memories
)

if res and res.code == 200:
    print("✅ 指定记忆已成功删除")

```

::note
&nbsp;想知道是否删除成功？
一键复制上述代码并运行，再次[检索记忆](/memos_cloud/mem_operations/search_memory)，看看记忆是否删除成功？
::

## 4. 注意事项

不可恢复性：删除操作是物理删除。一旦执行成功，该记忆将无法再通过检索接口召回。

批量效率：建议将需要删除的 ID 整合在一次请求中处理，以减少网络开销并利用后端的批量清理机制。

校验机制：开源版要求显式传入 `user_ids`，这为多租户或多用户场景下的数据安全提供了双重保障，防止误删其他用户的记忆。