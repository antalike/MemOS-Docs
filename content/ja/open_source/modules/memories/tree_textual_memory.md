---
title: "TreeTextMemory: ツリー型プレーンテキストメモリ"
desc: >
    MemOSであなたの最初の**グラフベースの、ツリー型プレーンテキストメモリ**を構築しましょう！
    <br>
    **TreeTextMemory** は、豊富なコンテキスト情報と優れた説明可能性を維持しながら、構造化された方法でメモリを整理、関連付け、検索することをサポートします。
    <br>
    MemOSは現在、バックエンドとして[Neo4j](/open_source/modules/memories/neo4j_graph_db)を使用しており、今後はさらに多くのグラフデータベースをサポートする予定です。
---



## 目次

- [何を学べるか](#何を学べるか)
- [コア概念とワークフロー](#コア概念とワークフロー)
    - [メモリ構造](#メモリ構造)
    - [メタデータフィールド](#メタデータフィールド-treenodetextualmemorymetadata)
    - [コアワークフロー](#コアワークフロー)
- [API リファレンス](#api-リファレンス)
- [ハンズオン：0 から 1 へ](#ハンズオン0-から-1-へ)
    - [TreeTextMemory 設定の作成](#treetextmemory-設定の作成)
    - [TreeTextMemory の初期化](#treetextmemory-の初期化)
    - [構造化メモリの抽出](#構造化メモリの抽出)
    - [メモリの検索](#メモリの検索)
    - [インターネットからのメモリ取得（任意）](#インターネットからのメモリ取得任意)
    - [ワーキングメモリの置換](#ワーキングメモリの置換)
    - [バックアップと復元](#バックアップと復元)
    - [完全なコード例](#完全なコード例)
- [なぜ TreeTextMemory を選ぶのか](#なぜ-treetextmemory-を選ぶのか)
- [次のステップ](#次のステップ)

## 何を学べるか

このガイドを終える頃には、次のことができるようになります:
- 生テキストまたは会話から構造化メモリを抽出する
- それらを**ノード**としてグラフデータベースに保存する
- メモリを**階層構造**とセマンティックグラフにリンクする
- **ベクトル類似度+グラフ走査**を使用して検索する

## コア概念とワークフロー

### メモリ構造

`TreeTextMemory` 内の各ノードは `TextualMemoryItem` です:
- `id`: 一意のメモリID（省略した場合は自動生成）
- `memory`: メインテキスト
- `metadata`: 階層構造情報、埋め込み、タグ、エンティティ、ソース、状態を含む

### メタデータフィールド (`TreeNodeTextualMemoryMetadata`)

| フィールド           | 型                                                  | 説明                                |
| --------------- |-------------------------------------------------------| ------------------------------------------ |
| `memory_type`   | `"WorkingMemory"`, `"LongTermMemory"`, `"UserMemory"` | ライフサイクル分類                         |
| `status`        | `"activated"`, `"archived"`, `"deleted"`              | ノード状態                                |
| `visibility`    | `"private"`, `"public"`, `"session"`                  | アクセス範囲                               |
| `sources`       | `list[str]`                                           | ソース一覧 (例: ファイル, URLs)        |
| `source`        | `"conversation"`, `"retrieved"`, `"web"`, `"file"`    | 元のソース種別                       |
| `confidence`    | `float (0-100)`                                       | 確実性スコア                           |
| `entities`      | `list[str]`                                           | 言及されたエンティティまたは概念             |
| `tags`          | `list[str]`                                           | トピックタグ                              |
| `embedding`     | `list[float]`                                         | ベクトル埋め込みベースの類似検索     |
| `created_at`    | `str`                                                 | 作成タイムスタンプ(ISO 8601)              |
| `updated_at`    | `str`                                                 | 最終更新タイムスタンプ(ISO 8601)           |
| `usage`         | `list[str]`                                           | 使用履歴                           |
| `background`    | `str`                                                 | 追加コンテキスト                        |


::note
**ベストプラクティス**<br>
  意味のあるタグと背景を使用してください——それらはマルチホップ推論のためにグラフを整理するのに役立ちます。
::

### コアワークフロー

この例を実行すると、ワークフローは次のようになります:

1. **抽出:** LLMを使用して生テキストから構造化メモリを抽出します.


2. **埋め込み:** 類似検索のためにベクトル埋め込みを生成します.


3. **保存とリンク:** 関係を持つノードをグラフデータベース（Neo4j）に追加します.


4. **検索:** ベクトル類似度でクエリし、その後グラフホップによって結果を展開します.


::note
**ヒント**<br>グラフリンクは、純粋なベクトル検索では見逃される可能性があるコンテキストの取得に役立ちます!
::

## API リファレンス

### 初期化

```python
TreeTextMemory(config: TreeTextMemoryConfig)
```

### コアメソッド

| メソッド                      | 説明                                           |
| --------------------------- | ----------------------------------------------------- |
| `add(memories)`             | 1 つ以上のメモリ（アイテムまたは辞書）を追加する             |
| `replace_working_memory()`  | すべてのWorkingMemoryノードを置き換える                      |
| `get_working_memory()`      | すべてのWorkingMemoryノードを取得する                          |
| `search(query, top_k)`      | ベクトル+グラフ検索を使用してtop-kメモリを取得する   |
| `get(memory_id)`            | ID で単一のメモリを取得する                             |
| `get_by_ids(ids)`           | IDs で複数のメモリを取得する                        |
| `get_all()`                 | メモリグラフ全体を辞書としてエクスポートする            |
| `update(memory_id, new)`    | ID でメモリを更新する                                 |
| `delete(ids)`               | IDs でメモリを削除する                                |
| `delete_all()`              | すべてのメモリと関係を削除する                 |
| `dump(dir)`                 | グラフをディレクトリ内でJSONにシリアライズする              |
| `load(dir)`                 | 保存されたJSONファイルからグラフを読み込む                     |
| `drop(keep_last_n)`         | グラフをバックアップしてデータベースを削除し、N 個のバックアップを保持する       |

### ファイルストレージ

`dump(dir)` を呼び出すと、MemOSはツリー型プレーンテキストメモリをJSONファイルにエクスポートします:

```
<dir>/<config.memory_filename>
```

このファイルには、`nodes` と `edges` を持つJSON構造が含まれます。これは `load(dir)` を使用して再読み込みできます.

---

## ハンズオン：0 から 1 へ

::steps{}

### TreeTextMemory 設定の作成
定義するもの:
- あなたのembeddingモデル（例: nomic-embed-text:latest）, 
- あなたのグラフデータベースバックエンド(Neo4j),
- メモリ抽出器（LLMベース）（任意）.

```python
from memos.configs.memory import TreeTextMemoryConfig

config = TreeTextMemoryConfig.from_json_file("examples/data/config/tree_config.json")
```


### TreeTextMemory の初期化

```python
from memos.memories.textual.tree import TreeTextMemory

tree_memory = TreeTextMemory(config)
```

### 構造化メモリの抽出

メモリ抽出器を使用して、会話、ファイル、または文書を複数の`TextualMemoryItem`に解析します.

#### SimpleStructMemReader の使用（基本）

```python
from memos.mem_reader.simple_struct import SimpleStructMemReader

reader = SimpleStructMemReader.from_json_file("examples/data/config/simple_struct_reader_config.json")

scene_data = [[
    {"role": "user", "content": "Tell me about your childhood."},
    {"role": "assistant", "content": "I loved playing in the garden with my dog."}
]]

memories = reader.get_memory(scene_data, type="chat", info={"user_id": "1234"})
for m_list in memories:
    tree_memory.add(m_list)
```

#### MultiModalStructMemReader の使用（上級）

`MultiModalStructMemReader` はマルチモーダルコンテンツ（テキスト、画像、URL、ファイルなど）の処理をサポートし、異なるパーサーを自動認識（インテリジェントルーティング）します:

```python
from memos.configs.mem_reader import MultiModalStructMemReaderConfig
from memos.mem_reader.multi_modal_struct import MultiModalStructMemReader

# MultiModal Reader 設定を作成
multimodal_config = MultiModalStructMemReaderConfig(
    llm={
        "backend": "openai",
        "config": {
            "model_name_or_path": "gpt-4o-mini",
            "api_key": "your-api-key"
        }
    },
    embedder={
        "backend": "openai",
        "config": {
            "model_name_or_path": "text-embedding-3-small",
            "api_key": "your-api-key"
        }
    },
    chunker={
        "backend": "text_splitter",
        "config": {
            "chunk_size": 1000,
            "chunk_overlap": 200
        }
    },
    extractor_llm={
        "backend": "openai",
        "config": {
            "model_name_or_path": "gpt-4o-mini",
            "api_key": "your-api-key"
        }
    },
    # 任意: どのドメイン名が直接 Markdown を返すかを指定
    direct_markdown_hostnames=["github.com", "docs.python.org"]
)

# MultiModal Reader を初期化
multimodal_reader = MultiModalStructMemReader(multimodal_config)

# ========================================
# 例 1: 画像を含む会話を処理
# ========================================
scene_with_image = [[
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "これは私の庭です"},
            {"type": "image_url", "image_url": {"url": "https://example.com/garden.jpg"}}
        ]
    },
    {
        "role": "assistant",
        "content": "あなたの庭はとてもきれいです！"
    }
]]

memories = multimodal_reader.get_memory(
    scene_with_image,
    type="chat",
    info={"user_id": "1234", "session_id": "session_001"}
)
for m_list in memories:
    tree_memory.add(m_list)
print(f"✓ {len(memories)} 件のマルチモーダルメモリを追加しました")

# ========================================
# 例 2: Web URL を処理
# ========================================
scene_with_url = [[
    {
        "role": "user",
        "content": "この記事を分析してください: https://example.com/article.html"
    },
    {
        "role": "assistant",
        "content": "この記事の分析をお手伝いします"
    }
]]

url_memories = multimodal_reader.get_memory(
    scene_with_url,
    type="chat",
    info={"user_id": "1234", "session_id": "session_002"}
)
for m_list in url_memories:
    tree_memory.add(m_list)
print(f"✓ URL から {len(url_memories)} 件のメモリを抽出して追加しました")

# ========================================
# 例 3: ローカルファイルを処理
# ========================================
# サポートされるファイル形式: PDF, DOCX, TXT, Markdown, HTML など
file_paths = [
    "./documents/report.pdf",
    "./documents/notes.md",
    "./documents/data.txt"
]

file_memories = multimodal_reader.get_memory(
    file_paths,
    type="doc",
    info={"user_id": "1234", "session_id": "session_003"}
)
for m_list in file_memories:
    tree_memory.add(m_list)
print(f"✓ ファイルから {len(file_memories)} 件のメモリを抽出して追加しました")

# ========================================
# 例 4: 混合モード（テキスト + 画像 + URL）
# ========================================
mixed_scene = [[
    {
        "role": "user",
        "content": [
            {"type": "text", "text": "これは私のプロジェクト文書です:"},
            {"type": "text", "text": "https://github.com/user/project/README.md"},
            {"type": "image_url", "image_url": {"url": "https://example.com/diagram.png"}}
        ]
    }
]]

mixed_memories = multimodal_reader.get_memory(
    mixed_scene,
    type="chat",
    info={"user_id": "1234", "session_id": "session_004"}
)
for m_list in mixed_memories:
    tree_memory.add(m_list)
print(f"✓ 混合コンテンツから {len(mixed_memories)} 件のメモリを抽出して追加しました")
```

::alert{type="info"}
**MultiModal Reader の利点**<br>
- **インテリジェントルーティング**：コンテンツタイプ（画像/URL/ファイル）を自動認識し、適切なパーサーを選択します<br>
- **形式サポート**：PDF、DOCX、Markdown、HTML、画像など多様な形式をサポートします<br>
- **URL 解析**：Webページ内容を自動抽出します（GitHub、ドキュメントサイトなどを含む）<br>
- **大きなファイルの処理**：超大規模ファイルを自動チャンク化して処理し、token 上限超過を回避します<br>
- **コンテキスト保持**：スライディングウィンドウを使用してチャンク間のコンテキスト連続性を維持します
::

::note
**設定のヒント**<br>
- `direct_markdown_hostnames` パラメータを使用すると、どのドメイン名が直接 Markdown 形式を返すか指定できます<br>
- `mode="fast"` と `mode="fine"` の 2 つの抽出モードをサポートし、fine モードはより詳細に抽出します<br>
- 完全な例を参照: `/examples/mem_reader/multimodal_struct_reader.py`
::

### メモリの検索

ベクトル検索+グラフ検索を試してください:
```python
results = tree_memory.search("Talk about the garden", top_k=5)
for i, node in enumerate(results):
    print(f"{i}: {node.memory}")
```

### インターネットからのメモリ取得（任意）
Google / Bing / Bocha などの検索エンジンから、Webページ内容をリアルタイムで取得し、自動的にメモリノードへ分割することもできます。MemOS は統一インターフェースを提供します。

次の例では、「Alibaba 2024 ESG report」に関連するWebページを取得し、自動的に構造化メモリとして抽出する方法を示します。

```python

# embedder を作成
embedder = EmbedderFactory.from_config(
    EmbedderConfigFactory.model_validate({
        "backend": "ollama",
        "config": {"model_name_or_path": "nomic-embed-text:latest"},
    })
)

# リトリーバーを設定（BochaAI を例とする）
retriever_config = InternetRetrieverConfigFactory.model_validate({
    "backend": "bocha",
    "config": {
        "api_key": "sk-xxx",  # あなたの BochaAI API Key に置き換えてください
        "max_results": 5,
        "reader": {  # 自動チャンク化 Reader 設定
            "backend": "simple_struct",
            "config": ...,  # あなたのmem-reader config
        },
    }
})

# リトリーバーをインスタンス化
retriever = InternetRetrieverFactory.from_config(retriever_config, embedder)

# Web 検索を実行
results = retriever.retrieve_from_internet("Alibaba 2024 ESG report")

# メモリグラフに追加
for m in results:
    tree_memory.add(m)

```
また、TreeTextMemoryConfig の internet_retriever フィールドで直接設定することもできます。例えば:


```json
{
  "internet_retriever": {
    "backend": "bocha",
    "config": {
      "api_key": "sk-xxx",
      "max_results": 5,
      "reader": {
        "backend": "simple_struct",
        "config": ...
      }
    }
  }
}
```

このようにすると、tree_memory.search(query) を呼び出す際に、システムは自動的にインターネット検索（BochaAI / Google / Bing など）を呼び出し、その後結果をローカルグラフ内のノードと一緒にランク付けして返します。手動で retriever.retrieve_from_internet を呼び出す必要はありません

### ワーキングメモリの置換

現在の `WorkingMemory` を新しいノードで置き換えます:
```python
tree_memory.replace_working_memory(
    [{
        "memory": "User is discussing gardening tips.",
        "metadata": {"memory_type": "WorkingMemory"}
    }]
)
```

### バックアップと復元
ツリー構造の永続化ストレージと、いつでも再ロードをサポートします:
```python
tree_memory.dump("tmp/tree_memories")
tree_memory.load("tmp/tree_memories")
```

::


### 完全なコード例

この例は上記のすべての手順を統合し、エンドツーエンドの完全なフローを提供します —— コピーすればそのまま実行できます！

```python
from memos.configs.embedder import EmbedderConfigFactory
from memos.configs.memory import TreeTextMemoryConfig
from memos.configs.mem_reader import SimpleStructMemReaderConfig
from memos.embedders.factory import EmbedderFactory
from memos.mem_reader.simple_struct import SimpleStructMemReader
from memos.memories.textual.tree import TreeTextMemory

# 埋め込み設定
embedder_config = EmbedderConfigFactory.model_validate({
    "backend": "ollama",
    "config": {"model_name_or_path": "nomic-embed-text:latest"}
})
embedder = EmbedderFactory.from_config(embedder_config)

# TreeTextMemory を作成
tree_config = TreeTextMemoryConfig.from_json_file("examples/data/config/tree_config.json")
my_tree_textual_memory = TreeTextMemory(tree_config)
my_tree_textual_memory.delete_all()

# リーダー設定
reader_config = SimpleStructMemReaderConfig.from_json_file(
    "examples/data/config/simple_struct_reader_config.json"
)
reader = SimpleStructMemReader(reader_config)

# 会話から抽出
scene_data = [[
    {
        "role": "user",
        "content": "Tell me about your childhood."
    },
    {
        "role": "assistant",
        "content": "I loved playing in the garden with my dog."
    },
]]
memory = reader.get_memory(scene_data, type="chat", info={"user_id": "1234", "session_id": "2222"})
for m_list in memory:
    my_tree_textual_memory.add(m_list)

# 検索
results = my_tree_textual_memory.search(
    "Talk about the user's childhood story?",
    top_k=10
)
for i, r in enumerate(results):
    print(f"{i}'th result: {r.memory}")

# ドキュメントから追加[オプション]
doc_paths = ["./text1.txt", "./text2.txt"]
doc_memory = reader.get_memory(
  doc_paths, "doc", info={
      "user_id": "your_user_id",
      "session_id": "your_session_id",
  }
)
for m_list in doc_memory:
    my_tree_textual_memory.add(m_list)

# ダンプして破棄[オプション]
my_tree_textual_memory.dump("tmp/my_tree_textual_memory")
my_tree_textual_memory.drop()
```

## なぜ TreeTextMemory を選ぶのか

- **構造階層:** マインドマップのように記憶を整理します——ノードは親、子、および交差リンクを持つことができます。
- **グラフスタイルのリンク:** 純粋な階層構造を超えて-多ホップ推論チェーンを構築します。
- **セマンティック検索+グラフ拡張:** ベクトルとグラフの利点を組み合わせます。
- **説明可能性:** 記憶がどのように接続、統合、または時間とともに進化したかを追跡します。

::note
**試してみましょう**<br>ドキュメントまたはwebコンテンツから記憶ノードを追加します。手動でリンクするか、類似したノードを自動的に統合しましょう！
::

## 次のステップ

- **さらに詳しく知る[Neo4j](/open_source/modules/memories/neo4j_graph_db):** TreeTextMemory はグラフデータベースのバックエンドによって支えられています。Neo4j がノード、エッジ、トラバーサルをどのように処理するかを理解すると、より効果的な記憶階層、多ホップ推論、およびコンテキストリンク戦略を設計するのに役立ちます。
- **[Activation Memory](/open_source/modules/memories/kv_cache_memory) を追加:** 実行時のKV Cacheを使用してセッション状態をテストします。
- **グラフ推論を探索:** 多ホップ検索と回答合成のためのワークフローを構築します。
- **さらに先へ:** 高度なアプリケーションについては [API Reference](/api-reference/search-memories) を確認するか、`examples/`でさらに多くの例を実行してください。

これであなたのAgentは事実を記憶できるだけでなく、それらの間のつながりも記憶できます！
