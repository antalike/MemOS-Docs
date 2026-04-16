---
title: REST API サービス
desc: MemOS は FastAPI を使用して記述された REST API サービスを提供します。ユーザーは REST インターフェースを通じてすべての操作を実行できます。
---

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)
<div style="text-align: center; margin-top: 10px">MemOS REST API サービスがサポートする API</div>  

### 機能特徴

- 新しいメモリを追加：指定したユーザーのために新しいメモリを作成します。
- メモリを検索：指定したユーザーのメモリ内容を検索します。
- ユーザーのすべてのメモリを取得：あるユーザーのすべてのメモリ内容を取得します。
- メモリフィードバック：指定したユーザーに対してメモリ内容のフィードバックを行います。
- MemOS と対話：MemOS と対話し、SSE ストリーミングレスポンスを返します。


## ローカル実行

### 1、ローカルにダウンロード
```bash
# コードをローカルフォルダーにダウンロードする 
git clone https://github.com/MemTensor/MemOS
```

### 2、環境変数を設定
```bash
# フォルダーのディレクトリに入る
cd MemOS
```

#### ルートディレクトリに `.env` ファイルを作成し、環境変数を設定してください。
##### .env クイックモード設定は以下のとおりです。完全モードは <a href="https://github.com/MemTensor/MemOS/blob/main/docker/.env.example">.env.example</a> を参照してください。

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
# embedding backend を設定、2 つの選択肢 ollama | universal_api
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

# redis スケジューラーを使用するかどうか
DEFAULT_USE_REDIS_QUEUE=false

# チャット API を有効化
ENABLE_CHAT_API=true
# チャットモデルリスト、百炼を通じて申請可能。モデルは任意選択可
CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://xxx/v1", "api_key": "sk-xxx", "model_name_or_path": "qwen3-max", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max"]}]
```

### 3、百炼を例にしたカスタム設定

```bash
# 百炼プラットフォームから申請できます
# https://bailian.console.aliyun.com/?spm=a2c4g.11186623.0.0.2f2165b08fRk4l&tab=api#/api
# 申請成功後、API_KEY と BASE_URL を取得します。設定例は以下のとおりです

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
# embedding backend を設定、2 つの選択肢 ollama | universal_api
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

# redis スケジューラーを使用するかどうか
DEFAULT_USE_REDIS_QUEUE=false

# チャット API を有効化
ENABLE_CHAT_API=true

CHAT_MODEL_LIST=[{"backend": "qwen", "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1", "api_key": "you_bailian_api_key", "model_name_or_path": "qwen3-max-preview", "extra_body": {"enable_thinking": true} ,"support_models": ["qwen3-max-preview"]}]
```
![MemOS bailian](https://cdn.memtensor.com.cn/img/get_key_url_by_bailian_compressed.png)
<div style="text-align: center; margin-top: 10px">百炼での API_KEY と BASE_URL 申請例</div>

docker/requirement.txt 内の依存パッケージのバージョンなどを設定します（省略可）。完全版は <a href="https://github.com/MemTensor/MemOS/blob/main/docker/requirements.txt">requirements.txt</a> を参照できます。

### 4、docker を起動 
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


### 方法一：Docker でリポジトリ依存パッケージイメージを使用して起動(推奨)
::steps{level="4"}

```bash
#dockerディレクトリに入る
cd docker
```

#### イメージパッケージ使用確認
クイックモードと完全モードを含み、軽量パッケージ（arm と x86 を区別）とフルパッケージ（arm と x86 を区別）を使い分けできます

```bash

● 軽量パッケージ：容量が大きすぎる nvidia 関連などの依存関係を簡略化し、イメージを軽量化して、ローカルデプロイをより軽量かつ高速にします。
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base:v1.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

● フルパッケージ：MemOS のすべての依存パッケージをイメージ化し、完全な機能を体験できます。Dockerfile を設定することで直接ビルドして起動できます。
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base:v1.0.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-full-base-arm:v1.0.0
```
#### Dockerfile ファイルを設定

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

#### サービスをビルドして起動 ：
```bash
# dockerディレクトリ内で
docker compose up
```
![MemOS buildComposeupSuccess](https://cdn.memtensor.com.cn/img/memos_build_composeup_success_compressed.png)
<div style="text-align: center; margin-top: 10px">サンプル画像、ポートは docker のカスタム設定に従います</div>  

#### [http://localhost:8000/docs](http://localhost:8000/docs) から API にアクセスします。

![MemOS Architecture](https://cdn.memtensor.com.cn/img/memos_run_server_success_compressed.png)


#### テストケース (ユーザーメモリ追加->ユーザーメモリ照会) は Docker Compose up テストケースを参照

::



### 方法二：クライアントinstall Docker Compose up
::steps{level="4"}
開発環境の Docker Compose up には qdrant、neo4j が事前設定されています。
サーバーの実行には環境変数 `OPENAI_API_KEY` が必要です。


#### dockerフォルダーに入る
```bash 
# 現在のフォルダーから docker フォルダーに入る
cd docker
```

#### 対応する依存モジュールをインストール
```bash

pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt
# Alibaba Cloud ミラーを使用して依存関係をインストール
pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt -i https://mirrors.aliyun.com/pypi/simple/

# command not found: pip  の場合は pip3 を使用



```


#### dockerディレクトリで Docker Compose Up を使用してコンテナを起動します(vpn が正常に接続されていることを保証)：

```bash

# 初回実行では build が必要
docker compose up --build
# 再度実行する場合は不要
docker compose up

```

#### [http://localhost:8000/docs](http://localhost:8000/docs) から API にアクセスします。

#### サンプルフロー

#####  (ユーザーメモリを照会（ここで止まらなければ先へ進む）->ユーザーメモリを追加->ユーザーメモリを照会)

##### ユーザーメモリを追加 http://localhost:8000/product/add (POST)
```bash
# リクエストパラメータ
{
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca",
  "async_mode": "async",
  "messages": [
    {
      "role": "user",
      "content": "私はイチゴが好きです"
    }
  ]
}
# レスポンス
{
    "code": 200,
    "message": "Memory created successfully",
    "data": null
}
```

##### ユーザーメモリを照会 http://localhost:8000/product/search (POST)
```bash
# リクエストパラメータ
{
  "query": "私は何が好きですか",
  "user_id": "8736b16e-1d20-4163-980b-a5063c3facdc",
  "mem_cube_id": "b32d0977-435d-4828-a86f-4f47f8b55bca"
}
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
                  "memory": "[user観点]ユーザーはイチゴが好きです。",
                  "metadata": {
                      "user_id": "de8215e3-3beb-4afc-9b64-ae594d62f1ea",
                      "session_id": "root_session",
                      "status": "activated",
                      "type": "fact",
                      "key": "ユーザーのイチゴに対する好み",
                      "confidence": 0.99,
                      "source": null,
                      "tags": [
                          "好み",
                          "イチゴ"
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
                      "background": "ユーザーはイチゴへの好みを表明しており、食の好みにおける傾向を示しています。",
                      "relativity": 0.6349761312470591,
                      "vector_sync": "success",
                      "ref_id": "[2f40be8f]",
                      "id": "2f40be8f-736c-4a5f-aada-9489037769e0",
                      "memory": "[user観点]ユーザーはイチゴが好きです。"
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



# レスポンス失敗、原因調査
# src/memos/api/config.py
# get_neo4j_community_config メソッドで設定された"neo4j_vec_db"と"EMBEDDING_DIMENSION"を確認
```


#### サーバーコードまたはライブラリコードへの変更は自動的にサーバーに再読み込みされます。


::

### 方法三：クライアントinstall で CLI コマンドを使用

::steps{level="4"}

#### 依存関係をインストール

```bash
# pip install --upgrade pip && pip install --no-cache-dir -r ./docker/requirements.txt
# Alibaba Cloud ミラーを使用して依存関係をインストール
pip install --no-cache-dir -r ./docker/requirements.txt -i https://mirrors.aliyun.com/pypi/simple/


```

#### ターミナルで以下のコマンドを実行してインストールを行ってください：

```bash

#  現在手動でインストールが必要な可能性があるパッケージ これら2つのパッケージはリソースを探す必要があります
# neo4j.5.26.4.tar   qdrant.v1.15.3.tar
docker load -i neo4j.5.26.4.tar
docker load -i qdrant.v1.15.3.tar
# インストールに成功したかどうかを確認
docker images
# 起動しているかどうかを確認
docker ps -a

#  起動時にModuleNotFoundError: No module named 'memos'が表示される場合、パスの一致に問題があるため、以下を実行してください
export PYTHONPATH=/you-file-absolute-path/MemOS/src

# ルートディレクトリ
 uvicorn memos.api.server_api:app --host 0.0.0.0 --port 8000 --workers 1



```

#### API へアクセス

起動完了後、[http://localhost:8000/docs](http://localhost:8000/docs) から API にアクセスします。


::

### 方法四：Docker を使用しない
::steps{level="4"}
#### 上記を参考に環境変数を設定し、.env ファイルを設定済み

#### 依存関係管理のために Poetry をインストール：

```bash
curl -sSL https://install.python-poetry.org | python3 - 
```

#### Poetry 環境変数の設定：

```bash

#使用を開始するには、「PATH」でPoetryのbinディレクトリ（/Users/jinyunyuan/.local/bin）`環境変数を見つける必要があります
# 現代の macOS システムのデフォルト Shell は zsh です。以下のコマンドで確認できます
1. 使用している Shell を確認

echo $SHELL
# 出力が /bin/zsh または /usr/bin/env zsh であれば、zsh を使用しています。
# (システムのバージョンが古い場合は、まだ bash を使用している可能性があり、出力は /bin/bash になります)
2. 対応する Shell 設定ファイルを開く
# zsh を使用している場合 (ほとんどのケース)：
# nano エディタを使用（初心者に推奨）
nano ~/.zshrc

# または vim エディタを使用
# vim ~/.zshrc
# bash を使用している場合：
nano ~/.bash_profile
# または
nano ~/.bashrc

3. PATH 環境変数を追加

# 開いたファイルの末尾に新しい行を作成し、インストール時のメッセージで表示されたその行のコマンドを貼り付けます：
export PATH="/you-path/.local/bin:$PATH"

4. 保存してエディタを終了

# nano を使用している場合：
# Ctrl + O を押して書き込み（保存）し、Enter を押してファイル名を確認します。
# その後 Ctrl + X を押してエディタを終了します。

# vim を使用している場合：
# i を押して挿入モードに入り、コードを貼り付けた後、ESC キーを押して挿入モードを終了します。
# :wq と入力し、その後 Enter を押して保存して終了します。

5. 設定をすぐに有効にする
# 今変更した設定ファイルは、現在開いているターミナルウィンドウには自動では反映されないため、以下のいずれかのコマンドを実行して再読み込みする必要があります：

# zsh の場合：
source ~/.zshrc

# bash の場合：
source ~/.bash_profile

6. インストールが成功したかどうかを確認
# これで、メッセージにあるテストコマンドを実行して、すべての準備が整っているかを確認できます：
poetry --version
# 成功するとバージョン番号 Poetry (version 2.2.0) が表示されます

```

#### すべてのプロジェクト依存関係と開発ツールをインストール：

```bash
make install  
```

#### まず docker で neo4j と qdrant を起動

#### FastAPI サーバーを起動（MomOS ディレクトリ配下）：

```bash
uvicorn memos.api.product_api:app --host 0.0.0.0 --port 8000 --reload
```

#### サーバー起動後、OpenAPI ドキュメントを使用して API をテストできます。URL は [http://localhost:8000/docs](http://localhost:8000/docs) または [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) です

#### テストケース (ユーザー登録->ユーザーメモリ追加->ユーザーメモリ検索) Docker Compose up テストケースを参照

::


### 方法五：PyCharm を使用して起動

#### server_api を実行
```bash
1、MemOS/docker/Dockerfile ファイルに入り、実行設定を変更
# Start the docker
CMD ["uvicorn", "memos.api.server_api:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

2、MemOS/src/memos/api ディレクトリに入り、直接 server_api.py を実行

```
