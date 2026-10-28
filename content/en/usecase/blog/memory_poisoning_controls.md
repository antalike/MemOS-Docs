---
title: "Memory Poisoning: Six Long-Term Memory Controls Enterprise Agents Need"
---

> **Key takeaway:** Memory poisoning occurs when untrusted information enters persistent memory and is reused in future sessions, tasks, or across agents. Enterprises need lifecycle controls around provenance, writing, updates, isolation, retrieval, and deletion alongside output safeguards. MemOS provides system entry points for writing, retrieval, feedback, deletion, and orchestration, working with identity and permissions, input validation, approvals, monitoring, and security operations.

---

With one-off Q&A, a wrong answer's effects usually end with the session. When agents have long-term memory across sessions, errors can be stored, recalled, and propagated through later tasks and other agents.

In August 2026, Forcepoint published *Agentic AI Security Risks: What CISOs Need to Know*. Drawing on X-Labs research, it discussed persistent risks from contaminated memory and context: false context, fabricated preferences, or incorrect behavioral patterns written into persistent state can affect subsequent decisions. In a multi-agent architecture, one agent's contaminated output can become another's input.

Compared with ordinary prompt injection, memory poisoning is harder to handle because its effects may appear later and survive the original session. A false memory can resurface weeks afterward as a fact the system supposedly already knows.

## From prompt injection to memory poisoning: what changes?

Prompt injection typically attempts to alter behavior during the current interaction. A web page might contain hidden instructions that steer an agent away from its rules or toward inappropriate tool calls.

In a stateless system, the effect may end with the task. A persistent agent can write the resulting content into long-term state:

- Save an attacker-supplied contact as a trusted supplier.
- Summarize an abnormal operation as successful experience for reuse.
- Mistake instructions on a malicious page for a lasting user preference.
- Share contaminated task conclusions across agents.
- Treat false information as historical evidence more trustworthy than external sources during future retrieval.

Long-term memory expands both agent capability and the time and scope over which an attack can persist.

Traditional controls are better suited to checking individual requests, connections, or tool calls. Memory poisoning requires observing information throughout ingestion, processing, storage, retrieval, feedback, and deletion.

## How contaminated information becomes a lasting risk

| Stage | What can happen | Controls to establish |
| --- | --- | --- |
| Input | Web pages, emails, tool results, or external agents carry untrusted content | Label source, trust level, and data type; validate high-risk inputs |
| Writing | A model summarizes temporary content or malicious instructions as lasting facts | Write permissions, policy validation, approval of sensitive operations |
| Persistence | Incorrect information loses its context and becomes a stable memory | Preserve source, time, creator, version, and validity period |
| Retrieval | Similarity search recalls a poisoned memory in the wrong situation | Identity and scope filters, freshness checks, reranking, confidence thresholds |
| Action | An agent uses it to call tools, make recommendations, or change business state | Least privilege, confirmation of critical actions, output and tool-call monitoring |
| Propagation | Results enter other agents, summaries, knowledge bases, or derived memories | Lineage, limits on cross-domain sharing, traceability, and bulk remediation |

This chain gives security teams an acceptance criterion: can contaminated information be identified, blocked, traced, and removed?

## Six governance questions a production memory system must answer

### 1. Where did this memory come from?

Distinguish explicit user statements, business records, external documents, model inferences, and agent summaries.

When different sources are compressed into indistinguishable text, later systems struggle to judge reliability. Preserve provenance, creation time, creator, related task, and processing history for traceability.

### 2. Who can write and modify it?

Reading and writing long-term memory need separate permissions.

Web pages, email, tool results, and third-party agents can all carry untrusted input. Define writing boundaries for users, organizations, applications, agents, and external sources, with validation or human confirmation for high-risk updates.

### 3. How does new information relate to old memory?

Long-term memory needs more than an append-only log.

When a new fact arrives, determine whether it supplements, corrects, replaces, or contradicts an earlier one. Simply retaining both can make an agent retrieve incompatible conclusions in the future.

### 4. How are different subjects isolated?

Multiple users, agents, and business systems generate many memories. Define personal, team, organization, task, and agent ownership, along with permitted sharing and access boundaries.

Isolation that relies on ad hoc parameter assembly becomes harder to maintain as systems grow, increasing unauthorized access and cross-scope leakage risks.

### 5. Can incorrect memories be corrected, rolled back, and deleted?

Finding an error is the first step. A system also needs to locate its copies and derived information and stop further use.

Feedback, versions, rollback, precise deletion, and forgetting are core controls for long-term memory.

### 6. Can the system keep detecting anomalies?

Memory poisoning can change behavior slowly and cumulatively. Reviewing individual answers may miss long-term drift.

Record memory writes, updates, retrievals, and deletions. Observe which memories an agent used, what data it accessed, which tools it called, and whether its behavior departed from the normal baseline.

## How MemOS places memory governance in the architecture

MemTensor treats long-term memory as a system resource requiring independent management.

MemOS sits between agentic AI and large language models, separating memory writes, retrieval, feedback, deletion, and module orchestration from scattered application logic. Publicly documented capabilities and their security value include:

| Governance goal | MemOS capability | Contribution | Official reference |
| --- | --- | --- | --- |
| Make writes explicit | Add Message | Applications choose which messages enter memory processing | [Add Message](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_message/) |
| Constrain retrieval by query and scope | Search Memory | Applications retrieve as needed at a task stage | [Search Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/) |
| Provide a correction channel | Add Feedback | Sends inaccurate, changed, or unsuitable information back into the memory flow | [Add Feedback](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/) |
| Provide a removal channel | Delete Memory | Explicitly removes incorrect, expired, or unwanted memories | [Delete Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) |
| Organize memory modules | Open-source MOS | Orchestrates agents' access to different memory modules | [MOS architecture](https://memos-docs.openmem.net/open_source/modules/mos/overview/) |

These capabilities provide a governance foundation. They do not promise automatic immunity to memory poisoning, and an API alone does not establish that an enterprise control has been deployed. A complete flow also needs identity management, least privilege, input validation, human approvals, DLP, SIEM, business logs, and incident response.

## Why feedback and deletion need formal APIs

Prototypes often focus on adding and retrieving memories. Updates and deletion are equally important for security and governance.

MemOS provides [`/add/message`](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_message/), [`/search/memory`](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/), [`/add/feedback`](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/), and [`/delete/memory`](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/).

Feedback lets applications report that a memory is inaccurate, a preference has changed, or a result should no longer be reused. Deletion makes removal of incorrect, stale, or unsuitable information an explicit operation.

Enterprise applications connect these APIs to identity, permissions, auditing, and business approvals. Governance records should identify the actor, the basis for a change, affected objects, and completion status.

## Layered memory brings layered risks

Plaintext, activation, and parameter memories have different visibility and modification costs.

Plaintext is easier to inspect, edit, and trace. Activation memory is closer to real-time inference. Parameter memory can carry stable learned capabilities. Incorrect information has different effects and remediation paths at each layer.

Governance therefore needs to check whether information has reached caches, graph relationships, derived summaries, skills, and other reusable state as well as the original stored text.

Layering also makes it possible to set different writing thresholds, update strategies, and audit methods for different memory forms.

## Private and edge deployments still need governance

Private or edge deployment can reduce the risk of data leaving organizational or device boundaries, but incorrect writes, excessive permissions, unclear provenance, and internal contamination remain concerns.

An incorrect local memory remains incorrect, and excessive privileges in a private environment can still permit unauthorized access.

Production governance needs to consider:

- Where data resides.
- Who can read, write, modify, and delete it.
- How external information is validated before ingestion.
- How sources and versions are recorded.
- How anomalous calls are detected.
- How users and administrators correct system state.

MemOS supports cloud, private, edge, and edge–cloud deployment approaches. Deployment addresses data boundaries, performance, and operations; memory governance applies across them.

## Different industries need different memory risk models

AI companions emphasize persona consistency, user control, and sensitive preferences. Smart hardware needs user isolation and local privacy. Financial agents emphasize policy freshness, business permissions, and auditing. Industrial agents need to distinguish equipment facts, expert experience, and field anomalies.

Treating all information as the same kind of searchable text hides these differences.

Define by industry and task what can be written automatically and what requires confirmation; what may be shared and what stays isolated; what can remain indefinitely and what expires; and what errors can be corrected through feedback versus requiring immediate suspension and audit.

## A pre-launch enterprise checklist

- Record source, creator, time, scope, and validity period for each memory.
- Distinguish read, write, update, delete, and cross-subject sharing permissions.
- Treat external pages, emails, and tool outputs as untrusted input by default.
- Require confirmation for high-risk memory writes and critical business actions.
- Define overwrite, retention, downranking, or review rules for conflicts.
- Trace which tasks recalled a memory and which actions it affected.
- Support suspending use, correcting or deleting the source, and tracing derived state after contamination.
- Monitor write volume, retrieval hits, conflicts, feedback corrections, deletion completion, cross-domain access, and anomalous tool calls.
- Regularly test prompt injection, cross-tenant leakage, stale memories, and propagation with red-team samples.
- Define responsibility boundaries for cloud, private, and edge deployments.

## Frequently asked questions

### What is memory poisoning?

It is the risk that untrusted or incorrect information enters an agent's persistent memory and influences decisions or actions in future tasks. Persistence is the defining feature: effects can survive across sessions and propagate to derived memories or other agents.

### How does it differ from prompt injection?

Prompt injection typically manipulates the current interaction. Memory poisoning concerns malicious influence written into long-term state. Injection can be an entry point; persistence and future reuse create the lasting memory-layer risk.

### Is private deployment enough to make it safe?

Private deployment changes data and system boundaries. It still needs identity and permissions, input validation, auditing, monitoring, correction, and deletion to address incorrect writes, unauthorized access, fabricated provenance, and internal contamination.

### What should production memory telemetry record?

Alongside latency, errors, and cost, record write sources, scope, retrieval history, conflicts and overwrites, corrections, deletion status, permission denials, cross-domain access, anomalous tool calls, and links between memories and final decisions. Security investigations need to know which memory influenced which action.

### What role does MemOS play?

MemOS makes writes, retrieval, feedback, deletion, and orchestration callable system capabilities, providing a memory-layer foundation for governance. It works alongside enterprise IAM, DLP, SIEM, approvals, and security operations; it does not automatically block every poisoning attack.

## Agents that act over time need accountability for memory

Continuity enables agents to retain history, continue tasks, understand users, and reuse experience. It can also let errors and attacks persist.

The next stage will evaluate whether systems can explain memory origins, update information correctly, keep untrusted content out of persistent state, give users and enterprises control, and trace, correct, and delete errors.

MemTensor's long-term intelligence roadmap spans Memory³ research, MemOS, agent and memory infrastructure, and memory-native models. Its central judgment is that memory improves personalization and constitutes infrastructure that needs governance in real production environments.

Long-running agents need a control system for the full memory lifecycle alongside a place to store history.

## About MemTensor

MemTensor (Shanghai) Technology Co., Ltd. is a next-generation large-model and long-term intelligence infrastructure company incubated by the Shanghai Institute for Algorithms Innovation, with a member of the Chinese Academy of Sciences serving as chief advisor.

Focused on reducing hallucinations, personalization, and self-learning and evolution, the company studies long-term memory and continual learning for large models. Its roadmap connects Memory³ research, the MemOS memory operating system, agent and memory infrastructure products, and exploration of memory-native general-purpose foundation models, progressing from theory to systems engineering and model research to advance AI beyond one-off generation toward long-term intelligence.

MemTensor has established close collaborations with partners including China Merchants, Haicheng, and HONOR, and commercial deployments in AI companionship, games, smart devices, finance, and industry. It has raised nearly RMB 200 million in total, with investors including CICC, Futeng Capital, Hubble, SenseTime, and MSA Capital.
