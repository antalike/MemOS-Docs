---
title: "安装指南"
desc: "MemOS 完整安装指南。"
---


::card-group

  :::card
  ---
  icon: ri:play-line
  title: 从源码安装
  to: /cn/open_source/getting_started/installation#从源码安装
  ---
  适合二次开发与贡献：可编辑安装、可跑测试、可本地调试。
  :::

  :::card
  ---
  icon: ri:tree-line
  title: 通过pip安装
  to: /cn/open_source/getting_started/installation#通过pip安装
  ---
  最简单的安装方式：快速开始使用 MemOS。
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: 通过Docker安装
  to: /cn/open_source/getting_started/installation#通过Docker安装
  ---
  适合快速部署：一键启动服务与依赖组件。
  :::

::

## 从源码安装
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
pip install . -e
```

#### 创建 .env 配置文件
MemOS 的 server_api 依赖环境变量启动，因此需要在启动目录下创建 .env 文件。
1. 新建 .env
```bash
cd MemOS
touch .env
```

2. .env 内容
.env详细配置请见[env配置](/open_source/getting_started/rest_api_server/#本地运行)

::note
**请注意**<br>
.env 文件配置需要放在MemOS 项目根目录下
::

#### 启动 MemOS Server。
```bash
cd MemOS
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1
```

#### ADD Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "我喜欢吃草莓"
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
    "query": "我喜欢吃什么",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
```


## 通过pip安装
安装 MemOS 最简单的方法是使用 pip。

::steps{level="4"}

#### 创建并激活 Conda 环境（推荐）

为避免依赖冲突，强烈建议使用独立的 Conda 环境。

```bash
conda create -n memos python=3.11
conda activate memos
```

#### 从 PyPI 安装 MemOS
安装 MemOS 及其全部可选组件：

```bash
pip install -U "MemoryOS[all]"
```

#### 安装图数据库
Memos的记忆底层是通过图数据库进行存储的，在开源项目中，推荐使用Neo4j运行您的第一个项目。社区同时支持Neo4j企业版/社区版与PolarDB。

::note
**PC开发者的最快选择：Neo4j Desktop**<br>如果您计划使用 Neo4j 作为图记忆，Neo4j Desktop可能是最方便的安装方式。
::


#### 创建 .env 配置文件
MemOS 的 server_api 依赖环境变量启动，因此需要在启动目录下创建 .env 文件。
1. 新建 .env
```bash
touch .env
```

2. 示例 .env 内容
.env详细配置请见[env配置](open_source/getting_started/rest_api_server)

有关详细的开发环境设置、工作流程指南和贡献最佳实践，请参阅我们的 [贡献指南](/open_source/contribution/overview)。

#### 启动 MemOS Server
MemOS 不会自动加载 .env 文件，请使用 python-dotenv 方式启动。
```bash
python -m dotenv run -- \
  uvicorn memos.api.server_api:app \
  --host 0.0.0.0 \
  --port 8000
```
启动成功后，你将看到类似输出：
```text
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

#### 开始您的记忆操作吧
添加记忆（调用方式和从源码部署是一致哒，这次我们试试**同步**方式来添加记忆）：
```text
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{
    "messages": [{
    "role": "user",
    "content": "我喜欢吃草莓"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "async_mode": "sync",
    "mode": "fine"
}'
```

::note
**期望的输出**<br>
```json
{
  "code": 200,
  "message": "Memory added successfully",
  "data": [
    {
      "memory": "用户喜欢吃草莓。",
      "memory_id": "d01a354e-e5f6-4e2a-bd89-c57ae",
      "memory_type": "UserMemory",
      "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
    }
  ]
}
```
::

检索记忆（调用方式和从源码部署是一致哒）：
```text
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "我喜欢吃什么",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
```

::note
**期望的输出**<br>
```json
{
  "code": 200,
  "message": "Search completed successfully",
  "data": {
    "text_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": [
          {
            "id": "f18cbe36-4cd9-456f-9b9f-6be89c35b2bf",
            "memory": "用户喜欢吃草莓。",
            "metadata": {
              "user_id": "8736b16e-1d20-4163-980b-a5dc",
              "session_id": "default_session",
              "status": "activated",
              "type": "fact",
              "key": "草莓喜好",
              "confidence": 0.99,
              "source": null,
              "tags": ["饮喜好", "草莓"],
              "visibility": null,
              "updated_at": "2025-12-26T20:35:08.178564000+00:00",
              "info": null,
              "covered_history": null,
              "memory_type": "WorkingMemory",
              "sources": [],
              "embedding": [],
              "created_at": "2025-12-26T20:35:08.177484000+00:00",
              "usage": [],
              "background": "用户表达了好，表明他们喜欢这种水果，可能在饮食选择中倾向于包含草莓。",
              "file_ids": [],
              "relativity": 0.0,
              "ref_id": "[f18cbe36]"
            },
            "ref_id": "[f18cbe36]"
          }
        ]
      }
    ],
    "act_mem": [],
    "para_mem": [],
    "pref_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": []
      }
    ],
    "pref_note": "",
    "tool_mem": [
      {
        "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
        "memories": []
      }
    ],
    "pref_string": ""
  }
}
```
::

::

::note
**下载示例代码**<br>恭喜您🎉已完成从pip安装MemOS，并跑通最小验证用例！您还可以基于以下命令下载示例代码，从而了解每个memos
内部模块的调用方式：
```bash
memos download_examples
```
::

## 通过Docker安装
