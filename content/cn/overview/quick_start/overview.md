---
title: 概览
desc: 快速开始模块为你提供最简洁的入门指引，帮助你在几分钟内上手 MemOS 的核心能力。
---

::note
**提示**<br> 在写第一行代码之前，你可以先通过 **MemOS Playground** 快速体验“记忆能力”带来的效果。<br>

* **无需安装**：直接在浏览器中打开即可使用<br>

* **真实交互**：像和普通 Chatbot 一样对话，但系统会自动记住你说过的话<br>

* **可视化记忆**：你能看到哪些内容被加工成了记忆、是如何被调度、召回的<br>

👉 [立即体验 Playground](https://memos-playground.openmem.net/)
::

MemOS 提供两种使用方式：

1. **云服务平台** —— 最快上手，只需 API Key。
2. **开源框架** —— 本地/私有化部署，方便二次开发和深度集成。

> 无论是 **云服务** 还是 **开源框架**，MemOS 都能让你的 AI **轻松获得持久记忆**。<br>你可以先用云服务快速体验，再根据业务需要切换到本地化部署。

---
## 1. 方式一：云服务平台

在使用大模型构建应用时，一个常见问题是：**如何让 AI 记住用户的长期偏好？**  
MemOS 提供了两个核心接口帮助你实现：

- `addMessage` —— 把原始对话交给我们，我们自动加工并存储记忆
- `searchMemory` —— 在后续对话中召回事实记忆和偏好记忆，让 AI 回答更贴近用户需求

![image.svg](https://cdn.memtensor.com.cn/img/1762434889291_h9co0h_compressed.png)

### 步骤 1. 获取 API Key

在 [MemOS Cloud 平台](https://memos-dashboard.openmem.net/quickstart) 注册账号，获取默认API Key


### 步骤 2. 存储原始对话（addMessage）

::note
**会话 A：2025-06-10 发生**<br>

你只需要把`原始的对话记录`给到MemOS，MemOS 会`自动抽象加工并保存为记忆`
::

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "messages": [
    {"role": "user", "content": "我暑假定好去广州旅游，住宿的话有哪些连锁酒店可选？"},
    {"role": "assistant", "content": "您可以考虑【七天、全季、希尔顿】等等"},
    {"role": "user", "content": "我选七天"},
    {"role": "assistant", "content": "好的，有其他问题再问我。"}
  ],
  "user_id": "memos_user_123",
  "conversation_id": "0610"
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}

url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(res.json())
```

### 步骤 3. 在会话中调用MemOS查询相关记忆（searchMemory）

::note
**会话 B：2025-9-28 发生**<br>

用户在一个新的会话中，提出让AI推荐国庆旅游地点和酒店，MemOS 会自动召回【事实记忆：曾去过哪里】【偏好记忆：订酒店的偏好】供AI参考，从而推荐更加个性化的旅游计划
::

```python
import os
import requests
import json

os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "user_id": "memos_user_123",  
  "conversation_id": "0928",
  "query": "我国庆想出去玩，帮我推荐个没去过的城市，以及没住过的酒店品牌",
  "memory_limit_number": 6,    # 事实记忆条数限制，不传默认6
  "include_preference":True,   # 是否返回偏好记忆，不传默认打开
  "preference_limit_number":6  # 偏好记忆条数限制，不传默认6

}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")

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

## 2. 方式二：开源框架

在需要本地化部署或深度定制时，可以直接使用 MemOS 的开源框架。与云服务相比，开源框架没有额外的抽象封装，开发者需要显式完成 **记忆的抽取、存储与检索**，这些操作均在一个 **MemCube（记忆立方）** 上进行。

> MemCube 是记忆的基本容器，负责承载用户的记忆条目。云服务中的 `addMessage` 和 `searchMemory` 接口，本质上就是对 MemCube 内部操作的抽象封装。在开源框架中，开发者可以直接控制这些步骤。

具体操作步骤详见：[开源项目→快速开始](https://memos-docs.openmem.net/cn/open_source/getting_started/quick_start)


## 3. 下一步行动

### 3.1 了解MemOS记忆生产流程

来我们将详细介绍【当一条消息进入系统时，它是如何被加工成记忆，并在未来对话中被有效使用的】，以帮助您更好的理解MemOS的记忆机制与优势

::note
**深入理解**<br>
MemOS 的记忆机制可以理解为一条完整的「工作流」： 
你提交原始消息 → 对记忆进行加工生产 → 调度机制根据任务和上下文安排调用与存储，并可动态调整记忆形态 → 在需要时被召回相关记忆→ 同时由生命周期管理维持演化与更新。
::

- [记忆生产](/overview/quick_start/mem_production)
- [记忆调度](/overview/quick_start/mem_schedule)
- [记忆召回](/overview/quick_start/mem_recall)
- [记忆生命周期管理](/overview/quick_start/mem_lifecycle)

### 3.2 使用MemOS进行实战

我们提供了3个具体的业务参考案例供您查看

- [让理财助手读懂客户行为背后的偏好](/usecase/financial_assistant)
  - 在智能投顾场景里，用户的点击、浏览、收藏和沟通，都是构建画像的行为轨迹。
  - MemOS 能把这些行为抽象成记忆，例如「风险偏好=保守」
  - 并在用户提问「我适合什么投资？」时直接发挥作用，让投顾建议更专业、更贴合实际。

- [构建拥有记忆的家庭生活助手](/usecase/home_assistant)
  - 家庭助手不只是回答即时问题，它还能记住你说过的待办、偏好和家庭信息。
  - 比如「周六带孩子去动物园」或「提醒时要先列要点」，MemOS 会把这些转成记忆
  - 在后续对话中自动发挥作用，让助手更贴近真实生活

- [有记忆的写作助手更好用](/usecase/writting_assistant)
  - 写作助手不仅要帮你生成内容，还要保持一致的语气和风格
  - 通过 MemOS，用户的写作偏好、常用信息、上下文指令都能被记住
  - 下次写总结或邮件时无需反复强调，实现连贯又个性化的创作体验。

## 4. 联系我们

<img src="https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png" alt="image" style="width:70%;">
