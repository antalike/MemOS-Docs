---
title: 快速开始
desc: 欢迎访问 MemOS 云平台，可参考本新手指南，快速接入记忆能力。
---

## 1. 获取接口密钥

注册并登录 [MemOS 云平台](https://memos-dashboard.openmem.net/quickstart)，此时系统已为您创建一个默认项目，从控制台复制您的默认 API Key。

![image.png](https://cdn.memtensor.com.cn/img/1758184757210_hksk0g_compressed.png)


## 2.核心记忆操作

如果是使用Python SDK，需先执行```pip install MemoryOS -U```

### 2.1 添加原始对话（addMessage）

**会话 A：2025-06-10 发生**<br>
你只需要把`原始的对话记录`给到MemOS，MemOS 会<code style="font-weight: bold;">自动抽象加工并保存为记忆</code>**。**

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# 替换成你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "messages": [
    {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
    {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
    {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
    {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
    {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
    {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
  ],
  "user_id": "memos_user_123",
  "conversation_id": "0610"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

requests.post(url=url, headers=headers, data=json.dumps(data))
```
```python [Python (SDK)]
# # 请确保已安装MemoS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# 使用 API Key 初始化客户端
client = MemOSClient(api_key="YOUR_API_KEY")

messages = [
  {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
  {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
  {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
  {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
  {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
  {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
]
user_id = "memos_user_123"
conversation_id = "0610"

client.add_message(messages=messages, user_id=user_id, conversation_id=conversation_id)
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/add/message \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "memos_user_123",
    "conversation_id": "0610",
    "messages": [
      {"role": "user", "content": "我想暑假出去玩，你能帮我推荐下吗？"},
      {"role": "assistant", "content": "好的！是自己出行还是和家人朋友一起呢？"},
      {"role": "user", "content": "肯定要带孩子啊，我们家出门都是全家一起。"},
      {"role": "assistant", "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？"},
      {"role": "user", "content": "对，带上孩子和老人，一般都是全家行动。"},
      {"role": "assistant", "content": "收到，那我会帮你推荐适合家庭出游的目的地。"}
    ]
  }'
```
::
```json [add_message_res.json]
{
	"code": 0,
	"data": {
		"success": true
	},
	"message": "ok"
}
```

### 2.2 查询记忆（searchMemory）

**会话 B：2025-9-28 发生**<br>
用户在一个新的会话中，提出让AI推荐国庆旅游计划，MemOS 会自动召回相关记忆供AI参考，从而推荐更加个性化的旅游计划

> MemOS 支持同时返回 **` 相关记忆（matches）`**、**`拼接指令（instruction）`（敬请期待） **与** `完整指令（full_instruction）`（敬请期待）** 。实际使用中，你只需根据业务需求选择其一即可

> - **需要完全掌控** → 用 **matches**，只返回记忆条目，由开发者自行拼接成指令；
> - **想省去拼接工作，但还需叠加业务规则** → 用 **instruction**，系统已将记忆与用户问题拼接为半成品指令，开发者可在此基础上再加工；
> - **追求一键直连** → 用 **full_instruction**，系统已生成完整可直接下发给大模型的终端指令。

> **为什么要这样设计**：大多数记忆系统只停留在“召回事实”，但事实并不等于可执行的 Prompt。 MemOS 独有的指令补全链路，帮你省去复杂的拼接与调优，把记忆转译成模型可直接理解和执行的提示。

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# 替换成你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "国庆去哪玩",
  "user_id": "memos_user_123",
  "conversation_id": "0928"
}

# MemOS 未来将支持返回 相关记忆（matches）、拼接指令（instruction）与完整指令（full_instruction）：
# "return_matches": true
# "return_instruction": true
# "return_full_instruction": true

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))
for memory in res.json()["data"]["memory_detail_list"]:
    print(f"相关记忆: {memory['memory_value']}")
```
```python [Python (SDK)]
# 请确保已安装MemOS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# 使用 API Key 初始化客户端
client = MemOSClient(api_key="YOUR_API_KEY")

query = "国庆去哪玩"
user_id = "memos_user_123"
conversation_id = "0928"

# MemOS 未来将支持返回 相关记忆（matches）、拼接指令（instruction）与完整指令（full_instruction）：
# return_matches = True
# return_instruction = True
# return_full_instruction = True

res = client.search_memory(query=query, user_id=user_id, conversation_id=conversation_id)
for memory in res.data.memory_detail_list:
    print(f"相关记忆: {memory.memory_value}")
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/search/memory \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "国庆去哪玩好？",
    "user_id": "memos_user_123",
    "conversation_id": "0928"
  }'
```
::
```json [search_memory_res.json]
{
    "code": 0,
    "data": {
        "memory_detail_list": [
            {
                "id": "0a89db3a-2061-4c97-a1b8-45700f8745bc",
                "memory_key": "暑假全家出游计划",
                "memory_value": "[user观点]用户计划在暑假进行一次家庭旅行，携带孩子和老人，全家一起行动。",
                "memory_type": "WorkingMemory",
                "memory_time": null,
                "conversation_id": "0610",
                "status": "activated",
                "confidence": 0.0,
                "tags": [
                    "暑假",
                    "家庭旅行",
                    "计划"
                ],
                "update_time": 1758095885922,
                "relativity": 0.007873535
            },
            {
                "id": "c8b41a89-83b3-4512-b4f7-1dfca3570107",
                "memory_key": "家庭旅行需求",
                "memory_value": "[assistant观点]助手了解到用户将和家人，包括孩子和老人一起旅行，并计划为其推荐适合家庭出游的目的地。",
                "memory_type": "WorkingMemory",
                "memory_time": null,
                "conversation_id": "0610",
                "status": "activated",
                "confidence": 0.0,
                "tags": [
                    "家庭旅行",
                    "推荐"
                ],
                "update_time": 1758095885923,
                "relativity": 0.0019950867
            }
        ],
        "message_detail_list": null
    },
    "message": "ok"
}
```


### 2.3 获取原始对话（getMessage）

获取指定用户和会话的**原始对话消息**，用于查看或参考完整聊天记录。

::code-group
```python [Python (HTTP)]
import os
import requests
import json

# 替换成你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "user_id": "memos_user_123",
  "conversation_id": "0610"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/get/message"

requests.post(url=url, headers=headers, data=json.dumps(data))

```
```python [Python (SDK)]
# 请确保已安装MemoS (pip install MemoryOS -U)
from memos.api.client import MemOSClient

# 使用 API Key 初始化客户端
client = MemOSClient(api_key="YOUR_API_KEY")

user_id = "memos_user_123"
conversation_id = "0610"

client.get_message(user_id=user_id, conversation_id=conversation_id)
```
```bash [Curl]
curl --request POST \
  --url https://memos.memtensor.cn/api/openmem/v1/get/message \
  --header 'Authorization: Token YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "user_id": "memos_user_123",
    "conversation_id": "0610"
  }'
```
::
```json [get_message_res.json]
{
  "code": 0,
  "data": {
    "message_detail_list": [
      {
        "role": "user",
        "content": "我想暑假出去玩，你能帮我推荐下吗？",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "assistant",
        "content": "明白了，所以你们是父母带孩子一块儿旅行，对吗？",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "user",
        "content": "对，带上孩子和老人，一般都是全家行动。",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "assistant",
        "content": "收到，那我会帮你推荐适合家庭出游的目的地。",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      }
    ]
  },
  "message": ""
}
```

## 4. 下一步行动

👉 现在你已经能够运行 MemOS，查看完整的[**<u>API 文档</u>**](/api)，探索更多功能吧！


## 5. 联系我们

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
