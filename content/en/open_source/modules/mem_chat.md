---
title: MemChat
desc: "MemChat is the 'diplomat' for your Agent. It coordinates user input, memory retrieval, and LLM generation to create a coherent dialogue experience with long-term memory."
---

## 1. Introduction

**MemChat** is the dialogue control center of MemOS.

It is not just a chat interface, but a bridge connecting "instant conversation" with "long-term memory". During interactions with users, MemChat is responsible for retrieving relevant background information from MemCube (Memory Cube) in real-time, constructing context, and solidifying new dialogue content into new memories. Through it, your Agent is no longer a "goldfish memory" but an intelligent partner that can truly understand the past and grow continuously.

---

## 2. Core Capabilities

### Memory-Augmented Chat

Before answering a user's question, MemChat automatically retrieves relevant Textual Memory from MemCube and injects it into the Prompt. This enables the Agent to answer questions based on past interaction history or knowledge bases, not just relying on the LLM's pre-trained knowledge.

### Auto-Memorization

Dialogue is not just about consuming tokens. MemChat uses the Extractor LLM to automatically extract valuable information (such as user preferences, factual knowledge) from the conversation flow and store it in MemCube. This process is automated and requires no manual user intervention.

### Context Management

Automatically manages the dialogue history window (`max_turns_window`). When the conversation becomes too long, it intelligently truncates old context while relying on retrieved long-term memories to maintain dialogue coherence, effectively addressing the LLM Context Window limitation.

### Flexible Configuration

Supports enabling/disabling different types of memories (textual memory, activation memory, etc.) via configuration to adapt to various application scenarios.

---

## 3. Code Structure

The core logic is located under `memos/src/memos/mem_chat/`.

*   **`simple.py`**: **Default Implementation (SimpleMemChat)**. This is an out-of-the-box REPL (Read-Eval-Print Loop) implementation containing the complete "retrieve -> generate -> store" closed-loop logic.
*   **`base.py`**: **Interface Definition (BaseMemChat)**. Defines the basic behavior of MemChat, such as the `run()` method and the `mem_cube` property.
*   **`factory.py`**: **Factory Class**. Responsible for instantiating specific MemChat objects based on configuration (`MemChatConfig`).
*   **`llm_chat.py`**: **LLM Interaction Layer**. Handles the specific communication details with the underlying LLM.

---

## 4. Key Interfaces

The main interaction entry point is the `MemChat` class (typically created by `MemChatFactory`).

### 4.1 Initialization

You first need to create a configuration object, then create an instance via the factory method. After creation, you must mount a `MemCube` instance to `mem_chat.mem_cube`.

### 4.2 `run()`

Starts an interactive command-line dialogue loop. Suitable for development and debugging, it handles user input, calls memory retrieval, generates responses, and prints them.

### 4.3 Properties

*   **`mem_cube`**: The associated memory cube object. MemChat reads and writes memories through it.
*   **`chat_llm`**: The LLM instance used for generating responses.

---

## 5. Workflow

A single dialogue cycle of MemChat typically involves the following steps:

1.  **Receive Input**: Obtain the user's text input.
2.  **Memory Recall**: (If `enable_textual_memory` is enabled) Uses the user input as a Query to retrieve the Top-K relevant memories from `mem_cube.text_mem`.
3.  **Prompt Construction**: Concatenates the system prompt, retrieved memories, and recent dialogue history (History) into a complete Prompt.
4.  **Response Generation**: Calls `chat_llm` to generate a response.
5.  **Memory Extraction & Storage**: (If `enable_textual_memory` is enabled) Sends the current dialogue turn (User + Assistant) to the `mem_cube`'s extractor, extracts new memories, and stores them in the database.

---

## 6. Development Example

The following is a complete code example demonstrating how to configure MemChat and mount a MemCube based on Qdrant and OpenAI.

### 6.1 Code Implementation

```python
import os
import sys

# Ensure the src module can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src")))

from memos.configs.mem_chat import MemChatConfigFactory
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_chat.factory import MemChatFactory
from memos.mem_cube.general import GeneralMemCube

def get_mem_chat_config() -> MemChatConfigFactory:
    """Generate MemChat configuration"""
    return MemChatConfigFactory.model_validate(
        {
            "backend": "simple",
            "config": {
                "user_id": "user_123",
                "chat_llm": {
                    "backend": "openai",
                    "config": {
                        "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                        "temperature": 0.8,
                        "max_tokens": 1024,
                        "api_key": os.getenv("OPENAI_API_KEY"),
                        "api_base": os.getenv("OPENAI_API_BASE"),
                    },
                },
                "max_turns_window": 20,
                "top_k": 5,
                "enable_textual_memory": True, # Enable explicit memory
            },
        }
    )

def get_mem_cube_config() -> GeneralMemCubeConfig:
    """Generate MemCube configuration"""
    return GeneralMemCubeConfig.model_validate(
        {
            "user_id": "user03alice",
            "cube_id": "user03alice/mem_cube_tree",
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "cube_id": "user03alice/mem_cube_general",
                    "extractor_llm": {
                        "backend": "openai",
                        "config": {
                            "model_name_or_path": os.getenv("MOS_CHAT_MODEL", "gpt-4o"),
                            "api_key": os.getenv("OPENAI_API_KEY"),
                            "api_base": os.getenv("OPENAI_API_BASE"),
                        },
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": "user03alice_mem_cube_general",
                            "vector_dimension": 1024,
                        },
                    },
                    "embedder": {
                        "backend": os.getenv("MOS_EMBEDDER_BACKEND", "universal_api"),
                        "config": {
                            "provider": "openai",
                            "api_key": os.getenv("MOS_EMBEDDER_API_KEY", "EMPTY"),
                            "model_name_or_path": os.getenv("MOS_EMBEDDER_MODEL", "bge-m3"),
                            "base_url": os.getenv("MOS_EMBEDDER_API_BASE"),
                        },
                    },
                },
            },
        }
    )

def main():
    print("Initializing MemChat...")
    mem_chat = MemChatFactory.from_config(get_mem_chat_config())

    print("Initializing MemCube...")
    mem_cube = GeneralMemCube(get_mem_cube_config())

    # Key step: Mount the memory cube
    mem_chat.mem_cube = mem_cube
    
    print("Starting Chat Session...")
    try:
        mem_chat.run()
    finally:
        print("Saving memory cube...")
        mem_chat.mem_cube.dump("new_cube_path")

if __name__ == "__main__":
    main()
```

---

## 7. Configuration Notes

When configuring `MemChatConfigFactory`, the following parameters are crucial:

*   **`user_id`**: Required. Used to identify the current user of the dialogue, ensuring memory isolation.
*   **`chat_llm`**: Dialogue model configuration. It is recommended to use a more capable model (e.g., GPT-4o) for better response quality and instruction-following ability.
*   **`enable_textual_memory`**: `True` / `False`. Whether to enable textual memory. If enabled, the system will perform retrieval before dialogue and storage after dialogue.
*   **`max_turns_window`**: Integer. The number of dialogue history turns to retain. History exceeding this limit will be truncated, relying on long-term memory to supplement the context.
*   **`top_k`**: Integer. How many of the most relevant memory fragments to retrieve from the memory bank and inject into the Prompt each time.
