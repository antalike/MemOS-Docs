---
title: NebulaGraph ベースの平文メモリバックエンド
desc: "このモジュールは、メモリ強化システム（RAG、認知エージェント、またはパーソナルアシスタントなど）に NebulaGraph ベースのメモリグラフの保存およびクエリ機能を提供します。`BaseGraphDB` を継承し、マルチユーザー分離、構造化検索、外部ベクトルインデックスなどの機能をサポートし、大規模グラフ構築と推論に適しています。"
---

## なぜ NebulaGraph を選ぶのか?

* 大規模分散デプロイに適している
* 頂点、辺のタグと属性を柔軟に定義できる
* ベクトルインデックスをサポート（Nebula 5 以降）


## 推奨設定テンプレート

本番シナリオに適用でき、マルチテナントの論理分離と互換性があります：

```json
"graph_db": {
  "backend": "nebular",
  "config": {
    "uri": ["localhost:9669"],
    "user": "root",
    "password": "your_password",
    "space": "database_name",
    "user_name": "user_name",
    "use_multi_db": false,
    "auto_create": true,
    "embedding_dimension": 1024
  }
}
```

* `space`：Nebula グラフ空間名、データベースに相当
* `user_name`：マルチユーザーの論理分離に使用（フィルタ条件を自動注入）
* `embedding_dimension`：埋め込みモデルに応じて調整（例: text-embedding-3-large は 3072）
* `auto_create`: グラフ空間および Schema を自動作成するかどうか（テスト環境での使用を推奨）


## マルチテナント使用モード

NebulaGraph バックエンドは 2 種類のマルチテナントアーキテクチャをサポートします：

### 単一 DB 複数ユーザー（Shared DB + `user_name`）

複数のユーザー/Agent がグラフ空間を共有し、各ユーザーが論理分離を使用する場合に適しています：

```python
GraphDBConfigFactory(
  backend="nebular",
  config={
    "space": "shared_graph",
    "user_name": "alice",
    "use_multi_db": False,
    ...
  },
)
```

### 複数 DB（Multi DB、ユーザーごとに 1 つの空間）

より強いリソース分離が必要なシナリオに適しており、各ユーザーが 1 つのグラフ空間（space）を専有します：

```python
GraphDBConfigFactory(
  backend="nebular",
  config={
    "space": "user_alice_graph",
    "use_multi_db": True,
    "auto_create": True,
    ...
  },
)
```

## クイック使用例

```python
import os
import json
from memos.graph_dbs.factory import GraphStoreFactory
from memos.configs.graph_db import GraphDBConfigFactory

config = GraphDBConfigFactory(
        backend="nebular",
        config={
            "uri": json.loads(os.getenv("NEBULAR_HOSTS", "localhost")),
            "user": os.getenv("NEBULAR_USER", "root"),
            "password": os.getenv("NEBULAR_PASSWORD", "xxxxxx"),
            "space": os.getenv("space"),
            "use_multi_db": True,
            "auto_create": True,
            "embedding_dimension": os.getenv("embedding_dimension", 1024),
        },
    )

graph = GraphStoreFactory.from_config(config)

topic = TextualMemoryItem(
        memory="This research addresses long-term multi-UAV navigation for energy-efficient communication coverage.",
        metadata=TreeNodeTextualMemoryMetadata(
            memory_type="LongTermMemory",
            key="Multi-UAV Long-Term Coverage",
            hierarchy_level="topic",
            type="fact",
            memory_time="2024-01-01",
            source="file",
            sources=["paper://multi-uav-coverage/intro"],
            status="activated",
            confidence=95.0,
            tags=["UAV", "coverage", "multi-agent"],
            entities=["UAV", "coverage", "navigation"],
            visibility="public",
            updated_at=datetime.now().isoformat(),
            embedding=embed_memory_item(
                "This research addresses long-term "
                "multi-UAV navigation for "
                "energy-efficient communication "
                "coverage."
            ),
        ),
    )

graph.add_node(
    id=topic.id, memory=topic.memory, metadata=topic.metadata.model_dump(exclude_none=True)
)
```
