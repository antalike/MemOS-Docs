---
title: "MemScheduler: The Scheduler for Memory Organization"
desc: "`MemScheduler` is a concurrent memory management system parallel running with the MemOS system, which coordinates memory operations between working memory, long-term memory, and activation memory in AI systems. It handles memory retrieval, updates, and compaction through event-driven scheduling. <br/> This system is particularly suited for conversational agents and reasoning systems requiring dynamic memory management."
---

## Key Features

- 🚀 **Concurrent operation** with MemOS system
- 🧠 **Multi-memory coordination** (Working/Long-Term/User memory)
- ⚡ **Event-driven scheduling** for memory operations
- 🔍 **Efficient retrieval** of relevant memory items
- 📊 **Comprehensive monitoring** of memory usage
- 📝 **Detailed logging** for debugging and analysis

- 

## Memory Scheduler Architecture

The `MemScheduler` system is structured around several key components:
1. **Message Handling**: Processes incoming messages through a dispatcher with labeled handlers
2. **Memory Management**: Manages different memory types (Working, Long-Term, User)
3. **Retrieval System**: Efficiently retrieves relevant memory items based on context
4. **Monitoring**: Tracks memory usage, frequencies, and triggers updates
5. **Dispatcher (Router)**: Trigger different memory reorganization strategies by checking messages from MemOS systems.
6. **Logging**: Maintains logs of memory operations for debugging and analysis

## Message Processing

The scheduler processes messages through a dispatcher with dedicated handlers:

### Message Types

| Message Type | Handler Method                  | Description                                |
|--------------|---------------------------------|--------------------------------------------|
| `QUERY_LABEL` | `_query_message_consume`       | Handles user queries and triggers retrieval |
| `ANSWER_LABEL`| `_answer_message_consume`      | Processes answers and updates memory usage |

### Schedule Message Structure 

The scheduler processes messages from its queue using the following format:

ScheduleMessageItem:

| Field         | Type                 | Description                                   |
|---------------|----------------------|-----------------------------------------------|
| `item_id`     | `str`                | UUID (auto-generated) for unique identification |
| `user_id`     | `str`                | Identifier for the associated user            |
| `mem_cube_id` | `str`                | Identifier for the memory cube                |
| `label`       | `str`                | Message label (e.g., `QUERY_LABEL`, `ANSWER_LABEL`) |
| `mem_cube`    | `GeneralMemCube｜str` | Memory cube object or reference               |
| `content`     | `str`                | Message content                               |
| `timestamp`   | `datetime`           | Time when the message was submitted           |

Meanwhile the scheduler will send the scheduling messages by following structures.

ScheduleLogForWebItem:

| Field                  | Type               | Description                                                                 | Default Value                          |
|------------------------|--------------------|-----------------------------------------------------------------------------|----------------------------------------|
| `item_id`              | `str`              | Unique log entry identifier (UUIDv4)                                        | Auto-generated (`uuid4()`)             |
| `user_id`              | `str`              | Associated user identifier                                                  | (Required)                             |
| `mem_cube_id`          | `str`              | Linked memory cube ID                                                       | (Required)                             |
| `label`                | `str`              | Log category identifier                                                     | (Required)                             |
| `from_memory_type`     | `str`              | Source memory partition<br>Possible values:<br>- `"LongTermMemory"`<br>- `"UserMemory"`<br>- `"WorkingMemory"` | (Required)                             |
| `to_memory_type`       | `str`              | Destination memory partition                                                | (Required)                             |
| `log_content`          | `str`              | Detailed log message                                                        | (Required)                             |
| `current_memory_sizes` | `MemorySizes`      | Current memory utilization                                                  | <pre>DEFAULT_MEMORY_SIZES = {<br>  "long_term_memory_size": -1,<br>  "user_memory_size": -1,<br>  "working_memory_size": -1,<br>  "transformed_act_memory_size": -1<br>}</pre> |
| `memory_capacities`    | `MemoryCapacities` | Memory partition limits                                                     | <pre>DEFAULT_MEMORY_CAPACITIES = {<br>  "long_term_memory_capacity": 10000,<br>  "user_memory_capacity": 10000,<br>  "working_memory_capacity": 20,<br>  "transformed_act_memory_capacity": -1<br>}</pre> |
| `timestamp`            | `datetime`         | Log creation time                                                           | Auto-set (`datetime.now`)              |

##  Execution Example

`examples/mem_scheduler/schedule_w_memos.py` is a demonstration script showcasing how to utilize the `MemScheduler` module. It illustrates memory management and retrieval within conversational contexts.

### Code Functionality Overview

This script demonstrates two methods for initializing and using the memory scheduler:

1. **Automatic Initialization**: Configures the scheduler via configuration files

2. **Manual Initialization**: Explicitly creates and configures scheduler components

The script simulates a pet-related conversation between a user and an assistant, demonstrating how memory scheduler manages conversation history and retrieves relevant information.

The most powerful feature of the scheduler is its support for registering custom message handlers. You can define specific types of messages (such as `MY_CUSTOM_TASK`) and write functions to handle them.

```python
import uuid
from datetime import datetime

# 1. Import necessary type definitions and the scheduler instance
# Note: mem_scheduler needs to be imported from server_router as it is a global singleton
from memos.api.routers.server_router import mem_scheduler
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem

# Define a custom task label
MY_TASK_LABEL = "MY_CUSTOM_TASK"


# Define the handler function
def my_task_handler(messages: list[ScheduleMessageItem]):
    """
    Function to handle custom tasks
    """
    for msg in messages:
        print(f"⚡️ [Handler] Received task: {msg.item_id}")
        print(f"📦 Content: {msg.content}")
        # Execute your business logic here, e.g., calling LLM, writing to database, triggering other tasks, etc.


# 2. Register the handler with the scheduler
# This step mounts your custom logic into the scheduling system
mem_scheduler.register_handlers({
    MY_TASK_LABEL: my_task_handler
})

# 3. Submit a task
task = ScheduleMessageItem(
    item_id=str(uuid.uuid4()),
    user_id="user_123",
    mem_cube_id="cube_001",
    label=MY_TASK_LABEL,
    content="This is a test message",
    timestamp=datetime.now()
)

# If the scheduler is not started, the task will be placed directly into the queue for processing (if using Redis queue)
# Or, in local queue mode, you might need to call mem_scheduler.start() first
mem_scheduler.submit_messages([task])

print(f"Task submitted: {task.item_id}")

# Prevent the scheduler's main process from exiting prematurely
time.sleep(10)
```

### 2. Redis Queue vs Local Queue

- **Local Queue**:
  - **Use Case**: Unit testing, simple single-machine scripts.
  - **Characteristics**: Fast, but data is lost after process restart; does not support multi-process/multi-instance sharing.
  - **Configuration**: `MOS_SCHEDULER_USE_REDIS_QUEUE=false`

- **Redis Queue (Redis Stream)**:
  - **Use Case**: Production environment, distributed deployment.
  - **Characteristics**: Data persistence, supports consumer groups, allows multiple scheduler instances to process tasks together (load balancing).
  - **Configuration**: `MOS_SCHEDULER_USE_REDIS_QUEUE=true`
  - **Debugging**: You can use the `show_redis_status.py` script to check queue backlog.

## Comprehensive Application Scenarios

### Scenario 1: Basic Conversation Flow and Memory Update

The following is a comprehensive example demonstrating how to initialize the environment, register custom logic, simulate a conversation flow, and trigger memory updates.

```python
import asyncio
import json
import os
import sys
import time
from pathlib import Path

# --- Environment Preparation ---
# 1. Add the project root directory to sys.path to ensure the memos module can be imported
FILE_PATH = Path(__file__).absolute()
BASE_DIR = FILE_PATH.parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

# 2. Set necessary environment variables (simulating .env configuration)
os.environ["ENABLE_CHAT_API"] = "true"
os.environ["MOS_ENABLE_SCHEDULER"] = "true"
# Decide whether to use Redis or Local queue
os.environ["MOS_SCHEDULER_USE_REDIS_QUEUE"] = "false" 

# --- Import Components ---
# Note: Importing server_router triggers component initialization, ensure environment variables are set before this
from memos.api.product_models import APIADDRequest, ChatPlaygroundRequest
from memos.api.routers.server_router import (
    add_handler,
    chat_stream_playground,
    mem_scheduler,  # mem_scheduler here is already an initialized singleton
)
from memos.log import get_logger
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem
from memos.mem_scheduler.schemas.task_schemas import (
    MEM_UPDATE_TASK_LABEL,
    QUERY_TASK_LABEL,
)

logger = get_logger(__name__)

# Global variable to demonstrate memory retrieval results
working_memories = []

# --- Custom Handlers ---

def custom_query_handler(messages: list[ScheduleMessageItem]):
    """
    Handle user query messages:
    1. Print the query content
    2. Convert the message to a MEM_UPDATE task, triggering the memory retrieval/update flow
    """
    for msg in messages:
        print(f"\n[Scheduler 🟢] Received user query: {msg.content}")
        
        # Copy the message and change the label to MEM_UPDATE, a common "task chain" pattern
        new_msg = msg.model_copy(update={"label": MEM_UPDATE_TASK_LABEL})
        
        # Submit the new task back to the scheduler
        mem_scheduler.submit_messages([new_msg])


def custom_mem_update_handler(messages: list[ScheduleMessageItem]):
    """
    Handle memory update tasks:
    1. Use the Retriever to find relevant memories
    2. Update the global working memory list
    """
    global working_memories
    search_args = {}
    top_k = 2
    
    for msg in messages:
        print(f"[Scheduler 🔵] Retrieving memories for query...")
        # Call the core retrieval function
        results = mem_scheduler.retriever.search(
            query=msg.content,
            user_id=msg.user_id,
            mem_cube_id=msg.mem_cube_id,
            mem_cube=mem_scheduler.current_mem_cube,
            top_k=top_k,
            method=mem_scheduler.search_method,
            search_args=search_args,
        )
        
        # Simulate updating working memories
        working_memories.extend(results)
        working_memories = working_memories[-5:] # Keep the latest 5
        
        for mem in results:
            # Print the retrieved memory fragment
            print(f"  ↳ [Memory Found]: {mem.memory[:50]}...")

# --- Simulate Business Data ---

def get_mock_data():
    """Generate simulated conversation data"""
    conversations = [
        {"role": "user", "content": "I just adopted a golden retriever puppy named Max."},
        {"role": "assistant", "content": "That's exciting! Max is a great name."},
        {"role": "user", "content": "He loves peanut butter treats but I am allergic to nuts."},
        {"role": "assistant", "content": "Noted. Peanut butter for Max, no nuts for you."},
    ]
    
    questions = [
        {"question": "What is my dog's name?", "category": "Pet"},
        {"question": "What am I allergic to?", "category": "Allergy"},
    ]
    return conversations, questions

# --- Main Flow ---

async def run_demo():
    print("==== MemScheduler Demo Start ====")
    conversations, questions = get_mock_data()

    user_id = "demo_user_001"
    mem_cube_id = "cube_demo_001"

    print(f"1. Initializing user memory cube ({user_id})...")
    # Use the API Handler to add initial memories (synchronous mode)
    add_req = APIADDRequest(
        user_id=user_id,
        writable_cube_ids=[mem_cube_id],
        messages=conversations,
        async_mode="sync", 
    )
    add_handler.handle_add_memories(add_req)
    print("   Memory addition complete.")

    print("\n2. Starting conversation test (and triggering scheduled tasks in the background)...")
    for item in questions:
        query = item["question"]
        print(f"\n>> User: {query}")

        # Initiate a chat request
        chat_req = ChatPlaygroundRequest(
            user_id=user_id,
            query=query,
            readable_cube_ids=[mem_cube_id],
            writable_cube_ids=[mem_cube_id],
        )
        
        # Get the streaming response
        response = chat_stream_playground(chat_req)
        
        # Process the streaming output (simplified version)
        full_answer = ""
        buffer = ""
        async for chunk in response.body_iterator:
            if isinstance(chunk, bytes):
                chunk = chunk.decode("utf-8")
            buffer += chunk
            while "\n\n" in buffer:
                msg, buffer = buffer.split("\n\n", 1)
                for line in msg.split("\n"):
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "text":
                                full_answer += data["data"]
                        except: pass
                        
        print(f">> AI: {full_answer}")
        
        # Wait a moment for the background scheduler to process tasks and print logs
        await asyncio.sleep(1)

if __name__ == "__main__":
    # 1. Register our custom Handlers
    # This will override or add to the default scheduling logic
    mem_scheduler.register_handlers(
        {
            QUERY_TASK_LABEL: custom_query_handler,
            MEM_UPDATE_TASK_LABEL: custom_mem_update_handler,
        }
    )
    
    # 2. Ensure the scheduler is started
    if not mem_scheduler._running:
        mem_scheduler.start()

    try:
        asyncio.run(run_demo())
    except KeyboardInterrupt:
        pass
    finally:
        # Prevent the scheduler's main process from exiting prematurely
        time.sleep(10)

        print("\n==== Stopping the scheduler ====")
        mem_scheduler.stop()
```

### Scenario 2: Asynchronous Task Concurrency and Checkpoint Restart (Redis)

This example demonstrates how to use the Redis queue to achieve asynchronous task concurrency and checkpoint restart functionality. Running this example requires a configured Redis environment.

```python
from pathlib import Path
from time import sleep

from memos.api.routers.server_router import mem_scheduler
from memos.mem_scheduler.schemas.message_schemas import ScheduleMessageItem


# Debug: Print scheduler configuration
print("=== Scheduler Configuration Debug ===")
print(f"Scheduler type: {type(mem_scheduler).__name__}")
print(f"Config: {mem_scheduler.config}")
print(f"use_redis_queue: {mem_scheduler.use_redis_queue}")
print(f"Queue type: {type(mem_scheduler.memos_message_queue).__name__}")
print(f"Queue maxsize: {getattr(mem_scheduler.memos_message_queue, 'maxsize', 'N/A')}")
print("=====================================\n")

queue = mem_scheduler.memos_message_queue


# Define the handler function
def my_test_handler(messages: list[ScheduleMessageItem]):
    print(f"My test handler received {len(messages)} messages: {[one.item_id for one in messages]}")
    for msg in messages:
        # Create a file based on task_id (using item_id as numeric ID 0..99)
        task_id = str(msg.item_id)
        file_path = tmp_dir / f"{task_id}.txt"
        try:
            sleep(5)
            file_path.write_text(f"Task {task_id} processed.\n")
            print(f"writing {file_path} done")
        except Exception as e:
            print(f"Failed to write {file_path}: {e}")


def submit_tasks():
    mem_scheduler.memos_message_queue.clear()

    # Create 100 messages (task_id 0..99)
    users = ["user_A", "user_B"]
    messages_to_send = [
        ScheduleMessageItem(
            item_id=str(i),
            user_id=users[i % 2],
            mem_cube_id="test_mem_cube",
            label=TEST_HANDLER_LABEL,
            content=f"Create file for task {i}",
        )
        for i in range(100)
    ]
    # Batch submit messages and print completion info
    print(f"Submitting {len(messages_to_send)} messages to the scheduler...")
    mem_scheduler.memos_message_queue.submit_messages(messages_to_send)
    print(f"Task submission done! tasks in queue: {mem_scheduler.get_tasks_status()}")


# Register the handler function
TEST_HANDLER_LABEL = "test_handler"
mem_scheduler.register_handlers({TEST_HANDLER_LABEL: my_test_handler})

# 5-second restart
mem_scheduler.orchestrator.tasks_min_idle_ms[TEST_HANDLER_LABEL] = 5_000

tmp_dir = Path("./tmp")
tmp_dir.mkdir(exist_ok=True)

# Test stop and restart: If there are >1 files in tmp, skip submission and print info
existing_count = len(list(Path("tmp").glob("*.txt"))) if Path("tmp").exists() else 0
if existing_count > 1:
    print(f"Skip submission: found {existing_count} files in tmp (>1), continue processing")
else:
    submit_tasks()

# 6. Wait until tmp has 100 files or timeout
poll_interval = 1
expected = 100
tmp_dir = Path("tmp")
tasks_status = mem_scheduler.get_tasks_status()
mem_scheduler.print_tasks_status(tasks_status=tasks_status)
while (
    mem_scheduler.get_tasks_status()["remaining"] != 0
    or mem_scheduler.get_tasks_status()["running"] != 0
):
    count = len(list(tmp_dir.glob("*.txt"))) if tmp_dir.exists() else 0
    tasks_status = mem_scheduler.get_tasks_status()
    mem_scheduler.print_tasks_status(tasks_status=tasks_status)
    print(f"[Monitor] Files in tmp: {count}/{expected}")
    sleep(poll_interval)
print(f"[Result] Final files in tmp: {len(list(tmp_dir.glob('*.txt')))})")

# 7. Stop the scheduler
sleep(20)
print("Stopping the scheduler...")
mem_scheduler.stop()
```
