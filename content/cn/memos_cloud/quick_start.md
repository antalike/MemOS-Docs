---
title: 快速开始
desc: 欢迎访问 MemOS 云平台，可参考本新手指南，快速接入记忆能力。
---

在使用大模型构建应用时，一个常见问题是：**如何让 AI 记住用户的长期偏好？**  
MemOS 提供了两个核心接口帮助你实现：

- `addMessage` —— 把原始对话交给我们，我们自动加工并存储记忆
- `searchMemory` —— 在后续对话中召回事实记忆和偏好记忆，让 AI 回答更贴近用户需求

![image.png](https://cdn.memtensor.com.cn/img/1758184757210_hksk0g_compressed.png)


## 1.调用前准备

* 注册并登录 MemOS 云平台 [（点击注册）](https://memos-dashboard.openmem.net/quickstart)；

* 获取 API Key[（点击获取）](https://memos-dashboard.openmem.net/apikeys)；

* 准备一个可发送 HTTP 请求的环境，Python 或 cURL。


## 2.代码配置

### 1.安装 SDK
如果你选择 Python SDK，请确保已安装 Python 3.10+，然后执行：
::

```
pip install MemoryOS -U 
```

### 2.添加原始对话（addMessage）

**会话 A：2025-06-10 发生**<br>
你只需要把`原始的对话记录`给到MemOS，MemOS 会<code style="font-weight: bold;">自动抽象加工并保存为记忆</code>**。**

::code-snippet{name=add_message}

### 2.2 在会话中调用MemOS查询相关记忆（searchMemory）

**会话 B：2025-9-28 发生**<br>
用户在一个新的会话中，提出让AI推荐国庆旅游地点和酒店，MemOS 会自动召回【事实记忆：曾去过哪里】【偏好记忆：订酒店的偏好】供AI参考，从而推荐更加个性化的旅游计划

::code-snippet{name=search_memory}

**输出的记忆列表如下：**<br>
::
```json [search_memory_res.json]

# 示例输出（为了方便理解此处做了简化，仅供参考）

# 偏好类型的记忆
# preference_detail_list [
#     {
#       "preference_type": "implicit_preference",  #隐性偏好
#       "preference": "用户可能偏好性价比较高的酒店选择。",
#       "reasoning": "七天酒店通常以经济实惠著称，而用户选择七天酒店可能表明其在住宿方面倾向于选择性价比较高的选项。虽然用户没有明确提到预算限制或具体酒店偏好，但在提供的选项中选择七天可能反映了对价格和实用性的重视。",
#       "conversation_id": "0610"
#     }
#   ]

# 事实类型的记忆
# memory_detail_list [
#     {
#       "memory_key": "暑假广州旅游计划",
#       "memory_value": "用户计划在暑假期间前往广州旅游，并选择了七天连锁酒店作为住宿选项。",
#       "conversation_id": "0610",
#       "tags": [
#         "旅游",
#         "广州",
#         "住宿",
#         "酒店"
#       ]
#     }
#   ]
```


### 2.3 获取原始对话（getMessage）

获取指定用户和会话的**原始对话消息**，用于查看或参考完整聊天记录。

::code-snippet{name=get_message}
::
```json [get_message_res.json]
[
  {
    "role": "user",
    "content": "我暑假定好去广州旅游，住宿的话有哪些连锁酒店可选？",
    "chat_time": null,
    "create_time": 1762747721000
  },
  {
    "role": "assistant",
    "content": "您可以考虑【七天、全季、希尔顿】等等",
    "chat_time": null,
    "create_time": 1762747721000
  },
  {
    "role": "user",
    "content": "我选七天",
    "chat_time": null,
    "create_time": 1762747721000
  },
  {
    "role": "assistant",
    "content": "好的，有其他问题再问我。",
    "chat_time": null,
    "create_time": 1762747721000
  }
]
```

## 4. 下一步行动

👉 现在你已经能够运行 MemOS，查看完整的[**<u>API 文档</u>**](/api)，探索更多功能吧！


## 5. 联系我们

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
