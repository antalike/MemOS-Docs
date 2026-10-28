---
title: "From Data Ownership to Deletion: Four Questions for Self-Hosted Agent Memory"
---

> **Key takeaway:** Enterprises usually choose self-hosted agent memory to bring data storage, model calls, and operations under their own management. As agents work across sessions and teams, the deployment plan also needs to answer more specific questions: what information deserves to be retained, who can use it, how errors are corrected, and when it should be deleted.

---

At MemTensor, we offer MemOS Cloud and an open-source self-hosted path. Enterprises can configure memory services around their infrastructure and connect memory management to existing business processes.

## 1. Who owns a memory, and where does it travel?

“Customer A prefers email” is personal information about a customer; a support team's operating procedure is suitable for sharing within an authorized scope. Ownership determines where a memory should be stored and which agents can access it.

Before deployment, map the complete data flow: which business system supplies messages, which model and embedding services process them, and where the resulting memories, indexes, and logs reside. Include model services, operational access, and backup locations in the same map.

The MemOS [self-hosted deployment](https://docs.openmem.net/open_source/getting_started/rest_api_server/) provides REST APIs for adding, searching, retrieving, and providing feedback on memories, with configurable model and embedding services. The reference deployment includes components such as Neo4j and Qdrant. Enterprises can plan service connections and storage locations around their existing environment.

If data must be processed on an internal network, include model, embedding, and other external calls in the deployment design. This establishes the data boundary during planning.

## 2. Who can write, read, update, and delete—and who approves sharing?

Agents within one enterprise often have different responsibilities. Support agents need customer preferences, while development assistants need project conventions. Their memory access should follow business permissions.

Start by distinguishing personal, project, and organization-wide information, then assign responsibility for writing, reading, updating, deleting, and sharing. For example, users maintain their personal preferences, project owners confirm project procedures, and organization-wide rules are reviewed before broader use.

In MemOS, [MemCube](https://memos-docs.openmem.net/open_source/modules/mem_cube/) organizes and manages memory spaces. It supports operations within a single space and retrieval across multiple spaces through composed views. Applications can combine identity and business permissions to determine the readable and writable memory scope of each request, allowing agents to reuse information within authorized boundaries.

Connect enterprise accounts and roles to these memory spaces. Adjust access when employees leave, projects end, or sharing is revoked. During a pilot, test access with different users and projects to catch missing permission rules early.

## 3. Can you explain where a memory came from when something goes wrong?

User-confirmed preferences, model inferences from chats, and business records returned by tools need to retain their respective sources. When an agent gives a wrong answer, those sources help determine whether the information was stored incorrectly, the wrong memory was retrieved, or the correct content was not used in the response.

The MemOS [memory scheduler](https://memos-docs.openmem.net/open_source/modules/mem_scheduler/) coordinates memory flow and updates, providing task status, processing times, and memory operation logs. Enterprises can connect these records to their monitoring systems and correlate business requests, memory processing, and agent responses.

For example, a system might mistake a user's one-time choice for a lasting preference. After the user corrects it, the team can inspect feedback processing, changes to the relevant memory, and the next retrieval result to confirm that subsequent interactions use the new information.

Prefer memory IDs, source references, and operation records in logs, with detailed content accessible according to permissions. This supports troubleshooting while reducing duplication of sensitive information across operational systems.

## 4. When a user requests deletion, what exactly gets removed?

Memory management should distinguish correction, expiration, and deletion. A changed contact detail calls for an update; a completed temporary task can be cleaned up according to retention rules; a request to delete historical information requires identifying the affected records and copies.

MemOS Cloud provides [deletion by memory, user, or agent](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) within the current project. Agent-level deletion applies to agents with independent memory enabled. For self-hosted deployments, enterprises can integrate cleanup into their own data management processes around the memory modules and storage components they use.

Include application-generated summaries, caches, and backups in the cleanup plan, and define processing times and owners. After deletion, search through the relevant business entry points to check whether old information still enters the agent's context.

This makes deletion an executable, traceable routine operation and gives teams a clear way to explain request progress to users.

## Put the four questions into practice with a pilot

Choose a real business scenario and prepare two projects, two users, and one test memory. Run through writing, retrieval, sharing, correction, and deletion. Check that authorized users receive the information they need, other users remain isolated, and subsequent tasks reflect updates and deletions.

MemOS provides memory organization, retrieval, feedback, and scheduling. Enterprises connect identity rules, storage policies, and operational processes. The pilot should produce a clear launch plan: where data lives, who can use it, how problems are traced, and how records are retired—so agents can continue accumulating useful experience in the enterprise's own environment.

## About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. is a next-generation large-model and long-term intelligence infrastructure company incubated by the Shanghai Institute for Algorithms Innovation, with a member of the Chinese Academy of Sciences serving as chief advisor.

Focused on reducing hallucinations, personalization, and self-learning and evolution, the company studies long-term memory and continual learning for large models. Its roadmap connects Memory³ research, the MemOS memory operating system, agent and memory infrastructure products, and exploration of memory-native general-purpose foundation models, progressing from theory to systems engineering and model research to advance AI beyond one-off generation toward long-term intelligence.

MemTensor has established close collaborations with partners including China Merchants, Haicheng, and HONOR, and commercial deployments in AI companionship, games, smart devices, finance, and industry. It has raised nearly RMB 200 million in total, with investors including CICC, Futeng Capital, Hubble, SenseTime, and MSA Capital.
