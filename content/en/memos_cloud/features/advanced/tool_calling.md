---
title: Tool Calling
desc: Add tool calling information to incorporate tool calling decisions, execution results, and usage trajectories into MemOS memory.
---

## 1. When to Use

This message structure is suitable when your Agent needs to obtain external information via tools (function / tool), and you want these "tool calling contexts and results" to be understood, associated, and stored by MemOS as retrievable memories.

## 2. How it Works

1. Add tool calling information:

`assistant` message: `tool_calls` describes the model's decision to call a tool and its parameters.

`tool` message: carries the actual tool return result, and precisely associates with the corresponding `tool_calls` via `tool_call_id`.

2. MemOS processes tool-related memories:

*   **Tool Schema**: MemOS supports structured management and dynamic updates of tool information, unifying the description of different tools, enabling the model to efficiently retrieve, understand, and discover tools without hardcoding tool details in the prompt.

*   **Tool Trajectory Memory**: MemOS extracts and stores key trajectories during tool usage, including "what tool was called in what context, what parameters were used, and what result was returned". These trajectories can be retrieved and reused in subsequent conversations, helping the model to more stably reproduce tool usage patterns and reduce repetitive probing and calling errors.

## 3. Usage Examples

For a complete list of API fields and formats, see the [Add Message API Documentation](/api_docs/core/add_message) to learn how to add tool calling information.

### Add Tool Calling Information

::note{icon="websymbol:chat"}
&nbsp;Session A: The user asks [What's the weather like in Beijing] in the conversation, the assistant calls the [Weather Tool], and the weather tool returns the result [Beijing, Temperature 7°C, Cloudy].
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# Message sequence with tool_call
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

### Retrieve Tool Memory

::note{icon="websymbol:chat"}
&nbsp;Session B: In a new session, the user asks [What clothes are suitable for Beijing], MemOS can recall relevant tool memories from past [Weather Tool calls], and the model can use tool memories in the future to improve the accuracy and effectiveness of tool usage.
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"


data = {
    "user_id": "demo-user-id",
    "conversation_id": "0928",
    "query": "What clothes are suitable for Beijing",
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

### Output Result

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
