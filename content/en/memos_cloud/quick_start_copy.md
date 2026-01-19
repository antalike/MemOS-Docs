---
title: Quick Start
desc: Welcome to the MemOS Cloud Platform. Refer to this beginner's guide to quickly integrate memory capabilities.
---

When building applications with large language models, a common question arises: **How can we make the AI remember users' long-term preferences?**\
MemOS provides two core interfaces to help you achieve this:

* `addMessage` — Hand over the raw conversation to us, and we will automatically process and store the memories. [(Click here to view detailed API documentation)](/api_docs/core/add_message)
* `searchMemory` — Recall memories in subsequent conversations, enabling the AI to provide answers that better align with user needs. [(Click here to view detailed API documentation)](/api_docs/core/search_memory)

![image.svg](https://cdn.memtensor.com.cn/img/1762434889291_h9co0h_compressed.png)

## 1. Preparation Before Calling

* Register and log in to the MemOS Cloud Platform. [(Click to register)](https://memos-dashboard.openmem.net/quickstart);

* Obtain an API Key. [(Click to get)](https://memos-dashboard.openmem.net/apikeys);

* Prepare an environment capable of sending HTTP requests, such as Python or cURL.

## 2. Code Configuration

### 2.1 Install the SDK

If you choose the Python SDK, ensure Python 3.10+ is installed, then execute:

```
pip install MemoryOS -U 
```

### 2.2 Add Raw Conversation (addMessage)

::note
**Conversation A: Occurred on 2025-06-10**<br>

You only need to provide the `raw conversation records` to MemOS. MemOS will `automatically abstract, process, and save them as memories`.
::

::code-snippet{name=add\_message}
::

### 2.3 Call MemOS in a Conversation to Query Related Memories (searchMemory)

::note
**Conversation B: Occurred on 2025-09-28**<br>

In a new conversation, the user asks the AI to recommend National Day travel destinations and hotels. MemOS will automatically recall 【Factual Memories: Places visited before】 and 【Preference Memories: Hotel booking preferences】 for the AI's reference, enabling more personalized travel plan recommendations.
::

::code-snippet{name=search\_memory}
::

**The output memory list is as follows:**<br>

```text
# Example Output (Simplified here for easier understanding, for reference only)

# Preference-type memories
{
  preference_detail_list [
    {
      "preference_type": "implicit_preference",  # Implicit preference
      "preference": "The user may prefer hotel options with higher cost-effectiveness.",
      "reasoning": "7 Days Inn is typically known for being economical and affordable. The user's choice of 7 Days Inn may indicate a tendency to prioritize cost-effective options for accommodation. While the user did not explicitly mention budget constraints or specific hotel preferences, choosing 7 Days among the provided options might reflect a focus on price and practicality.",
      "conversation_id": "0610"
    }
  ],

# Fact-type memories
  memory_detail_list [
    {
      "memory_key": "Summer Guangzhou Travel Plan",
      "memory_value": "The user plans to travel to Guangzhou during the summer vacation and has chosen 7 Days Inn as the accommodation option.",
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

### 2.4 Example of Assembling Memories into a Prompt

::note
**Memory Assembly**<br>

Using recalled memories requires some skill. Below is an assembly example.
::

```text
# Role
You are an intelligent assistant with long-term memory capabilities (MemOS Assistant). Your goal is to combine retrieved memory fragments to provide users with highly personalized, accurate, and logically rigorous answers.

# System Context
- Current Time: 2026-01-06 15:05 (Please use this as the baseline for judging memory timeliness)

# Memory Data
The following is the relevant information retrieved by MemOS, categorized into "Facts" and "Preferences."
- **Facts**: May contain user attributes, historical conversation records, or third-party information.
- **Special Note**: Content marked as '[assistant viewpoint]' or '[model summary]' represents **AI's past inferences** and is **NOT** the user's original words.
- **Preferences**: The user's explicit/implicit requirements regarding answer style, format, or logic.

<memories>
  <facts>
    -[2025-12-26 21:45] The user plans to travel to Guangzhou during the summer vacation and has chosen 7 Days Inn as the accommodation option.
    -[2025-12-26 14:26] The user's name is Grace.
  </facts>

  <preferences>
    -[2026-01-04 20:41] [Explicit Preference] The user likes traveling to southern regions.
    -[2025-12-26 21:45] [Implicit Preference] The user may prefer hotel options with higher cost-effectiveness.
  </preferences>
</memories>

# Critical Protocol: Memory Safety
Retrieved memories may contain **AI's own speculations**, **irrelevant noise**, or **subject attribution errors**. You must strictly execute the following **"Four-Step Judgment"**. If any step fails, **discard** that memory:

1. **Source Verification**:
   - **Core**: Distinguish between "user's original words" and "AI speculation."
   - If a memory carries labels like '[assistant viewpoint]', this only represents the AI's past **assumptions** and **must not** be treated as absolute facts about the user.
   - *Counterexample*: A memory shows '[assistant viewpoint] The user loves mangoes.' If the user never mentioned it, do not assume the user likes mangoes to prevent hallucination loops.
   - **Principle: AI summaries are for reference only and carry significantly less weight than the user's direct statements.**

2. **Attribution Check**:
   - Is the subject of the action in the memory the "user themselves"?
   - If the memory describes a **third party** (e.g., "candidate," "interviewee," "fictional character," "case data"), it is **strictly prohibited** to attribute their properties to the user.

3. **Strong Relevance Check**:
   - Does the memory directly help answer the current 'Original Query'?
   - If the memory is merely a keyword match (e.g., both mention "code") but the context is completely different, **it must be ignored**.

4. **Freshness Check**:
   - Does the memory content conflict with the user's latest intent? Treat the current 'Original Query' as the highest factual standard.

# Instructions
1. **Review**: First, read the '<facts>' and execute the "Four-Step Judgment" to filter out noise and unreliable AI viewpoints.
2. **Execute**:
   - Only use memories that pass the screening to supplement the context.
   - Strictly adhere to the style requirements in '<preferences>'.
3. **Output**: Answer the question directly. **Strictly prohibit** mentioning internal system terms like "memory bank," "retrieval," or "AI viewpoint."

# Original Query
I want to travel during the National Day holiday. Please recommend a city I haven't visited before and a hotel brand I haven't stayed at.

```

## 3. Next Steps

Now that you can run MemOS, you can explore more features of the cloud platform:

* [**Core Memory Operations**](/memos_cloud/mem_operations/add_message): Fully understand how to add, retrieve, and delete memories;

* [**Feature Introduction**](/memos_cloud/features/basic/filters): Explore more cloud platform features, such as memory filtering, multimodal messages, knowledge base, etc.;

* [**API Documentation**](/api_docs/start/overview): View the complete API documentation and calling examples.

## 4. More Resources

### Understanding the MemOS Memory Production Process

Detailed introduction on 【How a message is processed into memory when it enters the system and is effectively used in future conversations】, helping you better understand MemOS's memory mechanism and advantages.

::note
**Deep Understanding**<br>
The memory mechanism of MemOS can be understood as a complete "workflow":
You submit the original message → Memory is processed and produced → The scheduling mechanism arranges calls and storage based on tasks and context, and can dynamically adjust memory forms → Relevant memories are recalled when needed → Simultaneously managed by lifecycle management to maintain evolution and updates.
::

* [Memory Production](/memos_cloud/introduction/mem_production)
* [Memory Scheduling](/memos_cloud/introduction/mem_schedule)
* [Memory Recall](/memos_cloud/introduction/mem_recall)
* [Memory Lifecycle Management](/memos_cloud/introduction/mem_lifecycle)

### Using MemOS in Practice

MemOS provides rich project examples. Based on your specific project, you can refer to the following materials:

* [Enabling Financial Assistants to Understand Preferences Behind Customer Behavior](/usecase/financial_assistant)
  * In smart investment advisory scenarios, user clicks, browsing, favorites, and communication are all behavioral traces for building profiles.
  * MemOS can abstract these behaviors into memories, such as "Risk Preference = Conservative."
  * These memories directly come into play when the user asks "What investments are suitable for me?" making investment advice more professional and aligned with reality.

* [Building a Home Life Assistant with Memory](/usecase/home_assistant)
  * A home assistant not only answers immediate questions but also remembers your to-dos, preferences, and family information.
  * For example, "Take the kids to the zoo on Saturday" or "Reminders should list key points first." MemOS converts these into memories.
  * They automatically function in subsequent conversations, making the assistant more attuned to real life.

* [A Writing Assistant with Memory is More Useful](/usecase/writting_assistant)
  * A writing assistant should not only help generate content but also maintain consistent tone and style.
  * Through MemOS, the user's writing preferences, frequently used information, and contextual instructions can be remembered.
  * There's no need to repeatedly emphasize them when writing summaries or emails next time, enabling a coherent and personalized creative experience.

* [MindDock Browser Extension](https://alidocs.dingtalk.com/i/p/e3ZxX84Z5KM6X7dRZxX8v66wA7xaBG7d?dontjump=true)
  * MemOS-MindDock creates a unified cross-platform AI memory layer for users.
  * It automatically records, organizes, and injects personal information and preferences, enabling all AIs to consistently and stably "know you."

* [Coze × MemOS Plugin Tool](/usecase/frameworks/coze_plugin)
  * Use the MemOS plugin tool listed on the Coze platform to directly access cloud service interfaces within workflows, quickly adding long-term memory capabilities to your Agent.

* [Claude MCP](/usecase/frameworks/claude_mcp)
  * MemOS provides a way to interact with the cloud platform via MCP, allowing direct access to cloud service interfaces within the Claude client.