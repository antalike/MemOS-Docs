---
title: 获取任务状态
desc: 获取异步处理任务（如记忆生产、文档解析）的实时执行状态。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/message/get_status)**
<br>
<br>

**本文聚焦于开源项目的功能说明，详细接口字段及限制请点击上方文字链接查看**
::
**接口路径**：`POST /product/get/status`
**功能描述**：MemOS 在处理复杂的记忆提取或大规模文档导入时，通常采用异步模式。本接口允许开发者通过任务 ID 查询后台任务的执行情况，确保记忆生产流程的透明化。

## 1. 为什么需要此接口？

* **异步追踪**：当 `add_message` 以 `async_mode=True` 调用时，接口会立即返回响应，而实际的记忆提取逻辑在后台运行。
* **失败排查**：如果任务执行失败，可以通过此接口获取具体的错误原因。
* **流程控制**：在构建复杂 Agent 时，确保记忆已成功“入库”后再执行后续的高级搜索操作。

## 2. 关键参数说明

根据开源代码 `client.py` 中的 `get_task_status` 方法定义，核心参数如下：

| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **`task_id`** | `str` | 是 | 异步任务的唯一标识符。该 ID 通常在调用 `add_message` 或 `add_knowledgebase_file` 后获得。 |

## 3. 工作原理

1. **状态查询**：系统根据 `task_id` 在内部任务队列中检索记录。
2. **状态反馈**：返回当前任务的阶段（如 `pending`, `running`, `completed`, `failed`）。
3. **数据一致性校验**：若状态为 `completed`，通常意味着向量数据库同步（`vector_sync`）已完成，该记忆即可被搜索召回。

## 4. 快速上手示例

推荐使用项目中封装的 `MemOSClient` 进行状态轮询：

```python
from memos.api.client import MemOSClient
import time

# 初始化客户端
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8001/product"
)

# 假设您在添加消息时获得了一个 task_id
task_id = "async_task_123456789"

# 轮询任务状态
while True:
    res = client.get_task_status(task_id=task_id)
    if res and res.code == 200:
        status = res.data.get('status')
        print(f"当前任务状态: {status}")
        
        if status in ['completed', 'failed']:
            break
    
    time.sleep(2) # 建议轮询间隔 2 秒