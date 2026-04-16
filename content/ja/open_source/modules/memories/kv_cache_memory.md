---
title: "KVCacheMemory: アクティベーションメモリ"
desc: "`KVCacheMemory` はMemOSにおいてKV Cacheを保存および管理するための専用メモリモジュールであり、主に大規模言語モデル（LLMs）の推論を高速化し、効率的なコンテキスト再利用をサポートするために使用されます。アクティベーションメモリとして、対話型および生成AIシステムの性能向上に役立ちます。"
---

## KV Cacheメモリの使用例

MemOSでは、KV Cacheは**意味的に安定しており頻繁に再利用される背景情報**の保存に最適であり、例えば以下のようなものです：
- よくある質問（FAQs）または特定分野の知識
- 以前の対話履歴

これらの安定した**プレーンテキストメモリアイテム**は、`MemScheduler`モジュールによって自動的に識別および管理されます。選択されると、それらは事前にKV形式の表現(`KVCacheItem`)へ変換されます。この事前計算ステップは、メモリのアクティベーション状態（キーとバリューのテンソル）を再利用可能な形式で保存し、推論中にそれらをモデルのアテンションキャッシュへ注入できるようにします。

一度変換されると、これらのKVメモリは元の内容を再エンコードすることなく**クエリ間で再利用**できます。これにより、大量のテキストを処理および保存する際の計算オーバーヘッドが削減され、**高速な応答時間**と**高スループット**を必要とするアプリケーションにとって理想的な選択肢となります。

## なぜKV Cacheメモリなのか
`MemScheduler`をKV Cacheメモリと統合することで、特にLLM推論の**プレフィル段階**において大幅な性能最適化を実現できます。

### KV Cacheメモリなし

- 新しいクエリごとに、背景知識を含む完全なプロンプトテンプレートへ追加されます。
- モデルは、変更されていないメモリであっても、シーケンス全体にわたって**token埋め込みとアテンションを再計算**しなければなりません。

### KV Cacheメモリあり

- 背景知識はキーとバリューのテンソルの形式で**一度キャッシュ**されます。
- 各クエリについて、新しいユーザー入力（クエリtoken）のみがエンコードされます。
- 以前にキャッシュされたKVがアテンション機構へ直接注入されます。

### 利点

この分離により、プレフィル段階での冗長な計算が削減され、その結果次のようになります:

- 背景知識の繰り返しエンコードをスキップ
- クエリtokenとキャッシュされたメモリ間のアテンション計算が高速化
- 生成プロセスにおける**初回token時間(Time To First Token, TTFT)** のレイテンシ低減

この最適化は、以下の点で特に価値があります:

- マルチターンチャットボットの対話
- 検索拡張生成またはコンテキスト拡張生成(RAG, CAG)
- 固定ドキュメントまたはFAQスタイルのメモリ上で動作するアシスタント


### KV Cacheメモリ高速化評価

KVベースのメモリ注入が性能に与える影響を検証するために、MemOSにおいて実際のメモリ再利用を模擬した一連の対照実験を実施しました。

#### 実験設定

典型的な使用では、`MemScheduler`モジュールが継続的に対話パターンを追跡し、高頻度で安定したプレーンテキストメモリをKV形式へ昇格させます。これらのKVメモリはアクティベーションキャッシュとしてGPUメモリにロードされ、推論プロセス中に繰り返し使用されます。

評価では2つのメモリ戦略を比較します:

1. **プロンプトベースの注入**: 背景知識が生テキストとして追加される
2. **KV Cache注入**: メモリがモデルのアテンションキャッシュへ直接注入される

これらの戦略を以下でテストしました:

- **3種類のテキスト長**: 短文、中程度の長さのテキスト、長文
- **3種類のクエリタイプ**: 短いクエリ、中程度のクエリ、長いクエリ

主要な指標は**初回token時間(TTFT)** であり、これは応答的生成における重要なレイテンシ指標です。

#### 実験結果

以下の表は3つのモデルにまたがる結果を示しています(Qwen3-8B, Qwen3-32B, Qwen2.5-72B). KV Cache注入におけるTTFTは一貫してプロンプトベース注入より低く、一方で両戦略の出力tokenは一貫していました.

::note{icon="ri:bnb-fill"}
`Build (s)`は、メモリをKV形式へ変換する一度限りの前処理コストを指し、複数のクエリにわたって償却されます.
::

| Model       | Ctx    | CtxTok | Qry    | QryTok | Build (s) | KV TTFT (s) | Dir TTFT (s) | Speedup (%) |
| ----------- | ------ | ------ | ------ | ------ | --------- | ----------- | ------------ | ----------- |
| Qwen3-8B    | long   | 6064   | long   | 952.7  | 0.92      | 0.50        | 2.37         | 79.1        |
|             |        |        | medium | 302.7  | 0.93      | 0.19        | 2.16         | 91.1        |
|             |        |        | short  | 167    | 0.93      | 0.12        | 2.04         | 94.2        |
|             | medium | 2773   | long   | 952.7  | 0.41      | 0.43        | 1.22         | 64.6        |
|             |        |        | medium | 302.7  | 0.41      | 0.16        | 1.08         | 85.1        |
|             |        |        | short  | 167    | 0.43      | 0.10        | 0.95         | 89.7        |
|             | short  | 583    | long   | 952.7  | 0.12      | 0.39        | 0.51         | 23.0        |
|             |        |        | medium | 302.7  | 0.12      | 0.14        | 0.32         | 55.6        |
|             |        |        | short  | 167    | 0.12      | 0.08        | 0.29         | 71.3        |
| Qwen3-32B   | long   | 6064   | long   | 952.7  | 0.71      | 0.31        | 1.09         | 71.4        |
|             |        |        | medium | 302.7  | 0.71      | 0.15        | 0.98         | 84.3        |
|             |        |        | short  | 167    | 0.71      | 0.11        | 0.96         | 88.8        |
|             | medium | 2773   | long   | 952.7  | 0.31      | 0.24        | 0.56         | 56.9        |
|             |        |        | medium | 302.7  | 0.31      | 0.12        | 0.47         | 75.1        |
|             |        |        | short  | 167    | 0.31      | 0.08        | 0.44         | 81.2        |
|             | short  | 583    | long   | 952.7  | 0.09      | 0.20        | 0.24         | 18.6        |
|             |        |        | medium | 302.7  | 0.09      | 0.09        | 0.15         | 39.6        |
|             |        |        | short  | 167    | 0.09      | 0.07        | 0.14         | 53.5        |
| Qwen2.5-72B | long   | 6064   | long   | 952.7  | 1.26      | 0.48        | 2.04         | 76.4        |
|             |        |        | medium | 302.7  | 1.26      | 0.23        | 1.82         | 87.2        |
|             |        |        | short  | 167    | 1.27      | 0.15        | 1.79         | 91.4        |
|             | medium | 2773   | long   | 952.7  | 0.58      | 0.39        | 1.05         | 62.7        |
|             |        |        | medium | 302.7  | 0.58      | 0.18        | 0.89         | 79.2        |
|             |        |        | short  | 167    | 0.71      | 0.23        | 0.82         | 71.6        |
|             | short  | 583    | long   | 952.7  | 0.16      | 0.33        | 0.43         | 23.8        |
|             |        |        | medium | 302.7  | 0.16      | 0.15        | 0.27         | 43.2        |
|             |        |        | short  | 167    | 0.16      | 0.10        | 0.25         | 60.5        |


#### vLLM ベースの性能

MemOS は現在、vLLM を使用したアクティベーションメモリ管理をサポートしています。異なる長さのプレフィックステキストをKV Cacheとして事前保存することによる影響を評価するため、8 枚の `H800 80GB GPU（112 vCPU，1920 GiB メモリ）`を搭載したシステムと、8枚の `RTX4090-24G-PCIe(112 vCPU，960 GiB メモリ)` を搭載したシステムで、それぞれ性能テストを実施しました。評価対象は現在の2つのコアモデルである Qwen3-32B と Qwen2.5-72B です。

ベンチマークは、さまざまなアクティベーションメモリシナリオを模擬するために、一連のメモリ長とコンテキスト長の組み合わせで実行されました：
- **メモリテキスト長（tokens）**：500、1000、2000
- **コンテキストテキスト長（tokens）**：500、1000、2000、4000

以下の表はベンチマーク結果を要約しています。

**Qwen2.5-72B**
- On 4090（2 Nodes 16 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 1787.21                  | 851.47                | 52.358%          | 935.74      |
| 0.5k    | 1k         | 2506.26                  | 1290.68               | 48.502%          | 1215.58     |
| 0.5k    | 2k         | 3843.48                  | 2897.97               | 24.600%          | 945.51      |
| 0.5k    | 4k         | 6078.01                  | 5200.86               | 14.432%          | 877.15      |
| 1k      | 0.5k       | 2274.61                  | 920.16                | 59.546%          | 1354.45     |
| 1k      | 1k         | 2907.17                  | 1407.65               | 51.580%          | 1499.52     |
| 1k      | 2k         | 4278.53                  | 2916.47               | 31.835%          | 1362.06     |
| 1k      | 4k         | 6897.99                  | 5218.94               | 24.341%          | 1679.05     |
| 2k      | 0.5k       | 3460.12                  | 782.73                | 77.379%          | 2677.39     |
| 2k      | 1k         | 4443.34                  | 1491.24               | 66.439%          | 2952.10     |
| 2k      | 2k         | 5733.14                  | 2758.48               | 51.885%          | 2974.66     |
| 2k      | 4k         | 8152.76                  | 5627.41               | 30.975%          | 2525.35     |


- On H800（4 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 51.65                    | 52.17                 | -1.007%          | -0.52       |
| 0.5k    | 1k         | 55.70                    | 57.03                 | -2.388%          | -1.33       |
| 0.5k    | 2k         | 74.23                    | 78.56                 | -5.833%          | -4.33       |
| 0.5k    | 4k         | 77.56                    | 77.45                 | 0.142%           | 0.11        |
| 1k      | 0.5k       | 55.90                    | 55.73                 | 0.304%           | 0.17        |
| 1k      | 1k         | 55.35                    | 52.89                 | 4.444%           | 2.46        |
| 1k      | 2k         | 80.14                    | 73.82                 | 7.886%           | 6.32        |
| 1k      | 4k         | 82.83                    | 73.51                 | 11.252%          | 9.32        |
| 2k      | 0.5k       | 75.82                    | 71.31                 | 5.948%           | 4.51        |
| 2k      | 1k         | 80.60                    | 78.71                 | 2.345%           | 1.89        |
| 2k      | 2k         | 83.91                    | 78.60                 | 6.328%           | 5.31        |
| 2k      | 4k         | 99.15                    | 80.12                 | 19.193%          | 19.03       |

**Qwen3-32B**

- On 4090（1 Nodes 8 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 288.72                   | 139.29                | 51.756%          | 149.43      |
| 0.5k    | 1k         | 428.72                   | 245.85                | 42.655%          | 182.87      |
| 0.5k    | 2k         | 683.65                   | 538.59                | 21.218%          | 145.06      |
| 0.5k    | 4k         | 1170.48                  | 986.94                | 15.681%          | 183.54      |
| 1k      | 0.5k       | 409.83                   | 137.96                | 66.337%          | 271.87      |
| 1k      | 1k         | 507.95                   | 262.21                | 48.379%          | 245.74      |
| 1k      | 2k         | 743.48                   | 539.71                | 27.408%          | 203.77      |
| 1k      | 4k         | 1325.34                  | 1038.59               | 21.636%          | 286.75      |
| 2k      | 0.5k       | 686.01                   | 147.34                | 78.522%          | 538.67      |
| 2k      | 1k         | 762.96                   | 246.22                | 67.728%          | 516.74      |
| 2k      | 2k         | 1083.93                  | 498.05                | 54.051%          | 585.88      |
| 2k      | 4k         | 1435.39                  | 1053.31               | 26.619%          | 382.08      |


- On H800（2 GPUs）

| mem tks | prompt tks | TTFT (without cache, ms) | TTFT (With cache, ms) | TTFT Speedup (%) | Abs Dis(ms) |
| ------- | ---------- | ------------------------ | --------------------- | ---------------- | ----------- |
| 0.5k    | 0.5k       | 161.18                   | 97.61                 | 39.440%          | 63.57       |
| 0.5k    | 1k         | 164.00                   | 121.39                | 25.982%          | 42.61       |
| 0.5k    | 2k         | 257.34                   | 215.20                | 16.375%          | 42.14       |
| 0.5k    | 4k         | 365.14                   | 317.95                | 12.924%          | 47.19       |
| 1k      | 0.5k       | 169.45                   | 100.52                | 40.679%          | 68.93       |
| 1k      | 1k         | 180.91                   | 128.25                | 29.108%          | 52.66       |
| 1k      | 2k         | 271.69                   | 210.00                | 22.706%          | 61.69       |
| 1k      | 4k         | 389.30                   | 314.64                | 19.178%          | 74.66       |
| 2k      | 0.5k       | 251.43                   | 130.92                | 47.930%          | 120.51      |
| 2k      | 1k         | 275.81                   | 159.60                | 42.134%          | 116.21      |
| 2k      | 2k         | 331.11                   | 218.17                | 34.110%          | 112.94      |
| 2k      | 4k         | 451.06                   | 334.80                | 25.775%          | 116.26      |


結果は、vLLM の KV キャッシュ再利用機能の統合が MemOS に革命的な性能向上をもたらすことを明確に示しています。

## KV Cacheのメモリ構造

`KVCacheMemory`によってKVベースのメモリ再利用を実現することで、同一の出力を維持しながら、モデルサイズやクエリタイプをまたいでレイテンシを大幅に削減します。再利用可能なメモリをプレーンテキストプロンプトから事前計算済みのKV Cacheへ移行することで、MemOSは冗長なコンテキストエンコードを排除し、特にリアルタイムでメモリ拡張されたLLMアプリケーションにおいて、より高速な応答時間を実現します。

各キャッシュは`KVCacheItem`として保存されます:

| フィールド         | 型           | 説明                                 |
| ------------- | -------------- | ------------------------------------------- |
| `kv_cache_id` | `str`          | キャッシュ内の一意なID(UUID)              |
| `kv_cache`    | `DynamicCache` | 実際のKV Cache(transformers)   |
| `metadata`    | `dict`         | メタデータ (ソース、抽出時間など)    |


## API概要 (`KVCacheMemory`)

### 初期化
```python
KVCacheMemory(config: KVCacheMemoryConfig)
```

### コアメソッド
| メソッド                   | 説明                                              |
| ------------------------ | -------------------------------------------------------- |
| `extract(text)`          | LLMを使用して入力テキストからKV Cacheを抽出        |
| `add(memories)`          | 1つまたは複数の`KVCacheItem`をメモリに追加                |
| `get(memory_id)`         | IDによって単一のキャッシュを取得                               |
| `get_by_ids(ids)`        | IDsによって複数のキャッシュを取得                             |
| `get_all()`              | 保存されているすべてのキャッシュを返す                                |
| `get_cache(cache_ids)`   | 複数のIDsからキャッシュをマージして結合キャッシュを返す      |
| `delete(ids)`            | IDsによってキャッシュを削除                                     |
| `delete_all()`           | すべてのキャッシュを削除                                        |
| `dump(dir)`              | すべてのキャッシュをディレクトリ内のpickleファイルへシリアライズ       |
| `load(dir)`              | ディレクトリ内のpickleファイルからキャッシュをロード              |
| `from_textual_memory(mem)` | `TextualMemoryItem` を `KVCacheItem` に変換      |


`dump(dir)`を呼び出すと、システムは以下に書き込みます:

```
<dir>/<config.memory_filename>
```

このファイルにはすべてのKV Cacheのpickle辞書が含まれており、`load(dir)`を使用して再ロードできます。


## 使用方法

### HF KVCache Memory

```python
import json

from transformers import DynamicCache

from memos.configs.memory import MemoryConfigFactory
from memos.memories.activation.item import KVCacheItem
from memos.memories.factory import MemoryFactory


def get_cache_info(cache):
    if not cache:
        return None

    num_layers = 0
    total_size_bytes = 0

    if hasattr(cache, "layers"):
        num_layers = len(cache.layers)
        for layer in cache.layers:
            if hasattr(layer, "key_cache") and layer.key_cache is not None:
                total_size_bytes += layer.key_cache.nelement() * layer.key_cache.element_size()
            if hasattr(layer, "value_cache") and layer.value_cache is not None:
                total_size_bytes += layer.value_cache.nelement() * layer.value_cache.element_size()

            if hasattr(layer, "keys") and layer.keys is not None:
                total_size_bytes += layer.keys.nelement() * layer.keys.element_size()
            if hasattr(layer, "values") and layer.values is not None:
                total_size_bytes += layer.values.nelement() * layer.values.element_size()

    elif hasattr(cache, "key_cache") and hasattr(cache, "value_cache"):
        num_layers = len(cache.key_cache)
        for k, v in zip(cache.key_cache, cache.value_cache, strict=False):
            if k is not None:
                total_size_bytes += k.nelement() * k.element_size()
            if v is not None:
                total_size_bytes += v.nelement() * v.element_size()

    return {
        "num_layers": num_layers,
        "size_bytes": total_size_bytes,
        "size_mb": f"{total_size_bytes / (1024 * 1024):.2f} MB",
    }


def serialize_item(obj):
    if isinstance(obj, list):
        return [serialize_item(x) for x in obj]

    if isinstance(obj, KVCacheItem):
        return {
            "id": obj.id,
            "metadata": obj.metadata,
            "records": obj.records.model_dump()
            if hasattr(obj.records, "model_dump")
            else obj.records,
            "memory": get_cache_info(obj.memory),
        }

    if isinstance(obj, DynamicCache):
        return get_cache_info(obj)

    return str(obj)


if __name__ == "__main__":
    # ===== 例: ファクトリと HFLLM を使用して KVCacheMemory を構築および管理 =====

    # 1. KVCacheMemory 設定を作成（HuggingFace バックエンドを使用）
    config = MemoryConfigFactory(
        backend="kv_cache",
        config={
            "extractor_llm": {
                "backend": "huggingface",
                "config": {
                    "model_name_or_path": "Qwen/Qwen3-0.6B",  # 有効な HuggingFace モデル名を使用
                    "max_tokens": 32,
                    "add_generation_prompt": True,
                    "remove_think_prefix": True,
                },
            },
        },
    )

    # 2. ファクトリを使用して KVCacheMemory をインスタンス化
    kv_mem = MemoryFactory.from_config(config)

    # 3. プロンプトから KVCacheItem (DynamicCache) を抽出（内部で HFLLM.build_kv_cache を使用）
    prompt = [
        {"role": "user", "content": "What is MemOS?"},
        {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
    ]
    print("===== Extract KVCacheItem =====")
    cache_item = kv_mem.extract(prompt)
    print(json.dumps(serialize_item(cache_item), indent=2, default=str))
    print()

    # 4. 抽出した KVCacheItem を追加
    print("===== Add KVCacheItem =====")
    kv_mem.add([cache_item])
    print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
    print()

    # 5. ID によって取得
    print("===== Get KVCacheItem by id =====")
    retrieved = kv_mem.get(cache_item.id)
    print(json.dumps(serialize_item(retrieved), indent=2, default=str))
    print()

    # 6. キャッシュをマージ（2つの項目を使用してシミュレーション）
    print("===== Merge DynamicCache =====")
    item2 = kv_mem.extract([{"role": "user", "content": "Tell me a joke."}])
    kv_mem.add([item2])
    merged_cache = kv_mem.get_cache([cache_item.id, item2.id])
    print(json.dumps(serialize_item(merged_cache), indent=2, default=str))
    print()

    # 7. 1つ削除
    print("===== Delete one KVCacheItem =====")
    kv_mem.delete([cache_item.id])
    print(json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str))
    print()

    # 8. ダンプとロード
    print("===== Dump and Load KVCacheMemory =====")
    kv_mem.dump("tmp/kv_mem")
    print("Memory dumped to 'tmp/kv_mem'.")
    kv_mem.delete_all()
    kv_mem.load("tmp/kv_mem")
    print(
        "Memory loaded from 'tmp/kv_mem':",
        json.dumps(serialize_item(kv_mem.get_all()), indent=2, default=str),
    )
```

### VLLM KVCache Memory

```python
#!/usr/bin/env python3
"""
vLLM バックエンド付きの VLLMKVCacheMemory を使用する方法を示すサンプル。
このサンプルは、新しい vLLM 互換の KV cache メモリの使用方法を示します。
"""

from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory


def main():
    """VLLMKVCacheMemory の使用法を示すメイン関数。"""

    print("=== VLLM KV Cache Memory Example ===\n")

    # 1. VLLMKVCacheMemory 設定を作成（vLLM バックエンドを使用）
    config = MemoryConfigFactory(
        backend="vllm_kv_cache",  # 新しい vLLM KV cache バックエンドを使用
        config={
            "extractor_llm": {
                "backend": "vllm",
                "config": {
                    "model_name_or_path": "Qwen/Qwen3-0.6B",
                    "api_base": "http://localhost:8088/v1",
                    "temperature": 0.7,
                    "max_tokens": 1024,
                    "model_schema": "memos.configs.llm.VLLMLLMConfig",
                },
            },
        },
    )

    # 2. ファクトリを使用して VLLMKVCacheMemory をインスタンス化
    print("Initializing VLLM KV Cache Memory...")
    vllm_kv_mem = MemoryFactory.from_config(config)
    print("✓ VLLM KV Cache Memory initialized successfully.\n")

    # 3. プロンプトから VLLMKVCacheItem を抽出
    print("===== Extract VLLMKVCacheItem =====")
    system_prompt = [
        {"role": "system", "content": "You are a helpful AI assistant."},
        {"role": "user", "content": "What is MemOS?"},
        {"role": "assistant", "content": "MemOS is a memory operating system for LLMs."},
    ]

    try:
        cache_item = vllm_kv_mem.extract(system_prompt)
        print("✓ KV cache item extracted successfully")
        print(f"  ID: {cache_item.id}")
        print(f"  Memory (prompt): {cache_item.memory[:100]}...")
        print(f"  Metadata: {cache_item.metadata}")
        print()
    except Exception as e:
        print(f"✗ Failed to extract KV cache item: {e}")
        return

    # 4. 抽出した VLLMKVCacheItem を追加
    print("===== Add VLLMKVCacheItem =====")
    vllm_kv_mem.add([cache_item])
    all_items = vllm_kv_mem.get_all()
    print(f"✓ Added cache item. Total items: {len(all_items)}")
    print()

    # 5. ID によって取得
    print("===== Get VLLMKVCacheItem by id =====")
    retrieved = vllm_kv_mem.get(cache_item.id)
    if retrieved:
        print(f"✓ Retrieved cache item: {retrieved.id}")
        print(f"  Memory (prompt): {retrieved.memory[:100]}...")
    else:
        print("✗ Failed to retrieve cache item")
    print()

    # 6. キャッシュを取得（vLLM のプロンプト文字列を返す）
    print("===== Get Cache (Prompt String) =====")
    prompt_string = vllm_kv_mem.get_cache([cache_item.id])
    if prompt_string:
        print(f"✓ Retrieved prompt string: {prompt_string[:100]}...")
        print("  This prompt can be used for vLLM generation with preloaded KV cache")
    else:
        print("✗ Failed to retrieve prompt string")
    print()

    # 7. デモ用に別のキャッシュ項目を抽出
    print("===== Extract Another VLLMKVCacheItem =====")
    another_prompt = [
        {"role": "system", "content": "You are a coding assistant."},
        {"role": "user", "content": "Write a Python function to calculate fibonacci numbers."},
    ]

    try:
        cache_item2 = vllm_kv_mem.extract(another_prompt)
        vllm_kv_mem.add([cache_item2])
        print(f"✓ Added second cache item. Total items: {len(vllm_kv_mem.get_all())}")
        print()
    except Exception as e:
        print(f"✗ Failed to extract second KV cache item: {e}")
        print()

    # 8. vLLM サーバー上で KV cache を事前ロード
    print("===== Preload KV Cache on vLLM Server =====")
    try:
        vllm_kv_mem.preload_kv_cache([cache_item.id, cache_item2.id])
        print("✓ KV cache preloaded on vLLM server successfully")
        print("  The server now has the KV cache ready for fast generation")
    except Exception as e:
        print(f"✗ Failed to preload KV cache: {e}")
    print()

    # 9. 1つの項目を削除
    print("===== Delete One VLLMKVCacheItem =====")
    vllm_kv_mem.delete([cache_item.id])
    remaining_items = vllm_kv_mem.get_all()
    print(f"✓ Deleted cache item. Remaining items: {len(remaining_items)}")
    print()

    # 10. ダンプとロード
    print("===== Dump and Load VLLMKVCacheMemory =====")
    try:
        vllm_kv_mem.dump("tmp/vllm_kv_mem")
        print("✓ Memory dumped to 'tmp/vllm_kv_mem'")

        # メモリをクリアして再ロード
        vllm_kv_mem.delete_all()
        vllm_kv_mem.load("tmp/vllm_kv_mem")
        reloaded_items = vllm_kv_mem.get_all()
        print(f"✓ Memory loaded from 'tmp/vllm_kv_mem': {len(reloaded_items)} items")
    except Exception as e:
        print(f"✗ Failed to dump/load memory: {e}")
    print()

    print("=== Example completed successfully ===")


if __name__ == "__main__":
    main()
```

## 開発者向け注意事項

* HuggingFace `DynamicCache` を使用した効率的なキー・バリューストレージ
* 高速なロード/保存のためのpickleベースのシリアライズ
* `/tests`内の統合テストはすべてのメソッドをカバーしています。
