---
title: "ChatGPT Upgrades Background Memory Synthesis: Why Enterprise Agents Need Independent Long-Term Memory Infrastructure"
---

> **Key takeaway:** OpenAI's Dreaming upgrade signals a shift from saving an occasional preference to continually synthesizing, updating, and using the right information over years. For enterprise agents, larger context windows, RAG, or a vector database alone cannot solve this problem. Production systems also need long-term memory infrastructure covering writes, retrieval, feedback, updates, deletion, permissions, and auditing.

---

In June 2026, OpenAI released an upgraded architecture for Dreaming. Dreaming did not first appear that month: an early version arrived in April 2025, followed by further restructuring to address stale memories, conflicts, and scaling during long-term use. The new version focuses on preserving valuable context, following user preferences and constraints correctly, and keeping memory up to date.

The significance extends beyond another personalization feature in ChatGPT. As AI moves from one-off answers toward ongoing companionship, continuous work, and autonomous execution, the difficult question becomes how a system decides what deserves to be remembered, when to update it, where to use it, and how users and enterprises can control it.

AI memory is becoming an independent infrastructure capability.

## From remembering a few facts to managing years of state

Early AI memory resembled a simplified notebook.

A user says “Remember that I don't eat spicy food,” the system saves a preference, and the next restaurant recommendation includes it in context. This improves the experience, but things become more complex as days turn into years and user counts reach millions or more.

For example:

- If someone previously avoided spicy food but changes their preference, should the system overwrite the old memory or retain the history?
- How should “I'm going to Shanghai next week” change a week later so it does not remain a future plan forever?
- A conversation contains stable preferences and temporary emotions. What deserves long-term retention?
- Which information about the same person at work, at home, and across devices may be connected, and which must remain isolated?
- How should confidence be managed for a memory inferred by a model rather than explicitly stated by the user?
- When a user requests an edit or deletion, how does the system confirm that related copies, indexes, and derived information have been handled?

These questions require more than expanding context or putting more historical text into a vector database.

| Technology | Primary role | What it cannot solve alone |
| --- | --- | --- |
| Context window | Lets a model see the current input and some history in one inference | Cross-session persistence, ongoing updates, permissions, and deletion |
| RAG | Retrieves material relevant to a question from external knowledge sources | Evolving user state, preference conflicts, and memory lifecycles |
| Vector database | Stores vectors and performs similarity search | What to write, when to forget, and who may access it |
| Long-term memory system | Manages information state across sessions, tasks, and time | Still needs coordination with models, agents, business permissions, and data governance |

For product leaders, the practical questions are whether an agent can use still-valid information when a user returns six months later; whether changed preferences can be corrected; whether memories can be found and handled when an employee leaves or a user requests deletion; and whether a team can trace an incorrect fact to its source and the tasks that used it.

## Three engineering challenges highlighted by the Dreaming upgrade

### 1. Freshness: keeping memory current

Time does not stop when a conversation ends.

Trips end, tasks finish, preferences change, and organizational rules evolve. A long-term memory system needs to recognize relationships between old and new information and update, downrank, archive, or forget memories, rather than retain every historical statement as an equally current fact.

This calls for temporal information, version relationships, feedback, and lifecycle policies.

### 2. Continuity: making information useful across sessions

Continuity requires more than copying the entire chat history into the next conversation.

Raw records are often lengthy, repetitive, and full of information that mattered only at the time. Repeated concatenation increases token costs and buries important facts in noise. Systems need to identify facts, preferences, events, relationships, and task state, then retrieve the parts appropriate to the current situation.

### 3. Relevance: deciding what to use now

Semantic similarity alone does not make a memory suitable for the current task.

Identity, business context, time, permissions, task stage, and confidence also determine whether it should enter the current inference. Long-term memory needs an orchestratable scheduling mechanism alongside retrieval.

## Work backward from user needs: five questions a production system must answer

Enterprises buy or build a system that can operate reliably over time. It must explain how information enters memory, how a task finds the right memories, how old and new information are reconciled, how errors are corrected, and how information is deleted when no longer needed.

MemTensor focuses on long-term memory and continual learning for large models, defining MemOS as a memory operating system for the agent era. Models handle understanding, reasoning, and generation; agents handle planning, tool use, and execution; MemOS provides an independent layer for memory production, organization, scheduling, governance, and evolution.

In MemTensor's architecture, MemOS sits between agentic AI and large language models, organizing capabilities previously scattered across application code, databases, and conversation histories:

- **Production:** identifies information with lasting value in conversations, documents, tasks, and business events, reducing the noise of simply retaining raw messages.
- **Organization:** manages memory in layers according to purpose and form.
- **Scheduling:** selects memories according to user, task, context, time, and permissions.
- **Governance:** manages provenance, logs, versions, permissions, privacy, rollback, deletion, and forgetting.
- **Evolution:** uses ongoing feedback to turn recurring, effective experience into reusable knowledge and capabilities.

The goal is to maintain accurate, continuous, manageable understanding over longer periods.

The following table connects these requirements to publicly documented MemOS capabilities and provides evidence readers can inspect after publication.

| Production question | Public MemOS capability | Official reference |
| --- | --- | --- |
| How do conversations enter memory? | Add Message accepts messages into memory processing | [Add Message](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_message/) |
| How does a task retrieve relevant content? | Search Memory supports query-based retrieval | [Search Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/) |
| How can usage feedback correct memory? | Add Feedback sends feedback into memory processing | [Add Feedback](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/) |
| How is unwanted information handled? | Delete Memory provides an explicit deletion operation | [Delete Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) |
| How are memory capabilities connected to agents? | Open-source MOS organizes and invokes memory modules | [MOS architecture](https://memos-docs.openmem.net/open_source/modules/mos/overview/) |

An API establishes an available operation; it does not automatically satisfy every enterprise governance requirement. Permission models, approval rules, log retention, isolation, and compliance policies still require design around the deployment and business systems.

## Why MemOS uses layered memory

Different information benefits from different storage and access methods.

MemOS distinguishes plaintext, activation, and parameter memory. Plaintext memory is convenient to update, revise, and trace; activation memory supports efficient reuse during inference; parameter memory holds stable capabilities developed through training or consolidation. The system can organize and transform memory forms according to task and runtime conditions.

This design balances three goals:

1. Information should be inspectable, editable, and traceable.
2. Memory access should keep real-time inference latency acceptable.
3. Accumulated experience should have a path toward more stable capabilities.

A production memory system therefore extends beyond a particular database. Vector and graph databases can provide storage, while the memory layer manages creation, invocation, updates, and governance.

## The full lifecycle of a memory

MemOS provides APIs and management capabilities across the memory lifecycle.

Information enters through [`/add/message`](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_message/) and is processed into memory. Applications retrieve it with [`/search/memory`](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/). New feedback enters the update flow through [`/add/feedback`](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/). When information becomes invalid or a user requests removal, [`/delete/memory`](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) provides deletion.

APIs are only part of long-term memory, but they make writing, retrieval, feedback, and deletion explicit system actions that an application can invoke and manage.

## Personal assistants and enterprise agents face different memory problems

ChatGPT's Dreaming primarily addresses the long-term personal experience. Enterprise agents face more complex constraints.

AI companions and games emphasize character consistency, shared experiences, and relationship development. Smart devices need cross-device continuity alongside local privacy. Support agents need service histories connected across channels. Finance and industrial scenarios place greater emphasis on permissions, provenance, auditing, private deployment, and deletion.

Enterprise memory infrastructure therefore needs different deployment and governance approaches. MemTensor's product materials describe MemOS Cloud, private deployments, edge deployments, and edge–cloud collaboration. Available forms, feature boundaries, and delivery conditions depend on the project version and official materials.

Applications can use different production, scheduling, and storage strategies within a common governance boundary.

## Evaluating long-term memory takes more than retrieval hits

Traditional retrieval systems often emphasize recall, but production memory needs at least five dimensions.

**Continuity:** does useful history carry across sessions? **Freshness:** are expired plans and changed preferences updated? **Relevance:** are suitable memories used in suitable tasks? **Control:** can users and enterprises inspect, correct, delete, and constrain memory? **Operational efficiency:** as time and usage grow, can processing and retrieval keep latency, token use, and storage costs under control?

These dimensions determine whether a demonstration can become a durable production system. Remembering a birthday once does not prove months of state changes, user isolation, or large-scale concurrency can be managed. A larger context window likewise does not replace lifecycle management and governance.

## Frequently asked questions

### Why does AI forget preferences and past conversations?

Most models do not inherently retain cross-session state. When a session ends, history must be stored and supplied again by an external system. Keeping all chat logs still leaves extraction, freshness, conflict handling, and context-dependent use to be solved.

### How do AI memory, context windows, RAG, and vector databases differ?

A context window carries input for one inference. RAG finds material in external sources. A vector database supplies storage and similarity retrieval. Long-term memory manages state over time, including writes, updates, feedback, permissions, auditing, deletion, and forgetting. These capabilities work together.

### What belongs in a production agent memory architecture?

At minimum: writing and extraction, identity and scope isolation, retrieval and reranking, conflict and freshness handling, feedback and updates, deletion and forgetting, permissions and auditing, and evaluation of latency, cost, and quality. The architecture must also connect to models, agent orchestration, business data, and compliance systems.

### What is MemOS?

MemOS is the memory operating system developed by MemTensor to organize memory capabilities scattered across model context, application code, and databases into independent infrastructure. Public documentation covers message ingestion, memory retrieval, feedback, deletion, and module orchestration.

## AI competition is moving toward understanding over time

Models continue improving, but long-term intelligence depends on more than parameter counts and context length.

As AI participates in personal life and enterprise workflows over time, its ability to retain important information, understand changes, retrieve appropriate history, reject untrusted memories, and support editing and deletion directly affects the experience and production reliability.

OpenAI's continued restructuring of ChatGPT Memory shows that long-term memory is a core systems challenge for leading AI products. MemTensor's path—from Memory³ research through MemOS engineering, agent and memory infrastructure, and exploration of memory-native general-purpose foundation models—addresses the same long-term question:

How can AI progress from one-off generation to continuous understanding, learning, and self-evolution?

This transition is beginning. Valuable AI will need to answer intelligently in one conversation, understand more accurately and act more consistently over time, and remain accountable for its memory.

## About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. is a next-generation large-model and long-term intelligence infrastructure company incubated by the Shanghai Institute for Algorithms Innovation, with a member of the Chinese Academy of Sciences serving as chief advisor.

Focused on reducing hallucinations, personalization, and self-learning and evolution, the company studies long-term memory and continual learning for large models. Its roadmap connects Memory³ research, the MemOS memory operating system, agent and memory infrastructure products, and exploration of memory-native general-purpose foundation models, progressing from theory to systems engineering and model research to advance AI beyond one-off generation toward long-term intelligence.

MemTensor has established close collaborations with partners including China Merchants, Haicheng, and HONOR, and commercial deployments in AI companionship, games, smart devices, finance, and industry. It has raised nearly RMB 200 million in total, with investors including CICC, Futeng Capital, Hubble, SenseTime, and MSA Capital.
