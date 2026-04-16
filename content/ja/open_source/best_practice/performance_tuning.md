---
title: パフォーマンスチューニング
---

MemOS のパフォーマンス最適化は主に **記憶抽出 (Mem-Reader)**、**ベクトル埋め込み (Embedding)**、および **検索ランキング (Search Ranking)** を中心に行われます。ほとんどの設定は、YAML 設定ファイル（例: `memos_config_w_scheduler.yaml`）を変更するか、ソースコードを直接調整することで実現できます。

## 1. 記憶抽出最適化 (Mem-Reader Prompt)

slow_embedder = {
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "nomic-ai/nomic-embed-text-v1.5"
    }
}
```
`Mem-Reader` コンポーネントは、対話から重要情報を抽出する役割を担います。現在の実装では、Prompt はソースコードテンプレート内で定義されています。

### Prompt テンプレートの変更

抽出ロジックを調整するには（例: 雑談を無視し、特定の事実に集中する）、ソースコードファイルを直接修正する必要があります:

*   **ファイルパス**: `src/memos/templates/mem_reader_prompts.py`
*   **対象変数**: `SIMPLE_STRUCT_MEM_READER_PROMPT` (英語用) または `SIMPLE_STRUCT_MEM_READER_PROMPT_ZH` (中国語用)

**変更例**：

`src/memos/templates/mem_reader_prompts.py` 内:

```python
SIMPLE_STRUCT_MEM_READER_PROMPT = """
You are a preference extraction expert.
Your task is to extract ONLY user preferences and dislikes from the conversation.
Ignore all other information including plans and daily events.
...
"""
```

## 2. ベクトル埋め込みモデル最適化 (Embedding Models)

Embedding モデルの選択は、セマンティック検索の精度と速度を決定します。通常は YAML 設定ファイルで設定します。

### 設定ファイルの変更

設定ファイル（例: `memos_config.yaml`）で、`mem_reader` または `text_mem` 配下の `embedder` セクションを見つけてください:

```yaml
mem_reader:
  backend: "simple_struct"
  config:
    # ... その他の設定
    embedder:
      # オプション A: Ollama を使用 (高速、ローカル向け)
      backend: "ollama"
      config:
        model_name_or_path: "nomic-embed-text:latest"
      
      # オプション B: Sentence Transformer を使用 (高精度、VRAM 使用量が大きい)
      # backend: "sentence_transformer"
      # config:
      #   model_name_or_path: "BAAI/bge-m3"
```

*   **推奨モデル**:
    *   **高速/ローカル**: `nomic-embed-text` (Ollama)
    *   **高精度**: `BAAI/bge-m3` または `OpenAI` の `text-embedding-3-small` (`universal_api` backend の使用が必要)

## 3. 検索ランキング最適化 (Search Ranking)

検索パフォーマンスは主にリコール件数 (`top_k`) と再ランキング戦略の影響を受けます。

### リコール件数の調整 (Top-K)

`mem_scheduler` の設定で `top_k` を調整します。この値を増やすとリコール率を高められますが、処理時間が増加します。

```yaml
mem_scheduler:
  backend: "general_scheduler"
  config:
    # 初期検索の候補件数
    top_k: 20 
    # ...
```

### Reranker の導入 (上級)

MemOS は、検索後に Reranker を導入して精密ランキングを行うことをサポートしています。これは通常、`Searcher` コンポーネントを初期化する際に指定する必要があります。開発者として MemOS を統合している場合は、コード内で設定できます:

```python
from memos.reranker.factory import RerankerFactory

# Searcher の初期化時
reranker = RerankerFactory.from_config({
    "backend": "sentence_transformer",
    "config": {
        "model_name_or_path": "BAAI/bge-reranker-base"
    }
})
```

## 4. システムリソースと容量制限

各種記憶の容量を適切に制限することで、メモリの無制限な増加を防ぎ、検索速度を維持できます。これは通常、`mem_cube` の設定で行います。

### メモリ容量設定 (Memory Size)

YAML 設定ファイルで、`memory_size` 辞書を設定します:

```yaml
mem_cube:
  backend: "general"
  config:
    text_mem:
      backend: "tree"
      config:
        # 各種記憶の項目数を制限
        memory_size:
          WorkingMemory: 10         # 直近数ラウンドの対話の短期記憶
          LongTermMemory: 2000      # 長期記憶の上限
          UserMemory: 500           # ユーザープロファイル/嗜好の上限
```

### バッチ処理と並行性

`mem_scheduler` では並行処理能力を設定できます:

```yaml
mem_scheduler:
  config:
    thread_pool_max_workers: 10     # 並列処理スレッド数
    consume_interval_seconds: 0.01  # メッセージキュー消費間隔
    enable_parallel_dispatch: true  # 並列ディスパッチを有効化
```
