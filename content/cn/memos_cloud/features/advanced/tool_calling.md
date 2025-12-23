---
title: 工具调用
desc: 添加工具调用信息，将工具调用的决策、执行结果及其使用轨迹统一纳入 MemOS 记忆。
---

## 1. 何时使用

当您的 Agent 需要通过工具（function / tool）获取外部信息，并希望这些「工具调用的上下文与结果」能够被 MemOS 一并理解、关联和沉淀为可检索记忆时，适合使用这种消息结构。

## 2. 工作原理

Step1：添加工具调用信息

`assistant` 消息： `tool_calls` 描述模型决定调用某个工具的行为及其参数。

`tool` 消息：携带真实的工具返回结果，并通过 `tool_call_id` 与对应的 `tool_calls` 精确关联。

<br>

Step2：MemOS 处理工具相关记忆

*  **工具信息（Tool Schema）**：MemOS 支持对工具信息的结构化管理与动态更新，统一不同工具的描述方式，使模型能够高效地进行工具检索、理解与发现，而无需在提示词中硬编码工具细节。

*  **轨迹记忆（Tool Trajectory Memory）**：MemOS 会对工具使用过程中的关键轨迹进行抽取与存储，包括“在什么上下文下调用了什么工具、使用了哪些参数、返回了什么结果”。这些轨迹可在后续对话中被检索和复用，帮助模型更稳定地重现工具使用模式，减少重复试探和调用错误。

## 3.使用示例

有关 API 字段、格式等信息的完整列表，详见[Add Message 接口文档](/api_docs/core/add_message)查看如何添加工具调用信息。

### 添加工具调用信息

::note{icon="websymbol:chat"}
&nbsp;会话 A：用户在对话中询问【北京天气如何】，助手调用【天气工具】，天气工具得出结果【北京，温度7°C，阴天】。
::

```python
import os
import requests
import json

# 替换成你的 MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# 带 tool_call 的消息序列
data = {
    "user_id": "demo-user-id",
    "conversation_id": "demo-conv-id",
    "messages": [
        {"role": "user", "content": "What's the weather like in Beijing right now?"},
        {
            "role": "assistant",
            "tool_calls": [
                {
                    "id": "call_123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": json.dumps({"location": "Beijing"}),
                    },
                }
            ],
        },
        {
            "role": "tool",
            "tool_call_id": "call_123",
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(
                        {"location": "Beijing", "temperature": "7°C", "condition": "Cloudy"}
                    ),
                }
            ],
        },
    ],
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/add/message"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 检索工具记忆

::note{icon="websymbol:chat"}
&nbsp;会话 B：在新会话中，用户询问【北京适合穿什么衣服】，MemOS能够召回过往【天气工具调用】的相关工具记忆，模型可在后续使用工具记忆，提升工具使用的准确率、有效性。
::

```python
import os
import requests
import json

os.environ["MEMOS_API_KEY"] = "mpg-HfYkf/zcqsmrq00/e5/IjW1VI+4Q6UQDVpgXohBt"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"


data = {
    "user_id": "demo-user-id",
    "conversation_id": "0928",
    "query": "北京适合穿什么衣服",
    "memory_limit_number": 10,
    "include_preference": True,
    "preference_limit_number": 10,
    "include_tool_memory":True,
    "tool_memory_limit_number":10,
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(json.dumps(res.json(), indent=2, ensure_ascii=False))
```

### 输出结果

```python
"tool_memory_detail_list": [
  {
    "id": "56215e5d-6827-429d-a862-068ea5935e8e",
    "tool_type": "ToolTrajectoryMemory",
    "tool_value": "The user asked about the current weather in Beijing. The assistant attempted to call a weather retrieval tool named 'get_weather' with the argument specifying the location as Beijing. The tool successfully executed and returned the weather information indicating a temperature of 7°C and a cloudy condition. The assistant did not provide a final answer in this instance.",
    "tool_used_status": [
      {
        "used_tool": "get_weather",
        "error_type": "",
        "experience": "This tool is commonly used to retrieve weather information based on location parameters. It typically returns temperature and weather conditions in a structured format, allowing for straightforward interpretation.",
        "success_rate": 1.0
      }
    ],
    "create_time": 1765793446220,
    "conversation_id": "demo-conv-id",
    "status": "activated",
    "update_time": 1765793446221,
    "relativity": 5.027827501180582e-05
  }
]
```
