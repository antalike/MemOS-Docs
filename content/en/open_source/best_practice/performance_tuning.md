---
title: Performance Tuning
---

## Embedding Optimization

```python
fast_embedder = {
    "backend": "ollama",
    "config": {
        "model_name_or_path": "nomic-embed-text:latest"
    }
}

slow_embedder = {
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "nomic-ai/nomic-embed-text-v1.5"
    }
}
```

## Inference Speed

```python
generation_config = {
    "max_new_tokens": 256,  # Limit response length
    "temperature": 0.7,
    "do_sample": True
}
```

## System Resource Optimization

### Memory Capacity Limits

```python
scheduler_config = {
    "memory_capacities": {
        "working_memory_capacity": 20,         # Active context
        "user_memory_capacity": 500,           # User storage
        "long_term_memory_capacity": 2000,     # Domain knowledge
        "transformed_act_memory_capacity": 50  # KV cache items
    }
}
```

### Batch Processing

```python
def batch_memory_operations(operations, batch_size=10):
    for i in range(0, len(operations), batch_size):
        batch = operations[i:i + batch_size]
        yield batch  # Process in batches
```

*   **Recommended Models**:
    *   **Fast/Local**: `nomic-embed-text` (Ollama)
    *   **High Accuracy**: `BAAI/bge-m3` or OpenAI's `text-embedding-3-small` (requires using the `universal_api` backend)

## 3. Search Ranking Optimization

Retrieval performance is primarily affected by the recall quantity (`top_k`) and the re-ranking strategy.

### Adjusting Recall Quantity (Top-K)

Adjust `top_k` in the `mem_scheduler` configuration. Increasing this value can improve recall rate but will increase processing time.

```yaml
mem_scheduler:
  backend: "general_scheduler"
  config:
    # Number of candidates for initial retrieval
    top_k: 20 
    # ...
```

### Introducing a Reranker (Advanced)

MemOS supports introducing a Reranker for fine-grained ranking after retrieval. This typically requires specifying it when initializing the `Searcher` component. If you are integrating MemOS as a developer, you can configure it in the code:

```python
from memos.reranker.factory import RerankerFactory

# When initializing the Searcher
reranker = RerankerFactory.from_config({
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "BAAI/bge-reranker-base"
    }
})
```

## 4. System Resources and Capacity Limits

Setting reasonable capacity limits for various types of memories can prevent unlimited memory growth and maintain retrieval speed. This is usually configured in the `mem_cube` settings.

### Memory Capacity Configuration

In the YAML configuration file, configure the `memory_size` dictionary:

```yaml
mem_cube:
  backend: "general"
  config:
    text_mem:
      backend: "tree"
      config:
        # Limit the number of entries for each memory type
        memory_size:
          WorkingMemory: 10         # Short-term memory for recent conversation rounds
          LongTermMemory: 2000      # Long-term memory upper limit
          UserMemory: 500           # User profile/preference upper limit
```

### Batch Processing and Concurrency

Concurrency processing capabilities can be configured in `mem_scheduler`:

```yaml
mem_scheduler:
  config:
    thread_pool_max_workers: 10     # Number of parallel processing threads
    consume_interval_seconds: 0.01  # Message queue consumption interval
    enable_parallel_dispatch: true  # Enable parallel dispatch
```
