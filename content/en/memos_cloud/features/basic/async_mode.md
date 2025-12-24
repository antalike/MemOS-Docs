---
title: Async Mode
desc: When using async mode for adding messages, the API request returns immediately, while the actual processing is queued in the MemOS background.
---

:::note
The `async_mode` parameter currently defaults to `true`. Memory addition operations will be processed asynchronously by default, queuing for background execution instead of waiting for processing to complete before returning a response.
:::

## 1. Using Async Mode

### Process Flow

When the `async_mode` parameter is set to `true`, the API will return a response immediately and queue the memory processing in the background:

```json
{
  "code": 0,
  "data": {
    "success": true,
    "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9",
    "status": "running"
  },
  "message": "ok"
}
```

At this point, the user's previously sent messages can be immediately retrieved as memories, ensuring context continuity in the conversation without waiting for memory processing latency:

```json
"memory_detail_list": [
  {
    "id": "c436a738-eec9-4010-b65d-dc9c135d3a37",
    "memory_key": "user: [09:44 AM on 10 December, 2025 UTC]: I have decided to go to Guangzhou for a trip during the summer vacation. What chain hotels are available for accommodation?",
    "memory_value": "user: [09:44 AM on 10 December, 2025 UTC]: I have decided to go to Guangzhou for a trip during the summer vacation. What chain hotels are available for accommodation?\nassistant: [09:44 AM on 10 December, 2025 UTC]: You can consider [7 Days Inn, All Seasons, Hilton], etc.\nuser: [09:44 AM on 10 December, 2025 UTC]: I choose 7 Days Inn.\nassistant: [09:44 AM on 10 December, 2025 UTC]: Okay, ask me if you have other questions.\n",
    "memory_type": "WorkingMemory",
    "create_time": 1765359875901,
    "update_time": 1765359875902,
    "conversation_id": "0610",
    "status": "activated",
    "confidence": 0.99,
    "relativity": 0.05407696,
    "tags": ["mode:fast"]
  }
]
```

You can also use the `get/status` interface to get the status of the asynchronous task:

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9"
}
headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/get/status"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

### When to Use Async Mode

*   **Reduce API Response Latency**: Users don't need to wait and can continue using memories within the application;
    
*   **Batch Add Memories**: Process large amounts of data simultaneously without blocking the application;
    

*   **Background Task Processing**: Offload time-consuming memory processing operations to the background to improve system concurrency.
    

:::note
Note<br>
When the message contains multimodal content, due to the longer processing time for file memories, the `async_mode` field you pass in will be invalid, and "Async Mode" will be used by default. You can query the processing progress of file memories via the `get/status` interface.
:::

## 2. Using Sync Mode

### Process Flow

When the `async_mode` parameter is set to `false`, the API will return the result after memory processing is complete:

```json
{
  "code": 0,
  "data": {
    "success": true,
    "task_id": "c464e17e-f2ff-4e9a-a2c2-41cc55ab43b9",
    "status": "completed"
  },
  "message": "ok"
}
```

At this point, retrieving memory will yield memories that have been fully processed:

```json
"memory_detail_list":[
  {
    "memory_key": "Guangzhou Summer Trip Plan",
    "memory_value": "The user plans to travel to Guangzhou during the summer vacation and selected 7 Days Inn as the accommodation option.",
    "conversation_id": "0610",
    "tags": [
      "Travel",
      "Guangzhou",
      "Accommodation",
      "Hotel"
    ]
  }
],
"preference_detail_list":[
  {
    "preference_type": "implicit_preference",
    "preference": "The user may prefer cost-effective hotel choices.",
    "reasoning": "7 Days Inn is usually known for being economical, and the user's choice of 7 Days Inn may indicate a preference for cost-effective options in terms of accommodation. Although the user did not explicitly mention budget constraints or specific hotel preferences, choosing 7 Days Inn among the provided options may reflect an emphasis on price and practicality.",
    "conversation_id": "0610"
  }
]
```

### When to Use Sync Mode

*   **Debugging and Development Phase**: View the results after memory processing directly, facilitating debugging of memory retrieval;
    
*   **Immediate Query**: Need to confirm memory creation or update upon API call return, such as performance testing, functional verification, etc.
    
*   **Small Scale Operations**: When the data volume is small and latency impact is minimal, sync mode can be used.
    

### Important Notes

*   The default behavior for asynchronous processing is now `async_mode=true`.
    
*   If you need synchronous mode, please set `async_mode=false` when adding messages.
