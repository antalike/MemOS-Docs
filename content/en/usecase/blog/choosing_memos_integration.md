---
title: "Choosing a MemOS Integration for Your AI Agent"
---

Imagine a customer returning three days after a replacement was approved. They want to know when it will ship, and they have a new delivery address. The agent handling this conversation needs the earlier approval, the updated address, and the current shipping status from the order system.

That gives you a useful starting point for choosing a memory system. You can follow a specific piece of information from the conversation where it first appeared to the task that needs it later.

We built MemOS to help applications [carry context across conversations](https://memos-docs.openmem.net/memos_cloud/getting_started/quick_start/). You can connect through a managed API, run the open-source service on your infrastructure, or add memory to a supported agent through a plugin. The right starting point depends on what you’re building and how you want to operate it.

## Choose where the integration will run

For an application your team is developing, the first decision is whether to use our hosted service or manage the deployment yourself. If you’re adding memory to an existing agent environment, a plugin handles the connection between the agent and its memory.

| What you’re building | Where to start | What your team manages |
| --- | --- | --- |
| An application that needs a hosted memory service | [MemOS Cloud API](https://memos-docs.openmem.net/memos_cloud/getting_started/quick_start/) | Application integration, user identity, and how recalled memories enter the model’s context |
| A service running on your infrastructure | [MemOS open-source framework](https://github.com/MemTensor/MemOS) | The service, storage dependencies, model configuration, and operations |
| An OpenClaw or DeepSeek Harness setup using cloud memory | [MemOS Cloud Plugin](https://memos-docs.openmem.net/openclaw/guide/) | The agent environment and plugin configuration |
| An OpenClaw, Hermes Agent, or DeepSeek Harness setup with local memory storage | [MemOS Local Plugin](https://docs.openmem.net/openclaw/local_plugin/) | The local runtime, model connections, and backups |

With MemOS Cloud, we operate the memory service. Self-hosting gives you control over the code and infrastructure; our [reference Docker deployment](https://github.com/MemTensor/MemOS) runs the MemOS API alongside Neo4j and Qdrant.

The plugins connect memory to the agent’s normal execution. MemOS Cloud Plugin recalls relevant memories before a run and saves new messages afterward. MemOS Local Plugin maintains SQLite storage on the machine and combines vector and lexical retrieval. It also turns execution experience into reusable policies and Skills, with a Memory Viewer for inspecting the results. Its [local configuration](https://docs.openmem.net/openclaw/local_plugin/) includes model connections and optional team sharing, which you should review when deciding where data will be processed.

Once you’ve chosen a path, test the workflow you actually need. The examples below use MemOS Cloud’s interfaces.

## Decide what the next conversation needs to remember

In the replacement case, the customer’s notification preference belongs with their personal history. The company’s replacement policy belongs in shared business knowledge. A procedure for checking an order and opening a replacement ticket may be useful across many customers.

Our [customer service example](https://memos-docs.openmem.net/usecase/customer_service_assistant/) separates these into user memories, Agent Skills, and a policy knowledge base. That lets the agent retrieve customer context alongside general procedures while continuing to consult the order and ticket systems for current business state.

MemOS Cloud provides [different memory categories](https://memos-docs.openmem.net/memos_cloud/introduction/memory_types/) for these purposes. Facts and preferences capture customer context. Event Memory preserves details about what happened, while Skills and Tool Memory capture reusable task experience. Profiles organize information into predefined fields when your application needs a structured view of a user.

The setup varies by category. A Profile requires a template bound to the user. Tool Memory needs tool-call information in the input, and a knowledge base needs uploaded content. Use `allow_memory_view` to choose which categories may be generated from a write.

During development, inspect what the system extracts from a few representative conversations. “Please text me when it ships” is a preference. “If I move next month, I’ll need to change my address” is conditional. Your test should check whether that condition survives extraction.

For a closer look, our [memory extraction endpoint](https://memos-docs.openmem.net/self_developed_model/extraction_usage_example/) returns factual and preference candidates without writing them to the memory store. It supports synchronous extraction from text conversations, so your application can inspect the results or apply its own checks. After using the full write pipeline, inspect the stored records as well.

## Make the returning customer easy to recognize

When the customer comes back through another channel, use the same `user_id`. Your application should derive that identifier from its authenticated customer record.

MemOS Cloud’s [project and user scopes](https://memos-docs.openmem.net/memos_cloud/introduction/isolation_filters/) determine which personal memories a request searches. The API Key selects the project, and `user_id` identifies the customer within it. Keep the API Key on your server and connect each request to your application’s access rules.

If several agents serve the same customer, you can tag memories with `agent_id` and filter by the agent that produced them. An agent can also have its own independent memory, for example to accumulate reusable support Skills. Enable **Create Independent Memory for Agent** in the project settings for that behavior; it is disabled by default.

A new conversation can still use the customer’s earlier memories. The `conversation_id` supplies conversational context and can influence relevance, but it does not automatically restrict retrieval to that session.

To find the information needed for the next response, our [Search Memory API](https://memos-docs.openmem.net/memos_cloud/mem_operations/search_memory/) combines keyword and vector retrieval with ranking, filtering, and deduplication. You can select memory categories with `include_memory_view`, set the number of results with `memory_limit_number`, and narrow the search using `filter`.

In this case, inspect whether the search returns the replacement approval and relevant delivery details. Then check the context your application actually sends to the model. Our [application integration workflow](https://memos-docs.openmem.net/memos_cloud/getting_started/quick_start/) shows where recalled memories are added to the prompt.

## Handle the address change

Information that was accurate on Monday may need updating on Thursday. MemOS Cloud’s [time-aware memory handling](https://memos-docs.openmem.net/memos_cloud/introduction/time_awareness/) supports changing states and historical questions, so current information and earlier versions can serve different requests. When importing older conversations, provide `chat_time` to preserve when the information was recorded.

You also need a way to fix mistakes. If your support team knows which record is wrong, it can [update the memory by ID](https://memos-docs.openmem.net/memos_cloud/mem_operations/update_memory/), changing its content, title, or status. If the customer gives a correction in conversation, your backend can submit it through [natural-language feedback](https://memos-docs.openmem.net/memos_cloud/mem_operations/add_feedback/) with the relevant user and conversation context.

Follow the operation through to completion. Cloud writes use [asynchronous processing](https://memos-docs.openmem.net/memos_cloud/features/async_mode/) by default. Use the returned `task_id` to check `get/status`; a completed task includes a summary of memory changes. Then retrieve the affected information again and confirm that the next response uses the updated address.

For the shipment itself, your application should still verify the address and order status through the business system before taking action.

## Be specific about deletion

If the customer asks to remove their history, decide which records the request covers.

Our [`delete/memory` endpoint](https://memos-docs.openmem.net/memos_cloud/mem_operations/delete_memory/) accepts one of three targets per call: specific `memory_ids`, a `user_id`, or an `agent_id`. Each operation stays within the API Key’s project. Agent-wide deletion requires independent Agent memory to be enabled.

That endpoint does not accept a conversation ID or knowledge base ID as a deletion target. Knowledge Base files have a [separate deletion endpoint](https://memos-docs.openmem.net/api_docs/knowledge/delete_kb_doc/) that accepts `file_ids`.

After deleting, repeat the relevant searches. Include any copies your application keeps in caches, exports, or logs when defining the full deletion workflow.

## Try the whole case before rolling it out

Use the same replacement scenario throughout your pilot. A few variations will tell you more about the integration than a collection of unrelated prompts.

1. **Return in a new session.** Record the approval, then open another conversation for the same customer. Check whether the agent can continue the case without asking for information already provided.
2. **Change a detail.** Update the delivery address or switch the notification preference from email to text. Inspect the stored change and the next response.
3. **Include a conditional statement.** Try “If I move to Seattle, I’ll need to update my address.” Check that a possible move has not become a confirmed address change.
4. **Use another customer account.** Repeat the question as a different user. Inspect the request’s identity mapping and make sure the original customer’s personal information is absent.
5. **Remove the test records.** Delete the intended memories and search again. If the workflow uses Knowledge Base files, test their removal separately.

Track how long new information takes to become retrievable, along with p95 latency, token usage, and time spent investigating failures. Compare task outcomes with and without memory: whether the agent gives the correct next step, how often the customer has to repeat themselves, and whether corrections carry into later conversations.

Keep a short record of the configuration, results, and issues still to resolve. That record should make it clear why the chosen deployment fits your application.

Our [Cloud quick start](https://memos-docs.openmem.net/memos_cloud/getting_started/quick_start/) walks through the first write and retrieval. If you’re running the service yourself, begin with the [self-hosting instructions](https://github.com/MemTensor/MemOS). Bring one complete customer case through the integration before expanding to more workflows.
