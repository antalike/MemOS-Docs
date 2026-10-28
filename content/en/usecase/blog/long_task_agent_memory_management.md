---
title: "Memory Management for Long-Running Agents: From Session Recovery to Reusable Experience"
---

> **Key takeaway:** OpenAI's Agents API moves agents that run for days toward a standard interface, while exposing another side of long-running work: context can be compacted and processes resumed, but deciding why a piece of state deserves long-term retention, when it expires, and who may use it still requires separate system-level judgment.

---

![Memory management for long-running agents, from session recovery to reusable experience](https://cdn.memtensor.com.cn/img/memos-best-practices-long-task-cover-en-20261028_compressed.png)

On September 10, 2026, OpenAI released the public beta of its Agents API, bringing session orchestration, context compaction, and task recovery into a managed agent harness. Developers can start agents through an API, configure tool calls and subagent collaboration, and continue existing tasks in later interactions.

As agents move beyond single-turn Q&A into continuous execution across sessions and tools, systems need to track task progress, user requirements, and intermediate results. Reasoning, tool execution, and state management together affect the quality of long-running work.

Context management helps retain information needed for the current step. Content intended for reuse across sessions raises four further questions: what deserves long-term storage, which version wins when information conflicts, what agents can share, and what should be deleted when a task ends.

Long-term memory management addresses these questions. It associates information with users, tasks, or agents, manages retention across sessions and updates over time, and determines its scope of use alongside context management, retrieval, and underlying storage.

## Why do long-running agents need memory management?

Short tasks can usually keep the necessary information in current context. Long tasks continually generate tool results, files, plans, error logs, feedback, and intermediate conclusions. Repeatedly putting the full history back into context creates three issues.

First, history increases input size. If every request carries the complete history, inputs grow with the task, repeatedly including information unrelated to the current step. Selecting what is needed helps control input size; actual cost and latency also depend on the model, caching, and other mechanisms.

Second, compaction needs to retain provenance and status. Summaries shorten text, but missing labels can blur user requirements, model assumptions, tool-returned facts, and obsolete plans. Later tasks need those distinctions to decide what can be reused and what still requires verification.

Third, the scope of information use needs to be clear. Has a subagent's intermediate conclusion been verified, and can other agents use it? Which parts of a failed attempt deserve retention as experience, and which belong only in execution logs? These choices determine how history affects later work.

Four management objects help clarify responsibility.

| Object | Typical content | Responsibility |
| --- | --- | --- |
| Task execution state | Progress, tool call records, pending steps | Stored by the harness and application for continuation and recovery |
| Working context | Current instructions, plans, recent tool results, retrieved information | Organizes information visible to the model for this inference, compacting or replacing it as needed |
| External knowledge | Product manuals, project documents, business policies | Retrieved from source systems, with document versions and access scopes maintained |
| Long-term memory | User preferences, historical requirements, reusable task experience | Defines ownership, scope, update behavior, and deletion paths |

These responsibilities work together. The context window bounds one inference's input. RAG uses retrieved information to support generation and can retrieve external knowledge or historical memories. A vector database supplies vector storage and similarity search. Long-term memory management focuses on writing information, retaining it across sessions, updating it over time, and controlling where it is used.

For a report spanning multiple sessions, execution state records progress, working context contains the chapter currently being edited, a knowledge base supplies product references, and long-term memory stores the user's continuing format requirements. The next report can retrieve those requirements and apply them alongside current instructions.

Operations involving payment status or approval outcomes should use current state confirmed by the relevant business system. Historical descriptions in memory provide background.

## Memory management in production

Memories change throughout a long task. New requirements update old plans, and agents taking over the same work need clearly scoped shared information. The architecture needs a continuous flow connecting writing, use, updates, and deletion.

| Responsibility | What it manages |
| --- | --- |
| Writing | Selects content, distinguishes user statements, tool results, and model inferences, and records verifiable sources, times, and associated subjects |
| Organization | Establishes project, user, or agent ownership and separates personal memory from shared knowledge |
| Retrieval | Selects memory types, filters, and result counts for the task, with access control enforced server-side |
| Updates | Distinguishes additions, state changes, and corrections; verifies updated content and subsequent retrieval |
| Deletion and retention | Defines retention periods, deletion targets, and verification; application copies, logs, and caches follow their own retention rules |
| Operational records | Connects tasks, memory operations, and the memories actually sent to the model for troubleshooting |

These operations need to form one flow. If a user changes a report format, the system should update the memory, make the new requirement available to retrieval, and retain a verifiable change record. With multiple agents, their respective read and update scopes also need to be defined.

## How MemOS separates memory responsibilities from application logic

MemOS organizes memory reads, writes, and maintenance as independent system capabilities. Developers can configure memory processing through [components and interfaces](https://memos-docs.openmem.net/open_source/modules/mos/overview/), managing what is stored, when it is retrieved, and how it is updated and deleted.

With MemOS Cloud, applications can call [write, search, update, feedback, and deletion APIs](https://memos-docs.openmem.net/api_docs/start/overview/), using project API keys, user identifiers, and agent filters to set [retrieval scopes](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/). The `conversation_id` increases the retrieval weight of memories related to the current conversation; it does not enforce isolation.

For changing preferences and state, [time awareness](https://memos-docs.openmem.net/memos_cloud/introduction/time_awareness/) uses temporal cues in a query to select current or historical memories. User corrections can trigger updates through [natural-language feedback](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/); precise edits can [update a specific memory entry](https://memos-docs.openmem.net/memos_cloud/mem_operations/update_memory/). Applications can inspect the processed content and retrieval results.

Tool usage and task experience can also inform later work. After the application writes tool parameters, actual results, and their associations, MemOS Cloud can extract and retain [tool trajectories](https://memos-docs.openmem.net/memos_cloud/features/tool_calling/).

For reusable task methods, [self-evolving memory](https://memos-docs.openmem.net/memos_cloud/features/self-evolving/) can derive skills from historical conversations and accepts uploaded skill files. Selecting the relevant memory types during [search](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/) retrieves trajectories or skills for the agent to consult.

MemOS Cloud can [delete memories by ID](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) within the current project, with results verified through queries.

The open-source architecture uses a [Components + Handlers](https://memos-docs.openmem.net/open_source/modules/mos/overview/) pattern separating system components from request handling. [MemCube](https://memos-docs.openmem.net/open_source/modules/mem_cube/) organizes memory modules into containers for users and scenarios. Handlers coordinate adding, searching, feedback, and other operations. [MemScheduler](https://memos-docs.openmem.net/open_source/modules/mem_scheduler/) dispatches updates, organization, and feedback work in the background, providing task status and operation logs for tracking asynchronous processing.

Applications connect these operations to authentication, business authorization, and monitoring. The application server derives read and write scopes from business rules and handles its own copies and caches.

## How to validate memory flows in long-running tasks

Validation needs multiple interactions: can a new session find retained information, do corrections reach subsequent tasks, and do retrieval scopes follow expectations when users or agents change? Start with seven questions.

1. When a task resumes across sessions, does it use raw history, a summary, or structured state? Which layer stores and restores each?
2. Does a long-term memory retain its source, time, subject, and scope?
3. After a model, embedding model, or agent upgrade, are retrieval and use of existing memories tested for compatibility?
4. Are concurrency and conflict rules clear when several subagents write simultaneously?
5. Can incorrect memories receive feedback, be corrected, and be deleted? If they affected later tasks, can the related records be located and handled?
6. Can retrieval scopes be set according to identity, permissions, freshness, and task stage, with access controls enforced by the application server?
7. Can an abnormal action be linked to its input, the memories actually sent to the model, and tool execution results?

As agents participate in more tasks and sessions, memory needs to be designed and maintained alongside models, tools, and execution environments. MemOS makes reading, writing, updating, and deleting memories callable capabilities, allowing information accumulated across sessions to be maintained and used in later tasks as needed.

Learn more: [MemOS website](https://memos.memtensor.net/) | [Documentation](https://memos-docs.openmem.net/) | [GitHub](https://github.com/MemTensor/MemOS)

## About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. is a next-generation large-model and long-term intelligence infrastructure company incubated by the Shanghai Institute for Algorithms Innovation, with a member of the Chinese Academy of Sciences serving as chief advisor.

Focused on reducing hallucinations, personalization, and self-learning and evolution, the company studies long-term memory and continual learning for large models. Its roadmap connects Memory³ research, the MemOS memory operating system, agent and memory infrastructure products, and exploration of memory-native general-purpose foundation models, progressing from theory to systems engineering and model research to advance AI beyond one-off generation toward long-term intelligence.

MemTensor has established close collaborations with partners including China Merchants, Haicheng, and HONOR, and commercial deployments in AI companionship, games, smart devices, finance, and industry. It has raised nearly RMB 200 million in total, with investors including CICC, Futeng Capital, Hubble, SenseTime, and MSA Capital.
