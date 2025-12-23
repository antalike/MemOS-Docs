---
title: Memory Scheduling
desc: Memory Scheduling is like the brain's attention mechanism, dynamically deciding which memory to call at the right moment.
---

## 1. Capability Introduction

In MemOS, **Memory Scheduling** improves efficiency and accuracy by dynamically coordinating memories of different usage efficiencies (Parameter > Activated > Working > Other Plaintext). During conversations and tasks, it predicts which memories will be needed and preloads high-efficiency types like activated and working memories, accelerating the reasoning chain.

:::note{icon="ri:triangular-flag-fill"}
**Why Scheduling Is Needed**
:::

In complex interactions, if the system only relies on simple global search each time, it may:

*   **Be too slow**: Waiting until after the user finishes asking to search causes high first-token latency.
    
*   **Be inaccurate**: Too much history overwhelms key information, making retrieval difficult.
    
<br>

The role of scheduling is to give the system “instant readiness and fast response” capabilities:

*   **Preloading**: At the start of the conversation, load the user’s commonly used background.
    
*   **Predictive invocation**: Before the user finishes typing, prepare the memories that may be needed.
    
    
<br>

:::note
**How Scheduling Works — Dynamically arrange memory invocation and storage based on task semantics, context, access frequency, and lifecycle.**
:::

| Dimension | Explanation |
| --- | --- |
| What to schedule? | Parameter memory (long-term knowledge and skills)<br><br>Activated memory (runtime KV cache and hidden states)<br><br>Plaintext memory (externally editable facts, user preferences, retrieval snippets)<br><br>Supports dynamic migration among `Plaintext ⇆ Activated ⇆ Parameter`; frequently used plaintext snippets can be compiled into KV cache in advance; stable templates can be deposited into parameters. |
| When to schedule? | When context and efficient memory are insufficient to support answering user queries, memory structures are optimized.<br><br>Prepare memory content in advance according to the user’s intent and needs.<br><br>During continuous queries, scheduling ensures high efficiency and accuracy in conversation scenarios. |
| Who to schedule for? | Current user, specific role agent, or shared cross-task context |
| What form to schedule into? | Memories are tagged with indicators such as heat, timeliness, and importance. The scheduler decides which to load first, which to cool down, and which to archive. |

When using MemOS cloud services, the role of scheduling can be observed through the performance of the `searchMemory` API:

*   It quickly returns relevant memories, avoiding context breaks.
    
*   Returned content is already optimized by the scheduler, ensuring results are relevant without overloading model input.

        
## 2. Example: Memory Scheduling in a Household Assistant Scenario

*   Some time ago: the user was busy buying a house
    
::card-group

  :::card
  ---
  title: "User often said:"
  ---
  *   “Check the average second-hand housing price in XX community.”
    
  *   “Remind me to view the house on Saturday.”
    
  *   “Record the latest change in mortgage rates.”
  :::

  :::card
  ---
  title: ✨ MemOS System Operation
  ---
  *   Initially, the system generated these items as **Plaintext Memories**.
    
  *   Since house-buying information was frequently mentioned, the scheduler judged it as a **core theme** and migrated these plaintexts into **Activated Memories**, making subsequent queries faster and more direct.
  :::

::

        
<br>

*   Recently: the user bought the house and started decorating
    
::card-group

  :::card
  ---
  title: "User frequently mentioned:"
  ---
  *   “Going to check tiles this weekend.”
    
  *   “Remind me to confirm water and electricity work with the renovation company.”
    
  *   “Record next week’s furniture delivery time.”
  :::

  :::card
  ---
  title: ✨ MemOS System Operation
  ---
  *   The system continued to generate new **Plaintext Memories**.
    
  *   The scheduler detected that “renovation” had become the new high-frequency theme and migrated these entries into **Activated Memories**.
    
  *   Meanwhile, previous “house-buying” activated memories were no longer frequently used and were automatically **downgraded back to plaintext**, reducing active memory usage.
  :::

::

    
<br>

*   **At the current moment: the user casually says—“I feel like too many things are piling up, help me organize them.”**
    
::card-group

  :::card
  ---
  title: "Without scheduling, the system can only do a full-library retrieval, pulling out all possibly relevant memories:"
  ---
  *   Checking tiles (renovation)
    
*   Confirming water/electricity work (renovation)
    
*   Furniture delivery (renovation)
    
*   Checking housing prices (house-buying, outdated)
    
*   Viewing houses (house-buying, outdated)
    
*   Grocery shopping (daily life)
    
*   Watching a movie (daily life)
  :::

  :::card
  ---
  title: ✨ With scheduling, the system can return more quickly
  ---
  *   Checking tiles
    
*   Confirming water/electricity work
    
*   Furniture delivery

    
<br>

   👉 **User experience UP**

*   Faster response (no need for full-library search).
    
*   The listed items are exactly what they care about most → makes the assistant feel “very understanding.”
  :::

::

    

        

## 3. Advanced: Deep Customization

Developers can **extend scheduling strategies** to customize system behavior, mainly including:

| **Extension Point** | **Configurable Content** | **Example Scenario** |
| --- | --- | --- |
| Scheduling Strategy | Define memory selection logic for different tasks | Conversation systems prioritize activated memories; research systems prioritize retrieving the latest plaintexts |
| Transformation Rules | Set conditions for cross-type migration | High-frequency FAQs → KV cache; stable paradigms → parameter modules |
| Context Binding | Bind memories to roles/users | Student users automatically load learning preferences; enterprise users load project archives |
| Permissions & Governance | Combine scheduling with access control and compliance checks | Medical records visible only to doctors; sensitive content not shareable across domains |
| Scheduling Metrics | Optimize scheduling based on access frequency and latency needs | High-frequency hot memories prioritized; low-frequency cold memories downgraded to archive |

    
## 4. Next Steps

Learn more about MemOS core capabilities:

*   [Memory Recall](/memos_cloud/introduction/mem_recall)
    
*   [Memory Lifecycle Management](/memos_cloud/introduction/mem_lifecycle)