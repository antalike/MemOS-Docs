---
title: MemOS API Development Guide (Component & Handler Architecture)
desc: MemOS v2.0 adopts a more modular and decoupled architecture. The legacy MOS class has been deprecated, and the recommended development pattern is now Components + Handlers.
---


This architecture separates “system construction” (Components) from “business logic execution” (Handlers), making the system easier to extend, test, and maintain.

## 1. Core Concepts

### 1.1 Components (Core Components)

Components are MemOS’s “brain” and “infrastructure”. They are initialized when the server starts (via `init_server()`), and reused throughout the whole lifecycle.

Core components include:

- **Base models and databases**:
    - `llm`: the base large language model used for internal processing (e.g., information extraction, summary generation).
    - `chat_llms`: a dictionary of chat-specific LLMs (multi-model supported) used for external conversations.
    - `embedder`: the text embedding model that converts text into vectors.
    - `reranker`: the reranking model for fine-grained ordering of retrieval results.
    - `graph_db`: graph database (e.g., Neo4j, PolarDB) for storing memory nodes and their relations.
    - `vector_db`: vector database (e.g., Milvus, Qdrant) for storing vector indexes of preference memories.
    - `redis_client`: Redis client for task queues and status tracking.

- **Memory system core**:
    - `naive_mem_cube`: the most central memory container, which unifies and manages the following two subsystems:
        - `text_mem`: the textual memory system (based on TreeTextMemory), handling explicit memories such as chats and documents.
        - `pref_mem`: the preference memory system (based on PreferenceMemory), handling implicit memories such as user preferences and habits.
    - `memory_manager`: the memory manager responsible for the memory lifecycle (e.g., forgetting, archiving, organizing).

- **Functional modules**:
    - `mem_scheduler`: the task scheduler, MemOS’s “heart”, responsible for asynchronously handling all time-consuming memory writes, index building, and background optimization tasks.
    - `mem_reader`: the multimodal parser responsible for reading and parsing various inputs (PDF, images, Markdown, etc.).
    - `searcher`: the search module that encapsulates complex retrieval logic (including multi-route recall, reranking, web search, etc.).
    - `internet_retriever`: the online retriever used to fetch real-time information.
    - `feedback_server`: the feedback service handling user corrections and evaluations of memories.
    - `deepsearch_agent`: the deep search agent used to execute complex multi-step search tasks.
    - `online_bot`: (optional) bot integrations (e.g., DingTalk bot) for real-time notifications.

### 1.2 Handlers (Business Processors)

Handlers are MemOS’s “hands”. They encapsulate specific business logic and complete tasks by calling Components.

Main Handlers include:

## Core Handler Overview

| Handler | Purpose | Core Methods |
| :--- | :--- | :--- |
| **AddHandler** | Add memories (chat/doc/text) | `handle_add_memories` |
| **SearchHandler** | Search memories (semantic retrieval) | `handle_search_memories` |
| **ChatHandler** | Chat (memory-augmented) | `handle_chat_complete`, `handle_chat_stream` |
| **FeedbackHandler** | Feedback (memory correction/human intervention) | `handle_feedback_memories` |
| **MemoryHandler** | Management (get details/delete) | `handle_get_memory`, `handle_delete_memories` |
| **SchedulerHandler** | Scheduling (query async task status) | `handle_scheduler_status`, `handle_scheduler_wait` |
| **SuggestionHandler** | Suggestions (generate recommended questions) | `handle_get_suggestion_queries` |

## 2. Quick Start (Python Script Example)

Below is a complete, runnable Python script demonstrating how to initialize MemOS server components and execute the full workflow of “add memory -> search memory -> chat”.

**Prerequisites**: Make sure `OPENAI_API_KEY` is configured in environment variables, or specify the model in the configuration file.

### Example Code

```python
import uuid
import logging
import time

# Import core initialization module and Handlers
from memos.api import handlers
from memos.api.handlers.base_handler import HandlerDependencies
from memos.api.handlers.add_handler import AddHandler
from memos.api.handlers.search_handler import SearchHandler
from memos.api.handlers.chat_handler import ChatHandler
from memos.api.product_models import (
    APIADDRequest,
    APISearchRequest,
    APIChatCompleteRequest
)

# Set logging level
logging.basicConfig(level=logging.INFO)
logging.raiseExceptions = False


def main():
    print("🚀 Initializing MemOS server components...")

    # 1. Initialize core components (Components)
    # This loads configuration, connects databases, initializes models, etc.
    components = handlers.init_server()

    # 2. Build the dependency injection container
    deps = HandlerDependencies.from_init_server(components)

    # 3. Instantiate business processors (Handlers)
    add_handler = AddHandler(deps)
    search_handler = SearchHandler(deps)

    # Ensure chat_llms is available
    chat_llms = components.get("chat_llms")
    if not chat_llms:
        print("⚠️ Warning: chat_llms is not initialized (maybe ENABLE_CHAT_API=false?). Falling back to the processing LLM.")
        if components.get("llm"):
             llm_instance = components["llm"]
             print(f"Fallback LLM instance: {llm_instance}")
             print(f"Fallback LLM config: {llm_instance.config if hasattr(llm_instance, 'config') else 'No config'}")
             chat_llms = {"default": llm_instance}
        else:
             print("❌ Error: no available LLM.")
             return

    # ChatHandler composes SearchHandler and AddHandler
    chat_handler = ChatHandler(
        deps,
        chat_llms,
        search_handler,
        add_handler,
        online_bot=components.get("online_bot")
    )

    print("✅ MemOS initialization completed!")

    # --- Simulate a business flow ---

    # Create a user ID (in this example, we directly use user_id as cube_id)
    user_id = str(uuid.uuid4())
    cube_id = user_id
    print(f"\n👤 Current user ID: {user_id}")

    # Step 1: Add memories
    print("\n[Step 1] Adding memories...")
    # Tell the system: the user likes pizza
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[cube_id],  # Specify target memory cube(s) to write into
        messages=[
            {"role": "user", "content": "My favorite food is pizza, especially pepperoni."},
            {"role": "assistant", "content": "Got it. I'll remember that you like pepperoni pizza."}
        ],
        async_mode="sync"  # Use sync mode to see results immediately (use async in production)
    )
    add_res = add_handler.handle_add_memories(add_req)
    print(f"👉 Add result: {add_res.message}")

    # Step 2: Search memories
    print("\n[Step 2] Searching memories...")
    search_req = APISearchRequest(
        user_id=user_id,
        query="What do I like to eat?",
        readable_cube_ids=[cube_id],
        top_k=3
    )
    search_res = search_handler.handle_search_memories(search_req)

    # Extract memories from the response dict
    memories = []
    if search_res.data and "text_mem" in search_res.data:
        for bucket in search_res.data["text_mem"]:
            memories.extend(bucket.get("memories", []))

    print(f"🔍 Relevant memories found ({len(memories)}):")
    for idx, mem in enumerate(memories):
        # mem is a dict here
        memory_content = mem.get("memory", "")
        print(f"  {idx + 1}. {memory_content}")

    # Step 3: Memory-augmented chat
    print("\n[Step 3] Chatting...")
    chat_query = "Recommend a dinner for tonight."
    print(f"🗣️ User: {chat_query}")

    chat_req = APIChatCompleteRequest(
        user_id=user_id,
        query=chat_query,
        model_name_or_path="gpt-4o-mini",
        readable_cube_ids=[cube_id],
        writable_cube_ids=[cube_id],
        history=[]  # You can pass historical conversation context here
    )
    chat_res = chat_handler.handle_chat_complete(chat_req)

    if isinstance(chat_res, dict):
        response = chat_res.get("data", {}).get("response", "")
    else:
        response = chat_res.data.response
    
    print(f"🤖 AI reply: {response}")

    # Prevent scheduler from terminating too early
    time.sleep(10)


if __name__ == "__main__":
    main()
```

## 3. API Details

### 3.1 Initialization
Initialization is the foundation of system startup. All Handlers rely on unified component registration and dependency injection.

- Component loading ( init_server ): the system initializes all core components, including the LLM, storage layers (vector DB, graph DB), the scheduler, and various memory cubes.
- Dependency injection ( HandlerDependencies ): to ensure decoupling and testability, all components are packaged into a HandlerDependencies object. Handlers receive this dependency container when instantiated, allowing them to fetch resources like naive_mem_cube, mem_reader, or feedback_server on demand, without hard-coded instantiation inside the Handler.

### 3.2 Add Memories (AddHandler)
AddHandler is the main entry point for converting external information into system memory. It supports chats, file uploads, and plain text inputs. It not only writes memories, but also takes responsibility for some feedback routing.

- Core capabilities:
  - Multimodal support: can process user message lists (Messages) and convert them into internal memory objects.
  - Sync and async modes: controlled via the async_mode parameter. In production, "async" is recommended; tasks are pushed into a background queue and executed by the Scheduler, and the API returns a task_id immediately. For debugging, "sync" can block until results are ready.
  - Automatic feedback routing: if is_feedback=True is set in the request, the Handler automatically extracts the last user message from the conversation as feedback content and routes it to feedback handling logic, rather than adding it as a normal new memory.
  - Multi-target writing: supports specifying multiple target cubes via writable_cube_ids. If multiple targets are given, the Handler builds a CompositeCubeView to distribute write tasks in parallel; if only a single target is used, it falls back to a lightweight SingleCubeView.

### 3.3 Search Memories (SearchHandler)
SearchHandler provides semantic memory retrieval services and is a key component for enabling RAG (retrieval-augmented generation).

- Core capabilities:
  - Semantic retrieval: uses embedding techniques to recall relevant memories based on semantic similarity, rather than simple keyword matching.
  - Flexible search scope: via readable_cube_ids, callers can precisely control the search context (e.g., search only a specific user’s memories, or search public memories across users).
  - Multi-strategy modes: the underlying layer supports multiple retrieval strategies (e.g., fast, fine, or mixture), balancing response latency and recall accuracy.
  - Deep search integration: can integrate deepsearch_agent to handle more complex retrieval requests that require multi-step reasoning.

### 3.4 Chat (ChatHandler)
ChatHandler is the orchestrator for higher-level business logic. It does not store data directly; it completes end-to-end chat tasks by composing other Handlers.

- Core capabilities:
  - Flow orchestration: automatically chains the full process of "retrieve -> generate -> store". It first calls SearchHandler to obtain context, then calls the LLM to generate a reply, and finally calls AddHandler to save the newly produced conversation records as memories.
  - Context management: handles combining history (past conversations) with query (current question), ensuring the AI understands the full dialogue context.
  - Streaming and non-streaming: supports standard responses (APIChatCompleteRequest) and streaming responses (Stream) to meet different frontend interaction needs.
  - Notification integration: optional integration with online_bot (e.g., DingTalk bot) to push notifications after generating a reply.

### 3.5 Feedback and Correction (FeedbackHandler)
FeedbackHandler is the system’s “self-correction” mechanism. It allows users to intervene in the AI’s behavior to improve future memory retrieval and generation.

- Core capabilities:
  - Memory correction: when users point out errors (e.g., "The meeting is not in Beijing, it's in Shanghai"), the Handler updates or marks old memory nodes based on the feedback content.
  - Positive/negative feedback: supports processing Upvote or Downvote signals to adjust the weight or credibility of certain memories.
  - Precise targeting: in addition to conversation-history-based feedback, it supports using retrieved_memory_ids to correct specific retrieved results precisely, improving feedback effectiveness.

### 3.6 Memory Management (MemoryHandler)
MemoryHandler provides low-level CRUD (create, read, update, delete) capabilities for memory data, mainly used for admin backends or data cleanup tools.

- Core capabilities:
  - Fine-grained management: unlike AddHandler’s business-level writes, this Handler allows directly retrieving a single memory’s details by memory_id or performing physical deletion.
  - Direct access to dependencies: some operations need direct interaction with the underlying naive_mem_cube component, bypassing complex business wrappers for maximum efficiency.

### 3.7 Task Scheduling Status (SchedulerHandler)
SchedulerHandler monitors the lifecycle of all asynchronous tasks in the system and is an important part of system observability.

- Core capabilities:
  - Status tracking: with a Redis backend, tracks real-time task status (Queued, Running, Completed, Failed).
  - Result retrieval: for asynchronously executed tasks, clients can poll task progress through this API and fetch final results or error information after completion.
  - Debug support: provides utility functions such as handle_scheduler_wait to force async flows into synchronous waiting in test scripts, which helps integration testing.

### 3.8 Next Query Suggestions (SuggestionHandler)
SuggestionHandler aims to improve the interaction experience by predicting users’ potential intents and generating “recommended questions” (Next Query Suggestion).

- Core capabilities:
  - Dual generation modes:
    - Conversation-based: if message (recent chat logs) is provided, the system analyzes dialogue context and generates 3 follow-up questions closely related to the current topic.
    - Memory-based: if there is no dialogue context, the system calls naive_mem_cube to quickly retrieve the user’s “recent memories”, and generates questions related to the user’s recent life/work status.
  - Multilingual support: built-in Chinese and English prompt templates, switching the output language style automatically based on the language parameter.

