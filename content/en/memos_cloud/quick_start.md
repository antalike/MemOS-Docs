---
title: Quick Start
desc: 欢迎访问 MemOS 云平台，参考本新手指南即可在几分钟内接入记忆能力。
---

在使用大模型构建应用时，一个常见问题是：**如何让 AI 稳定记住用户的长期偏好？**  
MemOS provides two core interfaces to help you achieve this:

- `addMessage` —— Hand over the original conversation to us, and we will automatically process and store memories [(Click for detailed API documentation)](/api_docs/core/add_message)
- `searchMemory` —— Recall memories in subsequent conversations to make AI answers more relevant to user needs [(Click for detailed API documentation)](/api_docs/core/search_memory)

![image.svg](https://cdn.memtensor.com.cn/img/1762435152160_rnausc_compressed.png)


## 1. Preparation

* Register and log in to MemOS Cloud Platform [(Click to Register)](https://memos-dashboard.openmem.net/quickstart);

* 准备一个可发送 HTTP 请求的环境（Python 或 cURL 均可）；

* 获取 API Key[（点击获取）](https://memos-dashboard.openmem.net/apikeys) 并配置到环境变量；

* 准备一个可用于测试的 `conversation_id`（建议按日期命名，如 `20260413-demo`）。


## 2. Code Configuration

### 2.1 Install SDK
If you choose Python SDK, please ensure Python 3.10+ is installed, then execute:

```
pip install MemoryOS -U 
```

### 2.2 Add Original Conversation (addMessage)

::note
**Session A: Occurred on 2025-06-10**<br>

You only need to provide the `original conversation records` to MemOS, and MemOS will `automatically abstract, process, and save them as memories`.
::

::code-snippet{name=add_message}
::

### 2.3 Call MemOS to Search Relevant Memories in Session (searchMemory)

::note
**会话 B：2025-09-28 发生**<br>

用户在一个新的会话中提出“推荐国庆旅游地点和酒店”，MemOS 会自动召回【事实记忆：曾去过哪里】和【偏好记忆：订酒店的偏好】供 AI 参考，从而生成更个性化的旅游计划。
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
      "confidence": 0.82,
      "conversation_id": "0610"
    },
    {
      "preference_type": "explicit_preference",  #显性偏好
      "preference": "用户希望酒店评分不低于4.5分。",
      "conversation_id": "0928"
    }
  ],

# Factual Type Memories
  memory_detail_list [
    {
      "memory_key": "Summer Guangzhou Travel Plan",
      "memory_value": "User plans to travel to Guangzhou during the summer vacation and chose 7 Days Inn as accommodation.",
      "conversation_id": "0610",
      "memory_time": "2025-06-10 20:15:00",
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


## 3. Next Steps

现在你已经可以运行 MemOS，建议继续探索更多云平台功能：

* [**Core Memory Operations**](/memos_cloud/mem_operations/add_message): Learn fully how to add, retrieve, and delete memories;

* [**Feature Introduction**](/memos_cloud/features/basic/filters): Explore more cloud platform features, such as memory filtering, multi-modal messages, knowledge bases, etc.;

* [**API 接口文档**](/api_docs/start/overview)：查看完整的 API 文档与调用示例；

* [**SDK 接入说明**](/api_docs/start/quickstart)：按语言查看初始化、鉴权和错误处理方式。


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

- [Coze × MemOS Plugin Tool](/usecase/frameworks/coze_plugin)
  - Use the MemOS plugin tool listed on the Coze platform to directly access cloud service interfaces in the workflow, quickly adding long-term memory capabilities to your Agent.
    
- [Claude MCP](/usecase/frameworks/claude_mcp)
  - MemOS provides a way to interact with the cloud platform through MCP, directly accessing cloud service interfaces in the Claude client.

- [LangChain × MemOS 集成](/usecase/frameworks/langchain)
  - 在 LangChain 工作流中将 `searchMemory` 作为检索工具接入，支持多轮对话上下文增强。
