---
title: REST API 服务
desc: MemOS 提供了一个使用 FastAPI 编写的 REST API 服务。用户可以通过 REST 接口执行所有操作。
---

![MemOS Architecture](https://statics.memtensor.com.cn/memos/openapi.png)
<div style="text-align: center; margin-top: 10px">MemOS REST API 服务支持的 API</div>  

### 功能特点
以下是你的英文内容的中文翻译，专有名词保持不变：

- 注册新用户：使用配置信息和默认的 cube 注册一个新用户。
- 获取推荐查询：为指定用户获取推荐的查询语句。
- 获取用户所有记忆：获取某个用户的所有记忆内容。
- 添加新记忆：为指定用户创建一条新的记忆。
- 搜索记忆：为指定用户搜索其记忆内容。
- 与 MemOS 对话：与 MemOS 进行对话，返回 SSE 流式响应。


## 本地运行



### 配置环境变量

#### 1、在根目录中创建一个 `.env` 文件并设置你的环境变量。例如：
```bash
# 请根据你的实际配置修改这些值
# 时区设置， 默认是 Asia/Shanghai
TZ=Asia/Shanghai

# 本地数据存储路径
MOS_CUBE_PATH=/tmp/memos_data/playground-test

# 用户key，用于初始化或默认请求用户
OPENAI_API_KEY=your-openai-api-key  

# OpenAI 接口地址，默认 https://api.openai.com/v1。如走代理或自建兼容服务，改这里。
OPENAI_API_BASE=your-openai-ip

# 是否启用默认 cube 配置
MOS_ENABLE_DEFAULT_CUBE_CONFIG=true

# http_bge（HTTP 服务版 BGE 重排）或 cosine_local（本地余弦）。
MOS_RERANKER_BACKEND=cosine_local

# MemOS 模型配置
# 主模型名称
MOS_CHAT_MODEL=gpt-4o-mini

# 生成温度
MOS_CHAT_TEMPERATURE=0.8

# 生成最大 tokens
MOS_MAX_TOKENS=2048

# 检索时的 Top P 参数
MOS_TOP_P=0.9

# 检索时的 Top K 参数
MOS_TOP_K=50

# 聊天模型提供（openai | hugginface | vllm）
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

#4090地址
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
# 启用偏好记忆
ENABLE_PREFERENCE_MEMORY=true

# 首选加法器模式 (fine | safe)
PREFERENCE_ADDER_MODE=fine

# 通过文本消除重复的偏好解释
DEDUP_PREF_EXP_BY_TEXTUAL=true

# 启用激活记忆
ENABLE_ACTIVATION_MEMORY=false

# 启用任务调度器
MOS_ENABLE_SCHEDULER=false

# Neo4j Database Configuration
# NEO4J_URI=bolt://47.117.41.207:7687
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=12345678
# NEO4J_DB_NAME=audreymemos07061eval

#; NEO4J_BACKEND=neo4j
; # NEO4J_BACKEND=nebular
# Neo4j后端
NEO4J_BACKEND=polardb
# Neo4j连接URI
NEO4J_URI=bolt://47.117.45.189:7687
# Neo4j用户名
NEO4J_USER=neo4j
# Neo4j密码
NEO4J_PASSWORD=your-neo4j-password
# 启用Neo4j共享数据库模式
MOS_NEO4J_SHARED_DB=true
# Neo4j数据库名称(pref-tmp-db-test)
NEO4J_DB_NAME=your-neo4j-db-name 

# Nebular后端
# Nebular图数据库主机
NEBULAR_HOSTS='["106.14.142.60:9669", "120.55.160.164:9669", "106.15.38.5:9669"]'
# Nebular用户名
NEBULAR_USER=root
# Nebular密码
NEBULAR_PASSWORD=your-nebular-password
# Nebular Space名称(shared-tree-textual-memory-product-preandtest)
NEBULAR_SPACE=your-nebular-space

# Polar DB
# PolarDB主机 (memos-polardb.rwlb.rds.aliyuncs.com)
POLAR_DB_HOST=your-polar-db-host
# PolarDB端口
POLAR_DB_PORT=5432
# PolarDB用户名
POLAR_DB_USER=adimin
# PolarDB密码
POLAR_DB_PASSWORD=your-polar-db-password
# PolarDB多数据库支持
POLAR_DB_USE_MULTI_DB=false memtensor_memos_graph
# PolarDB P池最大连接数
POLARDB_POOL_MAX_CONN=100
# PolarDB数据库名称(memos_test)
POLAR_DB_DB_NAME=your-polar-db-db-name
# POLAR_DB_DB_NAME=memtensor_memos

#embedding dim
# Embedding向量维度
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
# 启用内存重组
MOS_ENABLE_REORGANIZE=false


# MemOS User Configuration
# 默认用户ID
MOS_USER_ID=root
# 默认会话ID
MOS_SESSION_ID=default_session
# Max turns window for memory/chat
MOS_MAX_TURNS_WINDOW=20

# Internet config
# 启用互联网搜索功能
ENABLE_INTERNET=true
# Bocha Search API Key
BOCHA_API_KEY=your-bocha-api-key
# Xinyu News API Key
XINYU_API_KEY=your-xinyu-api-key
# Xinyu Search Engine ID
XINYU_SEARCH_ENGINE_ID=your-xinyu-search-engine-id
# 内存阅读器LLM模型
MEMRADER_MODEL=gpt-4o-mini
# 内存阅读器API密钥
MEMRADER_API_KEY=your-memrader-api-key
# 内存阅读器API Base URL
MEMRADER_API_BASE=http://123.129.219.111:3000/v1

#dingding bot
# 启用钉钉机器人
ENABLE_DINGDING_BOT=false
# 钉钉配置
# 钉钉用户访问令牌
DINGDING_ACCESS_TOKEN_USER=your-dingding-access-token-user
# 钉钉用户密钥
DINGDING_SECRET_USER=your-dingding-secret-user
DINGDING_ACCESS_TOKEN_ERROR=your-dingding-access-token-error
DINGDING_SECRET_ERROR=your-dingding-secret-error
# 钉钉机器人代码
DINGDING_ROBOT_CODE=your-dingding-robot-code
# 钉钉App Key
DINGDING_APP_KEY=your-dingding-app-key
# 钉钉App Secret
DINGDING_APP_SECRET=your-dingding-app-secret

# OSS Configuration
# OSS 端点
OSS_ENDPOINT=https://oss-cn-shanghai.aliyuncs.com
# OSS 区域
OSS_REGION=cn-shanghai
# OSS 存储桶名称
OSS_BUCKET_NAME=your-oss-bucket-name
# OSS 访问密钥ID
OSS_ACCESS_KEY_ID=your-oss-access-key-id
# OSS 访问密钥密钥
OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
# OSS 公共基础URL
OSS_PUBLIC_BASE_URL=https://public-sandbox.oss-cn-shanghai.aliyuncs.com

# Ollama Configuration (for embeddings)
# Ollama API Base URL
OLLAMA_API_BASE=http://111.31.225.48:11434

# user manager config
# User Manager 后端 (sqlite | mysql)
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
# Embedder 后端 (universal_api | ollama)
MOS_EMBEDDER_BACKEND=universal_api

# 4090
# Embedder 模型名称
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
# Reranker 后端 (http_bge | etc.)
MOS_RERANKER_BACKEND=http_bge
# Reranker 服务URL
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

# MemScheduler Redis 配置
MEMSCHEDULER_REDIS_HOST=your-memscheduler-redis-host
MEMSCHEDULER_REDIS_PORT=your-memscheduler-redis-port
MEMSCHEDULER_REDIS_DB=your-memscheduler-redis-db
MEMSCHEDULER_REDIS_PASSWORD=your-memscheduler-redis-password
MEMSCHEDULER_REDIS_TIMEOUT=your-memscheduler-redis-timeout


# Scheduler Redis 主机
MEMSCHEDULER_REDIS_HOST=your-memscheduler-redis-host
# Scheduler Redis 端口
MEMSCHEDULER_REDIS_PORT=your-memscheduler-redis-port
# Scheduler Redis DB
MEMSCHEDULER_REDIS_DB=your-memscheduler-redis-db
# Scheduler Redis 密码
MEMSCHEDULER_REDIS_PASSWORD=your-memscheduler-redis-password
# Scheduler Redis 超时时间
MEMSCHEDULER_REDIS_TIMEOUT=your-memscheduler-redis-timeout


# api evaluation
# Search 模型 (fast | fine | mixture)
SEARCH_MODE=fast
# API Search 窗口大小
API_SEARCH_WINDOW_SIZE=5
# API Search 历史轮数
API_SEARCH_HISTORY_TURNS=5


# Async
# Async 执行模式 (sync/async)
ASYNC_MODE=sync
# Scheduler 线程池大小
MOS_SCHEDULER_THREAD_POOL_MAX_WORKERS=50

#  详细对话模型列表SON配置
CHAT_MODEL_LIST=[{
  "backend": "deepseek", 
  "api_base": "http://123.129.219.111:3000/v1", 
  "api_key": "your-api-key", 
  "model_name_or_path": "deepseek-r1", 
  "support_models": ["deepseek-r1"]
}]

```

#### 2、配置docker/requirement.txt中依赖包的版本等
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


### 启动docker 
```bash
 #查看docker状态
 docker ps
 #查看docker镜像 （可不用）
 docker images

```



### 客户端install Docker Compose up
::steps{level="4"}
开发环境的 Docker Compose up 已预配置了 qdrant、neo4j。
运行服务器需要环境变量 `OPENAI_API_KEY`。


#### 进入docker文件夹
```bash 
# 当前文件夹下进入docker文件夹
cd docker
```

#### 安装对应依赖模块
```bash

pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# 使用阿里云源安装依赖
pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# command not found: pip  使用pip3



```


#### 在docker目录下使用 Docker Compose Up启动容器(保证vpn正常连接)：

```bash

# 首次运行需要build
docker compose up --build
# 再次运行则不需要
docker compose up

```

#### 通过 [http://localhost:8000/docs](http://localhost:8000/docs) 访问 API。

#### 示例流程

#####  (注册用户->查询用户记忆（没有继续往后）->添加用户记忆->查询用户记忆)

##### 注册用户 http://localhost:8000/product/users/register (POST)
```bash
# 响应
{
    "code": 200,
    "message": "User registered successfully",
    "data": {
        "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
        "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
    }
}
```

##### 添加用户记忆 http://localhost:8000/product/add (POST)
```bash
# 请求参数
{
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
  "messages": [
    {
      "role": "user",
      "content": "我喜欢草莓"
    }
  ],
  "memory_content": "",
  "doc_path": "",
  "source": "",
  "user_profile": false
}
# 响应
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

##### 查询用户记忆 http://localhost:8000/product/search (POST)
```bash
# 请求参数
{
  "query": "我喜欢什么",
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
}
# 响应
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
                  "memory": "[user观点]用户喜欢草莓。",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "用户对草莓的喜好",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "喜好",
                          "草莓"
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
                      "background": "用户表达了对草莓的喜好，显示出他们在饮食偏好上的倾向。",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user观点]用户喜欢草莓。"
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



# 响应失败，原因排查
# src/memos/api/config.py
# 检查get_neo4j_community_config方法中配置的"neo4j_vec_db"和"EMBEDDING_DIMENSION"
```


#### 对服务器代码或库代码进行修改将自动重新加载服务器。


::

### 客户端install 使用 uv 命令

::steps{level="4"}

#### 安装依赖

```bash
# pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# 使用阿里云源安装依赖
pip3 install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/


```

#### 在终端中打开运行以下命令进行安装：

```bash

#  目前可能需要手动安装的包 这两个包需要找资源
# neo4j.5.26.4.tar   qdrant.v1.15.3.tar
docker load -i neo4j.5.26.4.tar
docker load -i qdrant.v1.15.3.tar
# 查看是否安装成功
docker images
# 查看是否跑起来了
docker ps -a

# 预计还漏掉的包， pymilvus， psycopg2-binary
pip install pymilvus psycopg2-binary


# 根目录
 uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1

#  若启动时出现ModuleNotFoundError: No module named 'memos'，是因为路径匹配有问题，请执行
export PYTHONPATH=/you-file-absolute-path/MemOS/src

```

#### 访问 API

启动完成后，通过 [http://localhost:8000/docs](http://localhost:8000/docs) 访问 API。


::

###  Dodcker 使用仓库依赖包镜像启动(推荐使用)
::steps{level="4"}

#### 参考上方配置环境变量，已经好配置.env文件

#### 配置Dockerfile文件（当前Dockerfile文件在根目录下）
```bash
# 精简包 url
FROM registry.cn-shanghai.aliyuncs.com/memtensor/memos:base-v1.0

WORKDIR /app

ENV HF_ENDPOINT=https://hf-mirror.com

ENV PYTHONPATH=/app/src

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

```

#### 本地构建-支持amd x86：windows,inter芯片的构建方式(根据芯片类型选择2步骤忽略3步骤)
#####  （镜像名称:版本号：例如：memos-api-server:v1.0.1）：

```bash
docker build -t memos-api-server:v1.0.1 .  
```

![MemOS buildSuccess](https://cdn.memtensor.com.cn/img/memos_build_success_ay2epm_compressed.png)
<div style="text-align: center; margin-top: 10px；font-size:12px">示例图片，构建命令按自定义的镜像名称:版本</div>  

##### 使用docker run 启动服务 ：

```bash
docker run --env-file .env -p 8000:8000 memos-api-server:v1.0.1
```

#### 本地构建-arm：mac m 芯片(根据芯片类型选择3步骤忽略2步骤)
##### 支持aarm：mac m 芯片芯片的构建方式 docker compose up
##### 进入docker目录下，配置docker-compose.yml文件

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

##### 使用docker compose up 构建并切动服务 ：
```bash
# 在docker目录下
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_jgdd8e_compressed.png)
<div style="text-align: center; margin-top: 10px">示例图片，端口按 docker 自定义的配置</div>  






#### 通过 [http://localhost:8000/docs](http://localhost:8000/docs) 访问 API。

![MemOS Architecture](https://statics.memtensor.com.cn/memos/openapi.png)


#### 测试用例 (注册用户->添加用户记忆->查询用户记忆) 参考Docker Compose up测试用例

::

### 不使用 Docker
::steps{level="4"}
#### 参考上方配置环境变量，已经好配置.env文件

#### 安装 Poetry 用于依赖管理：

```bash
curl -sSL https://install.python-poetry.org | python3 - 
```

#### Poetry 环境变量配置：

```bash

#要开始使用，您需要在“PATH”中找到Poetry的bin目录（/Users/jinyunyuan/.local/bin）`环境变量
# 现代 macOS 系统默认的 Shell 是 zsh。你可以通过以下命令确认
1. 确定你使用的 Shell

echo $SHELL
# 如果输出是 /bin/zsh 或 /usr/bin/env zsh，那么你就是 zsh。
# (如果你的系统版本较老，可能还在使用 bash，输出会是 /bin/bash)
2. 打开对应的 Shell 配置文件
# 如果使用的是 zsh (绝大多数情况)：
# 使用 nano 编辑器（推荐新手）
nano ~/.zshrc

# 或者使用 vim 编辑器
# vim ~/.zshrc
# 如果使用的是 bash：
nano ~/.bash_profile
# 或者
nano ~/.bashrc

3. 添加 PATH 环境变量

# 在打开的文件的最末尾，新起一行，粘贴安装提示给你的那行命令：
export PATH="/you-path/.local/bin:$PATH"

4. 保存并退出编辑器

# 如果你用的是 nano：
# 按 Ctrl + O 来写入（保存），按 Enter 确认文件名。
# 然后按 Ctrl + X 退出编辑器。

# 如果你用的是 vim：
# 按 i 进入插入模式，粘贴代码后，按 ESC 键退出插入模式。
# 输入 :wq，然后按 Enter 来保存并退出。

5. 使配置立刻生效
# 刚刚修改的配置文件不会自动在当前已打开的终端窗口生效，你需要运行以下命令之一来重新加载它：

# 对于 zsh：
source ~/.zshrc

# 对于 bash：
source ~/.bash_profile

6. 验证安装是否成功
# 现在，你可以执行提示中的测试命令来检查一切是否就绪：
poetry --version
# 成功后将显示版本号 Poetry (version 2.2.0)

```

#### 安装所有项目依赖和开发工具：

```bash
make install  
```

#### 先在docker中启动 neo4j 和 qdrant

#### 启动 FastAPI 服务器（在MomOS目录下）：

```bash
uvicorn memos.api.product_api:app --host 0.0.0.0 --port 8000 --reload
```

#### 服务器运行后,您可以使用OpenAPI文档测试API，网址为 [http://localhost:8000/docs](http://localhost:8000/docs) 或者 [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### 测试用例 (注册用户->添加用户记忆->查询用户记忆) 参考Docker Compose up测试用例

::


### 使用 pyCharm 启动

#### 运行 server_api
```bash
1、进入MemOS/docker/Dockerfile文件，修改运行配置
# Start the docker
CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

2、进入目录MemOS/src/memos/api 直接运行server_api.py

```