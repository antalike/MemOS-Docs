---
title: MemOS Documentation
desc: Welcome to the official documentation for MemOS – a Python package designed to empower large language models (LLMs) with advanced, modular memory capabilities.
banner: https://statics.memtensor.com.cn/memos/memos-banner.gif
links:
  - label: 'PyPI'
    to: https://pypi.org/project/MemoryOS/
    target: _blank
    avatar:
      src: https://statics.memtensor.com.cn/icon/pypi.svg
      alt: PyPI logo
  - label: 'Open Source'
    to: https://github.com/MemTensor/MemOS
    target: _blank
    icon: i-simple-icons-github
---

## What is MemOS?

As large language models (LLMs) evolve to tackle advanced tasks—such as multi-turn dialogue, planning, decision-making, and personalized agents—their ability to manage and utilize memory becomes crucial for achieving long-term intelligence and adaptability. However, mainstream LLM architectures often struggle with weak memory structuring, management, and integration, leading to high knowledge update costs, unsustainable behavioral states, and difficulty in accumulating user preferences.

**MemOS** addresses these challenges by redefining memory as a core, first-class resource with unified structure, lifecycle management, and scheduling strategies. It provides a Python package that delivers a unified memory layer for LLM-based applications, enabling persistent, structured, and efficient memory operations. This empowers LLMs with long-term knowledge retention, robust context management, and memory-augmented reasoning, supporting more intelligent and adaptive behaviors.

:Base64Image{src="/assets/memos-architecture.png" alt="MemOS Architecture"}

## Key Features

- **Modular Memory Architecture**: Support for textual, activation (KV cache), and parametric (adapters/LoRA) memory.
- **MemCube**: Unified container for all memory types, with easy load/save and API access.
- **MOS**: Memory-augmented chat orchestration for LLMs, with plug-and-play memory modules.
- **Graph-based Backends**: Native support for Neo4j and other graph DBs for structured, explainable memory.
- **Easy Integration**: Works with HuggingFace, Ollama, and custom LLMs.
- **Extensible**: Add your own memory modules or backends.

## Installation

::note
**Platform Compatibility Warning**<br>MemOS is compatible with Linux, Windows, and macOS. However, if you're using macOS, please note that there may be dependency issues that are difficult to resolve. For example, compatibility with macOS 13 Ventura is currently challenging.
::

### Install via pip

```bash
pip install MemoryOS
```

### Development Install

To contribute to MemOS, clone the repository and install it in editable mode:

```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
make install
```

### Optional Dependencies

::note
**Ollama Support**<br>To use MemOS with [Ollama](https://ollama.com/), first install the Ollama CLI:<br>`curl -fsSL https://ollama.com/install.sh | sh`
::

::note
**Transformers Support**<br>To use functionalities based on the `transformers` library, ensure you have [PyTorch](https://pytorch.org/get-started/locally/) installed (CUDA version recommended for GPU acceleration).
::

::note
**Download Examples**<br>To download example code, data and configurations, run the following command:<br>`memos download_examples`
::

## Contributing

We welcome contributions! Please see the [contribution guidelines](/contribution/overview) for details on setting up your environment and
submitting pull requests.

## License

MemOS is released under the Apache 2.0 License.
