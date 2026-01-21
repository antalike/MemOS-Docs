---
title: Memory Production
desc: The Memory Production module transforms raw messages or events into storable and retrievable memory units, serving as the starting point of the entire MemOS workflow.
---

::warning
**[Go directly to API Docs](/api_docs/core/add_message)**
<br>
<br>

**This article focuses on functional explanation. For detailed interface fields and limits, please click the link above.**
::

## 1. Capability Introduction: Why Process Raw Messages into Memory

In MemOS, what you submit is **raw information** (conversations between users and AI, user operation logs/action traces in the app, etc.), and the system will automatically complete the process of “memorization.”

::note{icon="ri:triangular-flag-fill"}
**Why process memory?**
::

If you simply save all the raw conversations and directly feed them to the large model, several problems will occur:

- **Overlong context**: Raw messages are often lengthy and repetitive. Feeding the entire context to the model is inefficient and wastes tokens.
- **Inaccurate retrieval**: Unprocessed raw text makes it difficult to quickly locate key information, and retrieval often recalls large amounts of noise.
- **High invocation cost**: Directly concatenating raw messages significantly increases model input length, leading to token costs and latency.

<br>

::note
**What’s different after processing?**
::

MemOS transforms raw messages into structured memory units, automatically extracting:

- **Key facts**: e.g., “The user usually travels with the whole family (children and parents).”
- **Task clues**: Extracting the user’s goal intent, such as “planning a family trip,” rather than just “going out during summer vacation.”
- **User preferences**:
  - Not only explicit expressions (“I like traveling with my family”), but also implicit reasoning patterns.
  - For example, if the user shows a preference for “clear logic in writing” while asking AI to rate 10 articles, MemOS will preserve this preference pattern for the next 20 article rating tasks, guiding the model to remain consistent.

<br>

As a result:

- **Faster and more accurate retrieval**: Directly locate facts/preferences/tasks instead of parsing a whole raw conversation.
- **More efficient invocation**: Only concise memory needs to be passed to the model, reducing token consumption.
- **More stable experience**: The model can continuously maintain its understanding of user habits without drifting due to lost context.

<br>

**Example**:

```json
User: I’ve planned to travel to Guangzhou this summer. What chain hotels are available for accommodation?
Assistant: You can consider options like 7 Days Inn, All Seasons, Hilton, etc.
User: I’ll choose 7 Days Inn.
Assistant: Alright, feel free to ask me if you have any other questions.
```

```json
Fact Memory: The user has planned to travel to Guangzhou during the summer of 2024 and has chosen to stay at 7 Days Inn for accommodation.

Preference Memory: Preference for budget-friendly accommodations.
Reasoning: The user's choice of 7 Days Inn over other options like Hilton suggests a potential preference for more budget-friendly accommodations. 7 Days Inn is known for being an economical option compared to Hilton, which is a higher-end hotel chain. This choice indicates that the user might prioritize cost-effectiveness in their accommodation decisions.
```

> For you, this means: as long as you store raw conversations, you don’t need to write your own “keyword extraction” or “intent recognition” logic—you can directly obtain reusable long-term user preferences.

## 2. Advanced: If You Want Deep Customization

In MemOS, **memory production** is the full process of converting raw input into schedulable and retrievable memory units. The specific pipeline details (such as extraction methods, embedding models, storage backends) evolve with versions and community practices—so this section does not provide a fixed unique workflow, but instead explains **extensible components** where you can make adjustments.

| **Extensible Component Examples** | **Default Behavior**                                        | **Customizable Options**                                                       |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Extraction & Structuring          | Generates MemoryItem (including content, timestamp, source) | Replace the extraction model or template, or add domain-specific fields to schema |
| Chunking & Embedding              | System chunks long text and feeds it into embedding models  | Adjust chunking granularity, or replace with better-suited embedding models (e.g., bge, e5) |
| Storage Backend                   | Defaults to a vector database (e.g., Qdrant)                | Switch to a graph database, or use a hybrid of both                            |
| Merging & Governance              | Automatically handles duplicates and conflicts              | Add custom rules (e.g., time priority, source priority), or governance logic (deduplication, filtering, etc.) |

## 3. Next Steps

Learn more about MemOS core capabilities:

- [Memory Scheduling](/memos_cloud/introduction/mem_schedule)
- [Memory Recall](/memos_cloud/introduction/mem_recall)
- [Memory Lifecycle Management](/memos_cloud/introduction/mem_lifecycle)
