---
title: "GeneralTextMemory: 汎用プレーンテキスト記憶"
desc: "`GeneralTextMemory` はMemOS内の柔軟なベクトルベースのプレーンテキスト記憶モジュールであり、非構造化知識の保存、検索、管理に使用されます。Naive モジュールが「キーワードマッチング」だとすれば、GeneralTextMemory は「意味を理解する」スマートインデックスであり、会話エージェント、パーソナルアシスタント、および意味記憶検索を必要とするあらゆるシステムに適しています。"
---
## 目次

- [記憶構造](#記憶構造)
  - [メタデータフィールド (`TextualMemoryMetadata`)](#メタデータフィールド-textualmemorymetadata)
- [API概要 (`GeneralTextMemory`)](#api概要-generaltextmemory)
  - [初期化](#初期化)
  - [コアメソッド](#コアメソッド)
- [ファイルストレージ](#ファイルストレージ)
- [使用例](#使用例)
- [拡張と上級機能](#拡張と上級機能)
  - [インターネット検索](#インターネット検索)
  - [MultiModal Reader](#multimodal-reader)
- [開発者向け注意事項](#開発者向け注意事項)


## 記憶構造

各記憶は`TextualMemoryItem`として表現されます:

| フィールド      | 型                        | 説明                        |
| ---------- | --------------------------- | ---------------------------------- |
| `id`       | `str`                       | UUID（省略時は自動生成）   |
| `memory`   | `str`                       | 記憶内容の本体（必須） |
| `metadata` | `TextualMemoryMetadata`     | メタデータ（検索/フィルタリング用）     |

### メタデータフィールド (`TextualMemoryMetadata`)

| フィールド         | 型                                               | 説明                         |
| ------------- | -------------------------------------------------- | ----------------------------------- |
| `type`        | `"procedure"`, `"fact"`, `"event"`, `"opinion"` | 記憶タイプ                         |
| `memory_time` | `str (YYYY-MM-DD)`                                 | 記憶が指す日付/時刻      |
| `source`      | `"conversation"`, `"retrieved"`, `"web"`, `"file"` | 記憶ソース                |
| `confidence`  | `float (0-100)`                                    | 確実性/信頼度スコア          |
| `entities`    | `list[str]`                                        | 主要エンティティ/概念               |
| `tags`        | `list[str]`                                        | トピックタグ                       |
| `visibility`  | `"private"`, `"public"`, `"session"`            | アクセス範囲                        |
| `updated_at`  | `str`                                              | 最終更新タイムスタンプ (ISO 8601)    |

すべての値は検証され、無効な値はエラーを引き起こします。

## 検索メカニズム

前述の`NaiveTextMemory` が**キーワードマッチングアルゴリズム**を使用するのとは異なり、`GeneralNaiveTextMemory` は**ベクトル意味検索**を使用します。

**NaiveTextMemoryとのアルゴリズム特性の比較**

| 特性           | キーワードマッチング  | ベクトル意味検索 |
| -------------- | ---------------------------- | -------------------------------- |
| **意味理解**   | ❌ 同義語を理解しない               | ✅ 類似概念を理解する                   |
| **リソース使用量**   | ✅ 非常に低い                       | ⚠️ 埋め込みモデルとベクトルデータベースが必要       |
| **実行速度**   | ✅ 高速（O(n)）               | ⚠️ 遅い（インデックス構築+クエリ）          |
| **適用規模**   | < 1K 件の記憶                  | 10K - 100K 件の記憶                |
| **予測可能性**   | ✅ 結果が直感的                   | ⚠️ ブラックボックスモデル                       |

## API概要 (`GeneralTextMemory`)

### 初期化
```python
GeneralTextMemory(config: GeneralTextMemoryConfig)
```

### コアメソッド
| メソッド                   | 説明                                         |
| ------------------------ | --------------------------------------------------- |
| `extract(messages)`      | メッセージリストから記憶を抽出する (LLMベース)     |
| `add(memories)`          | 1つまたは複数の記憶を追加する (項目または辞書)          |
| `search(query, top_k)`   | ベクトル類似度を使用してtop-k記憶を検索する    |
| `get(memory_id)`         | IDで単一の記憶を取得する                           |
| `get_by_ids(ids)`        | IDで複数の記憶を取得する                      |
| `get_all()`              | すべての記憶を返す                                |
| `update(memory_id, new)` | IDで記憶を更新する                               |
| `delete(ids)`            | IDで記憶を削除する                              |
| `delete_all()`           | すべての記憶を削除する                                 |
| `dump(dir)`              | すべての記憶をディレクトリ内のJSONファイルにシリアライズする    |
| `load(dir)`              | 保存されたファイルから記憶を読み込む                       |

## ファイルストレージ

`dump(dir)` を呼び出すと、システムは記憶を次に保存します：

```
<dir>/<config.memory_filename>
```

このファイルにはすべての記憶エントリのJSONリストが含まれており、`load(dir)`を使用して再読み込みできます.

## 使用例

```python
import os
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

config = MemoryConfigFactory(
    backend="general_text",
    config={
        "extractor_llm": { ... },
        "vector_db": { ... },
        "embedder": { ... },
    },
)
m = MemoryFactory.from_config(config)

# 記憶を抽出して追加
memories = m.extract([
    {"role": "user", "content": "I love tomatoes."},
    {"role": "assistant", "content": "Great! Tomatoes are delicious."},
])
m.add(memories)

# idで手動作成して記憶を追加
memory_id = "xxx"
m.add(
  [
        {
            "id": memory_id,
            "memory": "User is Chinese.",
            ...
        }
    ]  
)

# 記憶を検索
results = m.search("Tell me more about the user", top_k=2)

# 記憶を更新
m.update(memory_id, {"memory": "User is Canadian.", ...})

# 記憶を削除
m.delete([memory_id])

# すべての記憶をディレクトリ内のJSONファイルにシリアライズする/保存されたファイルから記憶を読み込む
m.dump("tmp/mem")
m.load("tmp/mem")
```

::note
**拡張：インターネット検索**<br>
GeneralTextMemory はインターネット検索と組み合わせて使用でき、Webページからコンテンツを抽出して記憶庫に追加できます。<br>
例を参照：[インターネットから記憶を検索](./tree_textual_memory#インターネットから記憶を検索オプション)
::

::note
**上級：MultiModal Reader を使用する**<br>
画像、URL、ファイルなどのマルチモーダルコンテンツを処理する必要がある場合は、`MultiModalStructMemReader` を使用できます。<br>
完全な例を参照：[MultiModalStructMemReader を使用する](./tree_textual_memory#multimodalstructmemreader-を使用する上級)
::

## 開発者向け注意事項

* 高速な類似度検索のためにQdrant（または互換）ベクトルDBを使用
* 埋め込みモデルと抽出モデルは設定可能です（olama/OpenAI をサポート）
* `/tests`内の統合テストですべてのメソッドを網羅しています。
