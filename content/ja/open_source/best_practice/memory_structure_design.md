---
title: 記憶構造設計ベストプラクティス
---

## 記憶タイプの選択

### ツリー型プレーンテキスト記憶

**最適用途**：知識管理、研究アシスタント、階層構造データ  
```python
tree_config = {
    "backend": "tree_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        },
        "graph_db": {
            "backend": "neo4j",
            "config": {
                "host": "localhost",
                "port": 7687
            }
        }
    }
}
```

### 嗜好プレーンテキスト記憶

**最適用途**：パーソナライズ対話、インテリジェント推薦、顧客サービス

```python
preference_config = {
    "backend": "preference_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b",
            }
        },
        "vector_db": {
            "backend": "milvus",
            "config": {
                "collection_name": [
                    "explicit_preference",
                    "implicit_preference"
                ],
                "vector_dimension": 768,
                "distance_metric": "cosine",
                "uri": "./milvus_demo.db"
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text:latest"
            }
        },
        "reranker": {
            "backend": "cosine_local",
            "config": {
                "level_weights": {
                    "topic": 1.0,
                    "concept": 1.0,
                    "fact": 1.0
                },
                "level_field": "background"
            }
        }
    }
}
```

### 汎用プレーンテキスト記憶（ベクトルインデックス付き）

**最適用途**：対話型 AI、パーソナルアシスタント、質問応答システム

```python
general_config = {
    "backend": "general_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        },
        "vector_db": {
            "backend": "qdrant",
            "config": {
                "collection_name": "general"
            }
        },
        "embedder": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "nomic-embed-text"
            }
        }
    }
}
```

### 純粋プレーンテキスト記憶（テキストのみ）

**最適用途**：シンプルなアプリケーション、プロトタイプ開発

```python
naive_config = {
    "backend": "naive_text",
    "config": {
        "extractor_llm": {
            "backend": "ollama",
            "config": {
                "model_name_or_path": "qwen3:0.6b"
            }
        }
    }
}
```

## 容量計画

スケジューラを有効にしている場合、リソース使用状況を制御するために記憶容量を設定できます：

```python
scheduler_config = {
    "memory_capacities": {
        "working_memory_capacity": 20,        # ワーキングメモリ
        "user_memory_capacity": 500,          # ユーザー記憶
        "long_term_memory_capacity": 2000     # 長期記憶
    }
}
```
