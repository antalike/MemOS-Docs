---
title: REST API Server
desc: MemOS provides a REST API service written using FastAPI. Users can perform all operations via REST interfaces.
---

![MemOS Architecture](https://statics.memtensor.com.cn/memos/openapi.png)
<div style="text-align: center; margin-top: 10px">APIs supported by MemOS REST API Server</div>  

### Features
The following is the English translation of your content, keeping proper nouns unchanged:

- Register new user: Register a new user using configuration information and default cube.
- Get recommended queries: Get recommended query statements for a specific user.
- Get all user memories: Get all memory content for a specific user.
- Add new memory: Create a new memory for a specific user.
- Search memories: Search for memory content for a specific user.
- Chat with MemOS: Chat with MemOS, returning SSE streaming response.


## Run Locally



### Configure Environment Variables

#### 1. Create a `.env` file in the root directory and set your environment variables. Example:
```bash
# Please modify these values according to your actual configuration
# Timezone setting, default is Asia/Shanghai
TZ=Asia/Shanghai

# Local data storage path
MOS_CUBE_PATH=/tmp/memos_data/playground-test

# User key, used for initialization or default request user
OPENAI_API_KEY=your-openai-api-key  

# OpenAI API address, default https://api.openai.com/v1. If going through proxy or self-built compatible service, change here.
OPENAI_API_BASE=your-openai-ip

# Whether to enable default cube configuration
MOS_ENABLE_DEFAULT_CUBE_CONFIG=true

# http_bge (HTTP service version BGE rerank) or cosine_local (local cosine).
MOS_RERANKER_BACKEND=cosine_local

# MemOS model configuration
# Main model name
MOS_CHAT_MODEL=gpt-4o-mini

# Generation temperature
MOS_CHAT_TEMPERATURE=0.8

# Generation max tokens
MOS_MAX_TOKENS=2048

# Top P parameter during retrieval
MOS_TOP_P=0.9

# Top K parameter during retrieval
MOS_TOP_K=50

# Chat model provider (openai | hugginface | vllm)
MOS_CHAT_MODEL_PROVIDER=openai




# MOS_CHAT_MODEL=/mnt/afs/models/hf_models/Qwen2.5-72B-Instruct
# MOS_CHAT_TEMPERATURE=0.8
# MOS_MAX_TOKENS=1024
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MOS_CHAT_MODEL_PROVIDER=huggingface_singleton

#new H8000
# MOS_CHAT_MODEL=/mnt/afs/models/Qwen2.5-72B-Instruct
# VLLM_API_KEY=""
# VLLM_API_BASE=http://58.22.103.29:8088/v1
# MOS_CHAT_TEMPERATURE=0.8
# MOS_MAX_TOKENS=2048
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MODEL_SCHEMA=memos.configs.llm.VLLMLLMConfig
# MOS_CHAT_MODEL_PROVIDER=vllm

#VLLMconfig
# MOS_CHAT_MODEL=/mnt/afs/models/hf_models/Qwen2.5-72B-Instruct
# VLLM_API_KEY=""
# VLLM_API_BASE=http://111.31.225.48:8088/v1
# MOS_CHAT_TEMPERATURE=0.8
# MOS_MAX_TOKENS=2048
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MODEL_SCHEMA=memos.configs.llm.VLLMLLMConfig
# MOS_CHAT_MODEL_PROVIDER=vllm

# MOS_CHAT_MODEL=/mnt/afs/models/hf_models/Qwen3-72B-Instruct
# VLLM_API_KEY=""
# VLLM_API_BASE=http://localhost:8087/v1
# MOS_CHAT_TEMPERATURE=0.7
# MOS_MAX_TOKENS=2048
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MODEL_SCHEMA=memos.configs.llm.VLLMLLMConfig
# MOS_CHAT_MODEL_PROVIDER=vllm

#4090 address
# MOS_CHAT_MODEL=Qwen2.5_72B
# VLLM_API_KEY=""
# VLLM_API_BASE=http://106.75.235.231:8088/v1
# MOS_CHAT_TEMPERATURE=0.8
# MOS_MAX_TOKENS=2048
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MODEL_SCHEMA=memos.configs.llm.VLLMLLMConfig
# MOS_CHAT_MODEL_PROVIDER=vllm

# 4090 qwen3_32B
# MOS_CHAT_MODEL=Qwen3_32B
# VLLM_API_KEY=""
# VLLM_API_BASE=http://106.75.235.231:8089/v1
# MOS_CHAT_TEMPERATURE=0.8
# MOS_MAX_TOKENS=2048
# MOS_TOP_P=0.9
# MOS_TOP_K=50
# MODEL_SCHEMA=memos.configs.llm.VLLMLLMConfig
# MOS_CHAT_MODEL_PROVIDER=vllm

# pref mem
# Enable preference memory
ENABLE_PREFERENCE_MEMORY=true

# Preferred adder mode (fine | safe)
PREFERENCE_ADDER_MODE=fine

# Deduplicate preference explanation by text
DEDUP_PREF_EXP_BY_TEXTUAL=true

# Enable activation memory
ENABLE_ACTIVATION_MEMORY=false

# Enable task scheduler
MOS_ENABLE_SCHEDULER=false

# Neo4j Database Configuration
# NEO4J_URI=bolt://47.117.41.207:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=12345678
# NEO4J_DB_NAME=audreymemos07061eval

#; NEO4J_BACKEND=neo4j
#; # NEO4J_BACKEND=nebular
# Neo4j backend
NEO4J_BACKEND=polardb
# Neo4j connection URI
NEO4J_URI=bolt://47.117.45.189:7687
# Neo4j username
NEO4J_USER=neo4j
# Neo4j password
NEO4J_PASSWORD=your-neo4j-password
# Enable Neo4j shared database mode
MOS_NEO4J_SHARED_DB=true
# Neo4j database name (pref-tmp-db-test)
NEO4J_DB_NAME=your-neo4j-db-name 

# Nebular backend
# Nebular graph database host
NEBULAR_HOSTS='["106.14.142.60:9669", "120.55.160.164:9669", "106.15.38.5:9669"]'
# Nebular username
NEBULAR_USER=root
# Nebular password
NEBULAR_PASSWORD=your-nebular-password
# Nebular Space name (shared-tree-textual-memory-product-preandtest)
NEBULAR_SPACE=your-nebular-space

# Polar DB
# PolarDB Host (memos-polardb.rwlb.rds.aliyuncs.com)
POLAR_DB_HOST=your-polar-db-host
# PolarDB Port
POLAR_DB_PORT=5432
# PolarDB Username
POLAR_DB_USER=adimin
# PolarDB Password
POLAR_DB_PASSWORD=your-polar-db-password
# PolarDB multi-database support
POLAR_DB_USE_MULTI_DB=false memtensor_memos_graph
# PolarDB pool max connections
POLARDB_POOL_MAX_CONN=100
# PolarDB Database Name (memos_test)
POLAR_DB_DB_NAME=your-polar-db-db-name
# POLAR_DB_DB_NAME=memtensor_memos

#embedding dim
# Embedding vector dimension
EMBEDDING_DIMENSION=1024


# milvus
# MILVUS_URI=http://101.132.252.74:19530
# MILVUS_USER_NAME=root
# MILVUS_PASSWORD=milvus_iaar123
# self url
; MILVUS_URI=http://101.132.25.51:19530
# milvus online
# MILVUS_URI=http://106.15.56.171:19530
# MILVUS_USER_NAME=root
# MILVUS_PASSWORD=Milvus123

#milvus
# Milvus Connection URI
MILVUS_URI=http://c-c31c787e871ed9c9.milvus.aliyuncs.com:19530
# Milvus Username
MILVUS_USER_NAME=your-milvus-user
# Milvus Password
MILVUS_PASSWORD=your-milvus-password

# tetxmem reog
# Enable memory reorganization
MOS_ENABLE_REORGANIZE=false


# MemOS User Configuration
# Default user ID
MOS_USER_ID=root
# Default session ID
MOS_SESSION_ID=default_session
# Max turns window for memory/chat
MOS_MAX_TURNS_WINDOW=20

# Internet config
# Enable internet search function
ENABLE_INTERNET=true
# Bocha Search API Key
BOCHA_API_KEY=your-bocha-api-key
# Xinyu News API Key
XINYU_API_KEY=your-xinyu-api-key
# Xinyu Search Engine ID
XINYU_SEARCH_ENGINE_ID=your-xinyu-search-engine-id
# Memory reader LLM model
MEMRADER_MODEL=gpt-4o-mini
# Memory reader API Key
MEMRADER_API_KEY=your-memrader-api-key
# Memory reader API Base URL
MEMRADER_API_BASE=http://123.129.219.111:3000/v1

#dingding bot
# Enable DingTalk robot
ENABLE_DINGDING_BOT=false
# DingTalk configuration
# DingTalk user access token
DINGDING_ACCESS_TOKEN_USER=your-dingding-access-token-user
# DingTalk user secret
DINGDING_SECRET_USER=your-dingding-secret-user
DINGDING_ACCESS_TOKEN_ERROR=your-dingding-access-token-error
DINGDING_SECRET_ERROR=your-dingding-secret-error
# DingTalk robot code
DINGDING_ROBOT_CODE=your-dingding-robot-code
# DingTalk App Key
DINGDING_APP_KEY=your-dingding-app-key
# DingTalk App Secret
DINGDING_APP_SECRET=your-dingding-app-secret

# OSS Configuration
# OSS Endpoint
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
# OSS Region
OSS_REGION=cn-shanghai
# OSS Bucket Name
OSS_BUCKET_NAME=your-oss-bucket-name
# OSS Access Key ID
OSS_ACCESS_KEY_ID=your-oss-access-key-id
# OSS Access Key Secret
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
# OSS Public Base URL
OSS_PUBLIC_BASE_URL=https://public-sandbox.oss-cn-shanghai.aliyuncs.com

# Ollama Configuration (for embeddings)
# Ollama API Base URL
OLLAMA_API_BASE=http://111.31.225.48:11434

# user manager config
# User Manager Backend (sqlite | mysql)
MOS_USER_MANAGER_BACKEND=mysql
# MySQL Host
MYSQL_HOST=your-mysql-host
# MySQL Username
MYSQL_USERNAME=your-mysql-username
# MySQL Password
MYSQL_PASSWORD=your-mysql-password
# MySQL Database Name
MYSQL_DATABASE=your-mysql-database

# embedding config
# Embedder Backend (universal_api | ollama)
MOS_EMBEDDER_BACKEND=universal_api

# 4090
# Embedder model name
MOS_EMBEDDER_MODEL=bge-m3
# Embedder API Base URL
MOS_EMBEDDER_API_BASE=http://106.75.235.231:8081/v1
# Embedder API Key
MOS_EMBEDDER_API_KEY=EMPTY

#H800
# MOS_EMBEDDER_MODEL=/mnt/afs/models/hf_models/bge-m3
# MOS_EMBEDDER_API_BASE=http://111.31.225.48:8078/v1
# MOS_EMBEDDER_API_KEY=EMPTY

#newH800
# MOS_EMBEDDER_MODEL=bge-m3
# MOS_EMBEDDER_API_BASE=http://58.22.103.29:8081/v1
# MOS_EMBEDDER_API_KEY=EMPTY

# reranker config
# Reranker Backend (http_bge | etc.)
MOS_RERANKER_BACKEND=http_bge
# Reranker Service URL
MOS_RERANKER_URL=http://106.75.235.231:8082/v1/rerank

# External Services (for evaluation scripts)
ZEP_API_KEY=your_zep_api_key_here
MEM0_API_KEY=your_mem0_api_key_here
MODEL=gpt-4o-mini
EMBEDDING_MODEL=nomic-embed-text:latest


# custom logger config
# CUSTOM_LOGGER_TOKEN=gAAAAABogLGccUIfiP2dIH5gSrXtN1RnKB65uxDwGFuKmEgO0f-j9jESfAmKiOqqLyXDnYkaKANabGVIO6kFJGPVRQCc6yFLbjttBZBVPHbdhG1X3H-k7cnTZ7y5ZYajE0hfY8w16u_n
# CUSTOM_LOGGER_URL=http://101.132.90.168:7001/api/upload_log
# CUSTOM_LOGGER_ATTRIBUTE_ACTION=memos

# MemScheduler Redis Config
MEMSCHEDULER_REDIS_HOST=your-memscheduler-redis-host
MEMSCHEDULER_REDIS_PORT=your-memscheduler-redis-port
MEMSCHEDULER_REDIS_DB=your-memscheduler-redis-db
MEMSCHEDULER_REDIS_PASSWORD=your-memscheduler-redis-password
MEMSCHEDULER_REDIS_TIMEOUT=your-memscheduler-redis-timeout


# Scheduler Redis Host
MEMSCHEDULER_REDIS_HOST=your-memscheduler-redis-host
# Scheduler Redis Port
MEMSCHEDULER_REDIS_PORT=your-memscheduler-redis-port
# Scheduler Redis DB
MEMSCHEDULER_REDIS_DB=your-memscheduler-redis-db
# Scheduler Redis Password
MEMSCHEDULER_REDIS_PASSWORD=your-memscheduler-redis-password
# Scheduler Redis Timeout
MEMSCHEDULER_REDIS_TIMEOUT=your-memscheduler-redis-timeout


# api evaluation
# Search model (fast | fine | mixture)
SEARCH_MODE=fast
# API Search window size
API_SEARCH_WINDOW_SIZE=5
# API Search history turns
API_SEARCH_HISTORY_TURNS=5


# Async
# Async execution mode (sync/async)
ASYNC_MODE=sync
# Scheduler thread pool size
MOS_SCHEDULER_THREAD_POOL_MAX_WORKERS=50

#  Detailed Chat Model List JSON configuration
CHAT_MODEL_LIST=[{
  "backend": "deepseek", 
  "api_base": "http://123.129.219.111:3000/v1", 
  "api_key": "your-api-key", 
  "model_name_or_path": "deepseek-r1", 
  "support_models": ["deepseek-r1"]
}]

```

#### 2. Configure dependency versions in docker/requirement.txt, etc.
```bash
annotated-types==0.7.0
anyio==4.11.0
attrs==25.4.0
Authlib==1.6.5
beartype==0.22.5
cachetools==6.2.2
certifi==2025.11.12
cffi==2.0.0
charset-normalizer==3.4.4
chonkie==1.1.0
click==8.3.0
concurrent-log-handler==0.9.28
cryptography==46.0.3
cyclopts==4.2.3
diskcache==5.6.3
distro==1.9.0
dnspython==2.8.0
docstring_parser==0.17.0
docutils==0.22.3
email-validator==2.3.0
exceptiongroup==1.3.0
fastapi==0.115.14
fastapi-cli==0.0.16
fastapi-cloud-cli==0.3.1
fastmcp==2.13.0.2
filelock==3.20.0
fsspec==2025.10.0
grpcio==1.76.0
h11==0.16.0
hf-xet==1.2.0
httpcore==1.0.9
httptools==0.7.1
httpx==0.28.1
httpx-sse==0.4.3
huggingface-hub==0.36.0
idna==3.11
iniconfig==2.3.0
itsdangerous==2.2.0
jaraco.classes==3.4.0
jaraco.context==6.0.1
jaraco.functools==4.3.0
jieba==0.42
Jinja2==3.1.6
jiter==0.12.0
joblib==1.5.2
jsonschema==4.25.1
jsonschema-path==0.3.4
jsonschema-specifications==2025.9.1
keyring==25.6.0
markdown-it-py==4.0.0
MarkupSafe==3.0.3
mcp==1.21.1
mdurl==0.1.2
more-itertools==10.8.0
numpy==2.3.4
ollama==0.4.9
openai==1.109.1
openapi-pydantic==0.5.1
orjson==3.11.4
packaging==25.0
pandas==2.3.3
pathable==0.4.4
pathvalidate==3.3.1
pika==1.3.2
platformdirs==4.5.0
pluggy==1.6.0
portalocker==2.10.1
prometheus_client==0.23.1
protobuf==6.33.1
psycopg2-binary==2.9.9
py-key-value-aio==0.2.8
py-key-value-shared==0.2.8
pycparser==2.23
pydantic==2.12.4
pydantic-extra-types==2.10.6
pydantic-settings==2.12.0
pydantic_core==2.41.5
Pygments==2.19.2
PyJWT==2.10.1
pymilvus==2.6.5
PyMySQL==1.1.2
pyperclip==1.11.0
pytest==9.0.2
python-dateutil==2.9.0.post0
python-dotenv==1.2.1
python-multipart==0.0.20
pytz==2025.2
PyYAML==6.0.3
redis==6.4.0
referencing==0.36.2
regex==2025.11.3
requests==2.32.5
rich==14.2.0
rich-rst==1.3.2
rich-toolkit==0.15.1
rignore==0.7.6
rpds-py==0.28.0
safetensors==0.6.2
scikit-learn==1.7.2
scipy==1.16.3
sentry-sdk==2.44.0
setuptools==80.9.0
shellingham==1.5.4
six==1.17.0
sniffio==1.3.1
SQLAlchemy==2.0.44
sse-starlette==3.0.3
starlette==0.46.2
tenacity==9.1.2
threadpoolctl==3.6.0
tokenizers==0.22.1
tqdm==4.67.1
transformers==4.57.1
typer==0.20.0
typing-inspection==0.4.2
typing_extensions==4.15.0
tzdata==2025.2
ujson==5.11.0
urllib3==2.5.0
uvicorn==0.38.0
uvloop==0.22.1
watchfiles==1.1.1
websockets==15.0.1

```


### Start Docker 
```bash
 # Check docker status
 docker ps
 # Check docker images (optional)
 docker images

```



### Client Install with Docker Compose up
::steps{level="4"}
Development Docker Compose up comes pre-configured with qdrant, neo4j.
Running the server requires the `OPENAI_API_KEY` environment variable.


#### Enter docker folder
```bash 
# Enter docker folder from current directory
cd docker
```

#### Install corresponding dependency modules
```bash

pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# Install dependencies using Aliyun source
pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# command not found: pip  use pip3



```


#### Start container using Docker Compose Up in docker directory (ensure vpn connects normally):

```bash

# Build required for first run
docker compose up --build
# Not required for subsequent runs
docker compose up

```

#### Access API via [http://localhost:8000/docs](http://localhost:8000/docs).

#### Example process

#####  (Register user -> Query user memory (stop if none) -> Add user memory -> Query user memory)

##### Register User http://localhost:8000/product/users/register (POST)
```bash
# Response
{
    "code": 200,
    "message": "User registered successfully",
    "data": {
        "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
        "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
    }
}
```

##### Add User Memory http://localhost:8000/product/add (POST)
```bash
# Request params
{
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
  "messages": [
    {
      "role": "user",
      "content": "I like strawberry"
    }
  ],
  "memory_content": "",
  "doc_path": "",
  "source": "",
  "user_profile": false
}
# Response
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

##### Query User Memory http://localhost:8000/product/search (POST)
```bash
# Request params
{
  "query": "What do I like",
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
}
# Response
{
    "code": 200,
    "message": "Search completed successfully",
    "data": {
        "text_mem": [
          {
            "cube_id": "7231eda8-6c57-4f6e-97ce-98b699eebb98",
            "memories": [
              {
                  "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                  "memory": "[user viewpoint] User likes strawberries.",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "User preference for strawberries",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "preference",
                          "strawberry"
                      ],
                      "visibility": null,
                      "updated_at": "2025-09-18T08:23:44.625479000+00:00",
                      "memory_type": "UserMemory",
                      "sources": [],
                      "embedding": [],
                      "created_at": "2025-09-18T08:23:44.625511000+00:00",
                      "usage": [
                          "{\"time\": \"2025-09-18T08:24:17.759748\", \"info\": {\"user_id\": \"de8215e3-3beb-4afc-9b64-ae594d62f1ea\", \"session_id\": \"root_session\"}}"
                      ],
                      "background": "The user expressed a preference for strawberries, indicating their inclination towards dietary preferences.",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user viewpoint] User likes strawberries."
                  },
                  "ref_id": "[2f40be8f]"
              },
              ...
            }
          }
        ],
        "act_mem": [],
        "para_mem": []
    }
}



# Response failure, troubleshooting
# src/memos/api/config.py
# Check "neo4j_vec_db" and "EMBEDDING_DIMENSION" configured in get_neo4j_community_config method
```


#### Modifications to server code or library code will automatically reload the server.


::

### Client Install with uv

::steps{level="4"}

#### Install dependencies

```bash
# pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# Install dependencies using Aliyun source
pip3 install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/


```

#### Open terminal and run the following command to install:

```bash

# Packages that might need manual installation currently. Need to find resources for these two packages
# neo4j.5.26.4.tar   qdrant.v1.15.3.tar
docker load -i neo4j.5.26.4.tar
docker load -i qdrant.v1.15.3.tar
# Check if installed successfully
docker images
# Check if running
docker ps -a

# Estimated missing packages, pymilvus, psycopg2-binary
pip install pymilvus psycopg2-binary


# Root directory
 uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1

# If ModuleNotFoundError: No module named 'memos' appears during startup, it is due to path matching problem, please execute
export PYTHONPATH=/you-file-absolute-path/MemOS/src

```

#### Access API

After startup is complete, access API via [http://localhost:8000/docs](http://localhost:8000/docs).


::

### Docker use repository dependency package image/start (Recommended use)
::steps{level="4"}

#### Reference configuration environment variables above, .env file should be configured

#### Configure Dockerfile (Current Dockerfile is in root directory)
```bash
# Lean package url
FROM registry.cn-shanghai.aliyuncs.com/memtensor/memos:base-v1.0

WORKDIR /app

ENV HF_ENDPOINT=https://hf-mirror.com

ENV PYTHONPATH=/app/src

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

```

#### Local build - supports amd x86: windows, intel chip build method (choose step 2 ignore step 3 according to chip type)
##### (Image name:version: Example: memos-api-server:v1.0.1):

```bash
docker build -t memos-api-server:v1.0.1 .  
```

![MemOS buildSuccess](https://cdn.memtensor.com.cn/img/memos_build_success_ay2epm_compressed.png)
<div style="text-align: center; margin-top: 10px；font-size:12px">Example image, build command as per custom image name:version</div>  

##### Start service using docker run:

```bash
docker run --env-file .env -p 8000:8000 memos-api-server:v1.0.1
```

#### Local build - arm: mac m chip (choose step 3 ignore step 2 according to chip type)
##### Support arm: mac m chip build method docker compose up
##### Enter docker directory, configure docker-compose.yml file

```bash
name: memos-dev

services:
  memos:
    container_name: memos-api-docker
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ../.env
    environment:
      - PYTHONPATH=/app/src
      - HF_ENDPOINT=https://hf-mirror.com
      - QDRANT_HOST=qdrant-docker
      - QDRANT_PORT=6333
      - NEO4J_URI=bolt://neo4j-docker:7687
    volumes:
      - ../src:/app/src
      - .:/app/docker
    networks:
      - memos_network


volumes:
  neo4j_data:
  neo4j_logs:

networks:
  memos_network:
    driver: bridge

```

##### Build and start service using docker compose up:
```bash
# Enter docker directory
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_jgdd8e_compressed.png)
<div style="text-align: center; margin-top: 10px">Example image, port as per docker custom configuration</div>  






#### Access API via [http://localhost:8000/docs](http://localhost:8000/docs).

![MemOS Architecture](https://statics.memtensor.com.cn/memos/openapi.png)


#### Test cases (Register user->Add user memory->Query user memory) Refer to Docker Compose up test cases

::

### Without Docker
::steps{level="4"}
#### Reference configuration environment variables above, .env file should be configured

#### Install Poetry for dependency management:

```bash
curl -sSL https://install.python-poetry.org | python3 - 
```

#### Poetry environment variable configuration:

```bash

# To start using, you need to find Poetry's bin directory in "PATH" (/Users/jinyunyuan/.local/bin) environment variable
# Modern macOS systems default Shell is zsh. You can confirm via following command
1. Determine which Shell you are using

echo $SHELL
# If output is /bin/zsh or /usr/bin/env zsh, then you are zsh.
# (If your system version is older, might still be using bash, output will be /bin/bash)
2. Open corresponding Shell config file
# If using zsh (vast majority of cases):
# Use nano editor (recommended for beginners)
nano ~/.zshrc

# Or use vim editor
# vim ~/.zshrc
# If using bash:
nano ~/.bash_profile
# Or
nano ~/.bashrc

3. Add PATH environment variable

# At the very end of opened file, start a new line, paste installation prompt command:
export PATH="/you-path/.local/bin:$PATH"

4. Save and exit editor

# If using nano:
# Press Ctrl + O to write (save), press Enter to confirm filename.
# Then press Ctrl + X to exit editor.

# If using vim:
# Press i to enter insert mode, paste code, then press ESC key to exit insert mode.
# Input :wq, then press Enter to save and exit.

5. Make configuration take effect immediately
# Newly modified config file won't automatically take effect in currently open terminal window, you need to run one of the following commands to reload it:

# For zsh:
source ~/.zshrc

# For bash:
source ~/.bash_profile

6. Verify if installation is successful
# Now, you can execute test command in prompt to check if everything is ready:
poetry --version
# Success will show version number Poetry (version 2.2.0)

```

#### Install all project dependencies and development tools:

```bash
make install  
```

#### First start neo4j and qdrant in docker

#### Start FastAPI server (In MomOS directory):

```bash
uvicorn memos.api.product_api:app --host 0.0.0.0 --port 8000 --reload
```

#### After server runs, you can use OpenAPI docs to test API, URL is [http://localhost:8000/docs](http://localhost:8000/docs) or [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Test cases (Register user->Add user memory->Query user memory) Refer to Docker Compose up test cases

::


### Start using pyCharm

#### Run server_api
```bash
1. Enter MemOS/docker/Dockerfile file, modify run configuration
# Start the docker
CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

2. Enter directory MemOS/src/memos/api directly run server_api.py

```