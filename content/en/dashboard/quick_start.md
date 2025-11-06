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
    "code": 0,
    "data": {
        "memory_detail_list": [
            {
                "id": "0a89db3a-2061-4c97-a1b8-45700f8745bc",
                "memory_key": "Summer Family Trip Plan",
                "memory_value": "[user perspective] The user plans a family trip during the summer vacation, bringing along children and elderly family members, traveling together as a whole family.",
                "memory_type": "WorkingMemory",
                "memory_time": null,
                "conversation_id": "0610",
                "status": "activated",
                "confidence": 0.0,
                "tags": [
                    "summer vacation",
                    "family trip",
                    "plan"
                ],
                "update_time": 1758095885922,
                "relativity": 0.007873535
            },
            {
                "id": "c8b41a89-83b3-4512-b4f7-1dfca3570107",
                "memory_key": "Family Trip Requirements",
                "memory_value": "[assistant perspective] The assistant understands that the user will travel with family, including children and elderly, and plans to recommend destinations suitable for family trips.",
                "memory_type": "WorkingMemory",
                "memory_time": null,
                "conversation_id": "0610",
                "status": "activated",
                "confidence": 0.0,
                "tags": [
                    "family trip",
                    "recommendation"
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

### 2.3 Get Original Messages

Retrieve the **original conversation messages** for a specified user and conversati

::code-snippet{name=get_message}
::
```json [get_message_res.json]
{
  "code": 0,
  "data": {
    "message_detail_list": [
      {
        "role": "user",
        "content": "I want to travel during summer vacation, can you recommend something?",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "assistant",
        "content": "Sure! Are you traveling alone, with family or with friends?",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "user",
        "content": "I’m bringing my kid. My family always travels together.",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      },
      {
        "role": "assistant",
        "content": "Understood, I’ll recommend destinations suitable for family trips.",
        "create_time": "2025-06-10 09:30:00",
        "update_time": "2025-06-10 09:30:00"
      }
    ]
  },
  "message": ""
}
```

<br>

## 4. Next Steps

👉 You can now run MemOS and check out the full [**<u>API Docs</u>**](/api) to explore more features!

<br>


## 5. Contact Us

![image.png](https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png)
