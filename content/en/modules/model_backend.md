---
title: LLMs and Embeddings
desc: "A practical guide to configuring and using Large Language Models (LLM) and Embedders in **MemOS**."
---

## Overview <a id="overview"></a>
MemOS decouples **model logic** from **runtime config** via two Pydantic factories:

| Factory | Produces | Typical backends |
|---------|----------|------------------|
| `LLMFactory` | Chat‑completion model | `ollama`, `openai`, `qwen`, `deepseek`, `huggingface` |
| `EmbedderFactory` | Text‑to‑vector encoder | `ollama`, `sentence_transformer`, `universal_api` |

Both factories accept a `*_ConfigFactory(model_validate(...))` blob, so you can switch provider with a single `backend=` swap.


## LLM Module <a id="llm-module"></a>

### Supported LLM Backends <a id="supported-llm-backends"></a>
| Backend       | Notes | Example Model Id                          |
|---------------|-------|-------------------------------------------|
| `ollama`  | Local llama‑cpp runner | `qwen3:0.6b` etc.                         |
| `openai`      | Official or proxy | `gpt-4o-mini`, `gpt-3.5-turbo` etc.       |
| `qwen`        | DashScope‑compatible | `qwen-plus`, `qwen-max-2025-01-25`  etc.  |
| `deepseek`    | DeepSeek REST API | `deepseek-chat`, `deepseek-reasoner` etc. |
| `huggingface` | Transformers pipeline | `Qwen/Qwen3-1.7B`  etc.                       |

### LLM Config Schema <a id="llm-config-schema"></a>


Common fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model_name_or_path` | str | – | Model id or local tag |
| `temperature` | float | 0.8 |
| `max_tokens` | int | 1024 |
| `top_p` / `top_k` | float / int | 0.9 / 50 |
| *API‑specific* | e.g. `api_key`, `api_base` | – | OpenAI‑compatible creds |
| `remove_think_prefix` | bool | True | Strip `/think` role content |


### Factory Usage <a id="llm-factory-usage"></a>
```python
from memos.configs.llm import LLMConfigFactory
from memos.llms.factory import LLMFactory

cfg = LLMConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "qwen3:0.6b"}
})
llm = LLMFactory.from_config(cfg)
```

### LLM Core APIs <a id="llm-core-apis"></a>
| Method | Purpose |
|--------|---------|
| `generate(messages: list)` | Return full string response |
| `generate_stream(messages)` | Yield streaming chunks|

### Streaming & CoT <a id="streaming--cot"></a>
```python
messages = [{"role": "user", "content": "Let’s think step by step: …"}]
for chunk in llm.generate_stream(messages):
    print(chunk, end="")
```

::note
**Full code**  
Find all scenarios in `examples/basic_modules/llm.py`.
::

### Performance Tips <a id="llm-performance-tips"></a>
- Use `qwen3:0.6b` for <2 GB footprint when prototyping locally.
- Combine with KV Cache (see *KVCacheMemory* doc) to cut TTFT .

## Embedding Module <a id="embedding-module"></a>

### Supported Embedder Backends <a id="supported-embedder-backends"></a>
| Backend | Example Model | Vector Dim |
|---------|---------------|------------|
| `ollama` | `nomic-embed-text:latest` | 768 |
| `sentence_transformer` | `nomic-ai/nomic-embed-text-v1.5` | 768 |
| `universal_api` | `text-embedding-3-large` | 3072 |

### Embedder Config Schema <a id="embedder-config-schema"></a>
Shared keys: `model_name_or_path`, optional API creds (`api_key`, `base_url`), etc.

### Factory Usage <a id="embedder-factory-usage"></a>
```python
cfg = EmbedderConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "nomic-embed-text:latest"}
})
embedder = EmbedderFactory.from_config(cfg)
```

