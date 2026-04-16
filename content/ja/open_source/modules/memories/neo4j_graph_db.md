---
title: Neo4j グラフデータベース
desc: "このモジュールは、メモリ強化システム（RAG、認知エージェント、または個人メモリアシスタントなど）に対して、グラフ構造に基づくメモリ保存とクエリを提供します。 <br/>これは、クリーンな抽象クラス(`BaseGraphDB`)を定義し、**Neo4j** を使用して本番環境で利用可能な実装を実現しています。"
---

## なぜメモリにはグラフストレージが必要なのか?

ベクトルストレージとは異なり、グラフデータベースでは次が可能です:

- メモリを**チェーン、階層、因果関係**として整理する
- **マルチホップ推論**と**サブグラフ走査**を実行する
- メモリの**重複排除、競合検出、スケジューリング**をサポートする
- 時間の経過とともにグラフメモリを動的に進化させる

これは、長期的で、説明可能で、構成的なメモリ推論の中核を成します。

## 特長

- 異なるグラフデータベース間の統一インターフェース
- Neo4j の組み込みサポート
- ベクトル強化検索(`search_by_embedding`)をサポート
- モジュール式で、プラグ可能で、テスト可能
- [v0.2.1 新機能] **マルチテナントグラフストレージアーキテクチャ**（単一DB複数ユーザー）をサポート
- [v0.2.1 新機能] **Neo4j** Community Edition と互換

## ディレクトリ構造

```

src/memos/graph_dbs/
├── base.py            # BaseGraphDBの抽象インターフェース
├── factory.py         # ファクトリが設定からGraphDBをインスタンス化
├── neo4j.py           # Neo4jGraphDBの本番実装

````

## 使用方法

```python
from memos.graph_dbs.factory import GraphStoreFactory
from memos.configs.graph_db import GraphDBConfigFactory

# ステップ1：ファクトリ設定を構築
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "your_neo4j_user_name",
        "password": "your_password",
        "db_name": "memory_user1",
        "auto_create": True,
        "embedding_dimension": 768
    }
)

# ステップ2：グラフストレージをインスタンス化
graph = GraphStoreFactory.from_config(config)

# ステップ3：メモリを追加
graph.add_node(
    id="node-001",
    memory="Today I learned about retrieval-augmented generation.",
    metadata={"type": "WorkingMemory", "tags": ["RAG", "AI"], "timestamp": "2025-06-05", "sources": []}
)

````

## プラガブルな設計

### インターフェース: `BaseGraphDB`

````
関数機能紹介：
1.ノード操作：
挿入：add_node（単一ノードを追加）
     add_nodes_batch(ノードを一括追加)
クエリ：get_node（単一ノードをクエリ）
     get_nodes(複数ノードをクエリ)
     get_memory_count(ノード数をクエリ)
     node_not_exist（ノードが存在するかどうか）
     search_by_embedding(ベクトル検索ではfilter条件によるフィルタリングを追加可能で、filterの使用方法は関数neo4j_example.example_complex_shared_db_search_filterを参照して完全なメソッドドキュメントを取得してください)
更新：update_node(単一ノードを更新)
削除：delete_node(単一ノードを削除)
     clear (user_nameによってすべての関連ノードを削除)
     完全なメソッドドキュメントは関数neo4j_example.example_complex_shared_db_delete_memoryを参照してください

2.エッジ操作
挿入：add_edge(三つ組メモリを追加)
クエリ：get_edges(複数の関係をクエリ)
     edge_exists(関係が存在するかどうか)
     get_children_with_embeddings(関係タイプPARENTのノードリストをクエリ)
     get_subgraph(マルチホップノードをクエリ)
削除：delete_edge(関係を削除)

3.インポート/エクスポート操作：
  import_graph(シリアライズされた辞書からグラフ全体をインポートし、パラメータにはロード対象のすべてのノードとエッジの辞書を含みます パラメータ:{'nodes':[],'edges':[])
  export_graph(構造化形式ですべてのグラフノードとエッジをエクスポートし、ページネーションをサポート)

完全なメソッドドキュメントはsrc/memos/graph_dbs/base.pyを参照してください。
````
### 現在のバックエンド:

| バックエンド | 状態 | ファイル       |
| ------- | ------ | ---------- |
| Neo4j   | Stable | `neo4j.py` |

## 単一DBマルチテナント（Shared DB, Multi-Tenant）

`user_name` フィールドを設定することで、MemOS は単一の Neo4j データベース内で複数ユーザーのメモリグラフを分離してサポートし、協調システムやマルチロールシナリオに適用できます:

```python
config = GraphDBConfigFactory(
    backend="neo4j",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "your_password",
        "db_name": "shared-graph",
        "user_name": "alice",
        "use_multi_db": false,
        "embedding_dimension": 768,
    },
)
```

各ユーザーのデータは、読み書き、検索、エクスポートにおいて `user_name` フィールドによって論理的に分離され、システムが自動的にフィルタリングを完了します。

::note
**サンプル参照**<br>
余計な説明はなし、すべてコード内にあります`examples/basic_modules
/neo4j_example.example_complex_shared_db(db_name="shared-traval-group-complex-new")`
::

## Neo4j Community Edition サポート

新しいバックエンド識別子：`neo4j-community`

使用方法は標準の Neo4j と似ていますが、エンタープライズ機能は自動的に無効化されます:

- ❌ `auto_create` データベースはサポートされません
- ❌ ネイティブベクトルインデックスはサポートされません（外部ベクトルライブラリを使用する必要があり、現在はQdrantのみサポート）
- ✅ `user_name` 論理分離を強制的に有効化（Community Edition、またはuser_nameが同一業務に属し強い分離が不要な場合）

設定例：

```python
config = GraphDBConfigFactory(
    backend="neo4j-community",
    config={
        "uri": "bolt://localhost:7687",
        "user": "neo4j",
        "password": "12345678",
        "db_name": "paper",
        "user_name": "bob",
        "auto_create": False,
        "embedding_dimension": 768,
        "use_multi_db": False,
        "vec_config": {
            "backend": "qdrant",
            "config": {
                "host": "localhost",
                "port": 6333,
                "collection_name": "neo4j_vec_db",
                "vector_dimension": 768,
                "distance_metric": "cosine"
            },
        },
    },
)
```

::note
**サンプル参照**<br>`examples/basic_modules
/neo4j_example.example_complex_shared_db(db_name="paper", 
community=True)`
::

## 拡張

他の任意のグラフエンジンのサポートを追加できます（例：**TigerGraph**, **DGraph**, **Weaviate hybrid**）:

1. `BaseGraphDB` をサブクラス化する
2. 設定データクラスを作成する(例, `DgraphConfig`)
3. それを次に登録する:

   * `GraphDBConfigFactory.backend_to_class`
   * `GraphStoreFactory.backend_to_class`

参考実装として `src/memos/graph_dbs/neo4j.py` を参照してください。
