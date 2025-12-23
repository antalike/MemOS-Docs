---
title: Add Message
desc: MemOS stores various types of messages you add—text, documents, etc., and automatically processes them into retrievable personal memories.
---

## 1. How to Add Messages?

The foundation of memory comes from original message content. MemOS processes the messages you add into memories for subsequent retrieval and use. When building an AI application, whether you have already started using MemOS for user memory management or not, you can choose the appropriate timing to add messages based on actual scenarios, including:

*   **One-time Import**: One-click import of existing user historical conversations into MemOS to quickly establish initial memory;
    
*   **Real-time Addition**: Add messages to MemOS in real-time every time the user sends a message;
    
*   **Batch Addition**: Set to add user messages to MemOS every few rounds of dialogue according to business needs.
    
::note
**&nbsp;Why is memory important?**
<div style="padding-left: 2em;">

* Enables long-term memory across sessions, avoiding information loss after the conversation ends;

* As interactions accumulate, allows AI to "understand the user" better and better;

* Continuously writes new information during the conversation, dynamically updating user memory;

* Share the same user's memory across your multiple applications or products to achieve a consistent user experience.
</div>
::


## 2. Key Parameters

*   **User ID (user\_id)**: Unique identifier for the user to whom the message belongs. Currently, all added dialogue information must be associated with a specific and unique user identifier.
    
*   **Conversation ID (conversation\_id)**: Unique identifier for the conversation to which the message belongs. Currently, all added dialogue information must be associated with a specific and unique conversation identifier.
    
*   **Messages (messages)**: An ordered list of messages between the user and AI to be added to MemOS.
    
*   **Metadata (info)**: Supplementary information customized by you and submitted with the message, which can be used for filtering during subsequent memory retrieval.
    

## 3. How it Works

*   **Information Extraction**: MemOS uses LLM internally to extract facts, preferences, etc., from messages and processes them into memories, including: factual memory, preference memory, tool memory, etc.
    
*   **Conflict Resolution**: Existing memories are checked for duplication or contradictions, and updates are completed.
    
*   **Memory Storage**: The resulting memories are stored using vector databases and graph databases to facilitate rapid recall during subsequent retrieval.
    

All the above processes can be triggered by simply calling the `add/message` interface, without requiring you to manually operate on the user's memory.


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
      {"role": "user", "content": "I've decided to go to Guangzhou for the summer vacation. What chain hotels are available for accommodation?"},
      {"role": "assistant", "content": "You can consider [7 Days Inn, All Seasons, Hilton], etc."},
      {"role": "user", "content": "I choose 7 Days Inn"},
      {"role": "assistant", "content": "Okay, let me know if you have other questions."}
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
Want to know what memories were generated? Copy the code above and run it, then go to [**Search Memory**](/memos_cloud/mem_operations/search_memory).
:::

## 5. Use Cases

### Real-time Conversation Import

You can call the interface to add messages in real-time every time the user receives a model reply, synchronizing the dialogue between the user and the assistant with MemOS at any time. MemOS will continuously update user memory in the backend based on new conversations.

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

# User sends message
add_message("memos_user_123", "memos_conversation_123", "user","""I ran 5 kilometers this morning, and my knees are a bit sore""")

# AI replies message
add_message("memos_assistant_123", "memos_conversation_123", "assistant","""You ran 5 kilometers today and your knees are a bit sore, which indicates that your joints and muscles are still adapting to the intensity. It is recommended to control the distance to about 3 kilometers tomorrow, focusing on full warm-up and relaxation. This can maintain the training rhythm and give the knees time to recover.""")

```

### Import Historical Conversation

If you have already built an AI dialogue application, MemOS also supports batch import of existing chat records to help the dialogue assistant remember users and reply more personally.

```python
# Example historical conversation data
"messages": [
  # Dialogue between user and AI on day 1
    {"role": "user", "content": "I like spicy food", "chat_time": "2025-09-12 08:00:00"},
    {"role": "assistant", "content": "Got it, I remembered, you like spicy food.", "chat_time": "2025-09-12 08:01:00"},
  # Dialogue between user and AI a few days later
    {"role": "user", "content": "But I don't really like heavy oil, like spicy hot pot, Maoxuewang, etc.", "chat_time": "2025-09-25 12:00:00"},
    {"role": "assistant", "content": "You prefer refreshing yet spicy dishes. I can help recommend some spicy delicacies that suit you~", "chat_time": "2025-09-25 12:01:00"}
]
```

### Record User Preferences or Behavior

In addition to importing conversation content, user personal preferences, behaviors, and other data, such as interest questionnaire information filled in when starting the application for the first time, can also be imported into MemOS as part of memory.

```python
# Example user interest information
"messages": [
    {
      "role": "user",
      "content": """
Favorite movie types: Sci-Fi, Action, Comedy
Favorite TV series types: Suspense, Historical Drama
Favorite book types: Popular Science, Technology, Self-growth
Preferred learning methods: Articles, Videos, Podcasts
Exercise habits: Running, Fitness
Dietary preferences: Prefer spicy, Healthy diet
Travel preferences: Natural landscapes, Urban culture, Adventure
Preferred chat style: Humorous, Warm, Casual chat
Types of help expected from AI: Advice, Information query, Inspiration
Topics I am most interested in: Artificial Intelligence, Future Technology, Movie Reviews
Things I hope AI can help with: Plan daily study schedule, Recommend movies and books, Provide emotional companionship
      """
    }
]
```

## 6. More Features

:::note
For a complete list of API fields and formats, see the [Add Message API Documentation](/api_docs/core/add_message).
:::

| **Feature** | **Field** | **Description** |
| :--- | :--- | :--- |
| Associate More Entities | `agent_id` `app_id` | Unique identifiers for Agent, App, etc., associated with the current user's dialogue message, facilitating subsequent retrieval by entity dimension. |
| Messages | `messages` | List of dialogue messages to be added.<br>Supported role types include: user / assistant / system / tool;<br>Supported message types include:<br>• Text<br>• Documents, Images, see [Multimodal Messages](/memos_cloud/features/basic/multimodal).<br>• Tool calling information, see [Tool Calling](/memos_cloud/features/advanced/tool_calling). |
| Async Mode | `async_mode` | Controls the processing method after adding a message, supporting both asynchronous and synchronous modes. See [Async Mode](/memos_cloud/features/basic/async_mode). |
| Custom Tags | `tags` | Add custom tags to the current user's dialogue message for subsequent memory retrieval and filtering. See [Custom Tags](/memos_cloud/features/basic/custom_tags). |
| Metadata | `info` | Custom metadata fields used to supplement the current user's dialogue message and serve as filtering conditions in subsequent memory retrieval. |
| Write to Public Memory | `allow_public` | Controls whether the memory generated from the current user's dialogue message is written to the project-level public memory, shared by all users under the project. |
| Write to Knowledge Base Memory | `allow_knowledgebase_ids` | Controls whether the memory generated from the current user's dialogue message is written to the specified knowledge bases associated with the project. |
