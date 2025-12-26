---
title: Add Message
desc: MemOS automatically processes multimodal content you add, such as text, files, and images, into retrievable personal memories.
---

::warning
**[Go directly to API Docs](/api_docs/core/add_message)**
<br>
<br>

**This article focuses on functional explanation. For detailed interface fields and limits, please click the link above.**
::

## 1. How to add messages?

The basis of memory comes from raw message content. MemOS processes the messages you add into memories for subsequent retrieval and use. When building AI applications, whether you have started using MemOS for user memory management or not, you can choose the appropriate timing to add messages based on actual scenarios, including:

*   **One-time Import**: Import existing user historical conversations into MemOS with one click to quickly establish initial memories;
    
*   **Real-time Addition**: Add messages to MemOS in real-time every time the user sends a message;
    
*   **Batch Addition by Turn**: Set to add user messages to MemOS every certain number of dialogue turns according to business needs.
    
::note
**&nbsp;Why is memory important?**
<div style="padding-left: 2em;">

* Enables cross-session long-term memory, avoiding information loss after the conversation ends;

* Makes AI understand the user better and better as interactions accumulate;

* Continuously writes new information during the conversation, dynamically updating user memories;

* Shares the same user's memory across your multiple applications or products to achieve a consistent user experience.
</div>
::


## 2. Key Parameters

*   **User ID (user\_id)**: Used to identify the unique user to whom the message belongs. Currently, all added conversation information needs to be associated with a specific and unique user identifier.
    
*   **Conversation ID (conversation\_id)**: Used to identify the unique conversation to which the message belongs. Currently, all added conversation information needs to be associated with a specific and unique conversation identifier.
    
*   **Messages (messages)**: An ordered list of user and AI conversation content added to MemOS.
    
*   **Meta Info (info)**: Supplementary information defined by you and submitted with the message, which can be used for filtering during subsequent memory retrieval.
    

## 3. Working Principle

*   **Information Extraction**: MemOS uses LLM internally to extract facts, preferences, etc., from messages and processes them into memories, including: factual memory, preference memory, tool memory, etc.
    
*   **Conflict Resolution**: Existing memories are checked for duplicates or contradictions and updated.
    
*   **Memory Storage**: The resulting memories are stored using vector databases and graph databases for fast recall during subsequent retrieval.
    

All the above processes can be triggered by simply calling the `add/message` interface, without the need for you to manually operate on user memories.


## 4. Quick Start

```python
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "0610",
    "messages": [
      {"role": "user", "content": "I'm planning a trip to Guangzhou during the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, JI Hotel, Hilton], etc."},
      {"role": "user", "content": "I choose 7 Days Inn"},
      {"role": "assistant", "content": "Okay, ask me if you have any other questions."}
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
:::note
Want to know what memories were generated? Copy the above code and run it, then go to [**Search Memory**](/memos_cloud/mem_operations/search_memory).
:::

## 5. Usage Scenarios

### 5.1 Real-time Conversation Import

You can call the interface to add messages in real-time every time the user receives a model reply, synchronizing the conversation between the user and the assistant with MemOS at any time. MemOS will continuously update user memories in the backend based on new conversations.

```python
import os
import json
import requests


os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

# headers and base URL
headers = {
  "Authorization": f"Token {os.environ['MEMOS_API_KEY']}",
  "Content-Type": "application/json"
}
BASE_URL = os.environ['MEMOS_BASE_URL']

def add_message(user_id, conversation_id, role, content):
    data = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "messages": [{"role": role, "content": content}]
    }
    
    res = requests.post(f"{BASE_URL}/add/message", headers=headers, data=json.dumps(data))
    result = res.json()
  
    if result.get('code') == 0: 
      print(f"✅ Added successfully")
    else:
      print(f"❌ Add failed, {result.get('message')}")

# User sends a message
add_message("memos_user_123", "memos_conversation_123", "user","""I ran 5 kilometers this morning, and my knees are a bit sore""")

# AI replies to the message
add_message("memos_user_123", "memos_conversation_123", "assistant","""You ran 5 kilometers today and your knees are a bit sore, which means your joints and muscles are still adapting to the intensity. It is recommended to control the distance to about 3 kilometers tomorrow, focusing on full warm-up and relaxation. This can maintain the training rhythm while giving the knees time to recover.""")

```

### 5.2 Import Historical Conversations

If you have already built an AI conversation application, MemOS also supports batch importing existing chat records to help the conversation assistant remember users and reply more personally.

```python
# Example historical conversation data
"messages": [
  # Conversation between user and AI on the first day
    {"role": "user", "content": "I like spicy food", "chat_time": "2025-09-12 08:00:00"},
    {"role": "assistant", "content": "Got it, I remember, you like spicy food.", "chat_time": "2025-09-12 08:01:00"},
  # Conversation between user and AI a few days later
    {"role": "user", "content": "But I don't really like heavy oil, such as spicy hot pot, Mao Xue Wang, etc.", "chat_time": "2025-09-25 12:00:00"},
    {"role": "assistant", "content": "You prefer refreshing and spicy dishes. I can help you recommend some spicy food that suits you~", "chat_time": "2025-09-25 12:01:00"}
]
```

### 5.3 Record User Preferences or Behaviors

In addition to importing conversation content, user personal preferences, behaviors, and other data, such as interest questionnaire information filled in when starting the application for the first time, can also be imported into MemOS as part of memory.

```python
# Example user interest information
"messages": [
    {
      "role": "user",
      "content": """
Favorite movie genres: Sci-Fi, Action, Comedy
Favorite TV series genres: Suspense, Historical Drama
Favorite book types: Popular Science, Technology, Self-growth
Preferred learning methods: Articles, Videos, Podcasts
Exercise habits: Running, Fitness
Dietary preferences: Prefer spicy, Healthy diet
Travel preferences: Natural landscapes, Urban culture, Adventure
Preferred chat style: Humorous, Warm, Casual chat
Types of help desired from AI: Suggestions, Information query, Inspiration
Topics I am most interested in: Artificial Intelligence, Future Technology, Movie Reviews
Things I hope AI can help with: Planning daily study schedules, Recommending movies and books, Providing emotional companionship
      """
    }
]
```

## 6. More Features

:::note
For a complete list of API fields, formats, etc., please see [Add Message API Docs](/api_docs/core/add_message).
:::

| **Feature** | **Field** | **Description** |
| --- | --- | --- |
| Associate more entities | `agent_id` `app_id` | Unique identifiers for associating the current user's conversation messages with entities such as Agents and applications, facilitating subsequent memory retrieval by entity dimension. |
| Messages | `messages` | List of conversation messages to be added.<br>Supported role types include: user / assistant / system / tool;<br>Supported message types include:<br>• Text<br>• Documents, images, see [Multimodal Messages](/memos_cloud/features/basic/multimodal).<br>• Tool calling information, see [Tool Calling](/memos_cloud/features/advanced/tool_calling). |
| Async Mode | `async_mode` | Controls the processing method after adding messages, supporting both asynchronous and synchronous modes. See [Async Mode](/memos_cloud/features/basic/async_mode). |
| Custom Tags | `tags` | Add custom tags to the current user's conversation messages for subsequent memory retrieval and filtering, such as "graph retrieval" during retrieval and other internal reasoning node retrieval. See [Custom Tags](/memos_cloud/features/basic/custom_tags). |
| Meta Info | `info` | Custom meta information field used to supplement the current user's conversation messages and used as a filtering condition in subsequent memory retrieval.<br><br>`info` supports passing arbitrary custom key-value pairs, and all fields can be stored and retrieved normally.<br><br>The current system provides better query performance support for the following fields (because these fields are already indexed):<br>• `business_type`<br>• `biz_id`<br>• `scene`<br>• `custom_status`<br><br>Using the above fields is not mandatory. Using other custom fields is completely consistent functionally, and may only differ in retrieval performance.<br><br>Note that info is a flattened key-value pair structure, and both field names and field values must be of string type for conditional filtering during retrieval; non-string values need to be converted to strings before passing. |
| Write to Public Memory | `allow_public` | Controls whether the memory generated by the current user's conversation message should be written to the project-level public memory for sharing among all users under the project. Default is closed. |
| Write to Knowledge Base Memory | `allow_knowledgebase_ids` | Controls whether the memory generated by the current user's conversation message is written to the specified knowledge base associated with the project for sharing among all users who can access the knowledge base. Default is empty. When used, you can pass in the list of knowledge bases to be written to. See [Knowledge Base](/memos_cloud/features/advanced/knowledge_base). |
