---
title: "PreferenceTextMemory: Preference Memory"
desc: "An intelligent preference memory module in MemOS designed for capturing, storing, and retrieving user preferences. Supports both explicit and implicit preference extraction with precise retrieval using vector semantic search."
---

# PreferenceTextMemory: Preference Memory

Let's build an intelligent system that understands and remembers user preferences!

**PreferenceTextMemory** is an advanced memory module in MemOS specifically designed for managing user preferences. It can automatically identify explicit preferences (clearly expressed) and implicit preferences (inferred from behavior) from conversations, and provides precise preference retrieval capabilities using vector semantic search.

## Table of Contents

- [What You'll Learn](#what-youll-learn)
- [Why Choose Preference Memory](#why-choose-preference-memory)
- [Core Concepts](#core-concepts)
    - [Memory Structure](#memory-structure)
    - [Metadata Fields](#metadata-fields-preferencetextualmemorymetadata)
    - [Preference Types](#preference-types)
    - [Workflow](#workflow)
- [API Reference](#api-reference)
    - [Initialization](#initialization)
    - [Core Methods](#core-methods)
    - [Configuration Parameters](#configuration-parameters)
- [Hands-On Practice](#hands-on-practice)
    - [Quick Start](#quick-start)
    - [Complete Example](#complete-example)
    - [Advanced Usage](#advanced-usage)
- [Usage Scenarios](#usage-scenarios)
- [Comparison with Other Memory Modules](#comparison-with-other-memory-modules)
- [Best Practices](#best-practices)
- [Next Steps](#next-steps)

## What You'll Learn

By the end of this guide, you will be able to:
- Automatically extract explicit and implicit preferences from conversations
- Store and manage preference memories using vector databases
- Retrieve relevant preferences based on semantic similarity
- Handle preference updates, deduplication, and conflict resolution
- Build personalized conversational agents and recommendation systems

## Why Choose Preference Memory

### Key Features

::list{icon="ph:check-circle-duotone"}
- **Dual Preference Extraction**: Automatically identifies both explicit and implicit preferences
- **Semantic Understanding**: Uses vector embeddings to understand deep meanings of preferences
- **Intelligent Deduplication**: Automatically detects and merges duplicate or conflicting preferences
- **Precise Retrieval**: Semantic search based on vector similarity
- **Persistent Storage**: Supports vector databases (Qdrant/Milvus)
- **Scalability**: Supports large-scale preference data management
- **Personalization Enhancement**: Maintains independent preference profiles for each user
::

### Use Cases

::list{icon="ph:lightbulb-duotone"}
- Personalized conversational agents (remembering user preferences)
- Intelligent recommendation systems (preference-based recommendations)
- Customer service systems (providing customized service)
- Content filtering systems (filtering based on preferences)
- Learning assistance systems (adapting to learning styles)
::

::alert{type="info"}
**Best Fit**<br>
When you need to build a system that "remembers" user preferences and provides personalized services accordingly, PreferenceTextMemory is your best choice.
::

## Core Concepts

### Memory Structure

Each preference memory is represented as a `TextualMemoryItem` object with the following fields:

| Field      | Type                                | Required | Description                        |
| ---------- | ----------------------------------- | -------- | ---------------------------------- |
| `id`       | `str`                               | ✗        | Unique identifier (auto-generated UUID) |
| `memory`   | `str`                               | ✓        | Summary description of the preference |
| `metadata` | `PreferenceTextualMemoryMetadata`   | ✗        | Detailed metadata of the preference |

### Metadata Fields (`PreferenceTextualMemoryMetadata`)

Preference memory metadata inherits from `TextualMemoryMetadata` with additional preference-specific fields:

| Field             | Type                                        | Default                 | Description                        |
| ----------------- | ------------------------------------------- | ----------------------- | ---------------------------------- |
| `preference_type` | `"explicit_preference"` / `"implicit_preference"` | `"explicit_preference"` | Type of preference                 |
| `dialog_id`       | `str`                                       | None                    | Dialog unique identifier           |
| `original_text`   | `str`                                       | None                    | Original dialog text               |
| `embedding`       | `list[float]`                               | None                    | Vector embedding of the preference |
| `preference`      | `str`                                       | None                    | Extracted preference content       |
| `created_at`      | `str`                                       | Auto-generated          | Creation timestamp (ISO 8601)      |
| `mem_cube_id`     | `str`                                       | None                    | MemCube identifier                 |
| `score`           | `float`                                     | None                    | Retrieval relevance score          |
| `user_id`         | `str`                                       | None                    | User identifier                    |
| `session_id`      | `str`                                       | None                    | Session identifier                 |
| `status`          | `"activated"` / `"archived"` / `"deleted"`  | `"activated"`           | Preference status                  |

### Preference Types

PreferenceTextMemory supports two types of preferences:

#### 1. Explicit Preference

Preferences that users clearly express likes or dislikes.

**Examples**:
- "I prefer dark mode"
- "I don't eat spicy food"
- "Please use brief answers"
- "I prefer technical documentation over video tutorials"

#### 2. Implicit Preference

Preferences inferred from user behavior and conversation patterns.

**Examples**:
- User always asks for code examples → Prefers practice-oriented learning
- User frequently requests detailed explanations → Prefers deep understanding
- User mentions environmental topics multiple times → Cares about sustainability

::alert{type="success"}
**Intelligent Extraction**<br>
PreferenceTextMemory uses LLM to automatically extract both explicit and implicit preferences from conversations without manual annotation!
::

### Workflow

The workflow of PreferenceTextMemory includes the following steps:

::steps{}

#### Step 1: Dialog Splitting
Break long conversations into processable chunks

#### Step 2: Preference Extraction
Use LLM to extract explicit and implicit preferences from each chunk

#### Step 3: Vector Embedding
Generate semantic vectors for extracted preferences

#### Step 4: Deduplication & Merging
Detect and intelligently merge duplicate or conflicting preferences

#### Step 5: Storage
Store preferences in vector database

#### Step 6: Retrieval
Search for relevant preferences based on semantic similarity

::

## API Reference

### Initialization

```python
from memos.memories.textual.preference import PreferenceTextMemory
from memos.configs.memory import PreferenceTextMemoryConfig

memory = PreferenceTextMemory(config: PreferenceTextMemoryConfig)
```

### Core Methods

| Method                                | Parameters                              | Return                        | Description                             |
| ------------------------------------- | --------------------------------------- | ----------------------------- | --------------------------------------- |
| `get_memory(messages, type, info)`    | `messages, type, info`                  | `list[TextualMemoryItem]`     | Extract preference memories from messages |
| `add(memories)`                       | `memories: list`                        | `list[str]`                   | Add preference memories (auto-dedup)    |
| `search(query, top_k, info, filter)`  | `query, top_k, info, filter`            | `list[TextualMemoryItem]`     | Semantic search for preference memories |
| `get_with_collection_name(coll, id)`  | `collection_name, memory_id`            | `TextualMemoryItem`           | Get single preference from specified collection |
| `get_by_ids_with_collection_name()`   | `collection_name, memory_ids`           | `list[TextualMemoryItem]`     | Batch get preferences                   |
| `get_all()`                           | -                                       | `dict[str, list]`             | Get all preferences (grouped by collection) |
| `get_memory_by_filter(filter, page)`  | `filter, page, page_size`               | `tuple[list, int]`            | Paginated query by conditions           |
| `delete(memory_ids)`                  | `memory_ids: list[str]`                 | `None`                        | Delete specified preferences            |
| `delete_by_filter(filter)`            | `filter: dict`                          | `None`                        | Delete preferences by conditions        |
| `delete_with_collection_name()`       | `collection_name, memory_ids`           | `None`                        | Delete preferences from specified collection |
| `delete_all()`                        | -                                       | `None`                        | Clear all preference memories           |
| `dump(dir)`                           | `dir: str`                              | `None`                        | Export preferences to JSON files        |
| `load(dir)`                           | `dir: str`                              | `None`                        | Load preferences from JSON files        |

### Configuration Parameters

**PreferenceTextMemoryConfig**

| Parameter        | Type                       | Required | Description                                |
| ---------------- | -------------------------- | -------- | ------------------------------------------ |
| `extractor_llm`  | `LLMConfigFactory`         | ✓        | LLM configuration for extracting preferences |
| `vector_db`      | `VectorDBConfigFactory`    | ✓        | Vector database config (Qdrant/Milvus)     |
| `embedder`       | `EmbedderConfigFactory`    | ✓        | Embedding model configuration              |
| `reranker`       | `RerankerConfigFactory`    | ✗        | Reranker model configuration (optional)    |
| `extractor`      | `ExtractorConfigFactory`   | ✓        | Preference extractor configuration         |
| `adder`          | `AdderConfigFactory`       | ✓        | Preference adder config (with dedup logic) |
| `retriever`      | `RetrieverConfigFactory`   | ✓        | Preference retriever configuration         |

**Configuration Example**

```json
{
  "backend": "preference",
  "config": {
    "extractor_llm": {
      "backend": "openai",
      "config": {
        "model_name_or_path": "gpt-4o-mini",
        "api_key": "sk-xxx"
      }
    },
    "vector_db": {
      "backend": "qdrant",
      "config": {
        "url": "http://localhost:6333",
        "collection_name": ["explicit_preference", "implicit_preference"]
      }
    },
    "embedder": {
      "backend": "openai",
      "config": {
        "model_name_or_path": "text-embedding-3-small",
        "api_key": "sk-xxx"
      }
    },
    "extractor": {
      "backend": "naive"
    },
    "adder": {
      "backend": "naive"
    },
    "retriever": {
      "backend": "naive"
    }
  }
}
```

## Hands-On Practice

### Quick Start

Get started with PreferenceTextMemory in just 4 steps:

::steps{}

#### Step 1: Create Configuration

```python
from memos.configs.memory import MemoryConfigFactory

config = MemoryConfigFactory(
    backend="preference",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
            },
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "url": "http://localhost:6333",
                "collection_name": ["explicit_preference", "implicit_preference"],
            },
        },
        "embedder": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "text-embedding-3-small",
                "api_key": "your-api-key",
            },
        },
        "extractor": {"backend": "naive"},
        "adder": {"backend": "naive"},
        "retriever": {"backend": "naive"},
    },
)
```

#### Step 2: Initialize Memory Module

```python
from memos.memories.factory import MemoryFactory

memory = MemoryFactory.from_config(config)
```

#### Step 3: Extract Preferences

```python
# Extract preferences from conversation
messages = [[
    {"role": "user", "content": "I prefer dark mode interfaces"},
    {"role": "assistant", "content": "Okay, I'll remember you prefer dark mode"},
    {"role": "user", "content": "Can you keep your answers brief?"},
    {"role": "assistant", "content": "Sure, I'll be concise"}
]]

preferences = memory.get_memory(
    messages=messages,
    type="chat",
    info={
        "user_id": "user_001",
        "session_id": "session_123"
    }
)

print(f"✓ Extracted {len(preferences)} preferences")
```

::alert{type="info"}
**Advanced: Multi-modal Content**<br>
If the conversation contains images, URLs, or files, you can use `MultiModalStructMemReader` as the extractor.<br>
See complete example: [Using MultiModalStructMemReader](./tree_textual_memory#using-multimodalstructmemreader-advanced)
::

#### Step 4: Add and Search Preferences

```python
# Add preferences to database
added_ids = memory.add(preferences)
print(f"✓ Added {len(added_ids)} preferences")

# Search for relevant preferences
results = memory.search(
    query="user interface preferences",
    top_k=5,
    info={
        "user_id": "user_001",
        "session_id": "session_123"
    },
    search_filter={"status": "activated"}
)

print(f"\n🔍 Found {len(results)} relevant preferences:")
for i, pref in enumerate(results, 1):
    print(f"  {i}. {pref.memory}")
    print(f"     Type: {pref.metadata.preference_type}")
    print(f"     Preference: {pref.metadata.preference}")
```

::

### Complete Example

Here's a complete end-to-end example demonstrating the full workflow of preference memory:

```python
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

# ========================================
# 1. Initialization
# ========================================
config = MemoryConfigFactory(
    backend="preference",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
            },
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "url": "http://localhost:6333",
                "collection_name": ["explicit_preference", "implicit_preference"],
            },
        },
        "embedder": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "text-embedding-3-small",
                "api_key": "your-api-key",
            },
        },
        "extractor": {"backend": "naive"},
        "adder": {"backend": "naive"},
        "retriever": {"backend": "naive"},
    },
)

memory = MemoryFactory.from_config(config)

# ========================================
# 2. Extract Preferences (Explicit + Implicit)
# ========================================
conversation = [[
    {"role": "user", "content": "I prefer clean code style without too many comments"},
    {"role": "assistant", "content": "Got it, I'll provide concise code"},
    {"role": "user", "content": "Can you give me an example?"},
    {"role": "assistant", "content": "Sure, here's a clean implementation..."},
    {"role": "user", "content": "Great! I prefer these practical examples"}
]]

preferences = memory.get_memory(
    messages=conversation,
    type="chat",
    info={
        "user_id": "developer_001",
        "session_id": "coding_session_456"
    }
)

print(f"✓ Extracted {len(preferences)} preferences")

# View extracted preferences
for pref in preferences:
    print(f"\nType: {pref.metadata.preference_type}")
    print(f"Summary: {pref.memory}")
    print(f"Preference: {pref.metadata.preference}")

# ========================================
# 3. Add Preferences (Auto-dedup)
# ========================================
added_ids = memory.add(preferences)
print(f"\n✓ Successfully added {len(added_ids)} preferences (auto-deduplicated)")

# ========================================
# 4. Semantic Search
# ========================================
query = "code writing style preferences"
results = memory.search(
    query=query,
    top_k=3,
    info={
        "user_id": "developer_001",
        "session_id": "coding_session_456"
    },
    search_filter={"status": "activated"}
)

print(f"\n🔍 Query: '{query}'")
print(f"Found {len(results)} relevant preferences:")
for i, result in enumerate(results, 1):
    print(f"\n  {i}. {result.memory}")
    print(f"     Relevance score: {result.metadata.score:.3f}")
    print(f"     Preference type: {result.metadata.preference_type}")

::alert{type="info"}
**Extension: Internet Retrieval**<br>
To retrieve content from the internet and extract preferences, combine with InternetRetriever.<br>
See example: [Retrieve Memories from the Internet](./tree_textual_memory#retrieve-memories-from-the-internet-optional)
::

# ========================================
# 5. Filter by Conditions
# ========================================
filtered_prefs, total = memory.get_memory_by_filter(
    filter={
        "user_id": "developer_001",
        "preference_type": "explicit_preference"
    },
    page=1,
    page_size=10
)

print(f"\n📊 User explicit preferences: {len(filtered_prefs)} / {total} items")

# ========================================
# 6. Get All Preferences
# ========================================
all_preferences = memory.get_all()
print(f"\n📚 All preferences statistics:")
for collection, prefs in all_preferences.items():
    print(f"  {collection}: {len(prefs)} items")

# ========================================
# 7. Update Preference Status
# ========================================
# Archive old preferences
memory.delete_by_filter({
    "user_id": "developer_001",
    "created_at": {"$lt": "2026-01-01"}
})
print("\n✓ Old preferences archived")

# ========================================
# 8. Persistent Storage
# ========================================
memory.dump("tmp/preferences")
print("\n💾 Preferences saved to tmp/preferences")

# Load preferences
memory.load("tmp/preferences")
print("✓ Preferences loaded from file")
```

### Advanced Usage

#### 1. Multi-Collection Operations

```python
# Get preference from specific collection
explicit_pref = memory.get_with_collection_name(
    collection_name="explicit_preference",
    memory_id="pref_id_123"
)

# Batch get
explicit_prefs = memory.get_by_ids_with_collection_name(
    collection_name="explicit_preference",
    memory_ids=["id_1", "id_2", "id_3"]
)

# Delete from specific collection
memory.delete_with_collection_name(
    collection_name="implicit_preference",
    memory_ids=["old_id_1", "old_id_2"]
)
```

#### 2. Paginated Query

```python
# Paginated retrieval of user preferences
page = 1
page_size = 20

while True:
    prefs, total = memory.get_memory_by_filter(
        filter={"user_id": "user_001"},
        page=page,
        page_size=page_size
    )
    
    if not prefs:
        break
    
    print(f"Page {page}: {len(prefs)} preferences")
    for pref in prefs:
        print(f"  - {pref.memory}")
    
    page += 1
```

#### 3. Preference Conflict Detection

```python
# Search for potentially conflicting preferences
new_pref = "User prefers detailed explanations"
similar_prefs = memory.search(
    query=new_pref,
    top_k=5,
    search_filter={"user_id": "user_001"}
)

# Check for opposite preferences
for pref in similar_prefs:
    if "brief" in pref.memory and "detailed" in new_pref:
        print(f"⚠️ Potential conflict detected: {pref.memory}")
```

## Usage Scenarios

### Best Fit Scenarios

::list{icon="ph:check-circle-duotone"}
- **Personalized Conversation Systems**: Build intelligent assistants that remember user habits
- **Recommendation Engines**: Provide precise recommendations based on user preferences
- **Customer Service**: Deliver customized customer experiences
- **Learning Systems**: Adapt to each learner's style and pace
- **Content Filtering**: Automatically filter content based on preferences
- **Product Configuration**: Remember user configuration preferences
::

### Typical Use Cases

#### Case 1: Intelligent Assistant

```python
# After multiple conversations with the user
query = "Help me write some code"

# Retrieve user's programming preferences
prefs = memory.search(
    query="programming style code conventions",
    top_k=5,
    search_filter={"user_id": "developer_001"}
)

# Adjust response based on preferences
preferences_context = "\n".join([
    f"- {p.memory}" for p in prefs
])

prompt = f"""
User preferences:
{preferences_context}

Please write code according to user preferences...
"""
```

#### Case 2: Recommendation System

```python
# Get user's content preferences
content_prefs = memory.search(
    query="content type topic interests",
    top_k=10,
    search_filter={
        "user_id": "user_001",
        "preference_type": "implicit_preference"
    }
)

# Extract preference keywords
keywords = []
for pref in content_prefs:
    if hasattr(pref.metadata, 'tags'):
        keywords.extend(pref.metadata.tags)

# Recommend content based on preferences
recommended_items = recommend_content(keywords)
```

## Comparison with Other Memory Modules

Choosing the right memory module is crucial for project success. This comparison helps you make the decision:

| Feature        | **NaiveTextMemory**   | **GeneralTextMemory**      | **PreferenceTextMemory**    | **TreeTextMemory**          |
| -------------- | --------------------- | -------------------------- | --------------------------- | --------------------------- |
| **Main Use**   | General memory        | General memory             | **Preference management**   | Structured knowledge graph  |
| **Search**     | Keyword matching      | Vector semantic search     | **Vector semantic search**  | Graph + vector search       |
| **Memory Type**| General text          | General text               | **Explicit/implicit prefs** | Hierarchical nodes          |
| **Dependencies**| LLM only             | LLM + Embedder + Vector DB | **LLM + Embedder + Vector DB** | LLM + Embedder + Graph DB |
| **Dedup**      | ❌                     | ❌                          | **✅ Smart dedup**          | ✅                           |
| **Scale**      | < 1K items            | 1K - 100K items            | **10K - 1M items**          | 10K - 1M items              |
| **Personalization** | ❌                | ⚠️ Manual implementation    | **✅ Native support**       | ⚠️ Manual implementation    |
| **Conflict Detection** | ❌            | ❌                          | **✅ Supported**            | ⚠️ Partial support          |
| **Config Complexity** | Low ⭐         | Medium ⭐⭐                | **Medium-High ⭐⭐⭐**     | High ⭐⭐⭐⭐             |
| **Learning Curve** | Minimal          | Medium                     | **Medium**                  | Steep                       |
| **Production Ready** | ❌ Prototype/demo | ✅ Most scenarios          | **✅ Professional pref mgmt** | ✅ Complex applications   |

::alert{type="success"}
**Selection Guidance**<br>
- **Need to remember user preferences?** → Choose PreferenceTextMemory<br>
- **Need general memory retrieval?** → Use GeneralTextMemory<br>
- **Need knowledge graph?** → Choose TreeTextMemory
::

## Best Practices

Follow these recommendations to maximize the benefits of PreferenceTextMemory:

::steps{}

### 1. Properly Set Up Collections

```python
# Create separate collections for different preference types
config = {
    "vector_db": {
        "backend": "qdrant",
        "config": {
            "collection_name": [
                "explicit_preference",   # Explicit preferences
                "implicit_preference"    # Implicit preferences
            ]
        }
    }
}

# This allows you to:
# ✓ Query explicit and implicit preferences separately
# ✓ Apply different processing logic to different types
# ✓ Facilitate preference analysis and visualization
```

### 2. Leverage Filters Fully

```python
# Precise retrieval of user's specific preferences
results = memory.search(
    query="interface setting preferences",
    top_k=10,
    search_filter={
        "user_id": "user_001",              # ✓ User isolation
        "status": "activated",              # ✓ Only activated preferences
        "preference_type": "explicit_preference",  # ✓ Only explicit preferences
        "created_at": {"$gte": "2026-01-01"}  # ✓ Only recent preferences
    }
)
```

### 3. Regularly Clean Outdated Preferences

```python
from datetime import datetime, timedelta

# Archive preferences older than 6 months
six_months_ago = (datetime.now() - timedelta(days=180)).isoformat()

memory.delete_by_filter({
    "created_at": {"$lt": six_months_ago},
    "status": "activated"
})

print("✓ Outdated preferences archived")
```

### 4. Handle Preference Conflicts

```python
def resolve_preference_conflict(memory, new_pref, user_id):
    """Intelligently resolve preference conflicts"""
    # Search for similar existing preferences
    similar = memory.search(
        query=new_pref,
        top_k=5,
        search_filter={"user_id": user_id}
    )
    
    # Detect conflicts
    for pref in similar:
        if is_conflicting(pref.memory, new_pref):
            # Option 1: Replace old preference with new one
            memory.delete([pref.id])
            print(f"✓ Replaced conflicting preference: {pref.memory}")
            
            # Option 2: Mark as archived
            # memory.delete_by_filter({
            #     "id": pref.id,
            #     "status": "activated"
            # })
    
    return True

# Usage example
new_preference = "User prefers detailed explanations"
resolve_preference_conflict(memory, new_preference, "user_001")
```

### 5. Monitor Preference Quality

```python
# Regularly evaluate preference extraction quality
def evaluate_preference_quality(memory, sample_size=100):
    """Evaluate preference quality"""
    all_prefs = memory.get_all()
    
    stats = {
        "total": 0,
        "explicit": 0,
        "implicit": 0,
        "with_tags": 0,
        "avg_confidence": []
    }
    
    for collection, prefs in all_prefs.items():
        stats["total"] += len(prefs)
        
        for pref in prefs[:sample_size]:
            if pref.metadata.preference_type == "explicit_preference":
                stats["explicit"] += 1
            else:
                stats["implicit"] += 1
            
            if hasattr(pref.metadata, 'tags') and pref.metadata.tags:
                stats["with_tags"] += 1
            
            if hasattr(pref.metadata, 'confidence') and pref.metadata.confidence:
                stats["avg_confidence"].append(pref.metadata.confidence)
    
    # Output statistics
    print(f"📊 Preference Quality Report:")
    print(f"  Total: {stats['total']}")
    print(f"  Explicit: {stats['explicit']}")
    print(f"  Implicit: {stats['implicit']}")
    print(f"  With tags: {stats['with_tags']}")
    if stats["avg_confidence"]:
        avg_conf = sum(stats["avg_confidence"]) / len(stats["avg_confidence"])
        print(f"  Average confidence: {avg_conf:.2f}")

# Usage example
evaluate_preference_quality(memory)
```

::

::alert{type="warning"}
**Developer Notes**<br>
- Preference data is stored in vector database, requires proper Qdrant or Milvus configuration<br>
- Extractor uses LLM, ensure sufficient API quota<br>
- For large-scale data, using a reranker is recommended to improve retrieval accuracy<br>
- Regularly backup preference data using `dump()` and `load()` methods<br>
- Check `/examples/` directory for more practical examples
::

## Next Steps

Congratulations! You've mastered the core usage of PreferenceTextMemory. Next, you can:

::list{icon="ph:arrow-right-duotone"}
- **Explore Other Memory Modules**: Learn about [TreeTextMemory](/open_source/modules/memories/tree_textual_memory)'s graph structure capabilities
- **Learn Vector Databases**: Deep dive into [Qdrant](https://qdrant.tech/) or Milvus configuration
- **Optimize Retrieval Performance**: Configure [Reranker](/open_source/modules/reranker) to improve retrieval accuracy
::
