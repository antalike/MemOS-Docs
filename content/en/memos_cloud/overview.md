---
title: Introduction to MemOS
desc: MemOS (Memory Operating System) is a memory management operating system for AI applications.
---

Its goal is: To make your AI system **possess long-term memory like a human**, not only remembering what the user said, but also actively recalling, updating, and scheduling these memories.

For developers, MemOS is like a database for applications: you don't need to reinvent the wheel to solve the problem of "how AI remembers". Just call the services provided by MemOS to easily equip your Agent or application with "memory capabilities".

<img src="{{cdnUrl}}/img/1758705757425_0enqrc_compressed.png" alt="Memory Comparison" style="width:70%;">

## 1. Why MemOS?

Native memory of Large Language Models has limitations:

* **Limited Context**: No matter how large the Token window of a single conversation is, it cannot carry long-term knowledge.

* **Severe Forgetting**: Preferences mentioned by the user last week disappear in the next conversation.

* **Hard to Manage**: As interactions increase, memory becomes chaotic, and developers need extra logic to handle it.
<br>

The value of MemOS lies in that it **abstracts the memory layer**, allowing you to focus only on business logic:

* No more writing tedious "long text splicing" or "extra database calls".

* Memory can be reused and extended like modules, and even shared between different Agents and different systems.

* Through active scheduling and multi-layer management, memory retrieval is faster and more accurate, significantly reducing hallucinations.

Simply put: **MemOS makes AI no longer a disposable chat machine, but a partner that grows continuously**.

<img src="{{cdnUrl}}/img/1758705793859_0ncfzd_compressed.jpeg" alt="image" style="width:70%;">

## 2. What Can MemOS Do?

*   **Personalized Conversation**: Remember user's name, habits, interests, and instruction preferences, automatically supplementing them next time.
    
*   **Team Knowledge Base**: Transform fragmented conversations into structured knowledge for collaborative use by multiple Agents. See [Knowledge Base](/memos_cloud/features/advanced/knowledge_base) for details.
    
*   **Task Continuity**: Maintain memory across sessions and applications, allowing AI to calmly handle long-process tasks.
    
*   **Multi-layer Memory Scheduling**: Call the most suitable memory for different needs to improve performance and accuracy.
    
*   **Open Extension**: Supports independent use as an API, and can also be integrated into existing frameworks (Official usage guides are coming soon. For those who can't wait, feel free to try it out yourself!).

## 3. Next Steps

👉 Enter [Quick Start](/memos_cloud/quick_start) to show how to add "memory capabilities" to your Agent through a minimal example.

👉 Or start developing business applications directly. We provide practical projects for your reference:
*   [Let Financial Assistant Understand Preferences Behind Customer Behavior](/usecase/financial_assistant)
*   [Writing Assistant with Memory is More Useful](/usecase/writting_assistant)
*   [Build a Home Assistant with Memory](/usecase/home_assistant)
*   [Claude MCP](/usecase/frameworks/claude_mcp)
*   [Coze Plugin](/usecase/frameworks/coze_plugin)
