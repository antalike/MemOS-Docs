---
title: "安装指南"
desc: "MemOS 完整安装指南。"
---


::card-group

  :::card
  ---
  icon: ri:play-line
  title: 从源码安装
  to: /open_source/getting_started/installation#from-source
  ---
  适合二次开发与贡献：可编辑安装、可跑测试、可本地调试。
  :::

  :::card
  ---
  icon: ri:tree-line
  title: 通过pip安装
  to: /open_source/getting_started/installation#from-pip
  ---
  最简单的安装方式：快速开始使用 MemOS。
  :::

  :::card
  ---
  icon: ri:database-2-line
  title: 通过Docker安装
  to: /open_source/getting_started/installation#from-docker
  ---
  适合快速部署：一键启动服务与依赖组件。
  :::

::

:span{id="from-source"}
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


:span{id="from-pip"}
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

安装完成后，可验证是否成功：

```bash
python -c "import memos; print(memos.__version__)"
```


::note
**可选依赖**<br>

MemOS 为不同功能提供了多个可选依赖组。您可以根据需要进行安装。

| 功能       | 包名                      |
| ---------- | ------------------------- |
| 树形记忆   | `MemoryOS[tree-mem]`      |
| 记忆读取器 | `MemoryOS[mem-reader]`    |
| 记忆调度器 | `MemoryOS[mem-scheduler]` |

安装命令示例：

```bash
pip install MemoryOS[tree-mem]
pip install MemoryOS[tree-mem,mem-reader]
pip install MemoryOS[mem-scheduler]
pip install MemoryOS[tree-mem,mem-reader,mem-scheduler]
```
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

#### 验证服务是否正常

::

#### Ollama 支持
要将 MemOS 与 [Ollama](https://ollama.com/) 一起使用，请先安装 Ollama CLI：

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### Transformers 支持

要使用基于 `transformers` 库的功能，请确保已安装 [PyTorch](https://pytorch.org/get-started/locally/)（建议使用 CUDA 版本以实现 GPU 加速）。

#### Neo4j 支持

::note
**Neo4j Desktop 要求**<br>如果您计划使用 Neo4j 作为图记忆，请安装 Neo4j Desktop
::

#### 下载示例

要下载示例代码、数据和配置，请运行以下命令：

```bash
memos download_examples
```

:span{id="from-docker"}
## 通过Docker安装
