---
title: 大模型与Embedding调用

desc: "一份实用的用于配置和使用 MemOS 中的大语言模型和文本Embedding指南。"
---

## 模块总览 <a id="overview"></a>
MemOS 通过两个 Pydantic 工厂类，将 **模型逻辑** 与 **运行时配置** 解耦。

| 工厂类 | 产出对象 | 常用后端 |
|---------|----------|------------------|
| `LLMFactory` | 聊天生成模型 | `ollama`, `openai`, `qwen`, `deepseek`, `huggingface` |
| `EmbedderFactory` | 文本到向量编码器 | `ollama`, `sentence_transformer`, `universal_api` |

## LLM 模块 <a id="llm-module"></a>

### 支持的 LLM 后端 <a id="supported-llm-backends"></a>
| 后端 | 描述 | 示例模型 ID                              |
|---------------|-------|--------------------------------------|
| `ollama`  | 本地 llama-cpp 运行 | `qwen3:0.6b` 等                    |
| `openai`  | 官方或代理 API | `gpt-4o-mini`, `gpt-3.5-turbo`  等     |
| `qwen`    | DashScope 接口 | `qwen-plus`, `qwen-max-2025-01-25`  等 |
| `deepseek`| DeepSeek REST API | `deepseek-chat`, `deepseek-reasoner`等 |
| `huggingface` | Transformers 管道 | `Qwen/Qwen3-1.7B`    等                |

### LLM 配置结构 <a id="llm-config-schema"></a>

常用字段:

| 字段 | 类型 | 默认值 | 描述 |
|-------|------|---------|-------------|
| `model_name_or_path` | str | - | 模型 ID 或本地标签 |
| `temperature` | float | 0.8 | - |
| `max_tokens` | int | 1024 | - |
| `top_p` / `top_k` | float / int | 0.9 / 50 | - |
| *API 相关* | `api_key`, `api_base` | - | 用于 OpenAI 或代理连接 |
| `remove_think_prefix` | bool | True | 是否删除 `/think` 标签 |

### 工厂使用 <a id="llm-factory-usage"></a>
```python
from memos.configs.llm import LLMConfigFactory
from memos.llms.factory import LLMFactory

cfg = LLMConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "qwen3:0.6b"}
})
llm = LLMFactory.from_config(cfg)
```

### 核心 API <a id="llm-core-apis"></a>
| 方法 | 功能 |
|--------|---------|
| `generate(messages: list)` | 返回完整结果 |
| `generate_stream(messages)` | 流式返回分段 |

### Streaming 与 CoT <a id="streaming--cot"></a>
```python
messages = [{"role": "user", "content": "我们一步步思考..."}]
for chunk in llm.generate_stream(messages):
    print(chunk, end="")
```

::note
**完整代码示例**  
参见 `examples/basic_modules/llm.py`
::

### 性能提示 <a id="llm-performance-tips"></a>
- `qwen3:0.6b` 适合本地部署做最小实践
- 配合 KV Cache 使用，有效降低 TTFT

## 嵌入器模块 <a id="embedding-module"></a>

### 支持的嵌入后端 <a id="supported-embedder-backends"></a>
| 后端 | 模型 | 向量维度 |
|--------|--------|-------------|
| `ollama` | `nomic-embed-text:latest` | 768 |
| `sentence_transformer` | `nomic-ai/nomic-embed-text-v1.5` | 768 |
| `universal_api` | `text-embedding-3-large` | 3072 |

### 工厂使用 <a id="embedder-factory-usage"></a>
```python
cfg = EmbedderConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "nomic-embed-text:latest"}
})
embedder = EmbedderFactory.from_config(cfg)
```

