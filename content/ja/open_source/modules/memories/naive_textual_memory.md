---
title: "NaiveTextMemory: シンプルなプレーンテキスト記憶"
desc: "MemOS における最も軽量な記憶モジュールであり、高速なプロトタイピングとシンプルなシナリオ向けに設計されています。ベクトルデータベースは不要で、キーワードマッチングを使用するだけで高速に検索できます。最もシンプルな方法で MemOS 記憶システムの利用を始めましょう！
`NaiveTextMemory` はメモリベースのプレーンテキスト記憶モジュールで、記憶をメモリリストに保存し、キーワードマッチングを使用して検索します。これは MemOS を学ぶための最良の出発点であり、デモ、テスト、小規模アプリケーションにも適しています。"

---

## 目次

- [何を学べるか](#何を学べるか)
- [なぜ NaiveTextMemory を選ぶのか](#なぜ-naivetextmemory-を選ぶのか)
- [コア概念](#コア概念)
    - [記憶構造](#記憶構造)
    - [メタデータフィールド](#メタデータフィールド-textualmemorymetadata)
    - [検索メカニズム](#検索メカニズム)
- [API 参考](#api-参考)
    - [初期化](#初期化)
    - [コアメソッド](#コアメソッド)
    - [設定パラメータ](#設定パラメータ)
- [ハンズオン実践](#ハンズオン実践)
    - [クイックスタート](#クイックスタート)
    - [完全な例](#完全な例)
    - [ファイル保存](#ファイル保存)
- [ユースケースガイド](#ユースケースガイド)
- [他の記憶モジュールとの比較](#他の記憶モジュールとの比較)
- [ベストプラクティス](#ベストプラクティス)
- [次のステップ](#次のステップ)

## 何を学べるか

このガイドの最後には、次のことができるようになります：
- LLM を使用して会話から構造化記憶を自動抽出する
- メモリ内で記憶を保存および管理する（データベース不要）
- キーワードマッチングを使用して記憶を検索する
- 記憶データを永続化および復元する
- いつ NaiveTextMemory を使い、いつ他のモジュールにアップグレードするかを理解する

## なぜ NaiveTextMemory を選ぶのか

### 強みの特徴

::list{icon="ph:check-circle-duotone"}
- **依存関係ゼロ**：ベクトルデータベースや埋め込みモデルは不要
- **高速起動**：数行のコードで実行可能
- **軽量高効率**：低リソース使用量で、実行速度が速い
- **シンプルで直感的**：キーワードマッチングで、結果は予測可能
- **デバッグしやすい**：すべての記憶がメモリ内にあり、確認が容易
- **完璧な出発点**：MemOS を学ぶための最良の入門選択
::

### 適用シナリオ

::list{icon="ph:lightbulb-duotone"}
- 高速プロトタイピングと概念実証
- シンプルな会話エージェント（記憶数 < 1000 件）
- テストおよびデモのシナリオ
- リソース制約環境（埋め込みモデルを実行できない）
- キーワード検索シナリオ（クエリが記憶と直接一致する）
::

::note
**パフォーマンスのヒント**<br>
記憶数が 1000 件を超える場合は、[GeneralTextMemory](/open_source/modules/memories/general_textual_memory) へのアップグレードを推奨します。これはベクトル検索を使用し、パフォーマンスがより優れています。
::


## コア概念

### 記憶構造

各記憶は `TextualMemoryItem` オブジェクトとして表され、以下のフィールドを含みます：

| フィールド   | 型                          | 必須 | 説明                              |
| ---------- | --------------------------- | ---- | ------------------------------- |
| `id`       | `str`                       | ✗    | 一意識別子（UUID を自動生成）   |
| `memory`   | `str`                       | ✓    | 記憶の主要テキスト内容          |
| `metadata` | `TextualMemoryMetadata`     | ✗    | メタデータ（分類、フィルタ、検索用）|

### メタデータフィールド (`TextualMemoryMetadata`)

メタデータは、記憶の分類、フィルタリング、整理に使用される豊富なコンテキスト情報を提供します：

| フィールド      | 型                                               | デフォルト値 | 説明                             |
| ------------- | -------------------------------------------------- | ---------- | ------------------------------ |
| `type`        | `"procedure"` / `"fact"` / `"event"` / `"opinion"` | `"fact"`   | 記憶タイプ分類                 |
| `memory_time` | `str (YYYY-MM-DD)`                                 | 現在の日付 | 記憶に関連付けられた時間       |
| `source`      | `"conversation"` / `"retrieved"` / `"web"` / `"file"` | -          | 記憶のソース                   |
| `confidence`  | `float (0-100)`                                    | 80.0       | 確実性/信頼度スコア            |
| `entities`    | `list[str]`                                        | `[]`       | 言及されたエンティティまたは概念 |
| `tags`        | `list[str]`                                        | `[]`       | トピックタグ                   |
| `visibility`  | `"private"` / `"public"` / `"session"`            | `"private"` | アクセス制御範囲               |
| `updated_at`  | `str`                                              | 自動生成   | 最新更新タイムスタンプ（ISO 8601） |

## API 参考

### 初期化

```python
from memos.memories.textual.naive import NaiveTextMemory
from memos.configs.memory import NaiveTextMemoryConfig

memory = NaiveTextMemory(config: NaiveTextMemoryConfig)
```

### コアメソッド

| メソッド                 | パラメータ                            | 戻り値                        | 説明                                   |
| ------------------------ | ------------------------------------- | ----------------------------- | -------------------------------------- |
| `extract(messages)`      | `messages: list[dict]`                | `list[TextualMemoryItem]`     | LLM を使用して会話から構造化記憶を抽出 |
| `add(memories)`          | `memories: list / dict / Item`        | `None`                        | 1 件または複数の記憶を追加             |
| `search(query, top_k)`   | `query: str, top_k: int`              | `list[TextualMemoryItem]`     | キーワードマッチングで top-k 記憶を検索 |
| `get(memory_id)`         | `memory_id: str`                      | `TextualMemoryItem`           | ID により単一の記憶を取得             |
| `get_by_ids(ids)`        | `ids: list[str]`                      | `list[TextualMemoryItem]`     | ID リストにより記憶を一括取得         |
| `get_all()`              | -                                     | `list[TextualMemoryItem]`     | すべての記憶を返す                     |
| `update(memory_id, new)` | `memory_id: str, new: dict`           | `None`                        | 指定した記憶の内容またはメタデータを更新 |
| `delete(ids)`            | `ids: list[str]`                      | `None`                        | 1 件または複数の記憶を削除             |
| `delete_all()`           | -                                     | `None`                        | すべての記憶をクリア                   |
| `dump(dir)`              | `dir: str`                            | `None`                        | 記憶を JSON ファイルにシリアライズして保存 |
| `load(dir)`              | `dir: str`                            | `None`                        | JSON ファイルから記憶を読み込む       |

### 検索メカニズム

`NaiveTextMemory` は**キーワードマッチングアルゴリズム**を使用します：

::steps{}

#### ステップ 1: トークン化
クエリと各記憶内容を語彙リストに分解します

#### ステップ 2: 一致度を計算
クエリ語彙と記憶語彙の共通部分の数を集計します

#### ステップ 3: ソート
一致語数の降順ですべての記憶を並べ替えます

#### ステップ 4: 結果を返す
先頭の top-k 件の記憶を検索結果として取得します

::



::note
**例の比較**<br>
クエリ："猫" <br>
- **キーワードマッチング**："猫"、"猫咪" を含む記憶だけに一致<br>
- **意味検索**："ペット"、"子猫"、"猫好き星人" などの関連記憶にも一致可能（この後「汎用プレーンテキスト記憶」の記事で学びます）
::

### 設定パラメータ

**NaiveTextMemoryConfig**

| パラメータ         | 型                     | 必須 | デフォルト値           | 説明                                       |
| ------------------ | ---------------------- | ---- | ---------------------- | ------------------------------------------ |
| `extractor_llm`    | `LLMConfigFactory`     | ✓    | -                      | 会話から記憶を抽出するための LLM 設定      |
| `memory_filename`  | `str`                  | ✗    | `textual_memory.json`  | 永続化保存用のファイル名                   |

**設定例**

```json
{
  "backend": "naive_text",
  "config": {
    "extractor_llm": {
      "backend": "openai",
      "config": {
        "model_name_or_path": "gpt-4o-mini",
        "temperature": 0.8,
        "max_tokens": 1024,
        "api_base": "xxx",
        "api_key": "sk-xxx"
      }
    },
    "memory_filename": "my_memories.json"
  }
}
```

## ハンズオン実践

### クイックスタート

わずか 3 ステップで NaiveTextMemory を使い始められます：

::steps{}

#### ステップ 1: 設定を作成

```python
from memos.configs.memory import MemoryConfigFactory

config = MemoryConfigFactory(
    backend="naive_text",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
                "api_base": "your-api-base"
            },
        },
    },
)
```

#### ステップ 2: 記憶モジュールを初期化

```python
from memos.memories.factory import MemoryFactory

memory = MemoryFactory.from_config(config)
```

#### ステップ 3: 記憶を抽出して追加

```python
# 会話から記憶を自動抽出
memories = memory.extract([
    {"role": "user", "content": "I love tomatoes."},
    {"role": "assistant", "content": "Great! Tomatoes are delicious."},
])

# 記憶庫に追加
memory.add(memories)
print(f"✓ {len(memories)} 件の記憶を追加しました")
```

::alert{type="info"}
**上級: MultiModal Reader を使用**<br>
画像、URL、ファイルなどのマルチモーダルコンテンツを処理する必要がある場合は、`MultiModalStructMemReader` を使用できます。<br>
完全な例はこちら：[MultiModalStructMemReader を使用](./tree_textual_memory#使用-multimodalstructmemreader高级)
::

::

### 完全な例

以下は、すべてのコア機能を示す完全なエンドツーエンドの例です：

```python
from memos.configs.memory import MemoryConfigFactory
from memos.memories.factory import MemoryFactory

# ========================================
# 1. 初期化
# ========================================
config = MemoryConfigFactory(
    backend="naive_text",
    config={
        "extractor_llm": {
            "backend": "openai",
            "config": {
                "model_name_or_path": "gpt-4o-mini",
                "api_key": "your-api-key",
            },
        },
    },
)
memory = MemoryFactory.from_config(config)

# ========================================
# 2. 記憶を抽出して追加
# ========================================
memories = memory.extract([
    {"role": "user", "content": "I love tomatoes."},
    {"role": "assistant", "content": "Great! Tomatoes are delicious."},
])
memory.add(memories)
print(f"✓ {len(memories)} 件の記憶を追加しました")

# ========================================
# 3. 記憶を検索
# ========================================
results = memory.search("tomatoes", top_k=2)
print(f"\n🔍 {len(results)} 件の関連記憶が見つかりました:")
for i, item in enumerate(results, 1):
    print(f"  {i}. {item.memory}")

# ========================================
# 4. すべての記憶を取得
# ========================================
all_memories = memory.get_all()
print(f"\n📊 合計 {len(all_memories)} 件の記憶")

# ========================================
# 5. 記憶を更新
# ========================================
if memories:
    memory_id = memories[0].id
    memory.update(
        memory_id, 
        {
            "memory": "User loves tomatoes.",
            "metadata": {"type": "opinion", "confidence": 95.0}
        }
    )
    print(f"\n✓ 記憶を更新しました: {memory_id}")

# ========================================
# 6. 永続化保存
# ========================================
memory.dump("tmp/mem")
print("\n💾 記憶を tmp/mem/textual_memory.json に保存しました")

# ========================================
# 7. 記憶を読み込み
# ========================================
memory.load("tmp/mem")
print("✓ ファイルから記憶を読み込みました")

# ========================================
# 8. 記憶を削除
# ========================================
if memories:
    memory.delete([memories[0].id])
    print(f"\n🗑️ 1 件の記憶を削除しました")

# すべての記憶を削除
# memory.delete_all()
```

::note
**拡張: インターネット検索**<br>
NaiveTextMemory はローカル記憶管理に特化しています。インターネットから情報を検索して記憶庫に追加する必要がある場合は、こちらを参照してください：<br>
[インターネットから記憶を検索](./tree_textual_memory#从互联网检索记忆可选)
::

### ファイルストレージ

`dump(dir)` を呼び出すと、システムは記憶を次の場所に保存します：

```
<dir>/<config.memory_filename>
```

このファイルには、すべての記憶エントリのJSONリストが含まれており、`load(dir)` を使用して再読み込みできます.

**デフォルトのファイル構造**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "memory": "User loves tomatoes.",
    "metadata": {
      "type": "opinion",
      "confidence": 95.0,
      "entities": ["user", "tomatoes"],
      "tags": ["food", "preference"],
      "updated_at": "2026-01-14T10:30:00Z"
    }
  },
  ...
]
```

`load(dir)` を使用すると、すべての記憶データを完全に復元できます。

::note
**重要な注意**<br>
記憶はメモリ内に保存され、プロセスの再起動後に失われます。定期的に `dump()` を呼び出してデータを保存してください！
::
## 使用シナリオガイド

### 最適なシナリオ

::list{icon="ph:check-circle-duotone"}
- **迅速なプロトタイピング開発**：ベクトルデータベースの設定は不要で、数分で起動可能
- **シンプルな対話エージェント**：記憶数 < 1000 件の小規模アプリケーション
- **テストとデモ**：記憶抽出と検索ロジックを迅速に検証
- **リソース制約環境**：埋め込みモデルやベクトルデータベースを実行できないシナリオ
- **キーワード検索**：問い合わせ内容が記憶テキストと直接一致するシナリオ
- **学習と教育**：MemOS 記憶システムを理解するための最適な出発点
::

### 推奨されないシナリオ

::list{icon="ph:x-circle-duotone"}
- **大規模アプリケーション**：10,000 件を超える記憶（検索性能が低下）
- **セマンティック検索要件**：同義語（例："猫" と "ペット"）を理解する必要がある
- **本番環境**：性能と精度に厳格な要件がある
- **多言語シナリオ**：言語をまたぐ意味理解が必要
- **複雑な関係推論**：記憶間の関連関係を理解する必要がある
::

::alert{type="info"}
**アップグレードパス**<br>
上記の推奨されないシナリオについては、次へのアップグレードを推奨します：
- [GeneralTextMemory](/open_source/modules/memories/general_textual_memory) - ベクトルセマンティック検索、10K-100K 件の記憶に適しています
- [TreeTextMemory](/open_source/modules/memories/tree_textual_memory) - グラフ構造ストレージ、関係推論とマルチホップクエリをサポート
::

## 他の記憶モジュールとの比較

適切な記憶モジュールの選択は、プロジェクト成功にとって極めて重要です。以下の比較は意思決定に役立ちます：

| 特性           | **NaiveTextMemory**   | **GeneralTextMemory**      | **TreeTextMemory**          |
| -------------- | --------------------- | -------------------------- | --------------------------- |
| **検索方式**   | キーワード一致         | ベクトルセマンティック検索   | グラフ構造 + ベクトル検索    |
| **依存コンポーネント**   | LLM のみ                | LLM + 埋め込み器 + ベクトルデータベース  | LLM + 埋め込み器 + グラフデータベース     |
| **適用規模**   | < 1K 件               | 1K - 100K 件               | 10K - 1M 件                 |
| **クエリ複雑度** | O(n) 線形スキャン         | O(log n) 近似最近傍        | O(log n) + グラフ走査           |
| **意味理解**   | ❌                     | ✅                          | ✅                           |
| **関係推論**   | ❌                     | ❌                          | ✅                           |
| **マルチホップクエリ**   | ❌                     | ❌                          | ✅                           |
| **ストレージバックエンド**   | メモリリスト              | ベクトルデータベース（Qdrant など）    | グラフデータベース（Neo4j/PolarDB）   |
| **設定複雑度** | 低 ⭐                 | 中 ⭐⭐                    | 高 ⭐⭐⭐                   |
| **学習曲線**   | 極めて簡単                  | 中程度                       | 急峻                        |
| **本番対応**   | ❌ プロトタイプ/デモのみ         | ✅ ほとんどのシナリオに適している           | ✅ 複雑なアプリケーションに適している             |

::alert{type="success"}
**選択の提案**<br>
- **学習を始めたばかり？** → NaiveTextMemory から開始<br>
- **セマンティック検索が必要？** → GeneralTextMemory を使用<br>
- **関係推論が必要？** → TreeTextMemory を選択
::

## ベストプラクティス

以下の提案に従って、NaiveTextMemory の利点を最大限に活用してください：

::steps{}

### 1. 定期的にデータを永続化する

```python
# 重要な操作の直後に保存
memory.add(new_memories)
memory.dump("tmp/mem")  # ✓ すぐに永続化

# 定期的な自動バックアップ
import schedule
schedule.every(10).minutes.do(lambda: memory.dump("tmp/mem"))
```

### 2. 記憶規模を制御する

```python
# 古い記憶を定期的にクリーンアップ
if len(memory.get_all()) > 1000:
    old_memories = sorted(
        memory.get_all(),
        key=lambda m: m.metadata.updated_at
    )[:100]  # 最も古い 100 件
    
    memory.delete([m.id for m in old_memories])
    print("✓ 古い記憶 100 件をクリーンアップしました")
```

### 3. 検索クエリを最適化する

```python
# ❌ 悪い例：曖昧なクエリ
results = memory.search("もの", top_k=5)

# ✅ 良い例：具体的なキーワードを使用
results = memory.search("トマト 西紅柿", top_k=5)
```

### 4. メタデータを適切に使用する

```python
# 記憶追加時に明確なメタデータを設定
memory.add({
    "memory": "User prefers dark mode",
    "metadata": {
        "type": "opinion",          # ✓ 明確な分類
        "tags": ["UI", "preference"],  # ✓ フィルタリングしやすい
        "confidence": 90.0,         # ✓ 信頼度を明記
        "entities": ["user", "dark mode"]  # ✓ エンティティ注釈
    }
})
```

### 5. アップグレードパスを計画する

```python
# 記憶数を監視し、適時アップグレード
memory_count = len(memory.get_all())
if memory_count > 800:
    print("⚠️ 記憶数が上限に近づいています。GeneralTextMemory へのアップグレードを推奨します")
    # 移行コード参考：
    # 1. 既存の記憶をエクスポート：memory.dump("backup")
    # 2. GeneralTextMemory 設定を作成
    # 3. 記憶を新しいモジュールにインポート
```

::


## 次のステップ

おめでとうございます！あなたはすでに NaiveTextMemory の中核的な使い方を習得しました。次にできること：

::list{icon="ph:arrow-right-duotone"}
- **ベクトル検索へアップグレード**： [GeneralTextMemory](/open_source/modules/memories/general_textual_memory) のセマンティック検索機能を学ぶ
- **グラフ構造を探索**： [TreeTextMemory](/open_source/modules/memories/tree_textual_memory) の関係推論機能を理解する
- **アプリケーションに統合**： [完全な API ドキュメント](/api-reference/search-memories) を確認して本番級アプリケーションを構築
- **サンプルコードを実行**： `/examples/` ディレクトリを参照して、より多くの実践事例を取得
- **グラフデータベースを理解**：高度な機能が必要な場合は、[Neo4j](/open_source/modules/memories/neo4j_graph_db) または [PolarDB](/open_source/modules/memories/polardb_graph_db) を学ぶ
::

::alert{type="success"}
**ヒント**<br>
NaiveTextMemory は MemOS を学ぶための完璧な出発点です。アプリケーションでより強力な機能が必要になったときは、他の記憶モジュールへシームレスに移行できます！
::
