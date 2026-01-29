---
title: 技能
desc: 添加用户对话消息，生成可被Agent复用的技能文件。
---

## 1. 什么是 MemOS 技能（Skills）？

**技能（Skills）** 是 Agent 在执行任务时可动态调用的**模块化能力包**。它由 Agent 根据对话上下文自动调度、按需注入，无需用户手动干预。这些技能通常由开发者协同编程大模型，基于开源项目或原生构思搭建，并在实际使用的过程中不断优化。

MemOS 主张“记忆即资产”。我们认为，那些在真实对话中沉淀下来的解决路径与用户偏好，本质上就是最宝贵的技能素材。基于此理念，MemOS **现已支持从用户记忆中自动提炼技能**——将零散的交互历史固化为可复用、个性化的专业能力。

::note
**MemOS 技能和已有的记忆有什么不同？**

* **静态事实 → 动态执行**

记忆通常是静态的、事实性的，例如：“我住在上海”，“我喜欢简洁的回复”，这些信息为 Agent 推理提供必要上下文；

技能则是建立在记忆之上的可执行的行为能力，封装了一套明确的任务处理逻辑，例如「如何规划一套完整的出行方案」，指导 Agent 决策与行动。

* **碎片化 → 结构化**

记忆通常是碎片化的，每条只描述一个事实或偏好；

技能则是高度结构化的，将多条相关记忆整合为一套完整任务方案，可在不同任务中复用。
::

## 2. 工作原理

![image.png](https://cdn.memtensor.com.cn/img/1769653199709_6ol3n7_compressed.png)

上图展示了终端用户、您构建的 AI Agent 与 MemOS 的完整交互流程：

1.  调用 `add/message` 接口将用户的对话消息传入 MemOS。

2.  MemOS 接收到请求后，会依次完成以下处理，生成技能（Skill）文件：

    a.  **智能切片：**识别历史对话中的任务边界，切分成任务文本块；

    b.  **聚类提取：**将同类型的任务文本块聚类，结合用户的历史记忆，提取出结构化的技能文本。

    c.  **技能转化：**将技能转化为可运行、可被识别的技能（Skill）文件。

3.  调用 `search/memory` 接口检索记忆，MemOS 会统一返回与上下文相关的用户事实、偏好、工具记忆与匹配的技能（Skill）文件。

4.  下载技能文件，将记忆和技能文件统一传给您自己部署的大模型，从而实现对长期经验与自动生成技能的有效利用。

## 3. 使用示例

下面展示了 MemOS 基于历史对话，生成“旅行规划”技能的使用示例。

### 1. **添加消息**

添加“高能量J人”与“旅行规划助手”的对话内容，“高能量J人”表达了对出行规划的几个要求：

*   #不喜欢回头路，特种兵

*   #喜欢文化景点

*   #需要提前确认天气和温度

```plaintext
import os
import requests
import json

# 替换成你的 API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "0127",
    "messages": [
      {"role": "user", "content": "下周我要去成都玩，帮我规划一个5天的出行计划，我喜欢不走回头路的特种兵出行，帮我标注路途中值得品尝的美食。"},
      {"role": "assistant", "content": "...此处省略..."},
      {"role": "user", "content": "我比较喜欢逛文化景点，商场什么的不太感兴趣。"},
      {"role": "assistant", "content": "...此处省略..."},
      {"role": "user", "content": "帮我在规划的时候，提前确认一下天气和温度，方便我准备行李。"},
      {"role": "assistant", "content": "...此处省略..."}
    ]
  }
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")

```

### 2. **检索记忆**

   假设该用户又一次向助手提出旅行规划的要求，传入用户的query：

   ```plaintext
   import os
   import requests
   import json
   
   # 替换成你的 API Key
   os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
   os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"
   data = {
     "query": "清明节我打算去云南，帮我规划7天的行程。",
     "user_id": "memos_user_123",
     "conversation_id": "0928"
   }
   headers = {
     "Content-Type": "application/json",
     "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
   }
   url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"
   
   res = requests.post(url=url, headers=headers, data=json.dumps(data))
   
   print(f"result: {res.json()}")
   ```

### 3. **结果展示**

在以下的检索结果中，技能包含了：

*   规划特种兵行程

*   推荐文化景点

*   关注了天气、温度，推荐需要携带的衣物。

```plaintext
# 待算法ready后补充
```

::note
#这里算法可以补充一下prompt或者具体使用方法

** 技能的两种使用方法：** 

* 如果你调用的模型 / Agent 有使用 Skill 文件的能力，可以直接下载 `skill_url` 链接地址中的文件。

* 如果你调用的模型 / Agent 没有使用 Skill 文件的能力，可以直接将 `skill_value` 转成字符串，添加到 prompt 中。
::

4. **构建专属于你的技能**

MemOS 基于不同用户的对话消息，能够创建专属于个人的技能。举例来说，我们另外构建了一个“低能量P人”与“旅行规划助手”的对话，当他提出：

*   #夜猫子，早上起不来

*   #不想去太远、要赶路的景点

*   #穿插小众景点，不走寻常路

MemOS构建的技能文件包含了：

*   规划下午-晚上出行、不紧密的行程

*   推荐不太远、不需要赶路的路线

*   穿插小众景点。

```plaintext
# 待算法ready后补充
```
::note
**现在就开始探索 MemOS 技能吧！ 🚀**
* 前往 [控制台 - 技能页面]()，查看基于用户历史对话自动生成的技能文件。
* 还没有技能？[添加消息](/memos_cloud/mem_operations/add_message)即可触发生成。
::
