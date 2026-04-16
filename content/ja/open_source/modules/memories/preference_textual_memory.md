---
title: "PreferenceTextMemory: ユーザー嗜好のプレーンテキスト記憶を保存および管理"
desc: "`PreferenceTextMemory` はMemOSでユーザー嗜好のプレーンテキスト記憶を保存および管理するためのモジュールです。ユーザー嗜好に基づいて記憶検索を行う必要があるシナリオに適しています。"
---

## 目次

- [なぜ嗜好記憶が必要なのか](#なぜ嗜好記憶が必要なのか)
  - [利点と特性](#利点と特性)
  - [適用シナリオ](#適用シナリオ)
- [コア概念とワークフロー](#コア概念とワークフロー)
  - [記憶構造](#記憶構造)
  - [メタデータフィールド](#メタデータフィールド)
  - [コアワークフロー](#コアワークフロー)
- [API 参考](#api-参考)
  - [初期化](#初期化)
  - [コアメソッド](#コアメソッド)
  - [ファイルストレージ](#ファイルストレージ)
- [ハンズオン: 0 から 1 へ](#ハンズオン-0-から-1-へ)
  - [PreferenceTextMemory 設定の作成](#preferencetextmemory-設定の作成)
  - [PreferenceTextMemory の初期化](#preferencetextmemory-の初期化)
  - [構造化記憶の抽出](#構造化記憶の抽出)
  - [記憶の検索](#記憶の検索)
  - [バックアップと復元](#バックアップと復元)
  - [完全なコード例](#完全なコード例)


## なぜ嗜好記憶が必要なのか

### 利点と特性

::list{icon="ph:check-circle-duotone"}
- **二重の嗜好抽出**：明示的嗜好と暗黙的嗜好を自動識別
- **意味理解**：ベクトル埋め込みを使用して嗜好の深い意味を理解
- **インテリジェント重複排除**：重複または競合する嗜好を自動検出して統合
- **高精度検索**：ベクトル類似度に基づくセマンティック検索
- **永続化ストレージ**：ベクトルデータベース（Qdrant/Milvus）をサポート
- **拡張性**：大規模な嗜好データ管理をサポート
- **パーソナライズ強化**：各ユーザーの独立した嗜好プロファイルを維持
::

### 適用シナリオ

::list{icon="ph:lightbulb-duotone"}
- パーソナライズされた対話エージェント（ユーザーの好みを記憶する）
- インテリジェント推薦システム（嗜好に基づく推薦）
- カスタマーサービスシステム（カスタマイズされたサービスを提供）
- コンテンツフィルタリングシステム（嗜好に応じてコンテンツを選別）
- 学習支援システム（学習スタイルに適応）
::

::alert{type="info"}

要するに、ユーザーの好みを"記憶"し、それに基づいてパーソナライズされたサービスを提供できるシステムを構築する必要がある場合、`PreferenceTextMemory` は最適な選択です。
::

## コア概念とワークフロー
### 記憶構造

MemOSでは、嗜好記憶は`PreferenceTextMemory`で表され、各記憶は`TextualMemoryItem`であり、Milvusデータベースを使用して保存されます。
- `id`: 一意の記憶ID（省略した場合は自動生成）
- `memory`: 主要テキスト
- `metadata`: 階層構造情報、埋め込み、タグ、エンティティ、ソース、状態を含む

嗜好記憶はさらに明示的嗜好記憶と暗黙的嗜好記憶に分けられます：
- **明示的嗜好記憶**：ユーザーが明確に表現した好みや嫌悪。**例**：
    - "ダークモードが好きです"
    - "辛いものは食べません"
    - "簡潔な回答でお願いします"
    - "動画チュートリアルより技術文書の方が好きです"

- **暗黙的嗜好記憶**：ユーザーの行動や対話パターンから推定される嗜好。**例**：
    - ユーザーはいつもコード例を尋ねる → 実践志向の学習を好む
    - ユーザーは頻繁に詳細な説明を求める → 深い理解を好む
    - ユーザーは何度も環境保護の話題に言及する → 持続可能な発展に関心がある

::alert{type="success"}
**インテリジェント抽出**<br>
`PreferenceTextMemory` は LLM を使用して、手動でラベル付けすることなく、対話から明示的嗜好と暗黙的嗜好の両方を自動的に抽出します！
::

### メタデータフィールド （`PreferenceTextualMemoryMetadata`）

| フィールド         | 型                                               | 説明                         |
| ------------- | -------------------------------------------------- | ----------------------------------- |
| `preference_type`        | `"explicit_preference"`, `"implicit_preference"`                                    | 嗜好記憶のタイプ。明示的嗜好記憶と暗黙的嗜好記憶に分かれる                         |
| `dialog_id`        | `str`                                    | 対話ID。嗜好記憶を特定の対話に関連付けるために使用                         |
| `original_text`        | `str`                                    | 元のテキスト。ユーザー嗜好情報を含む                         |
| `embedding`        | `str`                                    | 埋め込みベクトル。セマンティック検索と検索取得に使用                         |
| `preference`        | `str`                                    | ユーザー嗜好情報              |
| `create_at`        | `str`                                    | 作成タイムスタンプ (ISO 8601)                         |
| `mem_cube_id`        | `str`                                    | 記憶キューブID。嗜好記憶を特定の記憶キューブに関連付けるために使用                         |
| `score`        | `float `                                | 検索結果における嗜好記憶とqueryの類似度スコア   |

### コアワークフロー

この例を実行すると、ワークフローは次のようになります:

1. **抽出:** LLM を使用して元のテキストから構造化記憶を抽出します.


2. **埋め込み:** 類似性検索のためのベクトル埋め込みを生成します.


3. **保存:** 嗜好記憶をMilvusデータベースに保存し、同時にメタデータフィールドを更新します.


4. **検索:** ベクトル類似度クエリによって、最も関連性の高い嗜好記憶を返します.

## API 参考

### 初期化

```python
PreferenceTextMemory(config: PreferenceTextMemoryConfig)
```

### コアメソッド

| メソッド                      | 説明                                           |
| --------------------------- | ----------------------------------------------------- |
| `get_memory(messages)` | 元の対話から嗜好記憶を抽出します. |
| `search(query, top_k)` | ベクトル類似度を使用してtop-k嗜好記憶を検索します. |
| `load(dir)` | 保存されたファイルから嗜好記憶を読み込みます. |
| `dump(dir)` | すべての嗜好記憶をディレクトリ内のJSONファイルにシリアライズします. |
| `add(memories)` | 嗜好記憶をMilvusデータベースに一括追加します.  |
| `get_with_collection_name(collection_name, memory_id)` | コレクション名と記憶IDを通じて特定タイプの嗜好記憶を取得します. |
| `get_by_ids_with_collection_name(collection_name, memory_ids)` | コレクション名と記憶IDsを通じて特定タイプの嗜好記憶を**一括**取得します. |
| `get_all()` | すべての嗜好記憶を取得します. |
| `get_memory_by_filter(filter)` | フィルタ条件に基づいて嗜好記憶を取得します. |
| `delete(memory_ids)` | 指定IDの嗜好記憶を削除します. |
| `delete_by_filter(filter)` | フィルタ条件に基づいて嗜好記憶を削除します. |
| `delete_with_collection_name(collection_name, memory_ids)` | 指定したコレクション名とIDsのすべての嗜好記憶を削除します. |
| `delete_all()` | すべての嗜好記憶を削除します. |


### ファイルストレージ

`dump(dir)` を呼び出すと、MemOSはすべての嗜好記憶をディレクトリ内のJSONファイルにシリアライズします:
```
<dir>/<config.memory_filename>
```

---

## ハンズオン: 0 から 1 へ

::steps{}

### PreferenceTextMemory 設定の作成
定義するもの:
- あなたのembeddingモデル（例：nomic-embed-text:latest）, 
- あなたのMilvusデータベースバックエンド,
- 記憶抽出器（LLMベース）（オプション）.

```python
from memos.configs.memory import PreferenceTextMemoryConfig

config = PreferenceTextMemoryConfig.from_json_file("examples/data/config/preference_config.json")
```

### PreferenceTextMemory の初期化

```python
from memos.memories.textual.preference import PreferenceTextMemory

preference_memory = PreferenceTextMemory(config)
```

### 構造化記憶の抽出

記憶抽出器を使用して、対話、ファイル、またはドキュメントを複数の`TextualMemoryItem`に解析します.

```python
scene_data = [[
    {"role": "user", "content": "Tell me about your childhood."},
    {"role": "assistant", "content": "I loved playing in the garden with my dog."}
]]

memories = preference_memory.get_memory(scene_data, type="chat", info={"user_id": "1234"})
preference_memory.add(memories)
```

### 記憶の検索

```python
results = preference_memory.search("Tell me more about the user", top_k=2)
```

### バックアップと復元
嗜好記憶の永続化ストレージといつでも再読み込みをサポートします：
```python
preference_memory.dump("tmp/pref_memories")
preference_memory.load("tmp/pref_memories")
```

::

### 完全なコード例

この例は上記のすべてのステップを統合し、Milvusを例として、エンドツーエンドの完全なフローを提供します —— コピーすればそのまま実行できます！

```python
from memos.configs.memory import PreferenceTextMemoryConfig
from memos.memories.textual.preference import PreferenceTextMemory

# 创建PreferenceTextMemory
config = PreferenceTextMemoryConfig.from_json_file("examples/data/config/preference_config.json")

preference_memory = PreferenceTextMemory(config)
preference_memory.delete_all()

scene_data = [[
    {"role": "user", "content": "Tell me about your childhood."},
    {"role": "assistant", "content": "I loved playing in the garden with my dog."}
]]

# 从原始对话中抽取偏好记忆，并添加到Milvus数据库中
memories = preference_memory.get_memory(scene_data, type="chat", info={"user_id": "1234"})
preference_memory.add(memories)

# 搜索记忆
results = preference_memory.search("Tell me more about the user", top_k=2)

# 持久化存储偏好记忆
preference_memory.dump("tmp/pref_memories")
```
