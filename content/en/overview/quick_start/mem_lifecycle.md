---
title: Memory Lifecycle Management
desc: In MemOS, memories are not stored statically; they continuously evolve over time and through usage.
---

## 1. Capability Overview
A memory, once generated, may gradually consolidate into a stable long-term preference, or be removed if it becomes outdated or invalid.  
:::note
**Tip**<br>
This evolutionary process is called **Memory Lifecycle Management**, and its goal is to keep the memory base “clean and organized.”<br>

* **Recently useful entries** remain active for easy retrieval;<br>

* **Long-term stable facts** are consolidated to reduce duplication and noise;<br>

* **Outdated or conflicting information** is archived or deleted to ensure consistency and compliance.<br>
:::
> Note that lifecycle management focuses on **the evolution of memory entries at the storage layer**; whether a specific memory is invoked during reasoning is still determined by the scheduling mechanism.

<br>

:::note{icon="ri:customer-service-2-fill"}
**Lifecycle Stage Overview**
:::

| **Stage** | **Description** | **System Behavior** |
| --- | --- | --- |
| Generated | Newly created memory object, with metadata such as source, timestamp, and confidence | Initially stored in the storage layer, awaiting future use |
| Activated | Referenced during reasoning or tasks, entering a high-frequency active state | More likely to be selected by the scheduling mechanism |
| Merged | Semantically overlaps with historical memories or user-provided data, integrated into a new version | Multiple records are compressed and merged into an updated stable entry |
| Archived | Not accessed for a long period, downgraded to cold storage | Only enabled during special retrievals or backtracking |
| Expired (optional) | After archiving, further timeout or policy judgment marks it invalid | Removed from the index, no longer used in reasoning, only minimal logs retained |
| Frozen (special state) | Critical or compliance-related memories are locked and cannot be modified | Full historical versions are preserved for audit and compliance tracking |

## 2. Example: Memory Lifecycle of an Online Education Assistant

:::note{icon="ri:message-2-line"}
Suppose you are building an **online education assistant** with MemOS to help students solve math problems.
:::

**Generated**

*   A student says for the first time: “I always confuse quadratic functions with linear functions.”
    
*   The system extracts the memory:
    

```json
{"value": "The student often confuses quadratic and linear functions", "confidence": 0.8, "timestamp": "2025-09-11"}
```

*   Status: **Generated**
    
*   Behavior: Stored into the memory base, awaiting future use.
    

---

**Activated**

*   In the following problem-solving sessions, the system frequently calls this memory to assist with answers.
    
*   Status: **Activated**
    
*   Behavior: Prioritized by the scheduling mechanism and cached into the MemoryCube to improve retrieval speed.
    

---

**Merged**

*   With more interactions, the system discovers that the student not only confuses linear and quadratic functions, but also struggles with exponential functions.
    
*   The system merges multiple similar memories into:
    

```json
{"value": "This student is confused about function concepts, especially linear, quadratic, and exponential functions", "confidence": 0.95}
```

*   Status: **Merged**
    
*   Behavior: Old entries are compressed to form a new version, reducing redundancy.
    

---

**Archived**

*   Three months later, the student has mastered function-related concepts, and this memory hasn’t been scheduled for a long time.
    
*   Status: **Archived**
    
*   Behavior: Migrated into MemVault (cold storage), excluded from reasoning by default, but available in “learning trajectory backtracking.”
    

---

**Expired**

*   A year later, the student advances to a new grade level. The old “junior high function confusion” memory is judged invalid by policy.
    
*   Status: **Expired**
    
*   Behavior: Fully removed from the index, retaining only minimal audit info:
    

```json
{"deleted_memory_id": "12345", "deleted_at": "2026-09-11"}
```
---

**Frozen (special state)**

*   Meanwhile, the student’s “final exam evaluation report” is a compliance-related file that must not be modified.
    
*   Status: **Frozen**
    
*   Behavior: Locked against updates, retaining full history for audit and compliance inspection.
    

## 3. Advanced: Deep Customization Options

| **Extension Point** | **Description** | **Example** |
| --- | --- | --- |
| State transition conditions | Control the triggers for each state | “If unused for 7 days → Archive” |
| Merge and compression | Define how similar memories are handled | Multiple “likes sci-fi movies” entries merged into one with higher confidence |
| Conflict resolution | Handle memory conflicts in timestamps or sources | Choose “latest entry overrides” or “preserve in parallel” |
| Cleanup mechanism | Set deletion rules to control index size | Remove low-confidence or user-retracted memories |
| Audit trail | Decide whether to retain minimal metadata of deleted items | Enable “trace logs” under compliance requirements |

## 4. Next Steps

Still have questions? Check out [FAQs](/overview/faq) to see if they can help.

## 5. Contact Us

<img src="https://cdn.memtensor.com.cn/img/1758251354703_v1nwkz_compressed.png" alt="image" style="width:70%;">
