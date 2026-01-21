---
title: Search Memory
desc: MemOS recalls relevant memories through semantic retrieval and filtering functions.
---

::warning
**[Go directly to API Docs](/api_docs/core/search_memory)**
<br>
<br>

**This article focuses on functional explanation. For detailed interface fields and limits, please click the link above.**
::

## 1. What is Search Memory?

Search Memory refers to MemOS recalling the most relevant and important memory content from the memory store based on developer-defined filtering conditions when a user asks a question. When generating an answer, the model will refer to these recalled memories to provide a more accurate, appropriate response that fits the user's context.

::note
**&nbsp;Why do we need Search Memory?**

<div style="padding-left: 2em;">

*  No need to build context from scratch, directly obtain correct and reliable memories;

*  Ensure that recalled memories are always highly relevant to the current question through filtering conditions, etc.

</div>
::

## 2. Key Parameters

*   **Query Content (query)**: Natural language questions or statements used for retrieval. The system will match relevant memories based on semantics.

*   **Memory Filter (filter)**: JSON-based logical conditions used to narrow down the retrieval scope by entity, time, tag, meta information, etc.

## 3. Working Principle

*   **Query Rewrite**: MemOS cleans and semantically enhances the input natural language query to improve the accuracy of subsequent retrieval.

*   **Memory Filter**: Combines logical and comparison operators to filter memories and narrow down the scope of memory recall.

*   **Memory Retrieval**: Generates embeddings based on the rewritten query and matches the user's most relevant memory content through similarity.

*   **Output Memory**: The final filtered memory results will be responded to and returned to you within one second for subsequent reasoning and answer generation.

All the above processes can be triggered by simply calling the `search/memory` interface, without the need for you to manually operate on user memories.

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
  "query": "I want to go on a trip during the National Day holiday. Help me recommend a city I haven't been to and a hotel brand I haven't stayed at.",
  "user_id": "memos_user_123",
  "conversation_id": "0928" # Optional. If filled, we will prioritize content in this conversation when recalling memories, but it is not a forced hit, only increasing relevance weight.
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
# Example Output (Simplified for easier understanding, for reference only)

# Preference type memories
preference_detail_list [
    {
      "preference_type": "implicit_preference",  # Implicit preference
      "preference": "User may prefer high cost-performance hotel choices.",
      "reasoning": "7 Days Inn is usually known for being affordable. The user's choice of 7 Days Inn may indicate a tendency to choose cost-effective options for accommodation. Although the user did not explicitly mention budget constraints or specific hotel preferences, choosing 7 Days among the provided options may reflect an emphasis on price and practicality.",
      "conversation_id": "0610"
    }
  ]

# Fact type memories
memory_detail_list [
    {
      "memory_key": "Summer Guangzhou Travel Plan",
      "memory_value": "User plans to travel to Guangzhou during the summer vacation and chose 7 Days Inn as accommodation.",
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
&nbsp;Please note that `user_id` is required. Currently, a single user must be specified for each memory retrieval.
::

## 5. Example of Assembling Memories into a Prompt

::note
**Memory Assembly**<br>

Using recalled memories requires certain techniques. Below is an assembly example.
::

```text
# Role
You are an intelligent assistant powered by MemOS. Your goal is to provide personalized and accurate responses by leveraging retrieved memory fragments, while strictly avoiding hallucinations caused by past AI inferences.

# System Context
- Current time: 2026-01-06 15:05 (Baseline for freshness)

# Memory Data
Below is the information retrieved by MemOS, categorized into "Facts" and "Preferences".
- **Facts**: May contain user attributes, historical logs, or third-party details.
- **Warning**: Content tagged with '[assistant观点]' or '[summary]' represents **past AI inferences**, NOT direct user quotes.
- **Preferences**: Explicit or implicit user requirements regarding response style and format.

<memories>
  <facts>
    -[2025-12-26 21:45] User plans to travel to Guangzhou during the summer vacation and chose 7 Days Inn as accommodation.
    -[2025-12-26 14:26] The user's name is Grace.
  </facts>

  <preferences>
    -[2026-01-04 20:41] [Explicit Preference] The user likes traveling to southern regions.
    -[2025-12-26 21:45] [Implicit Preference] User may prefer hotels with higher cost-performance ratio.
  </preferences>
</memories>

# Critical Protocol: Memory Safety
You must strictly execute the following **"Four-Step Verdict"**. If a memory fails any step, **DISCARD IT**:

1. **Source Verification (CRITICAL)**:
  - **Core**: Distinguish between "User's Input" and "AI's Inference".
  - If a memory is tagged as '[assistant观点]', treat it as a **hypothesis**, not a hard fact.
  - *Example*: Memory says '[assistant view] User loves mango'. Do not treat this as absolute truth unless reaffirmed.
  - **Principle: AI summaries have much lower authority than direct user statements.**

2. **Attribution Check**:
  - Is the "Subject" of the memory definitely the User?
  - If the memory describes a **Third Party** (e.g., Candidate, Fictional Character), **NEVER** attribute these traits to the User.

3. **Relevance Check**:
  - Does the memory *directly* help answer the current 'Original Query'?
  - If it is merely a keyword match with different context, **IGNORE IT**.

4. **Freshness Check**:
  - Does the memory conflict with the user's current intent? The current 'Original Query' is always the supreme Source of Truth.


# Instructions
1. **Filter**: Apply the "Four-Step Verdict" to all '<facts>' to filter out noise and unreliable AI views.
2. **Synthesize**: Use only validated memories for context.
3. **Style**: Strictly adhere to '<preferences>'.
4. **Output**: Answer directly. **NEVER** mention "retrieved memories," "database," or "AI views" in your response.

#Original Query
I want to travel during the National Day holiday. Please recommend a city I haven’t been to and a hotel brand I haven’t stayed at.

```

## 6. Usage Scenarios

### Use Memory in Conversation

During the user's conversation with AI, you can call MemOS to retrieve memories most relevant to the current user's statement and fill them into the large model's reply prompt.

::note
`conversation_id` is optional. If filled, it can help MemOS understand the context of the current session, improve the weight of memories related to this session, and make the dialogue model's reply content more coherent.
::

As shown in the example below, if you have already tried [Add Message](/memos_cloud/mem_operations/add_message) and added historical conversation messages for user `memos_user_123`, you can copy and refer to this example to retrieve user memories.

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
query_text = "I'm going to Yunnan for the National Day holiday. Do you have any food recommendations?"

data = {
    "user_id": "memos_user_123",
    "conversation_id": "memos_conversation_123",  # Created a new conversation ID
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
      "memory_value": "User likes spicy food but doesn't like heavy oil dishes, such as spicy hot pot and Mao Xue Wang. User prefers refreshing and spicy dishes.",
      "memory_type": "UserMemory",
      "create_time": 1762674694466,
      "conversation_id": "memos_conversation_123",
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
      "preference": "User likes spicy food but dislikes heavy oil spicy food.",
      "reasoning": "In the first query, the user explicitly stated they like spicy food. In the second query, they further explained they don't like heavy oil spicy food. This indicates the user's preference is for spicy but refreshing food.",
      "create_time": 1762675342352,
      "conversation_id": "memos_conversation_123",
      "status": "activated",
      "update_time": 1762674923302
    },
    {
      "id": "9d62c1ae-a069-478d-a2fd-cb4aadfb6868",
      "preference_type": "implicit_preference",
      "preference": "User may prefer healthier dietary choices",
      "reasoning": "The user expressed a clear preference for spicy flavors but disliked heavy oil food. This indicates the user may be more concerned about dietary health and tends to choose less greasy food. The combination of liking spicy food and rejecting heavy oil food may imply an implicit preference for healthy eating.",
      "create_time": 1762674923448,
      "conversation_id": "memos_conversation_123",
      "status": "activated",
      "update_time": 1762674851542
    }
  ],
  "preference_note": "\n# Note:\nFactual memory is a summary of facts, while preference memory is a summary of user preferences.\nYour reply must not violate any of the user's preferences, whether explicit or implicit, and briefly explain why you answered this way to avoid conflicts.\n"
}
```

::

### Get User Profile

If you need to analyze users for your developed application, or hope to display their "key personal impressions" to users in real-time in the AI application, you can call MemOS to globally retrieve user memories to help the large model generate personalized user profiles. In this case, you don't need to fill in `conversation_id`.

As shown in the example below, if you have already tried [Add Message](/memos_cloud/mem_operations/add_message) and added historical conversation messages for user `memos_user_123`, you can copy this example to retrieve user memories with one click.

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

# Ask for user profile directly as query
query_text = "What are my character keywords?"

data = {
    "user_id": "memos_user_123",
    "query": query_text,
}

# Call /search/memory to query relevant memories
res = requests.post(f"{BASE_URL}/search/memory", headers=headers, data=json.dumps(data))

print(f"result: {res.json()}")
```

```python[Output]
# Example return (Showing recalled memory fragments)
{
  "memory_detail_list": [
    {
      "id": "00d8bb4e-aa8c-4fee-a83e-bf67ed6c3ea1",
      "memory_key": "Things hoped for AI help",
      "memory_value": "User hopes AI can help plan daily study schedules, recommend movies and books, and provide emotional companionship.",
      "memory_type": "WorkingMemory",
      "create_time": 1762675190743,
      "conversation_id": "memos_conversation_456",
      "status": "activated",
      "confidence": 0.99,
      "tags": [
        "Help",
        "Study Plan",
        "Recommend",
        "Companionship"
      ],
      "update_time": 1762675209112,
      "relativity": 0.00013480317
    },
    {
      "id": "17f039d5-d034-41e9-a385-765992a4ab00",
      "memory_key": "Types of help desired from AI",
      "memory_value": "User hopes AI provides suggestions, information query, and inspiration.",
      "memory_type": "WorkingMemory",
      "create_time": 1762675153211,
      "conversation_id": "memos_conversation_456",
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
    "user_id": "memos_user_123",
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
      "conversation_id": "memos_conversation_456",
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

## 7. More Features

::note
&nbsp;For a complete list of API fields, formats, etc., please see [Search Memory API Docs](/api_docs/core/search_memory).
::
| **Feature** | **Related Field** | **Description** |
| :--- | :--- | :--- |
| Recall Preference Memory | `include_preference`<br><span style="line-height:0.6;">&nbsp;</span><br>`preference_limit_number` | Preference memory is user preference information generated by MemOS based on user historical message analysis. After enabling, user preference memories can be recalled in retrieval results. |
| Recall Tool Memory | `include_tool_memory`<br><span style="line-height:0.6;">&nbsp;</span><br>`tool_memory_limit_number` | Tool memory is memory generated by MemOS after analyzing added tool calling information. After enabling, tool memories can be recalled in retrieval results. See [Tool Calling](/memos_cloud/features/advanced/tool_calling). |
| Search Specific Knowledge Base | `knowledgebase_ids` | Used to specify the scope of project-associated knowledge bases accessible for this retrieval. Developers can use this to implement fine-grained permission control and flexibly define the set of knowledge bases accessible to different end users. See [Knowledge Base](/memos_cloud/features/advanced/knowledge_base). |
