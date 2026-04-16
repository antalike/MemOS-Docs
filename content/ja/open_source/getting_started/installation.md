---
title: "インストールガイド"
desc: "MemOS 完全なインストールガイド。"
---


::card-group

  :::card
  ---
  icon: ri:database-2-line
  title: Docker でインストール
  to: /cn/open_source/getting_started/installation#docker-でインストール
  ---
  迅速なデプロイに適しています：ワンクリックでサービスと依存コンポーネントを起動します。
  :::

  :::card
  ---
  icon: ri:play-line
  title: ソースコードからインストール
  to: /cn/open_source/getting_started/installation#ソースコードからインストール
  ---
  二次開発と貢献に適しています：編集可能インストール、テスト実行、ローカルデバッグが可能です。
  :::

  :::card
  ---
  icon: ri:tree-line
  title: pip でインストール
  to: /cn/open_source/getting_started/installation#pip-でインストール
  ---
  最も簡単なインストール方法：MemOS をすぐに使い始められます。
  :::


::



## Docker でインストール
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
```

#### .env 設定ファイルを作成
::note
**ご注意ください**<br>
.env ファイルの設定は MemOS プロジェクトのルートディレクトリに配置する必要があります
::

::steps{level="4"}

#### 1. .env を新規作成
```bash
cd MemOS
touch .env
```

#### 2. .env の内容

.env のクイック設定は以下のとおりです
```bash 

# OpenAI API キー (カスタム設定が必要)
OPENAI_API_KEY=sk-xxx
# OpenAI API ベース URL 
OPENAI_API_BASE=http://xxx:3000/v1
# デフォルトモデル名
MOS_CHAT_MODEL=qwen3-max

# Memory Reader LLM モデル
MEMRADER_MODEL=qwen3-max
# Memory Reader API キー 
MEMRADER_API_KEY=sk-xxx
# Memory Reader API ベース URL
MEMRADER_API_BASE=http://xxx:3000/v1

# Embedder モデル名
MOS_EMBEDDER_MODEL=text-embedding-v4
# embedding backend を設定、2つの選択肢 ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Embedder API ベース URL 
MOS_EMBEDDER_API_BASE=http://xxx:8081/v1
# Embedder API キー
MOS_EMBEDDER_API_KEY=xxx
# Embedding ベクトル次元
EMBEDDING_DIMENSION=1024
# Reranker バックエンド (http_bge | etc.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j 接続 URI
# オプション値: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# backend=neo4j* の場合は必須
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# redis スケジューラを使用するかどうか
DEFAULT_USE_REDIS_QUEUE=false

# チャット API を有効化
ENABLE_CHAT_API=true
# チャットモデルリスト 百炼から申請可能。モデルは任意選択可能
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://xxx/v1", "api_key": "sk-xxx", "model_name_or_path": "qwen3-max", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max"]}]
```
#### .env の設定は百炼を例にすると以下のとおりです
```bash
# 百炼プラットフォームから申請可能
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api
# 申請成功後、API_KEY と BASE_URL を取得し、設定例は以下のとおりです

# OpenAI API キー (百炼のAPI_KEYを使用)
OPENAI_API_KEY=you_bailian_api_key
# OpenAI API ベース URL 
OPENAI_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# デフォルトモデル名
MOS_CHAT_MODEL=qwen3-max

# Memory Reader LLM モデル
MEMRADER_MODEL=qwen3-max
# Memory Reader API キー (百炼のAPI_KEYを使用)
MEMRADER_API_KEY=you_bailian_api_key
# Memory Reader API ベース URL
MEMRADER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1

# Embedderモデル名は以下のリンクを参照できます
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api/?type=model&url=2846066
MOS_EMBEDDER_MODEL=text-embedding-v4
# embedding backend を設定、2つの選択肢 ollama | universal_api
MOS_EMBEDDER_BACKEND=universal_api
# Embedder API ベース URL 
MOS_EMBEDDER_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
# Embedder API キー (百炼のAPI_KEYを使用)
MOS_EMBEDDER_API_KEY=you_bailian_api_key
# Embedding ベクトル次元
EMBEDDING_DIMENSION=1024
# Reranker バックエンド (http_bge | etc.)
MOS_RERANKER_BACKEND=cosine_local

# Neo4j 接続 URI
# オプション値: neo4j-community | neo4j | nebular | polardb
NEO4J_BACKEND=neo4j-community
# backend=neo4j* の場合は必須
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=12345678
NEO4J_DB_NAME=neo4j
MOS_NEO4J_SHARED_DB=false

# redis スケジューラを使用するかどうか
DEFAULT_USE_REDIS_QUEUE=false

# チャット API を有効化
ENABLE_CHAT_API=true

CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "you_bailian_api_key", "model_name_or_path": "qwen3-max-preview", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max-preview"]}]
```
![MemOS bailian](https://cdn.memtensor.com.cn/img/get_key_url_by_bailian_compressed.png)
<div style="text-align: center; margin-top: 10px">百炼での API_KEY と BASE_URL 申請例</div>

::


#### Dockerfile ファイルを設定
::note
**ご注意ください**<br>
Dockerfile ファイルは docker ディレクトリ配下にあります
::

```bash
#dockerディレクトリに移動
cd docker
```
クイックモードと完全モードが含まれており、軽量パッケージ（arm と x86 を区別）とフルパッケージ（arm と x86 を区別）を使い分けできます

```bash

● 軽量パッケージ：容量が大きすぎる nvidia関連などの依存関係を簡略化し、イメージを軽量化して、ローカルデプロイをより軽量かつ迅速にします。
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base:v1.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

● フルパッケージ：MemOS のすべての依存パッケージをイメージ化し、完全な機能を体験できます。Dockerfile を設定することで直接ビルドして起動できます。
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base:v1.0.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base-arm:v1.0.0
```

```bash
# 現在の例では軽量パッケージ url を使用
FROM registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

WORKDIR /app

ENV HF_ENDPOINT=https://hf-mirror.com

ENV PYTHONPATH=/app/src

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

```

#### docker クライアントを起動
```bash
 # docker がインストールされていない場合は、対応するバージョンをインストールしてください。ダウンロード先は以下です：
 https://www.docker.com/

 # インストール完了後、クライアントから docker を起動するか、コマンドラインから docker を起動できます
 # コマンドラインから docker を起動
 sudo systemctl start docker

# インストール完了後、docker の状態を確認
docker ps

# docker イメージを確認 （不要でも可）
docker images

```

#### サービスをビルドして起動：
::note
**ご注意ください**<br>
ビルドコマンドも docker ディレクトリ配下で実行します
::
```bash
# dockerディレクトリ配下で
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_compressed.png)
<div style="text-align: center; margin-top: 10px">サンプル画像、ポートは docker のカスタム設定に従います</div>  

#### [http://localhost:8000/docs](http://localhost:8000/docs) から API にアクセスします。

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)

#### ADD Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "私はいちごを食べるのが好きです"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"]
}'

# レスポンス
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

#### Search Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "私は何を食べるのが好きですか",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
# レスポンス
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
                  "memory": "[user観点]ユーザーはいちごが好きです。",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "ユーザーのいちごの好み",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "好み",
                          "いちご"
                      ],
                      "visibility": null,
                      "updated_at": "2025-09-18T08:23:44.625479000+00:00",
                      "memory_type": "UserMemory",
                      "sources": [],
                      "embedding": [],
                      "created_at": "2025-09-18T08:23:44.625511000+00:00",
                      "usage": [
                          "{
                            "time": "2025-09-18T08:24:17.759748", 
                            "info": {
                              "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                              "session_id": "root_session"
                            }
                          }"
                      ],
                      "background": "ユーザーはいちごへの好みを表現しており、食の好みにおける傾向を示しています。",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user観点]ユーザーはいちごが好きです。"
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
```


## ソースコードからインストール
```bash
git clone https://github.com/MemTensor/MemOS.git
cd MemOS
```

#### .env 設定ファイルを作成
MemOS の server_api は環境変数に依存して起動するため、起動ディレクトリに .env ファイルを作成する必要があります。
1. .env を新規作成
```bash
cd MemOS
touch .env
```

2. .env の内容、クイック設定は docker インストール内の[env 設定](/open_source/getting_started/installation#2.-.env-内容)を参照してください
.env の詳細設定は[env設定](/open_source/getting_started/rest_api_server/#ローカル実行)を参照してください

::note
**ご注意ください**<br>
.env ファイルの設定は MemOS プロジェクトのルートディレクトリに配置する必要があります
::


#### 依存関係をインストール
```bash
# インストールコマンドを実行
pip install -e .
pip install --no-cache-dir -r ./docker/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/
# PYTHONPATH を設定 現在のプロジェクトファイルの絶対ディレクトリ配下の src
export PYTHONPATH=/******/MemOS/src
```

#### グラフデータベースをインストール
MemOS のメモリ基盤はグラフデータベースを通じて保存されます。オープンソースプロジェクトでは、最初のプロジェクトの実行に Neo4j の使用を推奨します。コミュニティでは同時に Neo4j Enterprise Edition/Community Edition と PolarDB をサポートしています。

::note
**PC 開発者向けの最速の選択肢：Neo4j Desktop**<br>Neo4j をグラフメモリとして使用する予定がある場合、Neo4j Desktop が最も便利なインストール方法かもしれません。<br>
さらに、.env ファイルで **NEO4J_BACKEND=neo4j** を設定する必要があります
::


#### MemOS Server を起動。
```bash
# プロジェクトのルートディレクトリ配下
uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1
```

#### ADD Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{

    "messages": [{
    "role": "user",
    "content": "私はいちごを食べるのが好きです"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"]
}'

# レスポンス
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

#### Search Memory
```bash
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "私は何を食べるのが好きですか",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
# レスポンス
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
                  "memory": "[user観点]ユーザーはいちごが好きです。",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "ユーザーのいちごの好み",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "好み",
                          "いちご"
                      ],
                      "visibility": null,
                      "updated_at": "2025-09-18T08:23:44.625479000+00:00",
                      "memory_type": "UserMemory",
                      "sources": [],
                      "embedding": [],
                      "created_at": "2025-09-18T08:23:44.625511000+00:00",
                      "usage": [
                          "{
                            "time": "2025-09-18T08:24:17.759748", 
                            "info": {
                              "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea", 
                              "session_id": "root_session"
                            }
                          }"
                      ],
                      "background": "ユーザーはいちごへの好みを表現しており、食の好みにおける傾向を示しています。",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user観点]ユーザーはいちごが好きです。"
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
```


## pip でインストール
MemOS をインストールする最も簡単な方法は pip を使用することです。

::steps{level="4"}

#### Conda 環境を作成してアクティブ化（推奨）

依存関係の競合を避けるため、独立した Conda 環境の使用を強く推奨します。

```bash
conda create -n memos python=3.11
conda activate memos
```

#### PyPI から MemOS をインストール
MemOS とそのすべてのオプションコンポーネントをインストールします：

```bash
pip install -U "MemoryOS[all]"
```

#### グラフデータベースをインストール
MemOS のメモリ基盤はグラフデータベースを通じて保存されます。オープンソースプロジェクトでは、最初のプロジェクトの実行に Neo4j の使用を推奨します。コミュニティでは同時に Neo4j Enterprise Edition/Community Edition と PolarDB をサポートしています。

::note
**PC 開発者向けの最速の選択肢：Neo4j Desktop**<br>Neo4j をグラフメモリとして使用する予定であれば、Neo4j Desktop が最も便利なインストール方法かもしれません。
::


#### .env 設定ファイルを作成
MemOS の server_api は環境変数に依存して起動するため、起動ディレクトリに .env ファイルを作成する必要があります。
1. .env を新規作成
```bash
touch .env
```

2. .env 内容の例
.env の詳細設定については[env設定](/open_source/getting_started/rest_api_server)をご覧ください

詳細な開発環境設定、ワークフローガイド、およびコントリビューションのベストプラクティスについては、[貢献ガイド](/open_source/contribution/overview)を参照してください。

#### MemOS Server を起動
MemOS は .env ファイルを自動で読み込みません。python-dotenv の方法で起動してください。
```bash
python -m dotenv run -- \
  uvicorn memos.api.server_api:app \
  --host 0.0.0.0 \
  --port 8000
```
起動に成功すると、次のような出力が表示されます：
```text
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

#### メモリ操作を始めましょう
メモリを追加します（呼び出し方法はソースコードからのデプロイと一致しています。今回は**同期**方式でメモリを追加してみましょう）：
```text
curl --location --request POST 'http://127.0.0.1:8000/product/add' \
--header 'Content-Type: application/json' \
--data-raw '{
    "messages": [{
    "role": "user",
    "content": "私はイチゴを食べるのが好き"
  }],
    "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "writable_cube_ids":["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "async_mode": "sync",
    "mode": "fine"
}'
```

::note
**期待される出力**<br>
```json
{
  "code": 200,
  "message": "Memory added successfully",
  "data": [
    {
      "memory": "ユーザーはイチゴを食べるのが好きです。",
      "memory_id": "d01a354e-e5f6-4e2a-bd89-c57ae",
      "memory_type": "UserMemory",
      "cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
    }
  ]
}
```
::

メモリを検索します（呼び出し方法はソースコードからのデプロイと一致しています）：
```text
curl --location --request POST 'http://127.0.0.1:8000/product/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "私は何を食べるのが好きか",
     "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
    "readable_cube_ids": ["b32d0977-435d-4828-a86f-4f47f8b55bca"],
    "top_k":20
  }'
```

::note
**期待される出力**<br>
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
            "memory": "ユーザーはイチゴを食べるのが好きです。",
            "metadata": {
              "user_id": "8736b16e-1d20-4163-980b-a5dc",
              "session_id": "default_session",
              "status": "activated",
              "type": "fact",
              "key": "イチゴの好み",
              "confidence": 0.99,
              "source": null,
              "tags": ["飲食の好み", "イチゴ"],
              "visibility": null,
              "updated_at": "2025-12-26T20:35:08.178564000+00:00",
              "info": null,
              "covered_history": null,
              "memory_type": "WorkingMemory",
              "sources": [],
              "embedding": [],
              "created_at": "2025-12-26T20:35:08.177484000+00:00",
              "usage": [],
              "background": "ユーザーは好みを表明しており、この果物が好きであることを示しています。食事の選択においてイチゴを含む傾向がある可能性があります。",
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
**サンプルコードをダウンロード**<br>おめでとうございます🎉 pip から MemOS をインストールし、最小検証用例を完了しました！さらに、以下のコマンドに基づいてサンプルコードをダウンロードし、各 memos
内部モジュールの呼び出し方法を理解することもできます：
```bash
memos download_examples
```
::


