---
title: 获取记忆
desc: 分页查询并列出指定用户的所有记忆内容，支持深度过滤与分类筛选。
---

::warning
**[直接看 API文档 点这里哦](/api_docs/core/get_memory)**
<br>
<br>

**本文聚焦于开源项目的功能说明，详细接口字段及限制请点击上方文字链接查看**
::

**接口路径**：`POST /product/get_memory`
**功能描述**：与侧重于语义匹配的“检索”接口不同，“获取”接口主要用于管理目的。它允许开发者以分页的方式列出指定用户的所有记忆（事实、偏好及工具记忆），常用于构建用户记忆画像展示页或后台管理界面。

## 1. 为什么需要“获取”接口？

* **全局视图**：无需输入查询语句即可查看用户已有的全部记忆资产。
* **分页管理**：支持 `page` 和 `size` 参数，能够高效处理拥有数千条记忆的高级用户数据。
* **精确清理前置**：在执行删除操作前，通过此接口确认记忆的 `id`。

## 2. 关键参数说明


| 参数名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| **`user_id`** | `str` | 是 | 关联用户的唯一标识符。 |
| **`include_preference`** | `bool` | 否 | 是否返回偏好记忆（默认为 `True`）。 |
| **`page`** | `int` | 否 | 分页页码，默认从 `1` 开始。 |
| **`size`** | `int` | 否 | 每页返回的记忆条目数量（建议最大不超过 50）。 |
| **`filter`** | `dict` | 否 | 结构化过滤器。支持按 `create_time` 或自定义 `info` 字段精确锁定。 |



## 3. 工作原理

1. **多级过滤**：系统根据提供的 `user_id` 定位私有存储空间。
2. **分类聚合**：根据 `include_preference` 和 `include_tool_memory` 参数，从不同的存储索引中聚合数据。
3. **分页切片**：利用 `page` 和 `size` 对聚合后的结果集进行切片处理，降低网络传输压力。
4. **结果返回**：返回包含记忆 ID、内容、标签及创建时间的数据列表。

## 4. 快速上手示例

通过 `MemOSClient` 快速拉取用户的记忆列表：

```python
from memos.api.client import MemOSClient

# 初始化客户端
client = MemOSClient(
    api_key="YOUR_LOCAL_API_KEY",
    base_url="http://localhost:8000/product"
)

# 获取用户最近的 10 条记忆，包含偏好信息
res = client.get_memory(
    user_id="memos_user_123",
    include_preference=True,
    page=1,
    size=10
)

if res and res.code == 200:
    for memory in res.data.get('memory_detail_list', []):
        print(f"ID: {memory['id']} | 内容: {memory['memory_value']}")
```

## 5. 使用场景
### 5.1 构建用户画像看板
展示“AI 对你的印象”或“已记住的偏好”。由于该接口支持分页，非常适合瀑布流或列表展示。

### 5.2 数据审计与纠偏
您可以定期通过此接口扫描某个用户的记忆条目，配合过滤器查找是否存在过时的业务标签（如 custom_status='deprecated'），并利用删除记忆接口进行清理。

### 5.3 导出记忆资产
支持将用户的记忆批量拉取并导出，方便进行离线分析或跨平台的数据迁移。