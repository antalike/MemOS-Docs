---
title: "Agent Memory Observability: 12 Measures That Matter After Launch"
---

*A production checklist from MemTensor*

An agent may return the right answer while relying on an outdated preference. It may also retrieve a record outside the caller’s authorized scope or keep using one after a correction. At MemTensor, we recommend tracing memory from the initial write through retrieval and later changes, so you can see which records reached the model and investigate the result.

## Start with the user outcome

Choose a task that memory should improve: a support case resumed after a week, a coding agent applying a project rule, or an assistant using a corrected preference. Compare matched tasks with and without authorized memory. Keep the model, base prompt, tools, and scoring criteria fixed.

Track task success alongside retrieval quality and latency. This connects changes in the memory system to the work the agent actually completes.

## The twelve-measure starter set

We recommend the following measures for your application’s evaluation. Define the labels, sampling method, and thresholds before the pilot.

| Stage | Measure | How to measure it |
| --- | --- | --- |
| Write | **1. Memory acceptance rate** | Share of sampled generated memories judged accurate, correctly attributed, and useful enough to retain. |
| Write | **2. Duplicate write rate** | Share of newly stored records that unnecessarily duplicate an active memory. Exclude intentional historical versions. |
| Write | **3. Write-to-searchable latency** | Time from write submission to the first successful retrieval by a predefined authorized query. Report p50 and p95. |
| Retrieve | **4. Fact recall@k** | Distinct required facts covered by the top *k* results, divided by all required facts for the task. |
| Retrieve | **5. Precision@k** | Relevant records in the top *k* results, divided by *k*. Unfilled result slots count as misses. |
| Retrieve | **6. Stale recall rate** | Share of retrieved records that are obsolete for the question’s requested time. |
| Retrieve | **7. Cross-scope exposure rate** | Share of scope tests that return any unauthorized memory, whether or not it appears in the final answer. |
| Retrieve | **8. Read latency p95** | The 95th-percentile time from sending a retrieval request to receiving its response, segmented by workload and data size. |
| Update | **9. Correction propagation time** | Time from submitting a correction until current-state queries return the new value without presenting the old value as current. |
| Update | **10. Unresolved conflict rate** | Share of reviewed fact groups with incompatible current values for the same entity, attribute, scope, and effective time. |
| Forget | **11. Deletion completion rate** | Requests verified complete across the declared scope by their deadline, divided by all requests due. |
| Outcome | **12. Task success delta** | Difference in success rate on matched tasks with and without authorized memory, expressed in percentage points. |

Set latency budgets for the workload and report failed or timed-out operations alongside successful timings. Review each scope violation and incomplete deletion individually, even when overall rates are low.

## Follow identifiers, not copies of private content

Link each request to its authenticated scope, search query, returned memory IDs, injected memory IDs, answer, and feedback. For writes, updates, and deletions, record the affected memory IDs, source reference, actor, and timestamps. Keep sensitive payloads in their designated store rather than copying full conversations into telemetry.

MemOS Cloud’s [asynchronous writes](https://memos-docs.openmem.net/memos_cloud/features/async_mode/) return a task ID while processing continues in the background. Use [Get Task Status](https://memos-docs.openmem.net/api_docs/message/get_status/) to track completion and identify affected memories by category. Log that completion time alongside the first successful retrieval.

Our [Cloud console](https://memos-docs.openmem.net/memos_cloud/getting_started/cloud_and_opensource/) provides call logs and request-chain inspection for debugging API behavior. The [MemOS Local Plugin Viewer](https://docs.openmem.net/openclaw/local_plugin/) brings memory records, tasks, analytics, and logs into one interface for inspecting local runs. With our [open-source deployment](https://memos-docs.openmem.net/memos_cloud/getting_started/cloud_and_opensource/), you can extend service-side instrumentation in your own infrastructure.

## Three failures to rehearse before release

**Try a wrong-scope read.** Exercise your application with test accounts from different users and projects, including requests with altered identifiers. MemOS Cloud’s [project and user isolation](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/) separates records by project API key and `user_id`. Bind those IDs to authenticated callers in your backend, then check that unauthorized requests cannot expose another scope’s records.

**Correct a preference and repeat the task.** [Update Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/update_memory/) edits a known record by ID. [Add Feedback](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/) interprets a natural-language correction and locates the relevant memories to update. Measure propagation against your deadline; historical records can remain available without being treated as current.

**Delete a test memory and search again.** [Delete Memory](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) supports deleting selected memories or a user’s memories within the API key’s project. Agent-wide deletion requires independent Agent memory to be enabled. Query every retrieval route your application uses, and verify completion in the underlying stores covered by your deletion policy, including application copies.

Start with one user journey and a small labeled task set. Expand the measurements when they help you diagnose a failure or make a release decision.
