---
title: Quick Start
desc: Welcome to MemOS Cloud Platform. Refer to this beginner's guide to quickly access memory capabilities.
---

A common problem when building applications using Large Models is: **How to make AI remember user's long-term preferences?**
MemOS provides two core interfaces to help you achieve this:

- `addMessage` —— Hand over the original dialogue to us, and we will automatically process and store memories
- `searchMemory` —— Recall factual and preference memories in subsequent conversations, making AI responses closer to user needs

![image.svg](https://cdn.memtensor.com.cn/img/1762435152160_rnausc_compressed.png)


## 1. Preparation

* Register and log in to MemOS Cloud Platform [(Click to Register)](https://memos-dashboard.openmem.net/quickstart);

* Get API Key [(Click to Get)](https://memos-dashboard.openmem.net/apikeys);

* Prepare an environment capable of sending HTTP requests, Python or cURL.


## 2. Code Configuration

### 1. Install SDK
If you choose Python SDK, please ensure Python 3.10+ is installed, then execute:
::

```
pip install MemoryOS -U 
```

### 2. Add Original Dialogue (addMessage)

**Session A: Occurred on 2025-06-10**<br>
You only need to give the `original dialogue record` to MemOS, and MemOS will <code style="font-weight: bold;">automatically abstract, process, and save it as memory</code>**.**

::code-snippet{name=add_message}
::

### 3. Call MemOS to Query Related Memories in Session (searchMemory)

**Session B: Occurred on 2025-09-28**<br>
In a new session, the user asks AI to recommend travel destinations and hotels for the National Day holiday. MemOS automatically recalls [Fact Memory: Where they have been] and [Preference Memory: Hotel booking preferences] for AI reference, thereby recommending a more personalized travel plan.

::code-snippet{name=search_memory}
::

**The output memory list is as follows:**<br>

```text
# Example Output (Simplified here for easier understanding, for reference only)

# Preference Type Memory
{
  preference_detail_list [
    {
      "preference_type": "implicit_preference",  # Implicit Preference
      "preference": "The user may prefer hotels with higher cost-performance ratio.",
      "reasoning": "7 Days Inn is usually known for being economical and affordable, and the user's choice of 7 Days Inn may indicate a tendency to choose options with higher cost-performance ratio in accommodation. Although the user did not explicitly mention budget limits or specific hotel preferences, choosing 7 Days among the provided options may reflect an emphasis on price and practicality.",
      "conversation_id": "0610"
    }
  ],

# Fact Type Memory
  memory_detail_list [
    {
      "memory_key": "Summer Vacation Guangzhou Travel Plan",
      "memory_value": "The user plans to travel to Guangzhou during the summer vacation and chose 7 Days Inn as the accommodation option.",
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

Now that you can run MemOS, you can explore more Cloud Platform features:

* [**Core Memory Operations**](/memos_cloud/mem_operations/add_message): Fully understand how to add, retrieve, and delete memories;

* [**Feature Introduction**](/memos_cloud/features/basic/filters): Explore more Cloud Platform features, such as: memory filtering, multimodal messages, knowledge base, etc.;

* [**API Documentation**](/api_docs/start/overview): View complete API documentation and call examples.


## 4. More Resources

### Understand MemOS Memory Production Process

Detailed introduction to [how a message is processed into memory when it enters the system, and effectively used in future conversations], helping you better understand MemOS's memory mechanism and advantages.

::note
**Deep Understanding**<br>
MemOS's memory mechanism can be understood as a complete "workflow":
You submit original messages → Process and produce memory → Scheduling mechanism arranges calling and storage based on tasks and context, and can dynamically adjust memory forms → Relevant memories are recalled when needed → Simultaneously maintained, evolved, and updated by lifecycle management.
::

- [Memory Production](/memos_cloud/introduction/mem_production)
- [Memory Scheduling](/memos_cloud/introduction/mem_schedule)
- [Memory Recall](/memos_cloud/introduction/mem_recall)
- [Memory Lifecycle Management](/memos_cloud/introduction/mem_lifecycle)

### Practical Use with MemOS

MemOS provides rich project examples. Depending on your specific project, you can refer to the following resources:

- [Let Financial Assistant Understand Preferences Behind Customer Behavior](/usecase/financial_assistant)
  - In intelligent investment advisory scenarios, user clicks, browsing, favorites, and communication are all behavioral trajectories for building profiles.
  - MemOS can abstract these behaviors into memories, such as "Risk Preference = Conservative".
  - And play a direct role when the user asks "What investment suits me?", making investment advice more professional and fitting to reality.

- [Build a Home Assistant with Memory](/usecase/home_assistant)
  - A home assistant is not just about answering immediate questions; it can also remember your todos, preferences, and family information.
  - For example, "Take the kids to the zoo on Saturday" or "List key points first when reminding", MemOS will turn these into memories.
  - Automatically play a role in subsequent conversations, making the assistant closer to real life.

- [Writing Assistant with Memory is More Useful](/usecase/writting_assistant)
  - A writing assistant should not only help you generate content but also maintain a consistent tone and style.
  - Through MemOS, user writing preferences, frequently used information, and context instructions can be remembered.
  - No need to emphasize repeatedly when writing summaries or emails next time, achieving a coherent and personalized creation experience.

- [MindDock Browser Extension](usecase/frameworks/browser_extension)
  - MemOS-MindDock creates a unified cross-platform AI memory layer for users.
  - It automatically records, organizes, and injects personal information and preferences, so that all AIs can continuously and stably "know you".

- [Coze × MemOS Plugin Tool](usecase/frameworks/coze_plugin)
  - Use the MemOS plugin tool listed on the Coze platform to directly access cloud service interfaces in the workflow, quickly adding long-term memory functions to your Agent.
    
- [Claude MCP](usecase/frameworks/claude_mcp)
  - MemOS provides a way to interact with the cloud platform through MCP, directly accessing cloud service interfaces in the Claude client.
