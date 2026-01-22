---
title: Memory Scheduling
desc: Memory scheduling acts as the neural center of the memory system. It dynamically allocates and reclaims cognitive resources in the background by organizing and coordinating operations such as adding, updating, transforming, and retrieving memories, thereby continuously optimizing the entire memory system.
---

## 0. Entry Point and Initialization Process

**Entry Files**

- `MemOS/src/memos/api/server_api.py`: FastAPI application entry point, responsible only for mounting routes and exception handling.
- `MemOS/src/memos/api/routers/server_router.py`: API Router, executes `handlers.init_server()` to complete component loading and obtain `mem_scheduler`.

**Initialization Logic** (`MemOS/src/memos/api/handlers/component_init.py`)

1. Initialize Redis client (used for status tracking and queue support).
2. Build core components like LLM, Embedder, GraphDB, Reranker, MemReader, etc.
3. Create `OptimizedScheduler` (of `BaseScheduler` type) (via `SchedulerFactory` + `SchedulerConfigFactory`).
4. Call `mem_scheduler.initialize_modules(...)` and `mem_scheduler.init_mem_cube(...)` to bind resources.
5. If `API_SCHEDULER_ON=true` (default), call `mem_scheduler.start()` to start the scheduler.

**Scheduler Startup** (`BaseScheduler.start()`)

- `start_consumer()`: Start message consumer threads/processes.
- `start_background_monitor()`: Start queue monitor thread (samples queue length and other metrics).

> Thread/Process mode is controlled by `scheduler_startup_mode`, defaulting to `thread`.

## 1. Feature Overview

MemScheduler adopts a **Producer-Consumer + Thread Pool Parallelism** model.

**Overall Workflow**

```text
API Request
  -> BaseScheduler.submit_messages
     -> Priority Branching (LEVEL_1 Immediate / Others to Queue)
        -> Consumer Thread _message_consumer
           -> Dispatcher.dispatch (Thread Pool Concurrency)
              -> Handler Executes Business Logic
              -> Status Tracker Updates Status + Redis ACK
```


### 1.1 Queue Model

#### Local Queue (SchedulerLocalQueue)

- Enabled when `use_redis_queue=False`.
- Suitable for single-node deployment or development environments.

#### Redis Queue (SchedulerRedisQueue)

The Redis version is the **recommended default path for production environments**, supporting multi-instance deployment and breakpoint recovery.

**Stream Key Format**

```
{prefix}:{user_id}:{mem_cube_id}:{task_label}
```

- Default prefix: `scheduler:messages:stream:v2.0`
- Consumer Group: `scheduler_group`
  - Redis queue prefix can be overridden by `MEMSCHEDULER_REDIS_STREAM_KEY_PREFIX`.
  - Default constant `DEFAULT_STREAM_KEY_PREFIX` can be overridden by `MEMSCHEDULER_STREAM_KEY_PREFIX` (if a unified style is needed, configuring the former is recommended).


### 1.2 Status Tracking (TaskStatusTracker)

The scheduling system tracks task status via Redis Hash:

- **Task Main Table**: `memos:task_meta:{user_id}`
  - field: `item_id`
  - value: JSON payload (status, task_type, mem_cube_id, timestamps...)
  - TTL: 7 days
- **Business Task Association Table**: `memos:task_items:{user_id}:{task_id}`
  - value: set[item_id]
  - TTL: 7 days

**Status Transition**

```
waiting -> in_progress -> completed / failed
```

**TTL**

- All tracking keys expire in 7 days by default.

**Aggregate Query**

- When multiple `item_id`s share the same `task_id`, `get_task_status_by_business_id` aggregates them:
  - Any failed -> failed
  - Any in_progress/waiting -> in_progress
  - All completed -> completed

### 1.3 Message Protocol

#### ScheduleMessageItem

The core message structure received by the scheduler:

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `item_id` | `str` | Yes | Single message UUID. |
| `redis_message_id` | `str` | No | Redis Stream message ID (written after consumption). |
| `stream_key` | `str` | No | Redis stream key. |
| `user_id` | `str` | Yes | User ID. |
| `trace_id` | `str` | No | Trace ID, for distributed tracing. |
| `mem_cube_id` | `str` | Yes | MemCube ID. |
| `session_id` | `str` | No | Session ID (used for soft filtering). |
| `label` | `str` | Yes | Scheduling instruction. |
| `content` | `str` | Yes | JSON string or text payload. |
| `timestamp` | `datetime` | No | Submission time (auto-generated). |
| `user_name` | `str` | No | User display name. |
| `info` | `dict` | No | Extended information (e.g., source_doc_id). |
| `task_id` | `str` | No | Business task ID (used for aggregated status). |

#### Instruction Set (Task Labels)

| Label | Priority | Handler | Description |
| :--- | :--- | :--- | :--- |
| `query` | Level 1 | `_query_message_consumer` | Retrieval and memory activation. |
| `answer` | Level 1 | `_answer_message_consumer` | Record answer. |
| `add` | Level 1 | `_add_message_consumer` | Write new memory. |
| `mem_update` | Level 3 | `_memory_update_consumer` | Long-term memory index update. |
| `mem_read` | Level 3 | `_mem_read_message_consumer` | Memory enhancement after file parsing. |
| `mem_organize` | Level 3 | `_mem_reorganize_message_consumer` | Memory consolidation and organization. |
| `mem_archive` | Level 3 | Not Registered | Memory archiving reserved Label (handler not registered in current version). |
| `pref_add` | Level 3 | `_pref_add_message_consumer` | User preference recording. |
| `mem_feedback` | Level 3 | `_mem_feedback_message_consumer` | Like/Dislike feedback learning. |
| `api_mix_search` | Level 3 | `_api_mix_search_message_consumer` | API-side hybrid search (asynchronous enhancement). |

> Task priority is determined by `SchedulerOrchestrator.tasks_priorities`. Labels not configured default to Level 3.

### 1.4 Management and Monitoring API

**Scheduler Status**

- `GET /product/scheduler/status`
  - Params: `user_id`, `task_id`(optional)
  - `task_id` can be a business task ID (aggregated status) or a single `item_id`.
  - Returns: Status list for the specified task or all user tasks.

- `GET /product/scheduler/allstatus`
  - Returns: Global aggregated statistics (waiting / in_progress / failed / completed...).

**Queue Backlog**

- `GET /product/scheduler/task_queue_status`
  - Params: `user_id`
  - Only available when Redis queue is enabled (`use_redis_queue=True`).
  - Returns: Pending and remaining statistics at Redis Stream dimension.

**Request / Response Examples**

`GET /product/scheduler/status?user_id=u_123`

```json
{
  "data": [
    { "task_id": "9b4b8f3b-7c4e-4f9f-9cf0-0a4f5d2e3b10", "status": "completed" },
    { "task_id": "c0d3b7a1-5a9e-4e4a-90e0-6b8a6df6a2aa", "status": "in_progress" }
  ]
}
```

`GET /product/scheduler/status?user_id=u_123&task_id=task_20240722_001`

```json
{
  "data": [
    { "task_id": "task_20240722_001", "status": "completed" }
  ]
}
```

`GET /product/scheduler/task_queue_status?user_id=u_123`

```json
{
  "data": {
    "user_id": "u_123",
    "user_name": null,
    "mem_cube_id": null,
    "stream_keys": [
      "scheduler:messages:stream:v2.0:u_123:mem_001:query",
      "scheduler:messages:stream:v2.0:u_123:mem_001:add"
    ],
    "users_count": 1,
    "pending_tasks_count": 2,
    "remaining_tasks_count": 5,
    "pending_tasks_detail": [
      "scheduler:messages:stream:v2.0:u_123:mem_001:query:1",
      "scheduler:messages:stream:v2.0:u_123:mem_001:add:1"
    ],
    "remaining_tasks_detail": [
      "scheduler:messages:stream:v2.0:u_123:mem_001:query:3",
      "scheduler:messages:stream:v2.0:u_123:mem_001:add:2"
    ]
  }
}
```

`GET /product/scheduler/allstatus`

```json
{
  "data": {
    "scheduler_summary": {
      "waiting": 2,
      "in_progress": 1,
      "pending": 2,
      "completed": 15,
      "failed": 0,
      "cancelled": 0,
      "total": 18
    },
    "all_tasks_summary": {
      "waiting": 3,
      "in_progress": 1,
      "pending": 3,
      "completed": 24,
      "failed": 1,
      "cancelled": 0,
      "total": 29
    }
  }
}
```

### 1.5. Observability and Monitoring Events

The scheduler sends monitoring events at critical stages:

- `enqueue` / `dequeue` / `start` / `finish`
- Records `queue_wait_ms`, `exec_duration_ms`, `total_duration_ms`
- Supports `trace_id` to trace through API and scheduling links.

These events are the core basis for scheduling performance analysis and troubleshooting.

        

## 2. Advanced: Deep Customization

Developers can customize system behavior by **extending scheduling policies**, mainly including:

| **Extension Point** | **Configurable Content** | **Example Scenario** |
| --- | --- | --- |
| Scheduling Policy | Define memory selection logic for different tasks | Dialogue systems prioritize active memory; Research systems prioritize retrieving latest plaintext |
| Transition Rules | Set conditions for cross-type migration | High-frequency FAQ → KV cache; Stable paradigm → Parameter module |
| Context Binding | Link memory with roles/users | Student users auto-load learning preferences; Enterprise users load project archives |
| Permissions & Governance | Combine access control and compliance checks during scheduling | Medical records visible only to doctors; Sensitive content not shareable across domains |
| Scheduling Metrics | Optimize scheduling based on access frequency and latency requirements | High-frequency hot memory boosts priority; Low-frequency cold memory downgraded to archive |

### Deep Customization Guide: Registering and Triggering Custom Memory Management Tasks

Memos' scheduler supports developers in registering asynchronous background tasks (such as regular memory organization, bulk data export, or time-consuming analysis). You can trigger these tasks by registering a **Handler** and submitting messages with a specific **Label** to the scheduler.

Here is the complete process for implementing custom asynchronous tasks, which can be referred to in `examples/mem_scheduler/scheduler_for_async_tasks.py`:

#### 1. Define Handler Function

First, define a handler function that receives a batch of `ScheduleMessageItem` messages. This is where the business logic is actually executed.

```python
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem
import time

def my_async_task_handler(messages: list[ScheduleMessageItem]):
    """
    Process a batch of scheduling messages.
    """
    print(f"Received {len(messages)} tasks, starting processing...")
    
    for msg in messages:
        # Get task details
        task_id = msg.item_id
        content = msg.content
        user_id = msg.user_id
        
        # Execute your memory management logic here (e.g., file I/O, API calls, data analysis)
        print(f"Processing task {task_id} for user {user_id}: {content}")
        time.sleep(1) # Simulate time-consuming operation
        
    print("All tasks processed.")
```

#### 2. Register Handler

Define a unique Label for your task and register the Handler into the global scheduler instance `mem_scheduler`.

```python
from memos.api.routers.server_router import mem_scheduler

# Define unique task identifier
MY_TASK_LABEL = "my_custom_async_task"

# Register Handler
mem_scheduler.register_handlers({
    MY_TASK_LABEL: my_async_task_handler
})

# (Optional) Set minimum idle time (ms) for this task type
# This prevents the task from executing too frequently, suitable for low-priority background tasks
mem_scheduler.orchestrator.tasks_min_idle_ms[MY_TASK_LABEL] = 5000 
```

#### 3. Submit Task to Trigger Scheduling

Construct a `ScheduleMessageItem` and submit it to the scheduling queue. The scheduler will automatically distribute the message to your Handler based on the Label.

```python
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem

# Create task message
task_item = ScheduleMessageItem(
    user_id="user_123",
    mem_cube_id="default_cube",
    label=MY_TASK_LABEL,          # Must match the Label used during registration
    content="Data content to process",    # Payload passed to the Handler
    item_id="unique_task_id_001"   # (Optional) Task ID, will auto-generate UUID if left blank
)

# Submit to scheduling queue
print("Submitting task...")
mem_scheduler.memos_message_queue.submit_messages([task_item])

# At this point, the scheduler will asynchronously call my_async_task_handler in the background
```

By doing this, you can easily decouple complex memory management logic and hand it over to the Memos scheduling system for reliable background execution.


## 3. Contact Us
<img src="{{cdnUrl}}/img/1758685658684_nbhka4_compressed.png" alt="image" style="width:70%;">
