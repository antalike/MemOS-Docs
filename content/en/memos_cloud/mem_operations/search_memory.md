---
title: Search Memory
desc: MemOS recalls relevant memories through semantic search and filtering capabilities.
---

## 1. What is Search Memory?

Search Memory refers to the process where MemOS recalls the most relevant and important memory content from the memory store when a user asks a question, combining filter conditions pre-defined by the developer. When generating an answer, the model refers to these recalled memories to provide a response that is more accurate, appropriate, and consistent with the user's context.

::note
**&nbsp;Why is Search Memory needed?**
<div style="padding-left: 2em;">

*   No need to build context from scratch; directly obtain correct and reliable memories;

*   Ensure that the recalled memories are always highly relevant to the current question through filtering conditions and other methods.
</div>
::


## 2. Key Parameters

*   **Query Content (query)**: The natural language question or statement used for retrieval; the system will match relevant memories based on semantics.

*   **Memory Filter (filter)**: JSON-based logical conditions used to narrow the retrieval scope by dimensions such as entity, time, tags, metadata, etc.


## 3. How it Works

*   **Query Rewriting**: MemOS cleans and semantically enhances the input natural language query to improve the accuracy of subsequent retrieval.

*   **Memory Filtering**: Filters memories combined with logical and comparison operators to narrow the scope of memory recall.

*   **Memory Retrieval**: Generates embeddings based on the rewritten query and matches the user's most relevant memory content through similarity.

*   **Output Memory**: The final filtered memory results are responded to and returned to you within one second for subsequent reasoning and answer generation.

All the above processes can be triggered by simply calling the `search/memory` interface, without requiring you to manually operate on the user's memory.


## 4. Quick Start
::code-group
```python [Python (HTTP)]
import os
import requests
import json

# Replace with your MemOS API Key
os.environ["MEMOS_API_KEY"] = "YOUR_API_KEY"
os.environ["MEMOS_BASE_URL"] = "https://memos.memtensor.cn/api/openmem/v1"

data = {
  "query": "I want to go out for the National Day holiday. Recommend a city I haven't been to and a hotel brand I haven't stayed at.",
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
```python [Output]
# Example output (simplified for understanding, for reference only)

# Preference type memory
preference_detail_list [
    {
      "preference_type": "implicit_preference",  # Implicit preference
      "preference": "The user may prefer cost-effective hotel choices.",
      "reasoning": "7 Days Inn is usually known for being economical, and the user's choice of 7 Days Inn may indicate a preference for cost-effective options in terms of accommodation. Although the user did not explicitly mention budget constraints or specific hotel preferences, choosing 7 Days Inn among the provided options may reflect an emphasis on price and practicality.",
      "conversation_id": "0610"
    }
  ]

# Fact type memory
memory_detail_list [
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
  ]
```
::

::note
&nbsp;Please note that `user_id` is a required field. Currently, each memory search must specify a single user.
::


## 5. Use Cases

### Using Memory in Conversation

During the user's conversation with AI, you can call MemOS to retrieve the memories most relevant to the current user's statement and fill them into the prompt of the large model.
*   Filling in `conversation_id` can help MemOS understand the context of the current session, increase the weight of memories related to this session, and make the dialogue model's response content more coherent.

As shown in the example below, if you have tried [Add Message](/memos_cloud/mem_operations/add_message) and added historical conversation messages for user `memos_user_345`, you can copy and refer to this example to retrieve user memory.

::code-group
```python [Python (HTTP)]
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

# User's current statement, directly used as query
query_text = "I'm going to Yunnan for the National Day holiday, any food recommendations?"

data = {
    "user_id": "memos_user_345",
    "conversation_id": "memos_conversation_789",  # Created a new conversation ID
    "query": query_text,
}

# Call /search/memory to query relevant memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Output]
 {
  "memory_detail_list": [
    {
      "id": "c6c63472-25d3-49ee-b360-9b0702d96781",
      "memory_key": "Spicy Food Preference",
      "memory_value": "The user likes spicy food but doesn't like heavy oil dishes, such as spicy hot pot and Maoxuewang. The user prefers refreshing yet spicy dishes.",
      "memory_type": "UserMemory",
      "create_time": 1762674694466,
      "conversation_id": "memos_conversation_345",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "Dietary Preference",
        "Spicy",
        "Heavy Oil"
      ],
      "update_time": 1762674694423,
      "relativity": 0.00242424
    }
  ],
  "preference_detail_list": [
    {
      "id": "46d8372d-241a-4ffc-890b-ae13c90d5565",
      "preference_type": "explicit_preference",
      "preference": "The user likes spicy food but dislikes heavy oil spicy food.",
      "reasoning": "In the first query, the user explicitly stated they like spicy food, and in the second query, they further clarified they dislike heavy oil spicy food, indicating a preference for spicy but refreshing food.",
      "create_time": 1762675342352,
      "conversation_id": "memos_conversation_345",
      "status": "activated",
      "update_time": 1762674923302
    },
    {
      "id": "9d62c1ae-a069-478d-a2fd-cb4aadfb6868",
      "preference_type": "implicit_preference",
      "preference": "The user may prefer healthier dietary choices",
      "reasoning": "The user expressed a clear preference for spicy flavor but disliked heavy oil food. This suggests the user might be more concerned about dietary health and tends to choose less greasy food. The combination of liking spicy flavor and rejecting heavy oil food might imply an implicit preference for healthy eating.",
      "create_time": 1762674923448,
      "conversation_id": "memos_conversation_345",
      "status": "activated",
      "update_time": 1762674851542
    }
  ],
  "preference_note": "\n# Note:\nFact memory is a summary of facts, while preference memory is a summary of user preferences.\nYour response must not violate any of the user's preferences, whether explicit or implicit, and briefly explain why you answered this way to avoid conflict.\n"
}
```
::

### Get User Profile

If you need to conduct user analysis for your application or wish to display their "key personal impressions" to users in real-time within an AI application, you can call MemOS to globally search user memories to help the large model generate a personalized user profile. In this case, you don't need to fill in `conversation_id`.

As shown in the example below, if you have tried [Add Message](/memos_cloud/mem_operations/add_message) and added historical conversation messages for user `memos_user_567`, you can click to copy this example to retrieve user memory.

::code-group
```python [Python (HTTP)]
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

# Ask directly for user profile as query
query_text = "What are my persona keywords?"

data = {
    "user_id": "memos_user_567",
    "query": query_text,
}

# Call /search/memory to query relevant memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Output]
# Example return (showing recalled memory fragments)
{
  "memory_detail_list": [
    {
      "id": "00d8bb4e-aa8c-4fee-a83e-bf67ed6c3ea1",
      "memory_key": "Matters hoping AI can help with",
      "memory_value": "The user hopes AI can help plan daily study schedules, recommend movies and books, and provide emotional companionship.",
      "memory_type": "WorkingMemory",
      "create_time": 1762675190743,
      "conversation_id": "memos_conversation_id_567",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "Help",
        "Study Plan",
        "Recommendation",
        "Companionship"
      ],
      "update_time": 1762675209112,
      "relativity": 0.00013480317
    },
    {
      "id": "17f039d5-d034-41e9-a385-765992a4ab00",
      "memory_key": "Types of help expected from AI",
      "memory_value": "The user expects AI to provide advice, information queries, and inspiration.",
      "memory_type": "WorkingMemory",
      "create_time": 1762675153211,
      "conversation_id": "memos_conversation_id_567",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "AI",
        "Help",
        "Type"
      ],
      "update_time": 1762675206651,
      "relativity": 0.00010301525
    }
  ],
  "preference_detail_list": [],
  "preference_note": ""
}
```
::

### Search Memory with Filters

MemOS provides a powerful memory filter feature that allows developers to filter memories based on their properties. This feature is particularly useful when you need to retrieve memories based on specific characteristics, such as the creation time of the memory, the associated conversation ID, or the type of memory.

The following is an example of using a memory filter to filter out all memories that contain "Study Plan" in their tags and were created after 2025-11-09:
::code-group
```python [Python (HTTP)]
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

query_text = "What are my persona keywords?"

data = {
    "user_id": "memos_user_567",
    "query": query_text,
    "filter": {
        "and": [
            {"tags": {"contains": "Study Plan"}},
            {"create_time": {"gt": "2025-11-09"}}
        ]
    } # By passing the filter field, filter out all memories that contain "Study Plan" in their tags and were created after 2025-11-09
}

# Call /search/memory to query relevant memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```
```python [Output]
Example return (showing recalled memory fragments)
{
  "memory_detail_list": [
    {
      "id": "00d8bb4e-aa8c-4fee-a83e-bf67ed6c3ea1",
      "memory_key": "Matters hoping AI can help with",
      "memory_value": "The user hopes AI can help plan daily study schedules, recommend movies and books, and provide emotional companionship.",
      "memory_type": "WorkingMemory",
      "create_time": 1762675190743,
      "conversation_id": "memos_conversation_id_567",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "Help",
        "Study Plan",
        "Recommendation",
        "Companionship"
      ],
      "update_time": 1762675209112,
      "relativity": 0.00013480317
    }
  ],
  "preference_detail_list": [],
  "preference_note": ""
}
```
::

For more filtering options in the filter, please refer to [Memory Filters](/memos_cloud/features/basic/filters).

## 6. More Features

::note
&nbsp;For a complete list of API fields and formats, see the [Search Memory API Documentation](/api_docs/core/search_memory).
::
| **Feature** | **Field** | **Description** |
| :--- | :--- | :--- |
| Recall Preference Memory | `include_preference`<br><span style="line-height:0.6;">&nbsp;</span><br>`preference_limit_number` | Preference memory is user preference information generated by MemOS based on the analysis of user historical messages. When enabled, user preference memories can be recalled in the search results. |
| Recall Tool Memory | `include_tool_memory`<br><span style="line-height:0.6;">&nbsp;</span><br>`tool_memory_limit_number` | Tool memory is memory generated by MemOS after analyzing added tool calling information. When enabled, tool memories can be recalled in the search results. See [Tool Calling](/memos_cloud/features/advanced/tool_calling). |
| Search Specific Knowledge Base | `knowledgebase_ids` | Specify the range of project-associated knowledge bases available for this search. See [Knowledge Base](/memos_cloud/features/advanced/knowledge_base). |
