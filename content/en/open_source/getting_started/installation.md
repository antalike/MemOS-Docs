---
title: "Installation Guide"
desc: "Complete installation guide for MemOS."
---


::card-group

  :::card
  ---
  icon: ri:play-line
  title: Install from Source
  to: /open_source/getting_started/installation#from-source
  ---
  Ideal for development and contribution: editable installation, run tests, local debugging.
  :::

  :::card
  ---
  icon: ri:tree-line
  title: Install via pip
  to: /open_source/getting_started/installation#from-pip
  ---
  The simplest installation method: get started with MemOS quickly.
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: Install via Docker
  to: /open_source/getting_started/installation#from-docker
  ---
  Ideal for quick deployment: one-click startup for services and dependencies.
  :::

::

:span{id="from-source"}
## Install from Source
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
pip install -e .
```

#### Create .env Configuration File
The MemOS server_api relies on environment variables to start, so you need to create a .env file in the startup directory.
1. Create .env file
```bash
cd MemOS
touch .env
```

2. .env contents
For detailed .env configuration, please refer to [env configuration](/open_source/getting_started/rest_api_server/#local-deployment)

::note
**Please Note**<br>
The .env file must be placed in the MemOS project root directory.
::

#### Start MemOS Server
```bash
cd MemOS
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1
```

#### Add Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "I like eating strawberries"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"]
}'
```

#### Search Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "What do I like to eat",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
```


:span{id="from-pip"}
## Install via pip
The simplest way to install MemOS is using pip.

::steps{level="4"}

#### Create and Activate Conda Environment (Recommended)

To avoid dependency conflicts, it is strongly recommended to use a dedicated Conda environment.

```bash
conda create -n memos python=3.11
conda activate memos
```

#### Install MemOS from PyPI
Install MemOS with all optional components:

```bash
pip install -U "MemoryOS[all]"
```

After installation, you can verify it was successful:

```bash
python -c "import memos; print(memos.__version__)"
```


::note
**Optional Dependencies**<br>

MemOS provides several optional dependency groups for different features. You can install them based on your needs.

| Feature          | Package Name              |
| ---------------- | ------------------------- |
| Tree Memory      | `MemoryOS[tree-mem]`      |
| Memory Reader    | `MemoryOS[mem-reader]`    |
| Memory Scheduler | `MemoryOS[mem-scheduler]` |

Example installation commands:

```bash
pip install MemoryOS[tree-mem]
pip install MemoryOS[tree-mem,mem-reader]
pip install MemoryOS[mem-scheduler]
pip install MemoryOS[tree-mem,mem-reader,mem-scheduler]
```
::

#### Create .env Configuration File
The MemOS server_api relies on environment variables to start, so you need to create a .env file in the startup directory.
1. Create .env file
```bash
touch .env
```

2. Example .env contents
```text
# ========== Required Configuration ==========
CHAT_MODEL_LIST='[
  {
    "name": "default",
    "backend": "openai",
    "config": {
      "model": "gpt-4o-mini",
      "api_key": "YOUR_API_KEY"
    }
  }
]'

# ========== Optional Configuration ==========
MEMOS_LOG_LEVEL=INFO
```

::note
**Please Note**<br>
env notes
::

For detailed development environment setup, workflow guidelines, and contribution best practices, please see our [Contribution Guide](/open_source/contribution/overview).

#### Start MemOS Server
MemOS does not automatically load .env files. Please use the python-dotenv method to start.
```bash
python -m dotenv run -- \
  uvicorn memos.api.server_api:app \
  --host 0.0.0.0 \
  --port 8000
```
After successful startup, you will see output similar to:
```text
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

#### Verify Service is Running

::

#### Ollama Support
To use MemOS with [Ollama](https://ollama.com/), first install the Ollama CLI:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Transformers Support

To use functionalities based on the `transformers` library, ensure you have [PyTorch](https://pytorch.org/get-started/locally/) installed (CUDA version recommended for GPU acceleration).

#### Neo4j Support

::note
**Neo4j Desktop Requirement**<br>If you plan to use Neo4j for graph memory, please install Neo4j Desktop.
::

#### Download Examples

To download example code, data, and configurations, run the following command:

```bash
memos download_examples
```

:span{id="from-docker"}
## Install via Docker
For detailed steps, please refer to [Start Docker](/open_source/getting_started/rest_api_server/#_4start-docker)
