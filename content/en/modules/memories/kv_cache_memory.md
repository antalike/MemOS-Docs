---
title: "KVCacheMemory: Key-Value Cache for Activation Memory"
desc: "`KVCacheMemory` is a specialized memory module in MemOS for storing and managing key-value (KV) caches, primarily used to accelerate large language model (LLM) inference and support efficient context reuse. It is especially useful for activation memory in conversational and generative AI systems."
---

## KV-cache Memory Use Cases

In MemOS, KV-cache memory is best suited for storing **semantically stable and frequently reused background content** such as:

- Frequently asked questions (FAQs) or domain-specific knowledge
- Prior conversation history

These stable **plaintext memory items** are automatically identified and managed by the `MemScheduler` module. Once selected, they are converted into KV-format representations (`KVCacheItem`) ahead of time. This precomputation step stores the activation states (Key/Value tensors) of the memory in a reusable format, allowing them to be injected into the model’s attention cache during inference.

Once converted, these KV memories can be **reused across queries without requiring re-encoding** of the original content. This reduces the computational overhead of processing and storing large amounts of text, making it ideal for applications that require **rapid response times** and **high throughput**.


## Why KV-cache Memory
Integrating `MemScheduler` with KV-cache memory enables significant performance optimization, particularly in the **prefill phase** of LLM inference.

### Without KVCacheMemory

- Each new query is appended to the full prompt, including the background memory.
- The model must **recompute token embeddings and attention** over the full sequence — even for unchanged memory.

### With KVCacheMemory

- The background content is **cached once** as Key/Value tensors.
- For each query, only the new user input (query tokens) is encoded.
- The previously cached KV is injected directly into the attention mechanism.

### Benefits

This separation reduces redundant computation in the prefill phase and leads to:

- Skipping repeated encoding of background content
- Faster attention computation between query tokens and cached memory
- **Lower Time To First Token (TTFT)** latency during generation

This optimization is especially valuable in:

- Multi-turn chatbot interactions
- Retrieval-augmented or context-augmented generation (RAG, CAG)
- Assistants operating over fixed documentation or FAQ-style memory


### KVCacheMemory Acceleration Evaluation

To validate the performance impact of KV-based memory injection, we conducted a set of controlled experiments simulating real memory reuse in MemOS.

#### Experiment Setup

During typical usage, the `MemScheduler` module continuously tracks interaction patterns and promotes high-frequency, stable plaintext memory into KV format. These KV memories are loaded into GPU memory as activation caches and reused during inference.

The evaluation compares two memory injection strategies:

1. **Prompt-based injection**: background memory is prepended as raw text.
2. **KV-cache injection**: memory is injected directly into the model’s attention cache.

We test these strategies across:

- **Three context sizes**: short, medium, and long
- **Three query types**: short-form, medium-form, and long-form

The primary metric is **Time To First Token (TTFT)**, a key latency indicator for responsive generation.

#### Results

The following table shows results across three models (Qwen3-8B, Qwen3-32B, Qwen2.5-72B). TTFT under KV-cache injection is consistently lower than prompt-based injection, while the output tokens remain identical across both strategies.

::note{icon="ri:bnb-fill"}
`Build (s)` refers to the one-time preprocessing cost of converting the memory to KV format, amortized across multiple queries.
::

| Model       | Ctx    | CtxTok | Qry    | QryTok | Build (s) | KV TTFT (s) | Dir TTFT (s) | Speedup (%) |
| ----------- | ------ | ------ | ------ | ------ | --------- | ----------- | ------------ | ----------- |
| Qwen3-8B    | long   | 6064   | long   | 952.7  | 0.92      | 0.50        | 2.37         | 79.1        |
|             |        |        | medium | 302.7  | 0.93      | 0.19        | 2.16         | 91.1        |
|             |        |        | short  | 167    | 0.93      | 0.12        | 2.04         | 94.2        |
|             | medium | 2773   | long   | 952.7  | 0.41      | 0.43        | 1.22         | 64.6        |
|             |        |        | medium | 302.7  | 0.41      | 0.16        | 1.08         | 85.1        |
|             |        |        | short  | 167    | 0.43      | 0.10        | 0.95         | 89.7        |
|             | short  | 583    | long   | 952.7  | 0.12      | 0.39        | 0.51         | 23.0        |
|             |        |        | medium | 302.7  | 0.12      | 0.14        | 0.32         | 55.6        |
|             |        |        | short  | 167    | 0.12      | 0.08        | 0.29         | 71.3        |
| Qwen3-32B   | long   | 6064   | long   | 952.7  | 0.71      | 0.31        | 1.09         | 71.4        |
|             |        |        | medium | 302.7  | 0.71      | 0.15        | 0.98         | 84.3        |
|             |        |        | short  | 167    | 0.71      | 0.11        | 0.96         | 88.8        |
|             | medium | 2773   | long   | 952.7  | 0.31      | 0.24        | 0.56         | 56.9        |
|             |        |        | medium | 302.7  | 0.31      | 0.12        | 0.47         | 75.1        |
|             |        |        | short  | 167    | 0.31      | 0.08        | 0.44         | 81.2        |
|             | short  | 583    | long   | 952.7  | 0.09      | 0.20        | 0.24         | 18.6        |
|             |        |        | medium | 302.7  | 0.09      | 0.09        | 0.15         | 39.6        |
|             |        |        | short  | 167    | 0.09      | 0.07        | 0.14         | 53.5        |
| Qwen2.5-72B | long   | 6064   | long   | 952.7  | 1.26      | 0.48        | 2.04         | 76.4        |
|             |        |        | medium | 302.7  | 1.26      | 0.23        | 1.82         | 87.2        |
|             |        |        | short  | 167    | 1.27      | 0.15        | 1.79         | 91.4        |
|             | medium | 2773   | long   | 952.7  | 0.58      | 0.39        | 1.05         | 62.7        |
|             |        |        | medium | 302.7  | 0.58      | 0.18        | 0.89         | 79.2        |
|             |        |        | short  | 167    | 0.71      | 0.23        | 0.82         | 71.6        |
|             | short  | 583    | long   | 952.7  | 0.16      | 0.33        | 0.43         | 23.8        |
|             |        |        | medium | 302.7  | 0.16      | 0.15        | 0.27         | 43.2        |
|             |        |        | short  | 167    | 0.16      | 0.10        | 0.25         | 60.5        |

#### On vLLM

MemOS now supports vLLM for managing activated memory. To evaluate its impact, we conducted an experiment measuring performance on a system with 8x H800 80GB GPUs (112 vCPUs, 1920 GiB Memory). The evaluation covered six models: Qwen2.5-0.5B, Qwen2.5-1.5B, Qwen2.5-7B, Qwen2.5-14B, Qwen2.5-32B, and Qwen2.5-72B.

The benchmarks were run across a matrix of memory and context lengths to simulate various activation memory scenarios:
- **Memory Text Lengths (tokens)**: 200, 2000, 4000
- **Context Text Lengths (tokens)**: 200, 2000, 4000

The following table summarizes the benchmark results.

| Model | Memory Tokens | Context Tokens | TTFT (with KV Cache Prefill, ms) | TTFT (Without KV Cache , ms) | TTFT Speedup (%) |
| --- | --- | --- | --- | --- | --- |
| **Qwen2.5-0.5B** | 200 | 200 | 2.03 | 3.41 | **40.53** |
|  | 200 | 2000 | 2.04 | 3.42 | **40.46** |
|  | 200 | 4000 | 2.05 | 3.45 | **40.57** |
|  | 2000 | 200 | 1.58 | 3.48 | **54.65** |
|  | 2000 | 2000 | 1.78 | 3.91 | **54.48** |
|  | 2000 | 4000 | 1.86 | 4.07 | **54.29** |
|  | 4000 | 200 | 1.79 | 4.12 | **56.43** |
|  | 4000 | 2000 | 2.42 | 4.95 | **51.13** |
|  | 4000 | 4000 | 2.10 | 4.95 | **57.72** |
| **Qwen2.5-1.5B** | 200 | 200 | 1.48 | 3.04 | **51.11** |
|  | 200 | 2000 | 1.66 | 3.41 | **51.18** |
|  | 200 | 4000 | 1.81 | 3.71 | **51.20** |
|  | 2000 | 200 | 2.13 | 4.02 | **47.09** |
|  | 2000 | 2000 | 1.90 | 4.39 | **56.68** |
|  | 2000 | 4000 | 1.98 | 4.54 | **56.29** |
|  | 4000 | 200 | 3.24 | 5.81 | **44.24** |
|  | 4000 | 2000 | 2.05 | 5.78 | **64.59** |
|  | 4000 | 4000 | 3.32 | 6.02 | **44.92** |
| **Qwen2.5-7B** | 200 | 200 | 3.89 | 10.31 | **62.26** |
|  | 200 | 2000 | 3.88 | 10.23 | **62.07** |
|  | 200 | 4000 | 3.94 | 10.30 | **61.71** |
|  | 2000 | 200 | 3.23 | 10.27 | **68.52** |
|  | 2000 | 2000 | 3.76 | 11.02 | **65.89** |
|  | 2000 | 4000 | 3.67 | 11.02 | **66.63** |
|  | 4000 | 200 | 3.86 | 12.48 | **69.03** |
|  | 4000 | 2000 | 5.48 | 12.54 | **56.29** |
|  | 4000 | 4000 | 4.33 | 12.54 | **65.44** |
| **Qwen2.5-14B** | 200 | 200 | 9.03 | 13.91 | **35.05** |
|  | 200 | 2000 | 9.11 | 13.97 | **34.79** |
|  | 200 | 4000 | 9.08 | 13.95 | **34.90** |
|  | 2000 | 200 | 8.84 | 14.38 | **38.55** |
|  | 2000 | 2000 | 9.41 | 14.32 | **34.30** |
|  | 2000 | 4000 | 8.92 | 14.43 | **38.17** |
|  | 4000 | 200 | 8.59 | 14.50 | **40.76** |
|  | 4000 | 2000 | 9.25 | 14.72 | **37.16** |
|  | 4000 | 4000 | 7.62 | 14.78 | **48.42** |
| **Qwen2.5-32B** | 200 | 200 | 10.43 | 17.06 | **38.85** |
|  | 200 | 2000 | 7.06 | 17.45 | **59.55** |
|  | 200 | 4000 | 8.36 | 17.59 | **52.45** |
|  | 2000 | 200 | 10.22 | 19.46 | **47.50** |
|  | 2000 | 2000 | 7.62 | 19.59 | **61.11** |
|  | 2000 | 4000 | 8.81 | 19.39 | **54.56** |
|  | 4000 | 200 | 8.88 | 23.60 | **62.39** |
|  | 4000 | 2000 | 13.21 | 23.75 | **44.36** |
|  | 4000 | 4000 | 12.59 | 23.55 | **46.51** |
| **Qwen2.5-72B** | 200 | 200 | 18.16 | 35.27 | **48.51** |
|  | 200 | 2000 | 19.26 | 35.23 | **45.32** |
|  | 200 | 4000 | 19.49 | 35.66 | **45.33** |
|  | 2000 | 200 | 18.51 | 39.24 | **52.83** |
|  | 2000 | 2000 | 18.21 | 39.92 | **54.38** |
|  | 2000 | 4000 | 20.56 | 40.64 | **49.42** |
|  | 4000 | 200 | 14.61 | 43.23 | **66.21** |
|  | 4000 | 2000 | 14.33 | 43.22 | **66.84** |
|  | 4000 | 4000 | 17.45 | 43.63 | **60.00** |

The results clearly demonstrate that integrating vLLM's KV Cache reuse provides a transformative performance improvement for MemOS.

## KV-cache Memory Structure

KV-based memory reuse via `KVCacheMemory` offers substantial latency reduction across model sizes and query types, while maintaining identical output. By shifting reusable memory from plaintext prompts into precomputed KV caches, MemOS eliminates redundant context encoding and achieves faster response times—especially beneficial in real-time, memory-augmented LLM applications.

Each cache is stored as a `KVCacheItem`:

| Field         | Type           | Description                                 |
| ------------- | -------------- | ------------------------------------------- |
| `kv_cache_id` | `str`          | Unique ID for the cache (UUID)              |
| `kv_cache`    | `DynamicCache` | The actual key-value cache (transformers)   |
| `metadata`    | `dict`         | Metadata (source, extraction time, etc.)    |


## API Summary (`KVCacheMemory`)

### Initialization
```python
KVCacheMemory(config: KVCacheMemoryConfig)
```

### Core Methods
| Method                   | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `extract(text)`          | Extracts a KV cache from input text using the LLM        |
| `add(memories)`          | Adds one or more `KVCacheItem` to memory                 |
| `get(memory_id)`         | Fetch a single cache by ID                               |
| `get_by_ids(ids)`        | Fetch multiple caches by IDs                             |
| `get_all()`              | Returns all stored caches                                |
| `get_cache(cache_ids)`   | Merge and return a combined cache from multiple IDs      |
| `delete(ids)`            | Delete caches by IDs                                     |
| `delete_all()`           | Delete all caches                                        |
| `dump(dir)`              | Serialize all caches to a pickle file in directory       |
| `load(dir)`              | Load caches from a pickle file in directory              |
| `from_textual_memory(mem)` | Convert a `TextualMemoryItem` to a `KVCacheItem`      |
| `build_vllm_kv_cache( messages)` | Build a vLLM KV cache from a list of messages   |


When calling `dump(dir)`, the system writes to:

```
<dir>/<config.memory_filename>
```

This file contains a pickled dictionary of all KV caches, which can be reloaded using `load(dir)`.


## How to Use

```python
from memos.configs.memory import KVCacheMemoryConfig
from memos.memories.activation.kv import KVCacheMemory

config = KVCacheMemoryConfig(
    extractor_llm={
        "backend": "huggingface",
        "config": {"model_name_or_path": "Qwen/Qwen3-1.7B"}
    }
)
mem = KVCacheMemory(config)

# Extract and add a cache
cache_item = mem.extract("The capital of France is Paris.")
mem.add([cache_item])

# Retrieve and merge caches
merged_cache = mem.get_cache([cache_item.kv_cache_id])

# Save/load
mem.dump("tmp/act_mem")
mem.load("tmp/act_mem")
```


## Developer Notes

* Uses HuggingFace `DynamicCache` for efficient key-value storage
* Pickle-based serialization for fast load/save
* All methods are covered by integration tests in `/tests`
