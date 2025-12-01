---
title: Overview
desc: The Quick Start module provides you with the simplest onboarding guide to help you get started with MemOS’s core capabilities within minutes.
---

::note
**Tip**<br> Before writing the first line of code, you can quickly experience the effect of “memory capability” through **MemOS Playground**.<br>

* **No installation required**: Simply open in the browser to use<br>

* **Real interaction**: Chat just like with a normal Chatbot, but the system will automatically remember what you said<br>

* **Visualized memory**: You can see which content has been processed into memory, and how it is scheduled and recalled<br>

👉 [Try Playground now](https://memos-playground.openmem.net/)
::

MemOS provides two usage options:

1. **Cloud Service Platform** — the fastest way to get started, only requires an API Key.  
2. **Open-source Framework** — for local/private deployment, convenient for secondary development and deep integration.  

> Whether **Cloud Service** or **Open-source Framework**, MemOS enables your AI to **easily obtain persistent memory**.<br>You can start with the cloud service for a quick experience, then switch to localized deployment as needed.

---
## 1. Option One: Cloud Service Platform

When building applications with large models, a common problem is: **How can AI remember users’ long-term preferences?**  
MemOS provides two core APIs to help you achieve this:

- `addMessage` — Submit raw conversations to us, we automatically process and store them as memory  
- `searchMemory` — Recall factual memories and preference memories in subsequent conversations, so that the AI's responses are more aligned with the user's needs  

![image.svg](https://cdn.memtensor.com.cn/img/1762435152160_rnausc_compressed.png)

### Step 1. Get API Key

Register an account on the [MemOS Cloud Platform](https://memos-dashboard.openmem.net/quickstart) to obtain the default API Key.

### Step 2. Store raw conversations (addMessage)

::note
**Conversation A: occurred on 2025-06-10**<br>

You only need to provide the `raw conversation logs` to MemOS, and MemOS will `automatically abstract, process, and save them as memory`.
::

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "messages": [
    {"role": "user", "content": "I’ve planned to travel to Guangzhou this summer. What chain hotels are available for accommodation?"},
    {"role": "assistant", "content": "You can consider options like 7 Days Inn, All Seasons, Hilton, etc."},
    {"role": "user", "content": "I’ll choose 7 Days Inn."},
    {"role": "assistant", "content": "Alright, feel free to ask me if you have any other questions."}
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

### Step 3. Query MemOS for relevant memories within conversations (searchMemory)

::note
**Conversation B: occurred on 2025-09-28**<br>

When the user asks in a new session for National Day travel and hotel recommendations, MemOS automatically recalls factual (where they’ve been) and preference memories (hotel choices) to help the AI give more personalized suggestions.
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
  "query": "I want to travel during the National Day holiday. Please recommend a city I haven’t been to and a hotel brand I haven’t stayed at.",
  "memory_limit_number": 6,    # Fact memory limit — if not provided, default is 6
  "include_preference":True,   # Return preference memories — if not provided, defaults to enabled
  "preference_limit_number":6  # Preference memory limit — if not provided, default is 6
}

headers = {
  "Content-Type": "application/json",
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}"
}
url = f"{os.environ['MEMOS_BASE_URL']}/search/memory"

res = requests.post(url=url, headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")

# Example output (simplified for easier understanding, for reference only)

# Preference Memory
# preference_detail_list [
#     {
#       "preference_type": "implicit_preference",  
#       "preference": "Preference for budget-friendly accommodations.",
#       "reasoning": "The user's choice of 7 Days Inn over other options like Hilton suggests a potential preference for more budget-friendly accommodations. 7 Days Inn is known for being an economical option compared to Hilton, which is a higher-end hotel chain. This choice indicates that the user might prioritize cost-effectiveness in their accommodation decisions.",
#       "conversation_id": "0610"
#     }
#   ]

# Fact Memory
# memory_detail_list [
#     {
#       "memory_key": "Summer travel plans to Guangzhou",
#       "memory_value": "The user has planned to travel to Guangzhou during the summer of 2024 and has chosen to stay at 7 Days Inn for accommodation.",
#       "conversation_id": "0610",
#       "tags": [
#         "travel",
#         "Guangzhou",
#         "accommodation",
#         "hotel choice"
#       ]
#     }
#   ]
```

## 2. Option Two: Open-source Framework

For local deployment or deep customization, you can directly use MemOS’s open-source framework. Compared with cloud services, the open-source framework has no extra abstraction layer. Developers need to explicitly handle **memory extraction, storage, and retrieval**, all of which operate on a **MemCube**.

> MemCube is the basic container of memory, responsible for storing user memory items. The `addMessage` and `searchMemory` APIs in the cloud service are essentially abstracted wrappers around internal operations of MemCube. In the open-source framework, developers can directly control these steps.

For detailed operation steps, see: [Open-source Project → Quick Start](https://memos-docs.openmem.net/open_source/getting_started/quick_start)

## 3. Next Steps

### 3.1 Learn about MemOS Memory Production Process

Here we will explain in detail **how a message entering the system is processed into memory and effectively used in future conversations**, to help you better understand MemOS’s memory mechanism and advantages.

::note
**Deep Understanding**<br>
MemOS’s memory mechanism works like a complete “workflow”: 
You send a message → the system processes it into memory → the scheduler decides when to store or use it based on context and tasks, and can adjust its form → related memories are recalled when needed → meanwhile, lifecycle management keeps them evolving and updated.
::

- [Memory Production](/overview/quick_start/mem_production)  
- [Memory Scheduling](/overview/quick_start/mem_schedule)  
- [Memory Recall](/overview/quick_start/mem_recall)  
- [Memory Lifecycle Management](/overview/quick_start/mem_lifecycle)  

### 3.2 Practice with MemOS

We provide three concrete business reference cases for you to review:

- [Help financial assistant understand client preferences behind behaviors](/usecase/financial_assistant)  
  - In intelligent investment advisory, user clicks, browsing, bookmarks, and communication all form behavioral traces for profiling.  
  - MemOS can abstract these behaviors into memories, e.g. “Risk preference = Conservative”.  
  - When the user asks “What kind of investment suits me?”, the assistant can directly leverage them to provide more professional and personalized advice.  

- [Build a family life assistant with memory](/usecase/home_assistant)  
  - A family assistant doesn’t just answer immediate questions, it also remembers your to-dos, preferences, and family information.  
  - For example: “Take kids to the zoo on Saturday” or “Remind me by listing key points first”, MemOS converts these into memories.  
  - In later conversations, they automatically take effect, making the assistant closer to real life.  

- [A writing assistant with memory is more useful](/usecase/writting_assistant)  
  - A writing assistant should not only generate content but also maintain consistent tone and style.  
  - With MemOS, user writing preferences, frequently used information, and contextual instructions can all be remembered.  
  - Next time, when writing a summary or email, no need to repeat reminders—achieve coherent and personalized writing experience.  

- [Agent Development Platform Plugin Tool](/usecase/plugin_tool)
  - The plugin tool directly accesses the MemOS cloud service interface, quickly adding long-term memory functionality to your Agent for more considerate and continuous conversations.

## 4. Contact Us

<img src="https://cdn.memtensor.com.cn/img/1758685658684_nbhka4_compressed.png" alt="image" style="width:70%;">
