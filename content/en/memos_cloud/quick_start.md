---
title: Quick Start
desc: Welcome to MemOS Cloud Platform. Refer to this guide to quickly integrate memory capabilities.
---

When building applications with large models, a common question is: **How to make AI remember user's long-term preferences?**
MemOS provides two core interfaces to help you achieve this:

- `addMessage` —— Hand over the original conversation to us, and we will automatically process and store memories [(Click for detailed API documentation)](/api_docs/core/add_message)
- `searchMemory` —— Recall memories in subsequent conversations to make AI answers more relevant to user needs [(Click for detailed API documentation)](/api_docs/core/search_memory)

![image.svg](https://cdn.memtensor.com.cn/img/1762435152160_rnausc_compressed.png)


## 1. Preparation

* Register and log in to MemOS Cloud Platform [(Click to Register)](https://memos-dashboard.openmem.net/quickstart);

* Get API Key [(Click to Get)](https://memos-dashboard.openmem.net/apikeys);

* Prepare an environment capable of sending HTTP requests, such as Python or cURL.


## 2. Code Configuration

### 1. Install SDK
If you choose Python SDK, please ensure Python 3.10+ is installed, then execute:

```
pip install MemoryOS -U 
```

### 2. Add Original Conversation (addMessage)

::note
**Session A: Occurred on 2025-06-10**<br>

You only need to provide the `original conversation records` to MemOS, and MemOS will `automatically abstract, process, and save them as memories`.
::

::code-snippet{name=add_message}
::

### 3. Call MemOS to Search Relevant Memories in Session (searchMemory)

::note
**Session B: Occurred on 2025-09-28**<br>

In a new session, the user asks the AI to recommend travel destinations and hotels for the National Day holiday. MemOS automatically recalls [Factual Memory: Where they have been] and [Preference Memory: Hotel booking preferences] for AI reference, thereby recommending a more personalized travel plan.
::

::code-snippet{name=search_memory}
::

**The output memory list is as follows:**<br>

```text
# Example Output (Simplified for understanding, for reference only)

# Preference Type Memories
{
  preference_detail_list [
    {
      "preference_type": "implicit_preference",  # Implicit Preference
      "preference": "User may prefer hotels with higher cost-performance ratio.",
      "reasoning": "7 Days Inn is usually known for being economical. The user's choice of 7 Days Inn may indicate a preference for cost-effective options in accommodation. Although the user did not explicitly mention budget constraints or specific hotel preferences, choosing 7 Days among the provided options may reflect an emphasis on price and practicality.",
      "conversation_id": "0610"
    }
  ],

# Factual Type Memories
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
}
```


## 3. Next Steps

Now that you can run MemOS, you can explore more cloud platform features:

* [**Core Memory Operations**](/memos_cloud/mem_operations/add_message): Learn fully how to add, retrieve, and delete memories;

* [**Feature Introduction**](/memos_cloud/features/basic/filters): Explore more cloud platform features, such as memory filtering, multi-modal messages, knowledge bases, etc.;

* [**API Documentation**](/api_docs/start/overview): View complete API documentation and call examples.


## 4. More Resources

### Understand MemOS Memory Production Process

Detailed introduction to [how a message entering the system is processed into memory and effectively used in future conversations], helping you better understand the mechanism and advantages of MemOS memory.

::note
**Deep Understanding**<br>
MemOS's memory mechanism can be understood as a complete "workflow":
You submit original messages → Memory is processed and produced → Scheduling mechanism arranges calls and storage based on tasks and context, and dynamically adjusts memory forms → Relevant memories are recalled when needed → Lifecycle management maintains evolution and updates simultaneously.
::

- [Memory Production](/memos_cloud/introduction/mem_production)
- [Memory Scheduling](/memos_cloud/introduction/mem_schedule)
- [Memory Recall](/memos_cloud/introduction/mem_recall)
- [Memory Lifecycle Management](/memos_cloud/introduction/mem_lifecycle)

### MemOS in Action

MemOS provides rich project examples. Depending on your specific project, you can refer to the following materials:

- [Let Financial Assistant Understand Preferences Behind Customer Behavior](/usecase/financial_assistant)
  - In smart investment advisory scenarios, user clicks, browsing, favorites, and communication are all behavioral trajectories that build a profile.
  - MemOS can abstract these behaviors into memories, such as "Risk Preference = Conservative".
  - And directly play a role when the user asks "What investment suits me?", making investment advice more professional and realistic.

- [Building a Home Assistant with Memory](/usecase/home_assistant)
  - A home assistant not only answers immediate questions but also remembers your todos, preferences, and family information.
  - For example, "Take the kids to the zoo on Saturday" or "List points first when reminding", MemOS converts these into memories.
  - Automatically plays a role in subsequent conversations, making the assistant closer to real life.

- [Writing Assistant with Memory works better](/usecase/writting_assistant)
  - A writing assistant should not only generate content but also maintain a consistent tone and style.
  - Through MemOS, user writing preferences, commonly used information, and context instructions can be remembered.
  - No need to emphasize repeatedly when writing summaries or emails next time, achieving a coherent and personalized creation experience.

- [MindDock Browser Extension](https://alidocs.dingtalk.com/i/p/e3ZxX84Z5KM6X7dRZxX8v66wA7xaBG7d?dontjump=true)
  - MemOS-MindDock creates a unified cross-platform AI memory layer for users.
  - It automatically records, organizes, and injects personal information and preferences, allowing all AIs to continuously and stably "know you".

- [Coze × MemOS Plugin Tool](/usecase/frameworks/coze_plugin)
  - Use the MemOS plugin tool listed on the Coze platform to directly access cloud service interfaces in the workflow, quickly adding long-term memory capabilities to your Agent.
    
- [Claude MCP](/usecase/frameworks/claude_mcp)
  - MemOS provides a way to interact with the cloud platform through MCP, directly accessing cloud service interfaces in the Claude client.
