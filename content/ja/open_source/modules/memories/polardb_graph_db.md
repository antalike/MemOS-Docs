---
title: "PolarDB グラフデータベース"
desc: "MemOS は、**PolarDB**（Apache AGE 拡張に基づく）をグラフデータベースバックエンドとして使用し、知識グラフ形式の記憶データを保存および検索することをサポートします。PolarDB は PostgreSQL の強力な機能とグラフデータベースの柔軟性を組み合わせており、特にリレーショナルデータとグラフデータのクエリを同時に行う必要があるシナリオに適しています。"
---

## 機能特性

::list{icon="ph:check-circle-duotone"}
- 完全なグラフデータベース操作：ノードの作成・削除・更新・検索、エッジ管理
- ベクトル埋め込み検索：IVFFlat インデックスをサポートするセマンティック検索
- コネクションプール管理：データベース接続を自動管理し、高並行性をサポート
- マルチテナント分離：物理および論理の 2 つの分離モードをサポート
- JSONB 属性保存：柔軟なメタデータ保存
- バッチ操作：ノードとエッジのバッチ挿入をサポート
- 自動タイムスタンプ：`created_at` と `updated_at` を自動で維持
- SQL インジェクション防御：パラメータ化クエリと文字列エスケープを内蔵
::

## ディレクトリ構造

```
MemOS/
└── src/
    └── memos/
        ├── configs/
        │   └── graph_db.py              # PolarDBGraphDBConfig 設定クラス
        └── graph_dbs/
            ├── base.py                  # BaseGraphDB 抽象基底クラス
            ├── factory.py               # GraphDBFactory ファクトリクラス
            └── polardb.py               # PolarDBGraphDB 実装
```

## クイックスタート

### 1. 依存関係のインストール

```bash
# psycopg2 ドライバーをインストール（いずれか 1 つを選択）
pip install psycopg2-binary  # 推奨：事前コンパイル済みバージョン
# または
pip install psycopg2          # PostgreSQL 開発ライブラリが必要

# MemOS をインストール
pip install MemoryOS -U
```

### 2. PolarDB の設定

#### 方法 1：設定ファイルを使用（推奨）

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "localhost",
      "port": 5432,
      "user": "postgres",
      "password": "your_password",
      "db_name": "memos_db",
      "user_name": "alice",
      "use_multi_db": true,
      "auto_create": false,
      "embedding_dimension": 1024,
      "maxconn": 100
    }
  }
}
```

#### 方法 2：コードによる初期化

```python
from memos.configs.graph_db import PolarDBGraphDBConfig
from memos.graph_dbs.polardb import PolarDBGraphDB

# 設定を作成
config = PolarDBGraphDBConfig(
    host="localhost",
    port=5432,
    user="postgres",
    password="your_password",
    db_name="memos_db",
    user_name="alice",
    use_multi_db=True,
    embedding_dimension=1024,
    maxconn=100
)

# データベースを初期化
graph_db = PolarDBGraphDB(config)
```

### 3. 基本操作の例

```python
# ========================================
# ステップ 1: ノードを追加
# ========================================
node_id = graph_db.add_node(
    label="Memory",
    properties={
        "content": "Python は高級プログラミング言語の一種です",
        "memory_type": "Knowledge",
        "tags": ["programming", "python"]
    },
    embedding=[0.1, 0.2, 0.3, ...],  # 1024 次元ベクトル
    user_name="alice"
)
print(f"✓ ノードを作成しました: {node_id}")

# ========================================
# ステップ 2: ノードを更新
# ========================================
graph_db.update_node(
    id=node_id,
    fields={
        "content": "Python はインタプリタ型でオブジェクト指向の高級プログラミング言語の一種です",
        "updated": True
    },
    user_name="alice"
)
print("✓ ノードを更新しました")

# ========================================
# ステップ 3: 関係を作成
# ========================================
# まず 2 つ目のノードを作成
node_id_2 = graph_db.add_node(
    label="Memory",
    properties={
        "content": "Django は Python の Web フレームワークです",
        "memory_type": "Knowledge"
    },
    embedding=[0.15, 0.25, 0.35, ...],
    user_name="alice"
)

# エッジを作成
edge_id = graph_db.add_edge(
    source_id=node_id,
    target_id=node_id_2,
    edge_type="RELATED_TO",
    properties={
        "relationship": "フレームワークと言語",
        "confidence": 0.95
    },
    user_name="alice"
)
print(f"✓ 関係を作成しました: {edge_id}")

# ========================================
# ステップ 4: ベクトル検索
# ========================================
query_embedding = [0.12, 0.22, 0.32, ...]  # クエリベクトル

results = graph_db.search_by_embedding(
    embedding=query_embedding,
    top_k=5,
    memory_type="Knowledge",
    user_name="alice"
)

print(f"\n🔍 {len(results)} 個の類似ノードが見つかりました:")
for node in results:
    print(f"  - {node.get('content')} (類似度: {node.get('score', 'N/A')})")

# ========================================
# ステップ 5: ノードを削除
# ========================================
graph_db.delete_node(id=node_id, user_name="alice")
print(f"✓ ノード {node_id} を削除しました")
```

## 設定の詳細

### PolarDBGraphDBConfig パラメータ説明

| パラメータ | 型 | デフォルト値 | 必須 | 説明 |
|------|------|--------|------|------|
| `host` | str | - | ✓ | データベースホストアドレス |
| `port` | int | 5432 | ✗ | データベースポート |
| `user` | str | - | ✓ | データベースユーザー名 |
| `password` | str | - | ✓ | データベースパスワード |
| `db_name` | str | - | ✓ | 対象データベース名 |
| `user_name` | str | None | ✗ | テナント識別子（論理分離に使用） |
| `use_multi_db` | bool | True | ✗ | 複数データベースによる物理分離を使用するか |
| `auto_create` | bool | False | ✗ | データベースを自動作成するか |
| `embedding_dimension` | int | 1024 | ✗ | ベクトル埋め込み次元 |
| `maxconn` | int | 100 | ✗ | コネクションプールの最大接続数 |

### マルチテナントモード比較

| 特性 | 物理分離<br/>(`use_multi_db=True`) | 論理分離<br/>(`use_multi_db=False`) |
|------|-----------------------------------|-------------------------------------|
| **分離レベル** | データベースレベル | アプリケーション層のラベルフィルタリング |
| **設定要件** | `db_name` は通常 `user_name` と等しい | `user_name` の指定が必須 |
| **性能** | より良い（独立リソース） | 比較的良い（共有リソース） |
| **コスト** | 高い（テナントごとに独立 DB） | 低い（共有データベース） |
| **適用シナリオ** | エンタープライズ顧客、高いセキュリティ要件 | SaaS マルチテナント、開発テスト |
| **データ移行** | 容易（データベース全体をエクスポート） | ラベルでフィルタリングが必要 |

### 設定例

#### 例 1：物理分離（エンタープライズ版推奨）

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "prod-polardb.example.com",
      "port": 5432,
      "user": "admin",
      "password": "secure_password",
      "db_name": "customer_001",
      "user_name": null,
      "use_multi_db": true,
      "auto_create": false,
      "embedding_dimension": 1536,
      "maxconn": 200
    }
  }
}
```

#### 例 2：論理分離（SaaS 推奨）

```json
{
  "graph_db_store": {
    "backend": "polardb",
    "config": {
      "host": "shared-polardb.example.com",
      "port": 5432,
      "user": "app_user",
      "password": "app_password",
      "db_name": "shared_memos",
      "user_name": "tenant_alice",
      "use_multi_db": false,
      "auto_create": false,
      "embedding_dimension": 768,
      "maxconn": 50
    }
  }
}
```

## 高度な機能

### 1. ノードのバッチ挿入

```python
# ノードをバッチ追加（高性能）
nodes_data = [
    {
        "label": "Memory",
        "properties": {"content": f"ノード {i}", "memory_type": "Test"},
        "embedding": [0.1 * i] * 1024,
    }
    for i in range(100)
]

node_ids = graph_db.add_nodes_batch(
    nodes=nodes_data,
    user_name="alice"
)
print(f"✓ {len(node_ids)} 個のノードをバッチ作成しました")
```

### 2. 複雑なクエリの例

```python
# 特定タイプの記憶を検索し、時間順にソート
def get_recent_memories(graph_db, memory_type, limit=10):
    """最近の記憶ノードを取得"""
    query = f"""
        SELECT * FROM "{graph_db.db_name}_graph"."Memory"
        WHERE properties->>'memory_type' = %s
          AND properties->>'user_name' = %s
        ORDER BY updated_at DESC
        LIMIT %s
    """
    
    conn = graph_db._get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, [memory_type, "alice", limit])
            results = cursor.fetchall()
            return results
    finally:
        graph_db._return_connection(conn)

# 使用例
recent = get_recent_memories(graph_db, "WorkingMemory", limit=5)
print(f"最近 5 件の作業記憶: {len(recent)} 件")
```

### 3. ベクトルインデックス最適化

```python
# ベクトルインデックスを作成または更新
graph_db.create_index(
    label="Memory",
    vector_property="embedding",
    dimensions=1024,
    index_name="memory_vector_index"
)
print("✓ ベクトルインデックスを最適化しました")
```

### 4. コネクションプール監視

```python
# コネクションプールの状態を確認（デバッグ専用）
import logging
logging.basicConfig(level=logging.DEBUG)

# 接続取得時に詳細ログを出力
conn = graph_db._get_connection()
# [DEBUG] [_get_connection] Successfully acquired connection from pool
graph_db._return_connection(conn)
# [DEBUG] [_return_connection] Successfully returned connection to pool
```

## BaseGraphDB インターフェース

PolarDB は `BaseGraphDB` 抽象クラスのすべてのメソッドを実装しており、他のグラフデータベースバックエンドとの相互交換性を保証します。

### コアメソッド

| メソッド | 説明 | パラメータ |
|------|------|------|
| `add_node()` | 単一ノードを追加 | label, properties, embedding, user_name |
| `add_nodes_batch()` | ノードをバッチ追加 | nodes, user_name |
| `update_node()` | ノード属性を更新 | id, fields, user_name |
| `delete_node()` | ノードを削除 | id, user_name |
| `delete_node_by_params()` | 条件に応じてノードを削除 | params, user_name |
| `add_edge()` | 関係を作成 | source_id, target_id, edge_type, properties, user_name |
| `update_edge()` | 関係属性を更新 | edge_id, properties, user_name |
| `delete_edge()` | 関係を削除 | edge_id, user_name |
| `search_by_embedding()` | ベクトル類似度検索 | embedding, top_k, memory_type, user_name |
| `get_node()` | 単一ノードを取得 | id, user_name |
| `get_memory_count()` | ノード数を集計 | memory_type, user_name |
| `remove_oldest_memory()` | 古い記憶をクリーンアップ | memory_type, keep_latest, user_name |

### 完全なメソッドシグネチャ例

```python
from typing import Any

# ノードを追加
def add_node(
    self,
    label: str = "Memory",
    properties: dict[str, Any] | None = None,
    embedding: list[float] | None = None,
    user_name: str | None = None
) -> str:
    """グラフデータベースに新しいノードを追加"""
    pass

# ベクトル検索
def search_by_embedding(
    self,
    embedding: list[float],
    top_k: int = 10,
    memory_type: str | None = None,
    user_name: str | None = None,
    filters: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    """ベクトル埋め込みに基づいて類似度検索を実行"""
    pass

# バッチ操作
def add_nodes_batch(
    self,
    nodes: list[dict[str, Any]],
    user_name: str | None = None
) -> list[str]:
    """複数のノードをバッチ追加"""
    pass
```

## 拡張開発ガイド

PolarDB に基づいてカスタム機能を実装する必要がある場合は、`PolarDBGraphDB` クラスを継承できます：

```python
from memos.graph_dbs.polardb import PolarDBGraphDB
from memos.configs.graph_db import PolarDBGraphDBConfig

class CustomPolarDBGraphDB(PolarDBGraphDB):
    """カスタム PolarDB グラフデータベース実装"""
    
    def __init__(self, config: PolarDBGraphDBConfig):
        super().__init__(config)
        # カスタム初期化ロジック
        self.custom_index_created = False
    
    def create_custom_index(self):
        """カスタムインデックスを作成"""
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(f"""
                    CREATE INDEX IF NOT EXISTS idx_custom_field
                    ON "{self.db_name}_graph"."Memory" 
                    ((properties->>'custom_field'));
                """)
                conn.commit()
                self.custom_index_created = True
                print("✓ カスタムインデックスを作成しました")
        except Exception as e:
            print(f"❌ インデックスの作成に失敗しました: {e}")
            conn.rollback()
        finally:
            self._return_connection(conn)
    
    def search_by_custom_field(self, field_value: str):
        """カスタムフィールドに基づいて検索"""
        query = f"""
            SELECT * FROM "{self.db_name}_graph"."Memory"
            WHERE properties->>'custom_field' = %s
        """
        
        conn = self._get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(query, [field_value])
                results = cursor.fetchall()
                return results
        finally:
            self._return_connection(conn)

# カスタム実装を使用
config = PolarDBGraphDBConfig(
    host="localhost",
    port=5432,
    user="postgres",
    password="password",
    db_name="custom_db"
)

custom_db = CustomPolarDBGraphDB(config)
custom_db.create_custom_index()
results = custom_db.search_by_custom_field("special_value")
```

## 参考リソース

- [Apache AGE 公式ドキュメント](https://age.apache.org/)
- [PostgreSQL コネクションプールドキュメント](https://www.psycopg.org/docs/pool.html)
- [PolarDB 公式ドキュメント](https://www.alibabacloud.com/product/polardb)
- [MemOS GitHub リポジトリ](https://github.com/MemOS-AI/MemOS)

## 次のステップ

- [Neo4j グラフデータベース](./neo4j_graph_db.md) の使用方法を確認する
- [汎用テキスト記憶](./general_textual_memory.md) の設定を確認する
- [ツリー型テキスト記憶](./tree_textual_memory.md) の高度な機能を探る
