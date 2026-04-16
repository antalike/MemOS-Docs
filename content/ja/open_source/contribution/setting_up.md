---
title: 開発環境を構成する
desc: MemOS の開発に参加するには、ローカルで開発環境を構成する必要があります。
---

::steps{level="4"}

#### リポジトリを Fork してクローンする

ローカルでプロジェクトリポジトリをセットアップします：

- GitHub でリポジトリを fork する
- あなたの fork をローカルにクローンする：

  ```bash
  git clone https://github.com/YOUR-USERNAME/MemOS.git
  cd MemOS
  ```

- アップストリームリポジトリをリモートとして追加する：

  ```bash
  git remote add upstream https://github.com/MemTensor/MemOS.git
  ```

#### 開発依存関係を準備する

ローカルに以下がインストールされていることを確認してください：

- Git
- Python 3.9+
- Make

Python を確認する：

```bash
python3 --version
```

#### Poetry をインストールする

MemOS は Poetry を使用して Python 依存関係を管理します。公式インストールスクリプトの使用を推奨します：

```bash
curl -sSL https://install.python-poetry.org | python -
```

インストールが成功したか確認する：

```bash
poetry --version
```

`poetry: command not found` と表示された場合は、インストーラー出力で案内された Poetry 実行ファイルのディレクトリを PATH に追加し、その後ターミナルを再度開いて確認してください。

その他のインストールオプションについては、[公式インストールガイド](https://python-poetry.org/docs/#installing-with-the-official-installer) を参照してください。

#### 依存関係をインストールし Pre-commit フックを設定する

リポジトリのルートディレクトリで、すべての依存関係と開発ツールをインストールします：

```bash
make install
```

ヒント：

- ブランチを切り替えた場合や依存関係に変更があった場合は、環境の一貫性を保つために**`make install` を再実行する**必要がある可能性があります

### メモリモジュールと依存関係の選択を理解する
環境を構成する前に、まず MemOS のメモリモジュールの分類と、それに対応するデータベース依存関係を理解する必要があります。これにより、インストールすべきコンポーネントが決まります。

#### メモリタイプ

MemOS のメモリシステムは主に 2 種類に分かれます（括弧内は設定項目 `backend` の識別子です）：

- **平文メモリ (Textual Memory)**：事実メモリに属し、**この中から 1 つを選択する必要があります**。
  - `tree` (`tree_text`): ツリー状メモリ（推奨）、最も構造化の程度が高いです。
  - `general` (`general_text`): 汎用メモリ、ベクトル検索に基づきます。
  - `naive` (`naive_text`): シンプルメモリ、特別な依存関係はありません（テスト専用）。
- **選好メモリ (Preference Memory)**：ユーザー選好に属し、**任意**です。
  - `pref`: ユーザー選好の保存と検索に使用します。

#### データベース依存関係マトリクス

異なるメモリタイプには異なるデータベースサポートが必要です：

| メモリタイプ | 依存コンポーネント | 備考 |
| :--- | :--- | :--- |
| **Tree** | **グラフデータベース** | 必須。Neo4j Desktop, Neo4j Community , PolarDB をサポート |
| **General** | **ベクトルデータベース** | 必須。Qdrant（または互換ベクトル DB）の使用を推奨 |
| **Naive** | なし | データベースのインストール不要 |
| **Pref** | **Milvus** | 選好メモリを有効にする場合、Milvus のインストールが必須 |

#### Tree メモリとグラフデータベースの選択について

**Tree 平文メモリバックエンド**（設定識別子は通常 `tree_text`）を使用することを選択した場合、保存およびクエリの基盤として **グラフデータベース（Graph DB）** を準備する必要があります。現在の選択肢には以下が含まれます：

- **Neo4j Desktop**（PC 推奨）：ローカルマシンにインストールし、GUI でデータベースを管理します。素早い導入とデバッグに適しています。
- **PolarDB**：クラウド上でホストされるグラフデータベースサービス（有料）で、本番環境またはチームコラボレーションのシナリオに適しています。
- **Neo4j Community**（コミュニティ版）：オープンソースで無料、サーバーまたは Linux 環境へのデプロイに適しています。

**特記事項**：

- **Neo4j Desktop** を使用する場合、主にデータベースの起動と接続に注目すればよく、日常的なデバッグがより便利です。
- **Neo4j Community** を使用する場合、次の点に注意してください：これは**ネイティブなベクトルインデックス機能を提供しません**。ワークフローでベクトル検索/類似度検索機能が必要な場合、通常は**外部ベクトルライブラリ**（たとえば Qdrant）によって関連機能を補完する必要があります。

#### このチュートリアルの構成方案

開発者がコアパスをすばやく通せるようにするため、このチュートリアルでは以下の組み合わせを採用します：

- **平文メモリバックエンド**：`tree_text`（概念的には Tree メモリに対応）
- **グラフデータベース**：Neo4j Community（Docker を使用して起動可能）
- **ベクトル機能**：Qdrant（ローカルモード）

Neo4j Community はネイティブなベクトルインデックスをサポートしていないため、このチュートリアルではベクトル機能の補完として Qdrant を導入します。環境の複雑さを下げるため、**Qdrant のサーバープロセスは起動しません**（Qdrant コンテナは実行しません）。代わりに、Qdrant の**ローカルモード**を使用します：設定でローカルパス（`path`）の形式で保存場所を指定し、システムがそのディレクトリ配下で必要なデータファイルを初期化して読み書きします。パスを明示的に指定しない場合は、デフォルトパスを使用して初期化および永続化が行われます（具体的なデフォルト位置はプロジェクト実装と設定に準拠します）。

#### 設定ファイルを作成する

.env の内容について、クイック設定は docker インストール配下の[env 設定](/open_source/getting_started/installation#2.-.env-内容)を参照してください
.env の詳細設定は[env設定](/open_source/getting_started/rest_api_server/#本地运行)を参照してください

::note
**ご注意ください**<br>
.env ファイルの設定は MemOS プロジェクトのルートディレクトリに配置する必要があります
::

```bash
cd MemOS
touch .env
```
#### Dockerfile ファイルを構成する
::note
**ご注意ください**<br>
Dockerfile ファイルは docker ディレクトリ配下にあります
::

```bash
# docker ディレクトリに入る
cd docker
```
クイックモードとフルモードがあり、軽量パッケージ（arm と x86 を区別）とフルパッケージ（arm と x86 を区別）を使い分けできます

```bash

● 軽量パッケージ：サイズが大きすぎる nvidia 関連などの依存関係を簡素化し、イメージを軽量化して、ローカルデプロイをより軽量かつ高速にします。
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base:v1.0
url: registry.cn-shanghai.aliyuncs.com/memtensor/memos-base-arm:v1.0

● フルパッケージ：MemOS のすべての依存パッケージをイメージ化しており、完全な機能を体験できます。Dockerfile を設定することで直接ビルドして起動できます。
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

#### docker クライアントを起動する
```bash
 # docker がインストールされていない場合は、対応するバージョンをインストールしてください。ダウンロード先は以下です：
 https://www.docker.com/

 # インストール完了後、クライアント経由で docker を起動することも、コマンドライン経由で docker を起動することもできます
 # コマンドライン経由で docker を起動
 sudo systemctl start docker

# インストール完了後、docker の状態を確認
docker ps

# docker イメージを確認（不要でも可）
docker images

```

#### ビルドしてサービスを起動する ：
::note
**ご注意ください**<br>
ビルドコマンドも docker ディレクトリ配下で実行します
::
```bash
# docker ディレクトリ配下で
docker compose up neo4j
```
#### 新しいターミナルを開いて server ポートを起動する ：

```bash
cd MemOS
make serve
```
::
