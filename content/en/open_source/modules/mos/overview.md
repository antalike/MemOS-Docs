---
title: MemOS API Development Guide (Components & Handlers Architecture)
desc: MemOS v2.0 adopts a more modular and decoupled architecture. The legacy MOS class is deprecated; Components + Handlers is now recommended for development.
---

This architecture separates "system construction" (Components) from "business logic execution" (Handlers), making the system easier to extend, test, and maintain.

## 1. Core Concepts

### 1.1 Components

Components are the "brain" and "infrastructure" of MemOS. They are initialized when the server starts (via `init_server()`) and reused throughout the system lifecycle.

Core components include:

#### Core Memory Components

1. **MemCube**: A memory container used to isolate memories across different users / different cubes, and to manage multiple memory modules in a unified way.  
2. **MemReader**: A memory processor that parses user inputs (chat, documents, images) into memory items that the system can write.  
3. **MemScheduler**: A scheduler that turns time-consuming tasks such as memory writes, index building, and memory organization into asynchronous and concurrent jobs.  
4. **MemChat**: A conversation controller responsible for the dialogue loop of "retrieve memory -> generate response -> write new memory".  
5. **MemFeedback**: Correction and feedback that converts users' natural-language feedback into safe updates to the memory store.  

### 1.2 Handlers

Handlers are the "hands" of MemOS. They encapsulate concrete business logic and complete tasks by calling Components.

Main Handlers include:

## Core Handlers Overview

| Handler | Purpose | Key Methods |
| :--- | :--- | :--- |
| **AddHandler** | Add memories (chat / documents / text) | `handle_add_memories` |
| **SearchHandler** | Search memories (semantic retrieval) | `handle_search_memories` |
| **ChatHandler** | Chat (with memory augmentation) | `handle_chat_complete`, `handle_chat_stream` |
| **FeedbackHandler** | Feedback (correct memories / human-in-the-loop) | `handle_feedback_memories` |
| **MemoryHandler** | Manage (get details / delete) | `handle_get_memory`, `handle_delete_memories` |
| **SchedulerHandler** | Scheduling (query async task status) | `handle_scheduler_status`, `handle_scheduler_wait` |
| **SuggestionHandler** | Suggestions (generate recommended questions) | `handle_get_suggestion_queries` |

## 2. API Details

### 2.1 Initialization
Initialization is the foundation of system startup. All Handlers rely on a unified component registry and dependency-injection mechanism.

- Component loading (`init_server`): The system first initializes all core components, including the LLM, storage layers (vector DB, graph DB), the scheduler, and various Memory Cubes.
- Dependency injection (`HandlerDependencies`): To keep the code decoupled and testable, all components are wrapped into a `HandlerDependencies` object. Handlers receive this dependency container during instantiation, so they can access resources such as `naive_mem_cube`, `mem_reader`, or `feedback_server` on demand, without hard-coding initialization logic inside the Handler.

### 2.2 Add Memories (AddHandler)
AddHandler is the primary entry point that converts external information into system memories. It supports chats, file uploads, and plain text. Besides writing, it also takes on part of the feedback routing responsibility.

- Core capabilities:
  - Multimodal support: Processes user message lists (Messages) and converts them into internal memory objects.
  - Sync and async modes: Controlled via `async_mode`. In production, "async" is recommended: tasks are pushed to a background queue and executed by the Scheduler, and the API returns immediately with a task_id. For debugging, use "sync" to block until completion.
  - Automatic feedback routing: If the request sets `is_feedback=True`, the Handler automatically takes the last user message as feedback content and routes it to the feedback logic, instead of adding it as a normal new memory.
  - Multi-target writes: You can specify multiple target cubes via `writable_cube_ids`. If multiple targets are provided, the Handler builds a CompositeCubeView and fans out write tasks in parallel. If only one target is provided, it uses a lightweight SingleCubeView.

### 2.3 Search Memories (SearchHandler)
SearchHandler provides semantic memory retrieval and is a key component for RAG (Retrieval-Augmented Generation).

- Core capabilities:
  - Semantic retrieval: Uses embedding-based similarity to recall relevant memories by meaning rather than simple keyword matching.
  - Flexible search scope: With `readable_cube_ids`, callers can precisely control the search context (for example, search only within a specific user's memory, or search across public memories).
  - Multi-strategy support: The underlying implementation supports multiple search strategies (such as fast, fine, or mixture) to balance latency and recall quality.
  - Deep search integration: Can integrate `deepsearch_agent` to handle more complex retrieval requests that require multi-step reasoning.

### 2.4 Chat (ChatHandler)
ChatHandler is the orchestrator of upper-layer business logic. It does not store data directly; instead, it composes other Handlers to complete end-to-end chat tasks.

- Core capabilities:
  - Orchestration: Automatically chains the full process of "retrieve -> generate -> store". It calls SearchHandler for context, calls the LLM to generate a response, then calls AddHandler to save the newly produced dialogue as memory.
  - Context management: Assembles `history` (past conversation) and `query` (current question) to ensure the AI understands the complete context.
  - Streaming and non-streaming: Supports standard responses (APIChatCompleteRequest) and streaming responses (Stream) to match different frontend interaction needs.
  - Notification integration: Optionally integrates `online_bot` (for example, a DingTalk bot) to push notifications after responses are generated.

### 2.5 Feedback and Correction (FeedbackHandler)
FeedbackHandler is the system's "self-correction" mechanism. It allows users to intervene in the AI's behavior to improve future retrieval and generation.

- Core capabilities:
  - Memory correction: When users point out mistakes (for example, "the meeting location is Shanghai, not Beijing"), the Handler updates or marks the old memory nodes based on the feedback content.
  - Positive and negative feedback: Supports upvote and downvote signals to adjust the weight or credibility of specific memories.
  - Precise targeting: In addition to conversation-history-based feedback, it supports `retrieved_memory_ids` so you can correct specific retrieved items, improving feedback effectiveness.

### 2.6 Memory Management (MemoryHandler)
MemoryHandler provides low-level CRUD capabilities for memory data. It is mainly used for admin backends or cleanup tools.

- Core capabilities:
  - Fine-grained management: Unlike AddHandler's business-level writes, this Handler can fetch a single memory by `memory_id` or perform physical deletion.
  - Direct dependency access: Some operations need to interact with the underlying `naive_mem_cube` component directly, bypassing business wrappers to provide the most efficient data operations.

### 2.7 Scheduler Status (SchedulerHandler)
SchedulerHandler monitors the lifecycle of all async tasks in the system and is an important part of system observability.

- Core capabilities:
  - Status tracking: With a Redis backend, it tracks real-time task states (Queued, Running, Completed, Failed).
  - Result fetching: For async tasks, clients can poll progress via this API and retrieve the final result or error when the task completes.
  - Debugging support: Provides utilities such as `handle_scheduler_wait` to force async flows into synchronous waits in test scripts, which is useful for integration tests.

### 2.8 Suggested Next Questions (SuggestionHandler)
SuggestionHandler improves interaction by predicting users' potential intent and generating "recommended questions" (Next Query Suggestion).

- Core capabilities:
  - Dual-mode generation:
    - Conversation-based: If `message` (recent conversation records) is provided, the system analyzes the context and generates 3 follow-up questions closely related to the current topic.
    - Memory-based: If there is no conversation context, the system uses `naive_mem_cube` to quickly retrieve the user's "recent memories" and generates questions related to the user's recent life/work status.
  - Multi-language support: Built-in Chinese and English prompt templates switch the language style automatically based on the `language` parameter.

