---
title: Quick Start
desc: Welcome to the MemOS Cloud Platform. Refer to this quick start guide to easily integrate memory capabilities. You’ll need to complete the following steps.
---

## 1. Get Your API Key

Register and log in to the [MemOS Cloud Platform](https://memos-dashboard.openmem.net/quickstart). A default project will be created for you automatically. Copy the default API Key from the console.


<img width="3024" height="1116" alt="image" src="https://github.com/user-attachments/assets/fa6579bf-8915-49e6-a63c-b4b6f8f6e944" />


## 2. Core Memory Operations

### 2.1 Add Original Messages

**Conversation A: Occurred on 2025-06-10**<br>
Simply provide the **raw conversation records** to MemOS.  MemOS will <code style="font-weight: bold;">automatically abstract, process, and save them as memory</code>.

::code-snippet{name=add_message}
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

<br>

### 2.2 Search Memory

**Conversation B: Occurred on 2025-09-28**<br>
When the user asks in a new session for National Day travel and hotel recommendations, MemOS automatically recalls factual (where they’ve been) and preference memories (hotel choices) to help the AI give more personalized suggestions.

::code-snippet{name=search_memory}
::
```json [search_memory_res.json]
{
  "memory_detail_list": [
    {
      "id": "cf1230dd-3ebe-4832-809d-28a455b0e3ea",
      "memory_key": "Summer travel plans to Guangzhou",
      "memory_value": "The user has planned to travel to Guangzhou during the summer and has decided to choose 7 Days Inn for accommodation.",
      "memory_type": "WorkingMemory",
      "create_time": 1762748859685,
      "conversation_id": "0610",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "travel",
        "Guangzhou",
        "accommodation",
        "hotels"
      ],
      "update_time": 1762748860562,
      "relativity": 0.0016035014
    }
  ],
  "preference_detail_list": [
    {
      "id": "1cdc9186-41d4-4f03-b1ac-e6b037383b9d",
      "preference_type": "explicit_preference",
      "preference": "User prefers to choose 7 Days Inn for accommodation during their trip to Guangzhou this summer.",
      "reasoning": "The user explicitly stated 'I’ll choose 7 Days Inn,' which shows a clear preference for this hotel over other options provided by the assistant.",
      "create_time": 1762749378166,
      "conversation_id": "0610",
      "status": "activated",
      "update_time": 1762749115125
    },
    {
      "id": "e79a61e4-49fb-4365-9ccf-52c194aadd19",
      "preference_type": "implicit_preference",
      "preference": "Preference for cost-effective accommodations.",
      "reasoning": "The user's choice of 7 Days Inn, a budget hotel chain, over other options like Hilton, which are typically more expensive, suggests a preference for cost-effective accommodations. This indicates an underlying motivation to manage travel expenses and prioritize affordability in hotel selection.",
      "create_time": 1762749115269,
      "conversation_id": "0610",
      "status": "activated",
      "update_time": 1762749336979
    }
  ],
  "preference_note": "\n# Note:\nFact memory are summaries of facts, while preference memory are summaries of user preferences.\nYour response must not violate any of the user's preferences, whether explicit or implicit, and briefly explain why you answer this way to avoid conflicts.\n"
}
```

### 2.3 Get Original Messages

Retrieve the **original conversation messages** for a specified user and conversati

::code-snippet{name=get_message}
::
```json [get_message_res.json]
[
  {
    "role": "user",
    "content": "I’ve planned to travel to Guangzhou this summer. What chain hotels are available for accommodation?",
    "chat_time": null,
    "create_time": 1762748806000
  },
  {
    "role": "assistant",
    "content": "You can consider options like 7 Days Inn, All Seasons, Hilton, etc.",
    "chat_time": null,
    "create_time": 1762748806000
  },
  {
    "role": "user",
    "content": "I’ll choose 7 Days Inn.",
    "chat_time": null,
    "create_time": 1762748806000
  },
  {
    "role": "assistant",
    "content": "Alright, feel free to ask me if you have any other questions.",
    "chat_time": null,
    "create_time": 1762748806000
  }
]
```

<br>

## 4. Next Steps

👉 You can now run MemOS and check out the full [**<u>API Docs</u>**](/api) to explore more features!

<br>


## 5. Contact Us

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
